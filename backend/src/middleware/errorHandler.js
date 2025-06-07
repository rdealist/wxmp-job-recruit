/**
 * @fileoverview 错误处理中间件
 * @description 统一的错误处理和响应格式化
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const logger = require('../utils/logger')
const config = require('../config/index')

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 业务错误类
 */
class BusinessError extends AppError {
  constructor(message, code = 'BUSINESS_ERROR') {
    super(message, 400, code)
  }
}

/**
 * 验证错误类
 */
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR')
    this.errors = errors
  }
}

/**
 * 权限错误类
 */
class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

/**
 * 资源不存在错误类
 */
class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, 'NOT_FOUND_ERROR')
  }
}

/**
 * 处理Mongoose验证错误
 */
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message,
    value: err.value
  }))

  return new ValidationError('数据验证失败', errors)
}

/**
 * 处理Mongoose重复键错误
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue)[0]
  const value = error.keyValue[field]
  
  const message = `${field} '${value}' 已存在`
  return new BusinessError(message, 'DUPLICATE_KEY_ERROR')
}

/**
 * 处理Mongoose转换错误
 */
const handleCastError = (error) => {
  const message = `无效的 ${error.path}: ${error.value}`
  return new BusinessError(message, 'INVALID_ID_ERROR')
}

/**
 * 处理JWT错误
 */
const handleJWTError = () => {
  return new AppError('无效的访问令牌', 401, 'INVALID_TOKEN_ERROR')
}

/**
 * 处理JWT过期错误
 */
const handleJWTExpiredError = () => {
  return new AppError('访问令牌已过期', 401, 'TOKEN_EXPIRED_ERROR')
}

/**
 * 发送错误响应
 */
const sendErrorResponse = (err, req, res) => {
  const response = {
    code: err.statusCode || 500,
    message: err.message || '服务器内部错误',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  }

  // 添加错误代码
  if (err.code) {
    response.errorCode = err.code
  }

  // 添加验证错误详情
  if (err instanceof ValidationError && err.errors) {
    response.errors = err.errors
  }

  // 开发环境下添加堆栈信息
  if (config.env === 'development' && err.stack) {
    response.stack = err.stack
  }

  // 添加请求ID（如果存在）
  if (req.requestId) {
    response.requestId = req.requestId
  }

  res.status(err.statusCode || 500).json(response)
}

/**
 * 记录错误日志
 */
const logError = (err, req) => {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    code: err.code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : null,
    requestId: req.requestId,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query
  }

  // 根据错误级别记录日志
  if (err.statusCode >= 500) {
    logger.error('服务器错误:', errorInfo)
  } else if (err.statusCode >= 400) {
    logger.warn('客户端错误:', errorInfo)
  } else {
    logger.info('其他错误:', errorInfo)
  }

  // 记录安全相关错误
  if (err.statusCode === 401 || err.statusCode === 403) {
    logger.logSecurity('认证/授权错误', req.ip, {
      userId: req.user ? req.user._id : null,
      error: err.message,
      path: req.originalUrl
    })
  }
}

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // 记录错误日志
  logError(error, req)

  // 处理特定类型的错误
  if (err.name === 'ValidationError') {
    error = handleValidationError(err)
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err)
  } else if (err.name === 'CastError') {
    error = handleCastError(err)
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError()
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError()
  }

  // 确保错误对象有statusCode属性
  if (!error.statusCode) {
    error.statusCode = 500
  }

  // 发送错误响应
  sendErrorResponse(error, req, res)
}

/**
 * 404错误处理中间件
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`路由 ${req.originalUrl} 不存在`)
  next(error)
}

/**
 * 异步错误捕获包装器
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 创建错误响应
 */
const createErrorResponse = (message, statusCode = 500, code = null) => {
  return {
    code: statusCode,
    message,
    errorCode: code,
    timestamp: new Date().toISOString()
  }
}

/**
 * 成功响应格式化
 */
const successResponse = (data = null, message = 'success', code = 200) => {
  const response = {
    code,
    message,
    timestamp: new Date().toISOString()
  }

  if (data !== null) {
    response.data = data
  }

  return response
}

/**
 * 分页响应格式化
 */
const paginationResponse = (data, pagination, message = 'success') => {
  return {
    code: 200,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page * pagination.limit < pagination.total,
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  }
}

module.exports = {
  AppError,
  BusinessError,
  ValidationError,
  AuthorizationError,
  NotFoundError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createErrorResponse,
  successResponse,
  paginationResponse
}
