/**
 * @fileoverview 通用验证工具函数
 * @description 提供各种数据验证的通用工具函数
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

/**
 * 验证邮箱格式
 * @description 验证邮箱地址格式是否正确
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效的邮箱地址
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * 验证身份证号码
 * @description 验证中国大陆身份证号码格式和校验位
 * @param {string} idCard - 身份证号码
 * @returns {boolean} 是否为有效的身份证号码
 */
export const isValidIdCard = (idCard) => {
  if (!idCard || typeof idCard !== 'string') return false
  
  const cleanId = idCard.trim().toUpperCase()
  
  // 18位身份证号码正则
  const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]$/
  
  if (!idCardRegex.test(cleanId)) return false
  
  // 校验位验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(cleanId[i]) * weights[i]
  }
  
  const checkCode = checkCodes[sum % 11]
  return checkCode === cleanId[17]
}

/**
 * 验证URL格式
 * @description 验证URL地址格式是否正确
 * @param {string} url - URL地址
 * @returns {boolean} 是否为有效的URL
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证中文姓名
 * @description 验证中文姓名格式
 * @param {string} name - 姓名
 * @returns {boolean} 是否为有效的中文姓名
 */
export const isValidChineseName = (name) => {
  if (!name || typeof name !== 'string') return false
  
  const nameRegex = /^[\u4e00-\u9fa5]{2,10}$/
  return nameRegex.test(name.trim())
}

/**
 * 验证密码强度
 * @description 验证密码是否符合强度要求
 * @param {string} password - 密码
 * @param {Object} options - 验证选项
 * @param {number} options.minLength - 最小长度，默认8
 * @param {boolean} options.requireUppercase - 是否需要大写字母，默认true
 * @param {boolean} options.requireLowercase - 是否需要小写字母，默认true
 * @param {boolean} options.requireNumbers - 是否需要数字，默认true
 * @param {boolean} options.requireSpecialChars - 是否需要特殊字符，默认false
 * @returns {Object} 验证结果对象
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = options
  
  const result = {
    isValid: true,
    errors: [],
    strength: 0
  }
  
  if (!password || typeof password !== 'string') {
    result.isValid = false
    result.errors.push('密码不能为空')
    return result
  }
  
  // 长度检查
  if (password.length < minLength) {
    result.isValid = false
    result.errors.push(`密码长度至少${minLength}位`)
  } else {
    result.strength += 1
  }
  
  // 大写字母检查
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false
    result.errors.push('密码必须包含大写字母')
  } else if (/[A-Z]/.test(password)) {
    result.strength += 1
  }
  
  // 小写字母检查
  if (requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false
    result.errors.push('密码必须包含小写字母')
  } else if (/[a-z]/.test(password)) {
    result.strength += 1
  }
  
  // 数字检查
  if (requireNumbers && !/\d/.test(password)) {
    result.isValid = false
    result.errors.push('密码必须包含数字')
  } else if (/\d/.test(password)) {
    result.strength += 1
  }
  
  // 特殊字符检查
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.isValid = false
    result.errors.push('密码必须包含特殊字符')
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.strength += 1
  }
  
  return result
}

/**
 * 验证银行卡号
 * @description 使用Luhn算法验证银行卡号
 * @param {string} cardNumber - 银行卡号
 * @returns {boolean} 是否为有效的银行卡号
 */
export const isValidBankCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') return false
  
  const cleanNumber = cardNumber.replace(/\D/g, '')
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false
  
  // Luhn算法验证
  let sum = 0
  let isEven = false
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * 验证数字范围
 * @description 验证数字是否在指定范围内
 * @param {number} value - 要验证的值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 是否在范围内
 */
export const isInRange = (value, min, max) => {
  if (typeof value !== 'number' || isNaN(value)) return false
  return value >= min && value <= max
}

/**
 * 验证字符串长度
 * @description 验证字符串长度是否在指定范围内
 * @param {string} str - 要验证的字符串
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @returns {boolean} 长度是否符合要求
 */
export const isValidLength = (str, min, max) => {
  if (!str || typeof str !== 'string') return false
  const length = str.trim().length
  return length >= min && length <= max
}

/**
 * 验证只包含中文字符
 * @description 验证字符串是否只包含中文字符
 * @param {string} str - 要验证的字符串
 * @returns {boolean} 是否只包含中文字符
 */
export const isOnlyChinese = (str) => {
  if (!str || typeof str !== 'string') return false
  return /^[\u4e00-\u9fa5]+$/.test(str.trim())
}

/**
 * 验证只包含英文字符
 * @description 验证字符串是否只包含英文字符
 * @param {string} str - 要验证的字符串
 * @returns {boolean} 是否只包含英文字符
 */
export const isOnlyEnglish = (str) => {
  if (!str || typeof str !== 'string') return false
  return /^[a-zA-Z]+$/.test(str.trim())
}

/**
 * 验证只包含数字
 * @description 验证字符串是否只包含数字
 * @param {string} str - 要验证的字符串
 * @returns {boolean} 是否只包含数字
 */
export const isOnlyNumbers = (str) => {
  if (!str || typeof str !== 'string') return false
  return /^\d+$/.test(str.trim())
}

/**
 * 验证IP地址
 * @description 验证IPv4地址格式
 * @param {string} ip - IP地址
 * @returns {boolean} 是否为有效的IP地址
 */
export const isValidIP = (ip) => {
  if (!ip || typeof ip !== 'string') return false
  
  const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip.trim())
}

/**
 * 综合验证函数
 * @description 根据规则对象验证数据
 * @param {any} value - 要验证的值
 * @param {Object} rules - 验证规则
 * @returns {Object} 验证结果
 */
export const validate = (value, rules) => {
  const result = {
    isValid: true,
    errors: []
  }
  
  if (!rules || typeof rules !== 'object') {
    return result
  }
  
  // 必填验证
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    result.isValid = false
    result.errors.push(rules.requiredMessage || '此字段为必填项')
    return result
  }
  
  // 如果值为空且非必填，跳过其他验证
  if (!value || (typeof value === 'string' && !value.trim())) {
    return result
  }
  
  // 类型验证
  if (rules.type) {
    const typeValidators = {
      email: isValidEmail,
      url: isValidUrl,
      chineseName: isValidChineseName,
      bankCard: isValidBankCard,
      ip: isValidIP
    }
    
    const validator = typeValidators[rules.type]
    if (validator && !validator(value)) {
      result.isValid = false
      result.errors.push(rules.typeMessage || `${rules.type}格式不正确`)
    }
  }
  
  // 长度验证
  if (rules.minLength || rules.maxLength) {
    const length = typeof value === 'string' ? value.trim().length : String(value).length
    
    if (rules.minLength && length < rules.minLength) {
      result.isValid = false
      result.errors.push(rules.minLengthMessage || `最少需要${rules.minLength}个字符`)
    }
    
    if (rules.maxLength && length > rules.maxLength) {
      result.isValid = false
      result.errors.push(rules.maxLengthMessage || `最多允许${rules.maxLength}个字符`)
    }
  }
  
  // 正则验证
  if (rules.pattern) {
    const regex = new RegExp(rules.pattern)
    if (!regex.test(String(value))) {
      result.isValid = false
      result.errors.push(rules.patternMessage || '格式不正确')
    }
  }
  
  // 自定义验证函数
  if (rules.validator && typeof rules.validator === 'function') {
    const customResult = rules.validator(value)
    if (customResult !== true) {
      result.isValid = false
      result.errors.push(customResult || '验证失败')
    }
  }
  
  return result
}
