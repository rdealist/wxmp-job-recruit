/**
 * @fileoverview 微信小程序配置
 * @description 微信小程序登录和API调用配置
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const axios = require('axios')
const crypto = require('crypto')
const config = require('./index')
const logger = require('../utils/logger')

/**
 * 微信小程序API配置
 */
const wechatConfig = {
  appId: config.wechat.appId,
  appSecret: config.wechat.appSecret,
  apiUrl: config.wechat.apiUrl,
  
  // API端点
  endpoints: {
    // 登录凭证校验
    jscode2session: '/sns/jscode2session',
    // 获取access_token
    getAccessToken: '/cgi-bin/token',
    // 发送订阅消息
    sendMessage: '/cgi-bin/message/subscribe/send',
    // 生成小程序码
    getWxacode: '/wxa/getwxacode',
    // 获取用户手机号
    getPhoneNumber: '/wxa/business/getuserphonenumber'
  }
}

/**
 * 微信小程序服务类
 */
class WechatService {
  constructor() {
    this.accessToken = null
    this.accessTokenExpires = 0
  }

  /**
   * 通过code获取用户openid和session_key
   */
  async code2Session(code) {
    try {
      const url = `${wechatConfig.apiUrl}${wechatConfig.endpoints.jscode2session}`
      
      const response = await axios.get(url, {
        params: {
          appid: wechatConfig.appId,
          secret: wechatConfig.appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        },
        timeout: 10000
      })

      const data = response.data

      if (data.errcode) {
        throw new Error(`微信登录失败: ${data.errmsg} (${data.errcode})`)
      }

      logger.info('微信登录成功:', { openid: data.openid })

      return {
        openid: data.openid,
        sessionKey: data.session_key,
        unionid: data.unionid
      }

    } catch (error) {
      logger.error('微信code2Session失败:', error.message)
      throw new Error('微信登录验证失败')
    }
  }

  /**
   * 获取access_token
   */
  async getAccessToken() {
    try {
      // 检查token是否过期
      if (this.accessToken && Date.now() < this.accessTokenExpires) {
        return this.accessToken
      }

      const url = `${wechatConfig.apiUrl}${wechatConfig.endpoints.getAccessToken}`
      
      const response = await axios.get(url, {
        params: {
          grant_type: 'client_credential',
          appid: wechatConfig.appId,
          secret: wechatConfig.appSecret
        },
        timeout: 10000
      })

      const data = response.data

      if (data.errcode) {
        throw new Error(`获取access_token失败: ${data.errmsg} (${data.errcode})`)
      }

      // 缓存token，提前5分钟过期
      this.accessToken = data.access_token
      this.accessTokenExpires = Date.now() + (data.expires_in - 300) * 1000

      logger.info('获取access_token成功')
      return this.accessToken

    } catch (error) {
      logger.error('获取access_token失败:', error.message)
      throw new Error('获取微信access_token失败')
    }
  }

  /**
   * 解密用户敏感数据
   */
  decryptData(encryptedData, iv, sessionKey) {
    try {
      const sessionKeyBuffer = Buffer.from(sessionKey, 'base64')
      const encryptedDataBuffer = Buffer.from(encryptedData, 'base64')
      const ivBuffer = Buffer.from(iv, 'base64')

      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer)
      decipher.setAutoPadding(true)

      let decrypted = decipher.update(encryptedDataBuffer, null, 'utf8')
      decrypted += decipher.final('utf8')

      const decryptedData = JSON.parse(decrypted)

      // 验证数据完整性
      if (decryptedData.watermark.appid !== wechatConfig.appId) {
        throw new Error('数据完整性验证失败')
      }

      return decryptedData

    } catch (error) {
      logger.error('解密用户数据失败:', error.message)
      throw new Error('用户数据解密失败')
    }
  }

  /**
   * 获取用户手机号
   */
  async getPhoneNumber(code) {
    try {
      const accessToken = await this.getAccessToken()
      const url = `${wechatConfig.apiUrl}${wechatConfig.endpoints.getPhoneNumber}`

      const response = await axios.post(
        `${url}?access_token=${accessToken}`,
        { code },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      const data = response.data

      if (data.errcode !== 0) {
        throw new Error(`获取手机号失败: ${data.errmsg} (${data.errcode})`)
      }

      return {
        phoneNumber: data.phone_info.phoneNumber,
        purePhoneNumber: data.phone_info.purePhoneNumber,
        countryCode: data.phone_info.countryCode
      }

    } catch (error) {
      logger.error('获取用户手机号失败:', error.message)
      throw new Error('获取手机号失败')
    }
  }

  /**
   * 发送订阅消息
   */
  async sendSubscribeMessage(openid, templateId, data, page = '') {
    try {
      const accessToken = await this.getAccessToken()
      const url = `${wechatConfig.apiUrl}${wechatConfig.endpoints.sendMessage}`

      const response = await axios.post(
        `${url}?access_token=${accessToken}`,
        {
          touser: openid,
          template_id: templateId,
          page,
          data,
          miniprogram_state: config.env === 'production' ? 'formal' : 'trial'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      const result = response.data

      if (result.errcode !== 0) {
        throw new Error(`发送订阅消息失败: ${result.errmsg} (${result.errcode})`)
      }

      logger.info('订阅消息发送成功:', { openid, templateId })
      return true

    } catch (error) {
      logger.error('发送订阅消息失败:', error.message)
      throw new Error('发送订阅消息失败')
    }
  }

  /**
   * 生成小程序码
   */
  async generateWxacode(scene, page = 'pages/home/index', width = 430) {
    try {
      const accessToken = await this.getAccessToken()
      const url = `${wechatConfig.apiUrl}${wechatConfig.endpoints.getWxacode}`

      const response = await axios.post(
        `${url}?access_token=${accessToken}`,
        {
          scene,
          page,
          width,
          auto_color: false,
          line_color: { r: 102, g: 151, b: 245 }, // 主题色
          is_hyaline: true
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      )

      // 检查是否返回错误信息
      const contentType = response.headers['content-type']
      if (contentType && contentType.includes('application/json')) {
        const errorData = JSON.parse(response.data.toString())
        throw new Error(`生成小程序码失败: ${errorData.errmsg} (${errorData.errcode})`)
      }

      logger.info('小程序码生成成功:', { scene, page })
      return Buffer.from(response.data)

    } catch (error) {
      logger.error('生成小程序码失败:', error.message)
      throw new Error('生成小程序码失败')
    }
  }

  /**
   * 验证签名
   */
  verifySignature(signature, timestamp, nonce, token) {
    try {
      const tmpArr = [token, timestamp, nonce].sort()
      const tmpStr = tmpArr.join('')
      const hash = crypto.createHash('sha1').update(tmpStr).digest('hex')
      
      return hash === signature

    } catch (error) {
      logger.error('验证微信签名失败:', error.message)
      return false
    }
  }

  /**
   * 检查微信服务状态
   */
  async checkServiceHealth() {
    try {
      await this.getAccessToken()
      
      return {
        status: 'healthy',
        appId: wechatConfig.appId,
        hasAccessToken: !!this.accessToken
      }

    } catch (error) {
      logger.error('微信服务健康检查失败:', error.message)
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }
}

// 创建微信服务实例
const wechatService = new WechatService()

module.exports = {
  wechatConfig,
  wechatService
}
