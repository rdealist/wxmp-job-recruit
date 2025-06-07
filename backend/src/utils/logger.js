/**
 * @fileoverview 日志工具
 * @description 基于Winston的日志记录工具，支持多种输出格式和级别
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const winston = require('winston')
const path = require('path')
const fs = require('fs')
const config = require('../config/index')

// 确保日志目录存在
const logDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

/**
 * 自定义日志格式
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    // 添加堆栈信息
    if (stack) {
      log += `\n${stack}`
    }
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

/**
 * 控制台输出格式
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`
    if (stack) {
      log += `\n${stack}`
    }
    return log
  })
)

/**
 * 创建传输器配置
 */
const transports = []

// 控制台输出
if (config.log.console) {
  transports.push(
    new winston.transports.Console({
      level: config.log.level,
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true
    })
  )
}

// 文件输出
if (config.log.file) {
  // 错误日志文件
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: config.log.maxsize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.log.maxFiles || 5,
      handleExceptions: true,
      handleRejections: true
    })
  )

  // 综合日志文件
  transports.push(
    new winston.transports.File({
      filename: config.log.filename || path.join(logDir, 'app.log'),
      level: config.log.level,
      format: customFormat,
      maxsize: config.log.maxsize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.log.maxFiles || 5
    })
  )

  // 访问日志文件
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'info',
      format: customFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 10
    })
  )
}

/**
 * 创建Logger实例
 */
const logger = winston.createLogger({
  level: config.log.level || 'info',
  format: customFormat,
  transports,
  exitOnError: false,
  
  // 默认元数据
  defaultMeta: {
    service: config.app.name,
    version: config.app.version,
    environment: config.env
  }
})

/**
 * 扩展Logger功能
 */
class ExtendedLogger {
  constructor(winstonLogger) {
    this.logger = winstonLogger
  }

  /**
   * 记录API请求
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0
    }

    // 记录用户信息（如果存在）
    if (req.user) {
      logData.userId = req.user.id
      logData.userRole = req.user.role
    }

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      this.logger.error('API请求', logData)
    } else if (res.statusCode >= 400) {
      this.logger.warn('API请求', logData)
    } else {
      this.logger.info('API请求', logData)
    }
  }

  /**
   * 记录数据库操作
   */
  logDatabase(operation, collection, query = {}, result = {}) {
    this.logger.info('数据库操作', {
      operation,
      collection,
      query: JSON.stringify(query),
      resultCount: result.length || (result.modifiedCount !== undefined ? result.modifiedCount : 1),
      executionTime: result.executionTime || 0
    })
  }

  /**
   * 记录业务操作
   */
  logBusiness(action, userId, details = {}) {
    this.logger.info('业务操作', {
      action,
      userId,
      details,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 记录安全事件
   */
  logSecurity(event, ip, details = {}) {
    this.logger.warn('安全事件', {
      event,
      ip,
      details,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 记录性能指标
   */
  logPerformance(metric, value, unit = 'ms') {
    this.logger.info('性能指标', {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString()
    })
  }

  // 代理Winston的基础方法
  error(message, meta = {}) {
    this.logger.error(message, meta)
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta)
  }

  info(message, meta = {}) {
    this.logger.info(message, meta)
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta)
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta)
  }
}

// 创建扩展Logger实例
const extendedLogger = new ExtendedLogger(logger)

/**
 * 未捕获异常处理
 */
process.on('uncaughtException', (error) => {
  extendedLogger.error('未捕获的异常:', {
    error: error.message,
    stack: error.stack
  })
  
  // 给日志一些时间写入，然后退出
  setTimeout(() => {
    process.exit(1)
  }, 1000)
})

process.on('unhandledRejection', (reason, promise) => {
  extendedLogger.error('未处理的Promise拒绝:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString()
  })
})

module.exports = extendedLogger
