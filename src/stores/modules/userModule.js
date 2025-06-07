/**
 * @fileoverview 用户模块
 * @description 管理用户相关的数据和业务逻辑，包括用户信息、权限管理、解锁记录等
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import Taro from '@tarojs/taro'

/**
 * 默认用户信息
 * @description 定义用户信息的初始状态
 * @type {Object}
 */
export const defaultUserInfo = {
  /** 用户头像URL */
  avatar: 'https://avatars.dicebear.com/api/avataaars/user.svg',
  /** 用户昵称 */
  nickname: '工程师小王',
  /** 用户手机号（脱敏显示） */
  phone: '138****8888',
  /** 发布职位数量 */
  publishCount: 0,
  /** 用户注册时间 */
  registerTime: new Date().toISOString(),
  /** 最后登录时间 */
  lastLoginTime: new Date().toISOString()
}

/**
 * 用户权限配置
 * @description 定义用户在应用中的各种权限设置
 */
export const userPermissions = {
  /** 每日免费查看职位数量 */
  dailyFreeViews: 10,
  /** 发布职位的最大数量限制 */
  maxPublishCount: 50,
  /** 分享解锁的有效期（天） */
  shareUnlockDays: 30,
  /** VIP用户标识 */
  isVip: false
}

/**
 * 用户功能工具函数集合
 */
