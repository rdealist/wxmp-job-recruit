/**
 * @fileoverview 日期时间工具函数
 * @description 提供日期时间相关的通用工具函数
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

/**
 * 格式化日期时间
 * @description 将日期对象或时间字符串格式化为指定格式
 * @param {Date|string} date - 日期对象或时间字符串
 * @param {string} format - 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 * @example
 * formatDateTime(new Date()) // '2024-12-05 14:30:00'
 * formatDateTime('2024-12-05T14:30:00.000Z', 'YYYY-MM-DD') // '2024-12-05'
 */
export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return ''
    }
    
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  } catch (error) {
    console.error('日期格式化失败:', error)
    return ''
  }
}

/**
 * 获取相对时间
 * @description 获取相对于当前时间的描述，如"2小时前"、"昨天"等
 * @param {Date|string} date - 日期对象或时间字符串
 * @returns {string} 相对时间描述
 * @example
 * getRelativeTime(new Date(Date.now() - 3600000)) // '1小时前'
 */
export const getRelativeTime = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now - dateObj
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7))
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days === 1) return '昨天'
    if (days === 2) return '前天'
    if (days < 7) return `${days}天前`
    if (weeks < 4) return `${weeks}周前`
    if (months < 12) return `${months}个月前`
    
    return formatDateTime(dateObj, 'YYYY-MM-DD')
  } catch (error) {
    console.error('相对时间计算失败:', error)
    return ''
  }
}

/**
 * 判断是否为今天
 * @description 判断给定日期是否为今天
 * @param {Date|string} date - 日期对象或时间字符串
 * @returns {boolean} 是否为今天
 */
export const isToday = (date) => {
  if (!date) return false
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    
    return dateObj.toDateString() === today.toDateString()
  } catch (error) {
    console.error('日期比较失败:', error)
    return false
  }
}

/**
 * 判断是否为昨天
 * @description 判断给定日期是否为昨天
 * @param {Date|string} date - 日期对象或时间字符串
 * @returns {boolean} 是否为昨天
 */
export const isYesterday = (date) => {
  if (!date) return false
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    return dateObj.toDateString() === yesterday.toDateString()
  } catch (error) {
    console.error('日期比较失败:', error)
    return false
  }
}

/**
 * 获取日期范围
 * @description 获取指定天数范围内的日期数组
 * @param {number} days - 天数
 * @param {Date} startDate - 起始日期，默认为今天
 * @returns {Array<string>} 日期字符串数组
 */
export const getDateRange = (days, startDate = new Date()) => {
  const dates = []
  
  try {
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() - i)
      dates.push(formatDateTime(date, 'YYYY-MM-DD'))
    }
    
    return dates
  } catch (error) {
    console.error('日期范围生成失败:', error)
    return []
  }
}

/**
 * 计算两个日期之间的天数差
 * @description 计算两个日期之间相差的天数
 * @param {Date|string} date1 - 第一个日期
 * @param {Date|string} date2 - 第二个日期
 * @returns {number} 相差的天数
 */
export const getDaysDiff = (date1, date2) => {
  if (!date1 || !date2) return 0
  
  try {
    const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1
    const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2
    
    const timeDiff = Math.abs(dateObj2 - dateObj1)
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    
    return daysDiff
  } catch (error) {
    console.error('日期差计算失败:', error)
    return 0
  }
}

/**
 * 获取工作日
 * @description 判断给定日期是否为工作日（周一到周五）
 * @param {Date|string} date - 日期对象或时间字符串
 * @returns {boolean} 是否为工作日
 */
export const isWorkday = (date) => {
  if (!date) return false
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const dayOfWeek = dateObj.getDay()
    
    // 0 = 周日, 1-5 = 周一到周五, 6 = 周六
    return dayOfWeek >= 1 && dayOfWeek <= 5
  } catch (error) {
    console.error('工作日判断失败:', error)
    return false
  }
}

/**
 * 获取友好的时间描述
 * @description 获取更友好的时间描述，结合相对时间和具体时间
 * @param {Date|string} date - 日期对象或时间字符串
 * @returns {string} 友好的时间描述
 */
export const getFriendlyTime = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isToday(dateObj)) {
      return `今天 ${formatDateTime(dateObj, 'HH:mm')}`
    }
    
    if (isYesterday(dateObj)) {
      return `昨天 ${formatDateTime(dateObj, 'HH:mm')}`
    }
    
    const now = new Date()
    const diff = now - dateObj
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days < 7) {
      return `${days}天前`
    }
    
    return formatDateTime(dateObj, 'MM-DD HH:mm')
  } catch (error) {
    console.error('友好时间生成失败:', error)
    return formatDateTime(date)
  }
}
