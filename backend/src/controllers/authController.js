/**
 * @fileoverview 认证控制器
 * @description 处理用户认证相关的业务逻辑
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const User = require('../models/User')
const { wechatService } = require('../config/wechat')
const { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  blacklistToken 
} = require('../middleware/auth')
const { 
  successResponse, 
  BusinessError, 
  ValidationError 
} = require('../middleware/errorHandler')
const { cacheService } = require('../config/redis')
const logger = require('../utils/logger')
const Joi = require('joi')

/**
 * 验证schemas
 */
const schemas = {
  wechatLogin: Joi.object({
    code: Joi.string().required().messages({
      'string.empty': '微信授权code不能为空',
      'any.required': '微信授权code是必需的'
    }),
    encryptedData: Joi.string().optional(),
    iv: Joi.string().optional()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'string.empty': '刷新令牌不能为空',
      'any.required': '刷新令牌是必需的'
    })
  }),

  getPhoneNumber: Joi.object({
    code: Joi.string().required().messages({
      'string.empty': '手机号授权code不能为空',
      'any.required': '手机号授权code是必需的'
    })
  }),

  updateProfile: Joi.object({
    nickName: Joi.string().max(50).optional(),
    avatar: Joi.string().uri().optional(),
    gender: Joi.number().valid(0, 1, 2).optional(),
    province: Joi.string().max(20).optional(),
    city: Joi.string().max(20).optional(),
    county: Joi.string().max(20).optional()
  })
}

/**
 * 微信小程序登录
 */
const wechatLogin = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.wechatLogin.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { code, encryptedData, iv } = value

  try {
    // 通过微信API获取用户信息
    const wechatUserInfo = await wechatService.code2Session(code)
    const { openid, sessionKey, unionid } = wechatUserInfo

    // 查找或创建用户
    let user = await User.findByOpenId(openid)
    
    if (!user) {
      // 创建新用户
      user = new User({
        openId: openid,
        unionId: unionid,
        sessionKey,
        nickName: '微信用户',
        avatar: '',
        status: 1
      })

      // 如果有加密数据，解密用户信息
      if (encryptedData && iv) {
        try {
          const decryptedData = wechatService.decryptData(encryptedData, iv, sessionKey)
          
          user.nickName = decryptedData.nickName || '微信用户'
          user.avatar = decryptedData.avatarUrl || ''
          user.gender = decryptedData.gender || 0
          user.province = decryptedData.province || ''
          user.city = decryptedData.city || ''
          user.county = decryptedData.county || ''
        } catch (decryptError) {
          logger.warn('解密用户数据失败:', decryptError.message)
        }
      }

      await user.save()
      logger.logBusiness('用户注册', user._id, { openId: openid })
    } else {
      // 更新现有用户的session key和登录时间
      user.sessionKey = sessionKey
      user.lastLoginTime = new Date()
      
      // 如果有加密数据，更新用户信息
      if (encryptedData && iv) {
        try {
          const decryptedData = wechatService.decryptData(encryptedData, iv, sessionKey)
          
          user.nickName = decryptedData.nickName || user.nickName
          user.avatar = decryptedData.avatarUrl || user.avatar
          user.gender = decryptedData.gender || user.gender
          user.province = decryptedData.province || user.province
          user.city = decryptedData.city || user.city
          user.county = decryptedData.county || user.county
        } catch (decryptError) {
          logger.warn('解密用户数据失败:', decryptError.message)
        }
      }

      await user.save()
      logger.logBusiness('用户登录', user._id, { openId: openid })
    }

    // 生成JWT令牌
    const token = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    // 缓存用户信息
    await cacheService.set(`user:${user._id}`, user, 30 * 60) // 30分钟

    // 返回登录结果
    const responseData = {
      token,
      refreshToken,
      user: user.getDetailInfo()
    }

    res.json(successResponse(responseData, '登录成功'))

  } catch (error) {
    logger.error('微信登录失败:', error.message)
    throw new BusinessError('微信登录失败，请重试')
  }
}

/**
 * 刷新访问令牌
 */
const refreshToken = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.refreshToken.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { refreshToken: token } = value

  try {
    // 验证刷新令牌
    const decoded = verifyRefreshToken(token)
    
    // 查找用户
    const user = await User.findById(decoded.userId)
    if (!user || user.status !== 1) {
      throw new BusinessError('用户不存在或已被禁用')
    }

    // 生成新的令牌
    const newToken = generateToken(user)
    const newRefreshToken = generateRefreshToken(user)

    // 将旧的刷新令牌加入黑名单
    await blacklistToken(token)

    // 更新用户最后登录时间
    user.lastLoginTime = new Date()
    await user.save()

    // 缓存用户信息
    await cacheService.set(`user:${user._id}`, user, 30 * 60)

    logger.logBusiness('令牌刷新', user._id)

    const responseData = {
      token: newToken,
      refreshToken: newRefreshToken
    }

    res.json(successResponse(responseData, '令牌刷新成功'))

  } catch (error) {
    logger.error('令牌刷新失败:', error.message)
    throw new BusinessError('刷新令牌无效或已过期')
  }
}

/**
 * 用户登出
 */
const logout = async (req, res) => {
  try {
    const { user, token } = req

    // 将当前令牌加入黑名单
    await blacklistToken(token)

    // 清除用户缓存
    await cacheService.del(`user:${user._id}`)

    logger.logBusiness('用户登出', user._id)

    res.json(successResponse(null, '登出成功'))

  } catch (error) {
    logger.error('用户登出失败:', error.message)
    throw new BusinessError('登出失败，请重试')
  }
}

/**
 * 获取用户手机号
 */
const getPhoneNumber = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.getPhoneNumber.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { code } = value
  const { user } = req

  try {
    // 通过微信API获取手机号
    const phoneInfo = await wechatService.getPhoneNumber(code)
    
    // 更新用户手机号
    user.phone = phoneInfo.phoneNumber
    await user.save()

    // 更新缓存
    await cacheService.set(`user:${user._id}`, user, 30 * 60)

    logger.logBusiness('获取手机号', user._id, { phone: phoneInfo.purePhoneNumber })

    const responseData = {
      phoneNumber: phoneInfo.phoneNumber,
      purePhoneNumber: phoneInfo.purePhoneNumber,
      countryCode: phoneInfo.countryCode
    }

    res.json(successResponse(responseData, '手机号获取成功'))

  } catch (error) {
    logger.error('获取手机号失败:', error.message)
    throw new BusinessError('获取手机号失败，请重试')
  }
}

/**
 * 获取当前用户信息
 */
const getProfile = async (req, res) => {
  try {
    const { user } = req

    // 更新最后活跃时间
    await user.updateLastActive()

    res.json(successResponse(user.getDetailInfo(), '获取成功'))

  } catch (error) {
    logger.error('获取用户信息失败:', error.message)
    throw new BusinessError('获取用户信息失败')
  }
}

/**
 * 更新用户信息
 */
const updateProfile = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.updateProfile.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { user } = req

  try {
    // 更新用户信息
    Object.assign(user, value)
    await user.save()

    // 更新缓存
    await cacheService.set(`user:${user._id}`, user, 30 * 60)

    logger.logBusiness('更新用户信息', user._id, value)

    res.json(successResponse(user.getDetailInfo(), '更新成功'))

  } catch (error) {
    logger.error('更新用户信息失败:', error.message)
    throw new BusinessError('更新用户信息失败')
  }
}

module.exports = {
  wechatLogin,
  refreshToken,
  logout,
  getPhoneNumber,
  getProfile,
  updateProfile
}
