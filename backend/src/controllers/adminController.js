/**
 * @fileoverview 管理员控制器
 * @description 处理管理后台相关的业务逻辑
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const User = require('../models/User')
const Job = require('../models/Job')
const Share = require('../models/Share')
const { checkDBHealth } = require('../config/database')
const { checkRedisHealth } = require('../config/redis')
const { wechatService } = require('../config/wechat')
const { cosService } = require('../config/tencent')
const { 
  successResponse, 
  paginationResponse,
  BusinessError, 
  ValidationError,
  NotFoundError
} = require('../middleware/errorHandler')
const { cacheService } = require('../config/redis')
const logger = require('../utils/logger')
const Joi = require('joi')

/**
 * 验证schemas
 */
const schemas = {
  reviewJob: Joi.object({
    status: Joi.number().valid(1, 2).required().messages({
      'any.only': '审核状态无效，只能是1(通过)或2(拒绝)',
      'any.required': '审核状态是必需的'
    }),
    reason: Joi.string().max(500).optional().allow('').messages({
      'string.max': '审核意见不能超过500个字符'
    })
  }),

  updateUserStatus: Joi.object({
    status: Joi.number().valid(0, 1, 2).required().messages({
      'any.only': '用户状态无效',
      'any.required': '用户状态是必需的'
    }),
    reason: Joi.string().max(200).optional().allow('')
  })
}

/**
 * 获取管理后台仪表盘数据
 */
const getDashboard = async (req, res) => {
  try {
    // 检查缓存
    const cacheKey = 'admin:dashboard'
    let dashboardData = await cacheService.get(cacheKey)
    
    if (!dashboardData) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 并行查询各种统计数据
      const [
        userStats,
        jobStats,
        shareStats,
        todayUsers,
        todayJobs,
        todayShares,
        pendingJobs,
        activeUsers
      ] = await Promise.all([
        User.getStatistics(),
        Job.getStatistics(),
        Share.getTodayStats(),
        User.countDocuments({ createTime: { $gte: today } }),
        Job.countDocuments({ publishTime: { $gte: today }, status: 1 }),
        Share.countDocuments({ shareTime: { $gte: today }, status: 1 }),
        Job.countDocuments({ reviewStatus: 0 }),
        User.countDocuments({ 
          lastActiveTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: 1 
        })
      ])

      dashboardData = {
        users: {
          total: userStats.total,
          active: userStats.active,
          today: todayUsers,
          weeklyActive: activeUsers
        },
        jobs: {
          total: jobStats.total,
          today: todayJobs,
          pending: pendingJobs,
          published: jobStats.total - pendingJobs
        },
        shares: {
          total: shareStats.totalShares,
          today: todayShares,
          uniqueUsers: shareStats.uniqueUsers,
          uniqueJobs: shareStats.uniqueJobs
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: require('../../package.json').version
        }
      }

      // 缓存仪表盘数据
      await cacheService.set(cacheKey, dashboardData, 5 * 60) // 5分钟
    }

    logger.logBusiness('获取管理后台仪表盘', req.user._id)

    res.json(successResponse(dashboardData, '获取成功'))

  } catch (error) {
    logger.error('获取仪表盘数据失败:', error.message)
    throw new BusinessError('获取仪表盘数据失败')
  }
}

/**
 * 获取待审核职位列表
 */
const getPendingJobs = async (req, res) => {
  const { page = 1, limit = 20 } = req.query

  try {
    const query = { reviewStatus: 0 }
    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('publisherId', 'nickName avatar phone')
        .sort({ publishTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query)
    ])

    const processedJobs = jobs.map(job => ({
      ...job,
      publisher: job.publisherId
    }))

    const pagination = { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      total 
    }

    logger.logBusiness('获取待审核职位', req.user._id, { total: jobs.length })

    res.json(paginationResponse(processedJobs, pagination, '获取成功'))

  } catch (error) {
    logger.error('获取待审核职位失败:', error.message)
    throw new BusinessError('获取待审核职位失败')
  }
}

/**
 * 审核职位
 */
const reviewJob = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.reviewJob.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { id } = req.params
  const { status, reason } = value
  const { user: admin } = req

  try {
    const job = await Job.findById(id).populate('publisherId', 'nickName')
    
    if (!job) {
      throw new NotFoundError('职位不存在')
    }

    if (job.reviewStatus !== 0) {
      throw new BusinessError('该职位已经审核过了')
    }

    const oldStatus = job.reviewStatus
    job.reviewStatus = status
    job.reviewReason = reason || ''
    
    // 如果审核拒绝，设置职位状态为已下架
    if (status === 2) {
      job.status = 2
    }

    await job.save()

    // 清除相关缓存
    await cacheService.delPattern('jobs:list:*')
    await cacheService.del('admin:dashboard')

    // 记录审核日志
    logger.logBusiness('审核职位', admin._id, {
      jobId: id,
      jobTitle: job.title,
      publisherId: job.publisherId._id,
      publisherName: job.publisherId.nickName,
      oldStatus,
      newStatus: status,
      reason
    })

    // 这里可以发送通知给职位发布者
    // await sendNotificationToUser(job.publisherId._id, {
    //   type: 'job_review',
    //   status,
    //   reason,
    //   jobTitle: job.title
    // })

    const statusText = status === 1 ? '通过' : '拒绝'
    res.json(successResponse(job, `职位审核${statusText}成功`))

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      throw error
    }
    logger.error('审核职位失败:', error.message)
    throw new BusinessError('审核职位失败')
  }
}

