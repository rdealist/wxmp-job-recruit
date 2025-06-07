/**
 * @fileoverview 限流中间件
 * @description 基于Redis的API限流控制
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const { RateLimiterRedis } = require('rate-limiter-flexible')
const { getRedisClient } = require('../config/redis')
const config = require('../config/index')
const logger = require('../utils/logger')

/**
 * 创建限流器实例
 */
const createRateLimiter = (options) => {
  return new RateLimiterRedis({
    storeClient: getRedisClient(),
    keyPrefix: 'rate_limit',
    ...options
  })
}

/**
 * 通用限流器
 */
const generalLimiter = createRateLimiter({
  points: config.rateLimit.max, // 请求次数
  duration: config.rateLimit.windowMs / 1000, // 时间窗口（秒）
  blockDuration: 60, // 阻塞时间（秒）
  execEvenly: true // 平均分布请求
})

/**
 * 认证接口限流器
 */
const authLimiter = createRateLimiter({
  points: config.rateLimit.auth.max,
  duration: config.rateLimit.auth.windowMs / 1000,
  blockDuration: 300, // 5分钟阻塞
  execEvenly: false
})

/**
 * 发布职位限流器
 */
const publishLimiter = createRateLimiter({
  points: config.rateLimit.publish.max,
  duration: config.rateLimit.publish.windowMs / 1000,
  blockDuration: 3600, // 1小时阻塞
  execEvenly: false
})

/**
 * 严格限流器（用于敏感操作）
 */
const strictLimiter = createRateLimiter({
  points: 3, // 3次请求
  duration: 60, // 1分钟
  blockDuration: 600, // 10分钟阻塞
  execEvenly: false
})

/**
 * 获取客户端标识
 */
const getClientKey = (req) => {
  // 优先使用用户ID，其次使用IP地址
  if (req.user && req.user._id) {
    return `user:${req.user._id}`
  }
  
  // 获取真实IP地址
  const ip = req.ip || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null)
  
  return `ip:${ip}`
}

/**
 * 创建限流中间件
 */
const createRateLimitMiddleware = (limiter, options = {}) => {
  return async (req, res, next) => {
    try {
      const key = options.keyGenerator ? options.keyGenerator(req) : getClientKey(req)
      
      // 执行限流检查
      const result = await limiter.consume(key)
      
      // 设置响应头
      res.set({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': result.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext)
      })

      next()

    } catch (rejRes) {
      // 限流触发
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
      
      // 记录限流日志
      logger.logSecurity('API限流触发', req.ip, {
        userId: req.user ? req.user._id : null,
        path: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        remainingPoints: rejRes.remainingPoints,
        msBeforeNext: rejRes.msBeforeNext
      })

      res.set({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': rejRes.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext),
        'Retry-After': secs
      })

      return res.status(429).json({
        code: 429,
        message: `请求过于频繁，请在 ${secs} 秒后重试`,
        retryAfter: secs,
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * 通用限流中间件
 */
const rateLimitMiddleware = createRateLimitMiddleware(generalLimiter)

/**
 * 认证限流中间件
 */
const authRateLimit = createRateLimitMiddleware(authLimiter, {
  keyGenerator: (req) => {
    // 认证接口使用IP地址限流
    const ip = req.ip || req.connection.remoteAddress
    return `auth:${ip}`
  }
})

/**
 * 发布限流中间件
 */
const publishRateLimit = createRateLimitMiddleware(publishLimiter, {
  keyGenerator: (req) => {
    // 发布接口使用用户ID限流
    if (req.user && req.user._id) {
      return `publish:${req.user._id}`
    }
    const ip = req.ip || req.connection.remoteAddress
    return `publish:${ip}`
  }
})

/**
 * 严格限流中间件
 */
const strictRateLimit = createRateLimitMiddleware(strictLimiter)

/**
 * 动态限流中间件
 */
const dynamicRateLimit = (pointsConfig) => {
  return (req, res, next) => {
    // 根据用户角色动态调整限流
    let points = pointsConfig.default || 100
    
    if (req.user) {
      switch (req.user.role) {
        case 'admin':
          points = pointsConfig.admin || points * 10
          break
        case 'moderator':
          points = pointsConfig.moderator || points * 5
          break
        case 'vip':
          points = pointsConfig.vip || points * 2
          break
        default:
          points = pointsConfig.user || points
      }
    }

    const dynamicLimiter = createRateLimiter({
      points,
      duration: 60, // 1分钟
      blockDuration: 60,
      execEvenly: true
    })

    return createRateLimitMiddleware(dynamicLimiter)(req, res, next)
  }
}

/**
 * 基于路径的限流配置
 */
const pathBasedRateLimit = (req, res, next) => {
  const path = req.path
  
  // 根据不同路径应用不同的限流策略
  if (path.startsWith('/api/v1/auth')) {
    return authRateLimit(req, res, next)
  } else if (path.startsWith('/api/v1/jobs') && req.method === 'POST') {
    return publishRateLimit(req, res, next)
  } else if (path.includes('/admin/')) {
    return strictRateLimit(req, res, next)
  } else {
    return rateLimitMiddleware(req, res, next)
  }
}

/**
 * 白名单检查
 */
const checkWhitelist = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress
  const whitelist = process.env.RATE_LIMIT_WHITELIST ? 
    process.env.RATE_LIMIT_WHITELIST.split(',') : []
  
  if (whitelist.includes(ip)) {
    return next()
  }
  
  return pathBasedRateLimit(req, res, next)
}

/**
 * 获取限流状态
 */
const getRateLimitStatus = async (key, limiter) => {
  try {
    const result = await limiter.get(key)
    
    if (!result) {
      return {
        limit: limiter.points,
        remaining: limiter.points,
        reset: new Date(Date.now() + limiter.duration * 1000),
        blocked: false
      }
    }

    return {
      limit: limiter.points,
      remaining: result.remainingPoints,
      reset: new Date(Date.now() + result.msBeforeNext),
      blocked: result.remainingPoints <= 0
    }

  } catch (error) {
    logger.error('获取限流状态失败:', error)
    return null
  }
}

/**
 * 重置限流计数
 */
const resetRateLimit = async (key, limiter) => {
  try {
    await limiter.delete(key)
    return true
  } catch (error) {
    logger.error('重置限流计数失败:', error)
    return false
  }
}

/**
 * 限流统计中间件
 */
const rateLimitStats = async (req, res, next) => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const key = getClientKey(req)
    
    // 记录API调用统计
    logger.logPerformance('API调用', duration, 'ms')
    
    // 可以在这里添加更多统计逻辑
  })
  
  next()
}

module.exports = {
  rateLimitMiddleware,
  authRateLimit,
  publishRateLimit,
  strictRateLimit,
  dynamicRateLimit,
  pathBasedRateLimit,
  checkWhitelist,
  getRateLimitStatus,
  resetRateLimit,
  rateLimitStats,
  
  // 导出限流器实例供其他模块使用
  generalLimiter,
  authLimiter,
  publishLimiter,
  strictLimiter
}
