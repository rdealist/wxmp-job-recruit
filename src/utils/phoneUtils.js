/**
 * @fileoverview 电话号码工具函数
 * @description 提供电话号码相关的验证、格式化、脱敏等工具函数
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import Taro from '@tarojs/taro'

/**
 * 验证手机号码格式
 * @description 验证中国大陆手机号码格式是否正确
 * @param {string} phone - 手机号码
 * @returns {boolean} 是否为有效的手机号码
 * @example
 * isValidMobile('13812345678') // true
 * isValidMobile('12345678901') // false
 */
export const isValidMobile = (phone) => {
  if (!phone || typeof phone !== 'string') return false
  
  // 中国大陆手机号码正则表达式
  // 1开头，第二位为3-9，总共11位数字
  const mobileRegex = /^1[3-9]\d{9}$/
  
  return mobileRegex.test(phone.trim())
}

/**
 * 验证固定电话格式
 * @description 验证固定电话号码格式是否正确
 * @param {string} phone - 固定电话号码
 * @returns {boolean} 是否为有效的固定电话
 * @example
 * isValidLandline('010-12345678') // true
 * isValidLandline('0571-87654321') // true
 */
export const isValidLandline = (phone) => {
  if (!phone || typeof phone !== 'string') return false
  
  // 固定电话正则表达式
  // 支持格式：010-12345678, 0571-87654321, 400-123-4567等
  const landlineRegex = /^(\d{3,4}-?)?\d{7,8}$|^400-?\d{3}-?\d{4}$|^800-?\d{3}-?\d{4}$/
  
  return landlineRegex.test(phone.trim().replace(/\s/g, ''))
}

/**
 * 验证电话号码（手机或固话）
 * @description 验证电话号码是否为有效的手机号或固定电话
 * @param {string} phone - 电话号码
 * @returns {boolean} 是否为有效的电话号码
 */
export const isValidPhone = (phone) => {
  return isValidMobile(phone) || isValidLandline(phone)
}

/**
 * 格式化手机号码显示
 * @description 将手机号码格式化为易读的格式
 * @param {string} phone - 手机号码
 * @param {string} separator - 分隔符，默认为空格
 * @returns {string} 格式化后的手机号码
 * @example
 * formatMobile('13812345678') // '138 1234 5678'
 * formatMobile('13812345678', '-') // '138-1234-5678'
 */
export const formatMobile = (phone, separator = ' ') => {
  if (!phone || !isValidMobile(phone)) return phone
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length === 11) {
    return `${cleanPhone.slice(0, 3)}${separator}${cleanPhone.slice(3, 7)}${separator}${cleanPhone.slice(7)}`
  }
  
  return phone
}

/**
 * 脱敏处理电话号码
 * @description 将电话号码中间部分替换为星号
 * @param {string} phone - 电话号码
 * @param {number} startKeep - 开头保留位数，默认为3
 * @param {number} endKeep - 结尾保留位数，默认为4
 * @returns {string} 脱敏后的电话号码
 * @example
 * maskPhone('13812345678') // '138****5678'
 * maskPhone('13812345678', 2, 2) // '13******78'
 */
export const maskPhone = (phone, startKeep = 3, endKeep = 4) => {
  if (!phone || typeof phone !== 'string') return ''
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length < startKeep + endKeep) {
    return phone
  }
  
  const start = cleanPhone.slice(0, startKeep)
  const end = cleanPhone.slice(-endKeep)
  const middle = '*'.repeat(cleanPhone.length - startKeep - endKeep)
  
  return `${start}${middle}${end}`
}

/**
 * 拨打电话
 * @description 调用系统拨号功能
 * @param {string} phoneNumber - 电话号码
 * @param {Object} options - 配置选项
 * @param {boolean} options.confirm - 是否显示确认对话框，默认为true
 * @param {string} options.contactName - 联系人姓名
 * @returns {Promise<boolean>} 是否成功调用拨号
 */
