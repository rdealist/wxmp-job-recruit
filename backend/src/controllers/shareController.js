/**
 * @fileoverview 分享控制器
 * @description 处理分享解锁相关的业务逻辑
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const Job = require('../models/Job')
const Share = require('../models/Share')
const { wechatService } = require('../config/wechat')
const { cosService } = require('../config/tencent')
const { 
  successResponse, 
  BusinessError, 
  ValidationError,
  NotFoundError
} = require('../middleware/errorHandler')
const { cacheService } = require('../config/redis')
const logger = require('../utils/logger')
const Joi = require('joi')
const QRCode = require('qrcode')

/**
 * 验证schemas
 */
const schemas = {
  unlockJob: Joi.object({
    jobId: Joi.string().required().messages({
      'string.empty': '职位ID不能为空',
      'any.required': '职位ID是必需的'
    }),
    shareType: Joi.string().valid('wechat', 'timeline', 'poster', 'link').required().messages({
      'any.only': '分享类型无效',
      'any.required': '分享类型是必需的'
    }),
    shareChannel: Joi.string().valid('friend', 'group', 'timeline', 'qrcode', 'copy').optional().default('friend')
  }),

  checkUnlock: Joi.object({
    jobId: Joi.string().required().messages({
      'string.empty': '职位ID不能为空',
      'any.required': '职位ID是必需的'
    })
  }),

  generatePoster: Joi.object({
    jobId: Joi.string().required().messages({
      'string.empty': '职位ID不能为空',
      'any.required': '职位ID是必需的'
    }),
    template: Joi.string().valid('default', 'simple', 'detailed').optional().default('default')
  })
}

/**
 * 分享解锁职位
 */
const unlockJob = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.unlockJob.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { jobId, shareType, shareChannel } = value
  const { user } = req

  try {
    // 检查职位是否存在
    const job = await Job.findById(jobId)
    if (!job || job.status !== 1 || job.reviewStatus !== 1) {
      throw new NotFoundError('职位不存在或已下架')
    }

    // 检查是否是今日职位（今日职位无需分享）
    const isToday = new Date(job.publishTime).toDateString() === new Date().toDateString()
    if (isToday) {
      return res.json(successResponse({
        unlocked: true,
        shareId: null,
        message: '今日职位无需分享即可查看'
      }, '无需分享'))
    }

    // 获取客户端信息
    const sourceInfo = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      platform: 'weapp'
    }

    // 创建分享记录
    const share = await Share.createShare(
      user._id,
      jobId,
      shareType,
      shareChannel,
      sourceInfo
    )

    // 增加职位分享次数
    await Job.findByIdAndUpdate(jobId, { $inc: { shareCount: 1 } })

    // 增加用户分享次数
    await user.incrementShareCount()

    // 清除相关缓存
    await cacheService.del(`job:${jobId}:unlock:${user._id}`)

    logger.logBusiness('分享解锁职位', user._id, { 
      jobId, 
      shareType, 
      shareChannel,
      shareId: share._id 
    })

    res.json(successResponse({
      unlocked: true,
      shareId: share._id,
      unlockDate: share.unlockDate
    }, '解锁成功'))

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    logger.error('分享解锁失败:', error.message)
    throw new BusinessError('分享解锁失败')
  }
}

/**
 * 检查职位解锁状态
 */
const checkUnlockStatus = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.checkUnlock.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { jobId } = value
  const { user } = req

  try {
    // 检查职位是否存在
    const job = await Job.findById(jobId)
    if (!job || job.status !== 1 || job.reviewStatus !== 1) {
      throw new NotFoundError('职位不存在或已下架')
    }

    // 检查是否是今日职位
    const isToday = new Date(job.publishTime).toDateString() === new Date().toDateString()
    
    if (isToday) {
      return res.json(successResponse({
        unlocked: true,
        needShare: false,
        isToday: true
      }, '今日职位无需分享'))
    }

    // 检查缓存
    const cacheKey = `job:${jobId}:unlock:${user._id}`
    let isUnlocked = await cacheService.get(cacheKey)
    
    if (isUnlocked === null) {
      // 从数据库检查
      isUnlocked = await Share.checkUnlocked(user._id, jobId)
      
      // 缓存结果
      await cacheService.set(cacheKey, isUnlocked, 60 * 60) // 1小时
    }

    res.json(successResponse({
      unlocked: isUnlocked,
      needShare: !isUnlocked,
      isToday: false
    }, '检查成功'))

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    logger.error('检查解锁状态失败:', error.message)
    throw new BusinessError('检查解锁状态失败')
  }
}

/**
 * 生成分享海报
 */
