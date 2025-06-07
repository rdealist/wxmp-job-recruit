/**
 * @fileoverview 用户控制器
 * @description 处理用户相关的业务逻辑
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const User = require('../models/User')
const Job = require('../models/Job')
const Share = require('../models/Share')
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
  getMyJobs: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.number().valid(0, 1, 2, 3).optional()
  }),

  getMyShares: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
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
 * 获取我发布的职位
 */
const getMyJobs = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.getMyJobs.validate(req.query)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { page, limit, status } = value
  const { user } = req

  try {
    // 构建查询条件
    const query = { publisherId: user._id }
    if (status !== undefined) {
      query.status = status
    }

    const skip = (page - 1) * limit

    // 查询我的职位
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ publishTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query)
    ])

    // 处理职位数据
    const processedJobs = jobs.map(job => ({
      ...job,
      isToday: new Date(job.publishTime).toDateString() === new Date().toDateString(),
      needShareToUnlock: false // 自己的职位不需要分享解锁
    }))

    const pagination = { page, limit, total }

    logger.logBusiness('获取我的职位', user._id, { total: processedJobs.length })

    res.json(paginationResponse(processedJobs, pagination, '获取成功'))

  } catch (error) {
    logger.error('获取我的职位失败:', error.message)
    throw new BusinessError('获取我的职位失败')
  }
}

/**
 * 获取我的分享记录
 */
const getMyShares = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.getMyShares.validate(req.query)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { page, limit } = value
  const { user } = req

  try {
    const skip = (page - 1) * limit

    // 查询我的分享记录
    const [shares, total] = await Promise.all([
      Share.find({ userId: user._id, status: 1 })
        .populate('jobId', 'title company salary province city publishTime status')
        .sort({ shareTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Share.countDocuments({ userId: user._id, status: 1 })
    ])

    // 处理分享数据
    const processedShares = shares.map(share => ({
      id: share._id,
      shareType: share.shareType,
      shareChannel: share.shareChannel,
      shareTime: share.shareTime,
      unlockDate: share.unlockDate,
      clickCount: share.clickCount,
      viewCount: share.viewCount,
      job: share.jobId ? {
        id: share.jobId._id,
        title: share.jobId.title,
        company: share.jobId.company,
        salary: share.jobId.salary,
        location: `${share.jobId.province} ${share.jobId.city}`,
        publishTime: share.jobId.publishTime,
        status: share.jobId.status
      } : null
    }))

    const pagination = { page, limit, total }

    logger.logBusiness('获取我的分享', user._id, { total: processedShares.length })

    res.json(paginationResponse(processedShares, pagination, '获取成功'))

  } catch (error) {
    logger.error('获取我的分享失败:', error.message)
    throw new BusinessError('获取我的分享失败')
  }
}

/**
 * 获取我的统计信息
 */
const getMyStatistics = async (req, res) => {
  const { user } = req

  try {
    // 检查缓存
    const cacheKey = `user:${user._id}:statistics`
    let statistics = await cacheService.get(cacheKey)
    
    if (!statistics) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 并行查询统计数据
      const [
        todayPublishCount,
        todayShareCount,
        totalJobViews,
        recentJobs
      ] = await Promise.all([
        Job.countDocuments({
          publisherId: user._id,
          publishTime: { $gte: today }
        }),
        Share.countDocuments({
          userId: user._id,
          shareTime: { $gte: today },
          status: 1
        }),
        Job.aggregate([
          { $match: { publisherId: user._id } },
          { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
        ]),
        Job.find({ publisherId: user._id })
          .sort({ publishTime: -1 })
          .limit(5)
          .select('title company publishTime viewCount status')
          .lean()
      ])

      statistics = {
        publishCount: user.publishCount,
        shareCount: user.shareCount,
        viewCount: user.viewCount,
        todayPublish: todayPublishCount,
        todayShare: todayShareCount,
        totalJobViews: totalJobViews[0]?.totalViews || 0,
        recentJobs: recentJobs.map(job => ({
          id: job._id,
          title: job.title,
          company: job.company,
          publishTime: job.publishTime,
          viewCount: job.viewCount,
          status: job.status
        }))
      }

      // 缓存统计数据
      await cacheService.set(cacheKey, statistics, 5 * 60) // 5分钟
    }

    logger.logBusiness('获取我的统计', user._id)

    res.json(successResponse(statistics, '获取成功'))

  } catch (error) {
    logger.error('获取我的统计失败:', error.message)
    throw new BusinessError('获取我的统计失败')
  }
}

/**
 * 获取用户公开信息
 */
const getUserPublicInfo = async (req, res) => {
  const { id } = req.params

  try {
    const user = await User.findById(id).select('nickName avatar publishCount createTime')
    
    if (!user || user.status !== 1) {
      throw new NotFoundError('用户不存在')
    }

    // 获取用户最近发布的职位
    const recentJobs = await Job.find({
      publisherId: id,
      status: 1,
      reviewStatus: 1
    })
    .sort({ publishTime: -1 })
    .limit(5)
    .select('title company publishTime province city')
    .lean()

    const publicInfo = {
      id: user._id,
      nickName: user.nickName,
      avatar: user.avatar,
      publishCount: user.publishCount,
      joinTime: user.createTime,
      recentJobs: recentJobs.map(job => ({
        id: job._id,
        title: job.title,
        company: job.company,
        publishTime: job.publishTime,
        location: `${job.province} ${job.city}`
      }))
    }

    res.json(successResponse(publicInfo, '获取成功'))

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    logger.error('获取用户公开信息失败:', error.message)
    throw new BusinessError('获取用户信息失败')
  }
}

/**
 * 获取用户列表（管理员）
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

    res.json(paginationResponse(users, pagination, '获取成功'))

  } catch (error) {
    logger.error('获取用户列表失败:', error.message)
    throw new BusinessError('获取用户列表失败')
  }
}

/**
 * 更新用户状态（管理员）
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

module.exports = {
  getMyJobs,
  getMyShares,
  getMyStatistics,
  getUserPublicInfo,
  getUsers,
  updateUserStatus
}
