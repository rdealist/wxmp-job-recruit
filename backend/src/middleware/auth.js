/**
 * @fileoverview 认证中间件
 * @description JWT认证和权限验证中间件
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const jwt = require('jsonwebtoken')
const config = require('../config/index')
const logger = require('../utils/logger')
const User = require('../models/User')
const { cacheService } = require('../config/redis')

/**
 * JWT认证中间件
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌缺失',
        timestamp: new Date().toISOString()
      })
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, config.jwt.secret)
    
    // 检查令牌是否在黑名单中
    const isBlacklisted = await cacheService.get(`blacklist:${token}`)
    if (isBlacklisted) {
      return res.status(401).json({
        code: 401,
        message: '令牌已失效',
        timestamp: new Date().toISOString()
      })
    }

    // 从缓存或数据库获取用户信息
    let user = await cacheService.get(`user:${decoded.userId}`)
    
    if (!user) {
      user = await User.findById(decoded.userId).select('-sessionKey')
      
      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户不存在',
          timestamp: new Date().toISOString()
        })
      }

      // 缓存用户信息
      await cacheService.set(`user:${decoded.userId}`, user, config.cache.userInfoTtl)
    }

    // 检查用户状态
    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '账户已被冻结',
        timestamp: new Date().toISOString()
      })
    }

    // 更新用户最后活跃时间
    if (user.lastActiveTime < new Date(Date.now() - 5 * 60 * 1000)) { // 5分钟内不重复更新
      await User.findByIdAndUpdate(decoded.userId, { 
        lastActiveTime: new Date() 
      })
    }

    // 将用户信息添加到请求对象
    req.user = user
    req.token = token

    logger.logBusiness('用户认证', user._id, { 
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    })

    next()

  } catch (error) {
    logger.error('JWT认证失败:', error.message)

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的访问令牌',
        timestamp: new Date().toISOString()
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '访问令牌已过期',
        timestamp: new Date().toISOString()
      })
    }

    return res.status(500).json({
      code: 500,
      message: '认证服务异常',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, config.jwt.secret)
    const user = await User.findById(decoded.userId).select('-sessionKey')

    if (user && user.status === 1) {
      req.user = user
      req.token = token
    }

    next()

  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    logger.warn('可选认证失败:', error.message)
    next()
  }
}

/**
 * 权限验证中间件
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '需要登录',
        timestamp: new Date().toISOString()
      })
    }

    if (!req.user.hasPermission(permission)) {
      logger.logSecurity('权限不足', req.ip, {
        userId: req.user._id,
        permission,
        path: req.path
      })

      return res.status(403).json({
        code: 403,
        message: '权限不足',
        timestamp: new Date().toISOString()
      })
    }

    next()
  }
}

/**
 * 角色验证中间件
 */
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles]
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '需要登录',
        timestamp: new Date().toISOString()
      })
    }

    if (!roleArray.includes(req.user.role)) {
      logger.logSecurity('角色权限不足', req.ip, {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roleArray,
        path: req.path
      })

      return res.status(403).json({
        code: 403,
        message: '角色权限不足',
        timestamp: new Date().toISOString()
      })
    }

    next()
  }
}

/**
 * 管理员权限验证
 */
const requireAdmin = requireRole(['admin'])

/**
 * 资源所有者验证中间件
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'publisherId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '需要登录',
          timestamp: new Date().toISOString()
        })
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next()
      }

      const resourceId = req.params[resourceIdParam]
      if (!resourceId) {
        return res.status(400).json({
          code: 400,
          message: '资源ID缺失',
          timestamp: new Date().toISOString()
        })
      }

      // 这里需要根据具体的资源类型来查询
      // 示例：检查职位所有权
      const Job = require('../models/Job')
      const resource = await Job.findById(resourceId)

      if (!resource) {
        return res.status(404).json({
          code: 404,
          message: '资源不存在',
          timestamp: new Date().toISOString()
        })
      }

      if (resource[userIdField].toString() !== req.user._id.toString()) {
        logger.logSecurity('非法访问资源', req.ip, {
          userId: req.user._id,
          resourceId,
          resourceType: 'job',
          path: req.path
        })

        return res.status(403).json({
          code: 403,
          message: '无权访问此资源',
          timestamp: new Date().toISOString()
        })
      }

      req.resource = resource
      next()

    } catch (error) {
      logger.error('资源所有权验证失败:', error.message)
      return res.status(500).json({
        code: 500,
        message: '权限验证异常',
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * 生成JWT令牌
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id,
    openId: user.openId,
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  }

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  })
}

/**
 * 生成刷新令牌
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  }

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn
  })
}

/**
 * 验证刷新令牌
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    
    if (decoded.type !== 'refresh') {
      throw new Error('无效的刷新令牌类型')
    }

    return decoded

  } catch (error) {
    throw new Error('刷新令牌验证失败')
  }
}

/**
 * 将令牌加入黑名单
 */
const blacklistToken = async (token) => {
  try {
    const decoded = jwt.decode(token)
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
    
    if (expiresIn > 0) {
      await cacheService.set(`blacklist:${token}`, true, expiresIn)
    }

    return true

  } catch (error) {
    logger.error('令牌加入黑名单失败:', error.message)
    return false
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requirePermission,
  requireRole,
  requireAdmin,
  requireOwnership,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken
}