export const userUtils = {
  /**
   * 检查日期是否已解锁
   * @description 判断指定日期的职位是否可以免费查看
   * @param {string} date - 要检查的日期字符串
   * @param {Object} unlockedDates - 已解锁的日期记录
   * @returns {boolean} 是否已解锁
   * @example
   * const isUnlocked = userUtils.isDateUnlocked('2024-12-05', unlockedDates)
   */
  isDateUnlocked: (date, unlockedDates) => {
    if (!date) return false
    
    // 今天发布的职位总是可以查看
    const today = new Date().toDateString()
    if (date === today) return true
    
    // 检查是否通过分享解锁
    return Boolean(unlockedDates && unlockedDates[date])
  },

  /**
   * 解锁指定日期
   * @description 将指定日期标记为已解锁状态
   * @param {string} date - 要解锁的日期字符串
   * @param {Object} currentUnlockedDates - 当前已解锁的日期记录
   * @returns {Object} 更新后的解锁记录
   */
  unlockDate: (date, currentUnlockedDates = {}) => {
    if (!date) return currentUnlockedDates
    
    return {
      ...currentUnlockedDates,
      [date]: true
    }
  },

  /**
   * 处理分享解锁逻辑
   * @description 执行分享操作并解锁对应日期的内容
   * @param {string} jobId - 职位ID
   * @param {Array<Object>} jobs - 职位列表
   * @param {Object} unlockedDates - 当前解锁记录
   * @returns {Promise<Object>} 分享结果和更新后的解锁记录
   */
  handleShareUnlock: async (jobId, jobs, unlockedDates) => {
    try {
      // 查找对应的职位
      const job = jobs.find(j => j.id === jobId)
      if (!job) {
        throw new Error('职位不存在')
      }

      // 检查是否已经解锁
      if (userUtils.isDateUnlocked(job.publishDate, unlockedDates)) {
        return {
          success: true,
          message: '该内容已经解锁',
          unlockedDates
        }
      }

      // 模拟分享操作
      await userUtils.simulateShare(job)

      // 解锁对应日期
      const newUnlockedDates = userUtils.unlockDate(job.publishDate, unlockedDates)

      // 显示成功提示
      Taro.showToast({
        title: '分享成功，已解锁历史内容',
        icon: 'success',
        duration: 2000
      })

      return {
        success: true,
        message: '分享成功，内容已解锁',
        unlockedDates: newUnlockedDates
      }
    } catch (error) {
      console.error('分享解锁失败:', error)
      
      Taro.showToast({
        title: '分享失败，请重试',
        icon: 'error',
        duration: 2000
      })

      return {
        success: false,
        message: error.message || '分享失败',
        unlockedDates
      }
    }
  },

  /**
   * 模拟分享操作
   * @description 模拟微信分享功能，实际项目中会调用真实的分享API
   * @param {Object} job - 要分享的职位对象
   * @returns {Promise<boolean>} 分享是否成功
   * @private
   */
  simulateShare: async (job) => {
    return new Promise((resolve, reject) => {
      // 模拟分享延迟
      setTimeout(() => {
        // 90% 的成功率模拟
        if (Math.random() > 0.1) {
          console.log('模拟分享成功:', job.title)
          resolve(true)
        } else {
          reject(new Error('分享失败，请重试'))
        }
      }, 1000)
    })
  },

  /**
   * 更新用户信息
   * @description 更新用户的基本信息
   * @param {Object} currentUserInfo - 当前用户信息
   * @param {Object} updates - 要更新的字段
   * @returns {Object} 更新后的用户信息
   */
  updateUserInfo: (currentUserInfo, updates) => {
    // 验证更新数据
    const validatedUpdates = userUtils.validateUserUpdates(updates)
    
    return {
      ...currentUserInfo,
      ...validatedUpdates,
      lastUpdateTime: new Date().toISOString()
    }
  },

  /**
   * 验证用户信息更新数据
   * @description 验证用户信息更新数据的有效性
   * @param {Object} updates - 要验证的更新数据
   * @returns {Object} 验证后的数据
   * @private
   */
  validateUserUpdates: (updates) => {
    const validated = {}

    // 验证昵称
    if (updates.nickname) {
      const nickname = updates.nickname.trim()
      if (nickname.length >= 2 && nickname.length <= 20) {
        validated.nickname = nickname
      }
    }

    // 验证头像URL
    if (updates.avatar && typeof updates.avatar === 'string') {
      validated.avatar = updates.avatar
    }

    // 验证手机号
    if (updates.phone) {
      const phoneRegex = /^1[3-9]\d{9}$/
      if (phoneRegex.test(updates.phone)) {
        // 脱敏处理
        validated.phone = userUtils.maskPhone(updates.phone)
      }
    }

    return validated
  },

  /**
   * 手机号脱敏处理
   * @description 将手机号中间4位替换为星号
   * @param {string} phone - 原始手机号
   * @returns {string} 脱敏后的手机号
   */
  maskPhone: (phone) => {
    if (!phone || phone.length !== 11) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },

  /**
   * 获取用户发布的职位
   * @description 根据用户信息筛选出用户发布的职位
   * @param {Array<Object>} jobs - 所有职位列表
   * @param {Object} userInfo - 用户信息
   * @returns {Array<Object>} 用户发布的职位列表
   */
  getUserJobs: (jobs, userInfo) => {
    if (!jobs || !userInfo || !userInfo.phone) return []
    
    // 提取用户手机号的特征部分用于匹配
    const phonePattern = userInfo.phone.replace(/\*/g, '')
    
    return jobs.filter(job => {
      if (!job.contact) return false
      // 简单的匹配逻辑，实际项目中应该有更严格的用户身份验证
      return job.contact.includes(phonePattern.slice(0, 3)) && 
             job.contact.includes(phonePattern.slice(-4))
    })
  },

  /**
   * 检查用户权限
   * @description 检查用户是否有执行特定操作的权限
   * @param {string} action - 要检查的操作类型
   * @param {Object} userInfo - 用户信息
   * @returns {boolean} 是否有权限
   */
  checkPermission: (action, userInfo) => {
    switch (action) {
      case 'publish':
        return userInfo.publishCount < userPermissions.maxPublishCount
      case 'view_contact':
        return true // 基础权限，所有用户都可以查看
      case 'unlimited_view':
        return userPermissions.isVip
      default:
        return false
    }
  },

  /**
   * 获取用户统计信息
   * @description 计算用户的各种统计数据
   * @param {Object} userInfo - 用户信息
   * @param {Array<Object>} userJobs - 用户发布的职位
   * @param {Object} unlockedDates - 解锁记录
   * @returns {Object} 统计信息对象
   */
  getUserStats: (userInfo, userJobs, unlockedDates) => {
    const today = new Date().toDateString()
    const todayJobs = userJobs.filter(job => job.publishDate === today)
    const unlockedCount = Object.keys(unlockedDates || {}).length

    return {
      totalPublished: userJobs.length,
      todayPublished: todayJobs.length,
      totalUnlocked: unlockedCount,
      joinDays: userUtils.calculateJoinDays(userInfo.registerTime),
      publishRemaining: userPermissions.maxPublishCount - userInfo.publishCount
    }
  },

  /**
   * 计算用户加入天数
   * @description 计算用户注册到现在的天数
   * @param {string} registerTime - 注册时间ISO字符串
   * @returns {number} 加入天数
   * @private
   */
  calculateJoinDays: (registerTime) => {
    if (!registerTime) return 0
    
    const registerDate = new Date(registerTime)
    const now = new Date()
    const diffTime = Math.abs(now - registerDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }
}