const generatePoster = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.generatePoster.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { jobId, template } = value
  const { user } = req

  try {
    // 检查职位是否存在
    const job = await Job.findById(jobId).populate('publisherId', 'nickName avatar')
    if (!job || job.status !== 1 || job.reviewStatus !== 1) {
      throw new NotFoundError('职位不存在或已下架')
    }

    // 检查缓存中是否已有海报
    const cacheKey = `poster:${jobId}:${template}`
    let posterUrl = await cacheService.get(cacheKey)
    
    if (posterUrl) {
      return res.json(successResponse({
        posterUrl,
        qrcodeUrl: posterUrl.replace('poster', 'qrcode')
      }, '海报获取成功'))
    }

    // 生成小程序码
    const scene = `jobId=${jobId}&from=poster`
    const qrcodeBuffer = await wechatService.generateWxacode(scene, 'pages/detail/index')

    // 上传小程序码到COS
    const qrcodeResult = await cosService.uploadFile(
      qrcodeBuffer,
      `qrcode_${jobId}_${Date.now()}.png`,
      'qrcodes'
    )

    // 生成海报内容（这里简化处理，实际应该使用图片处理库）
    const posterData = {
      title: job.title,
      company: job.company,
      salary: job.salary,
      location: `${job.province} ${job.city}`,
      qrcodeUrl: qrcodeResult.url,
      publishTime: job.publishTime,
      template
    }

    // 生成简单的文本海报（实际项目中应该生成图片）
    const posterText = `
【${posterData.title}】
公司：${posterData.company}
薪资：${posterData.salary}
地点：${posterData.location}
发布时间：${new Date(posterData.publishTime).toLocaleDateString()}

扫码查看详情
小程序码：${posterData.qrcodeUrl}
    `

    // 将海报文本转换为图片（这里简化为文本，实际应该生成图片）
    const posterBuffer = Buffer.from(posterText, 'utf8')

    // 上传海报到COS
    const posterResult = await cosService.uploadFile(
      posterBuffer,
      `poster_${jobId}_${template}_${Date.now()}.txt`,
      'posters'
    )

    // 缓存海报URL
    await cacheService.set(cacheKey, posterResult.url, 24 * 60 * 60) // 24小时

    logger.logBusiness('生成分享海报', user._id, { 
      jobId, 
      template,
      posterUrl: posterResult.url 
    })

    res.json(successResponse({
      posterUrl: posterResult.url,
      qrcodeUrl: qrcodeResult.url
    }, '海报生成成功'))

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    logger.error('生成分享海报失败:', error.message)
    throw new BusinessError('生成分享海报失败')
  }
}

/**
 * 获取分享统计
 */
const getShareStatistics = async (req, res) => {
  const { days = 7 } = req.query
  const { user } = req

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 获取用户分享统计
    const userShares = await Share.find({
      userId: user._id,
      shareTime: { $gte: startDate },
      status: 1
    })

    // 统计分享类型
    const shareTypes = {}
    const shareChannels = {}
    const dailyStats = {}

    userShares.forEach(share => {
      // 分享类型统计
      shareTypes[share.shareType] = (shareTypes[share.shareType] || 0) + 1
      
      // 分享渠道统计
      shareChannels[share.shareChannel] = (shareChannels[share.shareChannel] || 0) + 1
      
      // 每日统计
      const dateKey = share.shareTime.toISOString().split('T')[0]
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          shares: 0,
          clicks: 0,
          views: 0
        }
      }
      dailyStats[dateKey].shares += 1
      dailyStats[dateKey].clicks += share.clickCount
      dailyStats[dateKey].views += share.viewCount
    })

    const statistics = {
      totalShares: userShares.length,
      totalClicks: userShares.reduce((sum, share) => sum + share.clickCount, 0),
      totalViews: userShares.reduce((sum, share) => sum + share.viewCount, 0),
      shareTypes,
      shareChannels,
      dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
    }

    logger.logBusiness('获取分享统计', user._id, { days, totalShares: statistics.totalShares })

    res.json(successResponse(statistics, '获取成功'))

  } catch (error) {
    logger.error('获取分享统计失败:', error.message)
    throw new BusinessError('获取分享统计失败')
  }
}

/**
 * 获取分享排行榜
 */
const getShareRanking = async (req, res) => {
  const { days = 7, limit = 10 } = req.query

  try {
    // 检查缓存
    const cacheKey = `share:ranking:${days}:${limit}`
    let ranking = await cacheService.get(cacheKey)
    
    if (!ranking) {
      ranking = await Share.getShareRanking(parseInt(days), parseInt(limit))
      
      // 缓存排行榜
      await cacheService.set(cacheKey, ranking, 60 * 60) // 1小时
    }

    res.json(successResponse(ranking, '获取成功'))

  } catch (error) {
    logger.error('获取分享排行榜失败:', error.message)
    throw new BusinessError('获取分享排行榜失败')
  }
}

module.exports = {
  unlockJob,
  checkUnlockStatus,
  generatePoster,
  getShareStatistics,
  getShareRanking
}
