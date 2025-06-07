/**
 * @fileoverview 请求日志中间件
 * @description 记录API请求日志和性能监控
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const { v4: uuidv4 } = require('uuid')
const logger = require('../utils/logger')
const config = require('../config/index')

/**
 * 生成请求ID
 */
const generateRequestId = () => {
  return uuidv4().replace(/-/g, '').substring(0, 16)
}

/**
 * 获取客户端IP地址
 */
const getClientIP = (req) => {
  return req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    'unknown'
}

/**
 * 获取用户代理信息
 */
const getUserAgent = (req) => {
  const userAgent = req.get('User-Agent') || 'unknown'
  
  // 解析用户代理信息
  const isWeChat = /MicroMessenger/i.test(userAgent)
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
  const isBot = /bot|crawler|spider/i.test(userAgent)
  
  return {
    raw: userAgent,
    isWeChat,
    isMobile,
    isBot
  }
}

/**
 * 过滤敏感信息
 */
const filterSensitiveData = (data) => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'sessionKey',
    'phone', 'email', 'idCard', 'bankCard'
  ]

  const filtered = { ...data }

  const filterObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase()
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '***'
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          filterObject(obj[key])
        }
      }
    }
  }

  filterObject(filtered)
  return filtered
}

/**
 * 请求日志中间件
 */
const requestLogger = (req, res, next) => {
  // 生成请求ID
  req.requestId = generateRequestId()
  
  // 记录请求开始时间
  req.startTime = Date.now()
  
  // 获取客户端信息
  const clientIP = getClientIP(req)
  const userAgent = getUserAgent(req)
  
  // 设置响应头
  res.set('X-Request-ID', req.requestId)
  
  // 记录请求开始日志
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    ip: clientIP,
    userAgent: userAgent.raw,
    isWeChat: userAgent.isWeChat,
    isMobile: userAgent.isMobile,
    isBot: userAgent.isBot,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    timestamp: new Date().toISOString()
  }

  // 记录请求体（非GET请求且非文件上传）
  if (req.method !== 'GET' && !req.is('multipart/*')) {
    requestInfo.body = filterSensitiveData(req.body)
  }

  // 记录用户信息（如果已认证）
  if (req.user) {
    requestInfo.userId = req.user._id
    requestInfo.userRole = req.user.role
  }

  logger.info('API请求开始', requestInfo)

  // 监听响应结束事件
  const originalSend = res.send
  const originalJson = res.json

  // 重写res.send方法
  res.send = function(data) {
    res.responseBody = data
    return originalSend.call(this, data)
  }

  // 重写res.json方法
  res.json = function(data) {
    res.responseBody = data
    return originalJson.call(this, data)
  }

  // 监听响应完成
  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime
    
    // 构建响应日志
    const responseInfo = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0,
      ip: clientIP,
      userId: req.user ? req.user._id : null,
      timestamp: new Date().toISOString()
    }

    // 记录响应体（开发环境或错误响应）
    if (config.env === 'development' || res.statusCode >= 400) {
      if (res.responseBody) {
        try {
          const body = typeof res.responseBody === 'string' ? 
            JSON.parse(res.responseBody) : res.responseBody
          responseInfo.responseBody = filterSensitiveData(body)
        } catch (e) {
          responseInfo.responseBody = res.responseBody
        }
      }
    }

    // 根据状态码和响应时间选择日志级别
    let logLevel = 'info'
    if (res.statusCode >= 500) {
      logLevel = 'error'
    } else if (res.statusCode >= 400) {
      logLevel = 'warn'
    } else if (responseTime > 5000) { // 超过5秒的慢请求
      logLevel = 'warn'
      responseInfo.slowRequest = true
    }

    logger[logLevel]('API请求完成', responseInfo)

    // 记录性能指标
    logger.logPerformance(`${req.method} ${req.path}`, responseTime, 'ms')

    // 记录API调用统计
    logger.logRequest(req, res, responseTime)
  })

  // 监听响应错误
  res.on('error', (error) => {
    const responseTime = Date.now() - req.startTime
    
    logger.error('API响应错误', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      ip: clientIP,
      userId: req.user ? req.user._id : null,
      timestamp: new Date().toISOString()
    })
  })

  next()
}

/**
 * 健康检查请求过滤器
 */
const skipHealthCheck = (req, res, next) => {
  // 跳过健康检查和静态资源的日志记录
  const skipPaths = ['/health', '/favicon.ico', '/robots.txt']
  
  if (skipPaths.includes(req.path)) {
    return next()
  }
  
  return requestLogger(req, res, next)
}

/**
 * API统计中间件
 */
const apiStats = (req, res, next) => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime
    const endpoint = `${req.method} ${req.route ? req.route.path : req.path}`
    
    // 这里可以将统计数据发送到监控系统
    // 例如：Prometheus、StatsD等
    
    logger.debug('API统计', {
      endpoint,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date().toISOString()
    })
  })
  
  next()
}

/**
 * 错误请求监控
 */
const errorMonitor = (req, res, next) => {
  res.on('finish', () => {
    // 监控4xx和5xx错误
    if (res.statusCode >= 400) {
      const errorInfo = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        ip: getClientIP(req),
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user._id : null,
        timestamp: new Date().toISOString()
      }

      // 记录安全相关错误
      if (res.statusCode === 401 || res.statusCode === 403) {
        logger.logSecurity('认证授权错误', errorInfo.ip, errorInfo)
      }

      // 记录客户端错误
      if (res.statusCode >= 400 && res.statusCode < 500) {
        logger.warn('客户端错误', errorInfo)
      }

      // 记录服务器错误
      if (res.statusCode >= 500) {
        logger.error('服务器错误', errorInfo)
      }
    }
  })
  
  next()
}

module.exports = {
  requestLogger,
  skipHealthCheck,
  apiStats,
  errorMonitor,
  generateRequestId,
  getClientIP,
  getUserAgent,
  filterSensitiveData
}