/**
 * 获取用户列表
 */
const getUsers = async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    keyword, 
    status, 
    role 
  } = req.query

  try {
    // 构建查询条件
    const query = {}
    
    if (keyword) {
      query.$or = [
        { nickName: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } }
      ]
    }
    
    if (status !== undefined) {
      query.status = parseInt(status)
    }
    
    if (role) {
      query.role = role
    }

    const skip = (page - 1) * limit

    // 查询用户列表
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-sessionKey -openId')
        .sort({ createTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ])

    // 为每个用户添加统计信息
    const userIds = users.map(user => user._id)
    const [jobCounts, shareCounts] = await Promise.all([
      Job.aggregate([
        { $match: { publisherId: { $in: userIds } } },
        { $group: { _id: '$publisherId', count: { $sum: 1 } } }
      ]),
      Share.aggregate([
        { $match: { userId: { $in: userIds }, status: 1 } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ])
    ])

    const jobCountMap = {}
    const shareCountMap = {}
    
    jobCounts.forEach(item => {
      jobCountMap[item._id] = item.count
    })
    
    shareCounts.forEach(item => {
      shareCountMap[item._id] = item.count
    })

    const processedUsers = users.map(user => ({
      ...user,
      actualJobCount: jobCountMap[user._id] || 0,
      actualShareCount: shareCountMap[user._id] || 0
    }))

    const pagination = { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      total 
    }

    logger.logBusiness('获取用户列表', req.user._id, { 
      keyword, 
      status, 
      role, 
      total: users.length 
    })

    res.json(paginationResponse(processedUsers, pagination, '获取成功'))

  } catch (error) {
    logger.error('获取用户列表失败:', error.message)
    throw new BusinessError('获取用户列表失败')
  }
}

/**
 * 更新用户状态
 */
const updateUserStatus = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.updateUserStatus.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { id } = req.params
  const { status, reason } = value
  const { user: admin } = req

  try {
    const user = await User.findById(id)
    
    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    // 不能修改管理员状态
    if (user.role === 'admin' && admin._id.toString() !== id) {
      throw new BusinessError('不能修改其他管理员的状态')
    }

    const oldStatus = user.status
    user.status = status
    await user.save()

    // 清除用户缓存
    await cacheService.del(`user:${id}`)

    logger.logBusiness('更新用户状态', admin._id, {
      targetUserId: id,
      targetUserName: user.nickName,
      oldStatus,
      newStatus: status,
      reason
    })

    res.json(successResponse(user.getDetailInfo(), '用户状态更新成功'))

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      throw error
    }
    logger.error('更新用户状态失败:', error.message)
    throw new BusinessError('更新用户状态失败')
  }
}

/**
 * 获取系统统计数据
 */
const getStatistics = async (req, res) => {
  const { days = 30 } = req.query

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 获取时间序列数据
    const [userTrend, jobTrend, shareTrend] = await Promise.all([
      User.aggregate([
        { $match: { createTime: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createTime' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Job.aggregate([
        { $match: { publishTime: { $gte: startDate }, status: 1 } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishTime' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Share.aggregate([
        { $match: { shareTime: { $gte: startDate }, status: 1 } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$shareTime' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ])

    // 获取地区分布
    const regionStats = await Job.aggregate([
      { $match: { status: 1, reviewStatus: 1 } },
      {
        $group: {
          _id: { province: '$province', city: '$city' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ])

    // 获取职位分类统计
    const categoryStats = await Job.aggregate([
      { $match: { status: 1, reviewStatus: 1 } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    const statistics = {
      trends: {
        users: userTrend,
        jobs: jobTrend,
        shares: shareTrend
      },
      regions: regionStats.map(item => ({
        province: item._id.province,
        city: item._id.city,
        count: item.count
      })),
      categories: categoryStats.map(item => ({
        category: item._id,
        count: item.count
      }))
    }

    logger.logBusiness('获取系统统计', req.user._id, { days })

    res.json(successResponse(statistics, '获取成功'))

  } catch (error) {
    logger.error('获取系统统计失败:', error.message)
    throw new BusinessError('获取系统统计失败')
  }
}

/**
 * 获取系统健康状态
 */
const getSystemHealth = async (req, res) => {
  try {
    // 并行检查各个服务的健康状态
    const [
      databaseHealth,
      redisHealth,
      wechatHealth,
      cosHealth
    ] = await Promise.all([
      checkDBHealth(),
      checkRedisHealth(),
      wechatService.checkServiceHealth(),
      cosService.checkServiceHealth()
    ])

    const systemHealth = {
      database: databaseHealth,
      redis: redisHealth,
      wechat: wechatHealth,
      cos: cosHealth,
      server: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform
      }
    }

    // 判断整体健康状态
    const allHealthy = [databaseHealth, redisHealth, wechatHealth, cosHealth]
      .every(health => health.status === 'healthy' || health.status === 'connected')

    systemHealth.overall = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString()
    }

    logger.logBusiness('获取系统健康状态', req.user._id)

    res.json(successResponse(systemHealth, '获取成功'))

  } catch (error) {
    logger.error('获取系统健康状态失败:', error.message)
    throw new BusinessError('获取系统健康状态失败')
  }
}

module.exports = {
  getDashboard,
  getPendingJobs,
  reviewJob,
  getUsers,
  updateUserStatus,
  getStatistics,
  getSystemHealth
}
