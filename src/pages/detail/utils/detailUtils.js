/**
 * @fileoverview 详情页面工具函数
 * @description 提供详情页面相关的工具函数，包括时间格式化、联系方式处理等
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import Taro from '@tarojs/taro'

/**
 * 格式化时间显示
 * @description 将时间字符串格式化为易读的格式
 * @param {string} dateString - 时间字符串
 * @returns {string} 格式化后的时间字符串
 * @example
 * formatTime('2024-12-05T10:30:00.000Z') // '2024-12-05 10:30'
 */
export const formatTime = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('时间格式化失败:', error)
    return dateString
  }
}

/**
 * 格式化相对时间
 * @description 将时间转换为相对时间显示（如：2小时前、昨天等）
 * @param {string} dateString - 时间字符串
 * @returns {string} 相对时间字符串
 * @example
 * formatRelativeTime('2024-12-05T08:00:00.000Z') // '2小时前'
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days === 1) return '昨天'
    if (days === 2) return '前天'
    if (days < 7) return `${days}天前`
    
    // 超过一周显示具体日期
    return formatTime(dateString)
  } catch (error) {
    console.error('相对时间格式化失败:', error)
    return formatTime(dateString)
  }
}

/**
 * 脱敏处理联系方式
 * @description 将手机号中间部分替换为星号
 * @param {string} contact - 联系方式
 * @returns {string} 脱敏后的联系方式
 * @example
 * maskContact('13812345678') // '138****5678'
 */
export const maskContact = (contact) => {
  if (!contact || typeof contact !== 'string') return ''
  
  // 手机号脱敏
  if (contact.length === 11 && /^1[3-9]\d{9}$/.test(contact)) {
    return contact.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }
  
  // 固定电话脱敏
  if (contact.includes('-')) {
    const parts = contact.split('-')
    if (parts.length === 2 && parts[1].length >= 4) {
      const masked = parts[1].replace(/\d(?=\d{2})/g, '*')
      return `${parts[0]}-${masked}`
    }
  }
  
  // 其他格式的联系方式
  if (contact.length > 4) {
    const start = contact.slice(0, 2)
    const end = contact.slice(-2)
    const middle = '*'.repeat(contact.length - 4)
    return `${start}${middle}${end}`
  }
  
  return contact
}

/**
 * 拨打电话
 * @description 调用系统拨号功能
 * @param {string} phoneNumber - 电话号码
 * @param {string} contactName - 联系人姓名
 * @returns {Promise<boolean>} 是否成功调用拨号
 */
export const makePhoneCall = async (phoneNumber, contactName = '') => {
  if (!phoneNumber) {
    Taro.showToast({
      title: '电话号码无效',
      icon: 'error'
    })
    return false
  }
  
  try {
    // 显示确认对话框
    const result = await new Promise((resolve) => {
      Taro.showModal({
        title: '拨打电话',
        content: `确认拨打 ${phoneNumber}${contactName ? ` (${contactName})` : ''} 吗？`,
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false)
      })
    })
    
    if (!result) return false
    
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
 * 复制联系方式
 * @description 将联系方式复制到剪贴板
 * @param {string} contact - 联系方式
 * @param {string} type - 联系方式类型（如：电话、邮箱等）
 * @returns {Promise<boolean>} 是否成功复制
 */
export const copyContact = async (contact, type = '联系方式') => {
  if (!contact) {
    Taro.showToast({
      title: `${type}无效`,
      icon: 'error'
    })
    return false
  }
  
  try {
    await Taro.setClipboardData({
      data: contact
    })
    
    Taro.showToast({
      title: `${type}已复制`,
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
 * 检查职位是否为今日发布
 * @description 判断职位是否为今天发布
 * @param {string} publishDate - 发布日期字符串
 * @returns {boolean} 是否为今日发布
 */
export const isToday = (publishDate) => {
  if (!publishDate) return false
  
  try {
    const today = new Date().toDateString()
    const jobDate = new Date(publishDate).toDateString()
    return today === jobDate
  } catch (error) {
    console.error('日期比较失败:', error)
    return false
  }
}

/**
 * 获取职位状态标签
 * @description 根据职位信息生成状态标签
 * @param {Object} job - 职位对象
 * @returns {Array<Object>} 状态标签数组
 */
export const getJobStatusTags = (job) => {
  const tags = []
  
  if (!job) return tags
  
  // 今日发布标签
  if (isToday(job.publishDate)) {
    tags.push({
      text: '今日发布',
      type: 'success',
      color: '#00b42a'
    })
  }
  
  // 热门职位标签（可以根据浏览量、申请量等判断）
  if (job.viewCount && job.viewCount > 100) {
    tags.push({
      text: '热门职位',
      type: 'warning',
      color: '#ff7d00'
    })
  }
  
  // 紧急招聘标签
  if (job.urgent) {
    tags.push({
      text: '紧急招聘',
      type: 'error',
      color: '#f53f3f'
    })
  }
  
  // 高薪职位标签
  if (job.salary && job.salary.includes('K')) {
    const salaryMatch = job.salary.match(/(\d+)-?(\d+)?K/i)
    if (salaryMatch) {
      const maxSalary = parseInt(salaryMatch[2] || salaryMatch[1], 10)
      if (maxSalary >= 30) {
        tags.push({
          text: '高薪职位',
          type: 'primary',
          color: '#6697f5'
        })
      }
    }
  }
  
  return tags
}

/**
 * 验证职位数据完整性
 * @description 检查职位数据是否完整
 * @param {Object} job - 职位对象
 * @returns {Object} 验证结果
 */
export const validateJobData = (job) => {
  const errors = []
  const warnings = []
  
  if (!job) {
    errors.push('职位数据不存在')
    return { isValid: false, errors, warnings }
  }
  
  // 必需字段检查
  const requiredFields = ['id', 'title', 'company', 'location', 'salary']
  requiredFields.forEach(field => {
    if (!job[field]) {
      errors.push(`缺少必需字段: ${field}`)
    }
  })
  
  // 联系信息检查
  if (!job.contact && !job.contactName) {
    errors.push('缺少联系信息')
  }
  
  // 描述信息检查
  if (!job.description || job.description.length < 10) {
    warnings.push('职位描述过于简短')
  }
  
  // 标签检查
  if (!job.tags || job.tags.length === 0) {
    warnings.push('缺少技能标签')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 生成分享内容
 * @description 根据职位信息生成分享内容
 * @param {Object} job - 职位对象
 * @returns {Object} 分享配置对象
 */
export const generateShareContent = (job) => {
  if (!job) {
    return {
      title: '工程招聘职位分享',
      path: '/pages/home/index',
      imageUrl: ''
    }
  }
  
  const title = `${job.title} - ${job.company}`
  const path = `/pages/detail/index?id=${job.id}`
  
  return {
    title,
    path,
    imageUrl: '', // 可以设置分享图片
    desc: job.description ? job.description.substring(0, 50) + '...' : '优质工程职位推荐'
  }
}