export const makePhoneCall = async (phoneNumber, options = {}) => {
  const { confirm = true, contactName = '' } = options
  
  if (!phoneNumber) {
    Taro.showToast({
      title: '电话号码无效',
      icon: 'error'
    })
    return false
  }
  
  if (!isValidPhone(phoneNumber)) {
    Taro.showToast({
      title: '电话号码格式不正确',
      icon: 'error'
    })
    return false
  }
  
  try {
    // 显示确认对话框
    if (confirm) {
      const result = await new Promise((resolve) => {
        Taro.showModal({
          title: '拨打电话',
          content: `确认拨打 ${phoneNumber}${contactName ? ` (${contactName})` : ''} 吗？`,
          success: (res) => resolve(res.confirm),
          fail: () => resolve(false)
        })
      })
      
      if (!result) return false
    }
    
    // 调用拨号功能
    await Taro.makePhoneCall({
      phoneNumber: phoneNumber
    })
    
    return true
  } catch (error) {
    console.error('拨号失败:', error)
    Taro.showToast({
      title: '拨号失败，请重试',
      icon: 'error'
    })
    return false
  }
}

/**
 * 复制电话号码到剪贴板
 * @description 将电话号码复制到系统剪贴板
 * @param {string} phoneNumber - 电话号码
 * @param {string} label - 标签名称，用于提示信息
 * @returns {Promise<boolean>} 是否成功复制
 */
export const copyPhoneNumber = async (phoneNumber, label = '电话号码') => {
  if (!phoneNumber) {
    Taro.showToast({
      title: `${label}无效`,
      icon: 'error'
    })
    return false
  }
  
  try {
    await Taro.setClipboardData({
      data: phoneNumber
    })
    
    Taro.showToast({
      title: `${label}已复制`,
      icon: 'success'
    })
    
    return true
  } catch (error) {
    console.error('复制失败:', error)
    Taro.showToast({
      title: '复制失败，请重试',
      icon: 'error'
    })
    return false
  }
}

/**
 * 获取电话号码类型
 * @description 判断电话号码的类型
 * @param {string} phone - 电话号码
 * @returns {string} 电话号码类型：'mobile' | 'landline' | 'service' | 'unknown'
 */
export const getPhoneType = (phone) => {
  if (!phone || typeof phone !== 'string') return 'unknown'
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  // 手机号码
  if (isValidMobile(phone)) {
    return 'mobile'
  }
  
  // 服务号码（400、800等）
  if (/^(400|800)/.test(cleanPhone)) {
    return 'service'
  }
  
  // 固定电话
  if (isValidLandline(phone)) {
    return 'landline'
  }
  
  return 'unknown'
}

/**
 * 获取手机号码运营商
 * @description 根据手机号码前缀判断运营商
 * @param {string} phone - 手机号码
 * @returns {string} 运营商名称
 */
export const getMobileCarrier = (phone) => {
  if (!isValidMobile(phone)) return '未知'
  
  const prefix = phone.slice(0, 3)
  
  // 中国移动
  const cmPrefixes = ['134', '135', '136', '137', '138', '139', '147', '150', '151', '152', '157', '158', '159', '178', '182', '183', '184', '187', '188', '198']
  
  // 中国联通
  const cuPrefixes = ['130', '131', '132', '145', '155', '156', '166', '175', '176', '185', '186']
  
  // 中国电信
  const ctPrefixes = ['133', '149', '153', '173', '177', '180', '181', '189', '199']
  
  if (cmPrefixes.includes(prefix)) return '中国移动'
  if (cuPrefixes.includes(prefix)) return '中国联通'
  if (ctPrefixes.includes(prefix)) return '中国电信'
  
  return '未知运营商'
}

/**
 * 清理电话号码
 * @description 清理电话号码中的非数字字符
 * @param {string} phone - 电话号码
 * @returns {string} 清理后的电话号码
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return ''
  
  return phone.replace(/\D/g, '')
}
