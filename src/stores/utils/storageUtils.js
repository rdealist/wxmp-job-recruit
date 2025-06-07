/**
 * @fileoverview 本地存储工具函数
 * @description 提供统一的本地存储操作接口，包括数据的保存、读取、验证等功能
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import Taro from '@tarojs/taro'

/**
 * 存储相关的常量配置
 */
const STORAGE_CONFIG = {
  /** 主要存储键名 */
  MAIN_KEY: 'job-storage',
  /** 数据版本号，用于数据迁移 */
  CURRENT_VERSION: 1,
  /** 存储数据的最大大小（字节） */
  MAX_SIZE: 1024 * 1024, // 1MB
  /** 数据过期时间（毫秒） */
  EXPIRE_TIME: 30 * 24 * 60 * 60 * 1000 // 30天
}

/**
 * 保存数据到本地存储
 * @description 将状态数据保存到微信小程序的本地存储中，包含版本控制和时间戳
 * @param {Object} data - 要保存的数据对象
 * @param {Object} data.unlockedDates - 已解锁的日期记录
 * @param {Object} data.userInfo - 用户信息
 * @returns {boolean} 保存是否成功
 * @example
 * const success = saveToStorage({
 *   unlockedDates: { '2024-12-05': true },
 *   userInfo: { nickname: '张三', publishCount: 5 }
 * })
 */
export const saveToStorage = (data) => {
  try {
    // 构建要保存的数据结构
    const dataToSave = {
      state: {
        unlockedDates: data.unlockedDates || {},
        userInfo: data.userInfo || {}
      },
      version: STORAGE_CONFIG.CURRENT_VERSION,
      timestamp: Date.now(),
      expireTime: Date.now() + STORAGE_CONFIG.EXPIRE_TIME
    }

    // 检查数据大小
    const dataString = JSON.stringify(dataToSave)
    if (dataString.length > STORAGE_CONFIG.MAX_SIZE) {
      console.warn('存储数据过大，可能影响性能')
      return false
    }

    // 保存到本地存储
    Taro.setStorageSync(STORAGE_CONFIG.MAIN_KEY, dataString)
    console.log('数据保存成功:', dataToSave)
    return true
  } catch (error) {
    console.error('保存数据到本地存储失败:', error)
    return false
  }
}

/**
 * 从本地存储加载数据
 * @description 从微信小程序本地存储中读取数据，包含数据验证和过期检查
 * @returns {Object|null} 加载的数据对象，失败时返回 null
 * @example
 * const data = loadFromStorage()
 * if (data) {
 *   console.log('用户信息:', data.userInfo)
 *   console.log('解锁记录:', data.unlockedDates)
 * }
 */
export const loadFromStorage = () => {
  try {
    // 从本地存储读取数据
    const savedData = Taro.getStorageSync(STORAGE_CONFIG.MAIN_KEY)
    if (!savedData) {
      console.log('本地存储中没有找到数据')
      return null
    }

    // 解析 JSON 数据
    const parsedData = JSON.parse(savedData)
    
    // 验证数据结构
    if (!isValidStorageData(parsedData)) {
      console.warn('本地存储数据格式无效，将清除数据')
      clearStorage()
      return null
    }

    // 检查数据是否过期
    if (isDataExpired(parsedData)) {
      console.log('本地存储数据已过期，将清除数据')
      clearStorage()
      return null
    }

    // 检查版本兼容性
    if (parsedData.version !== STORAGE_CONFIG.CURRENT_VERSION) {
      console.log('数据版本不匹配，尝试迁移数据')
      const migratedData = migrateData(parsedData)
      if (migratedData) {
        saveToStorage(migratedData.state)
        return migratedData.state
      }
      return null
    }

    console.log('数据加载成功:', parsedData.state)
    return parsedData.state
  } catch (error) {
    console.error('从本地存储加载数据失败:', error)
    return null
  }
}

/**
 * 清除本地存储数据
 * @description 清除所有保存在本地存储中的应用数据
 * @returns {boolean} 清除是否成功
 */
export const clearStorage = () => {
  try {
    Taro.removeStorageSync(STORAGE_CONFIG.MAIN_KEY)
    console.log('本地存储数据已清除')
    return true
  } catch (error) {
    console.error('清除本地存储数据失败:', error)
    return false
  }
}

/**
 * 验证存储数据的有效性
 * @description 检查从本地存储读取的数据是否符合预期格式
 * @param {Object} data - 要验证的数据对象
 * @returns {boolean} 数据是否有效
 * @private
 */
const isValidStorageData = (data) => {
  if (!data || typeof data !== 'object') return false
  if (!data.state || typeof data.state !== 'object') return false
  if (!data.version || !data.timestamp) return false
  return true
}

/**
 * 检查数据是否过期
 * @description 根据时间戳判断数据是否已经过期
 * @param {Object} data - 包含时间戳的数据对象
 * @returns {boolean} 数据是否过期
 * @private
 */
const isDataExpired = (data) => {
  if (!data.expireTime) return false
  return Date.now() > data.expireTime
}

/**
 * 数据迁移函数
 * @description 处理不同版本数据格式的兼容性问题
 * @param {Object} oldData - 旧版本的数据
 * @returns {Object|null} 迁移后的数据，失败时返回 null
 * @private
 */
const migrateData = (oldData) => {
  try {
    // 目前只有版本1，暂时返回 null
    // 未来版本升级时在这里添加迁移逻辑
    console.warn('暂不支持数据迁移，版本:', oldData.version)
    return null
  } catch (error) {
    console.error('数据迁移失败:', error)
    return null
  }
}

/**
 * 获取存储使用情况
 * @description 获取当前存储的使用情况统计信息
 * @returns {Object} 存储使用情况对象
 */
export const getStorageInfo = () => {
  try {
    const data = Taro.getStorageSync(STORAGE_CONFIG.MAIN_KEY)
    const size = data ? JSON.stringify(data).length : 0
    const percentage = (size / STORAGE_CONFIG.MAX_SIZE * 100).toFixed(2)
    
    return {
      size,
      maxSize: STORAGE_CONFIG.MAX_SIZE,
      percentage: `${percentage}%`,
      isEmpty: size === 0
    }
  } catch (error) {
    console.error('获取存储信息失败:', error)
    return {
      size: 0,
      maxSize: STORAGE_CONFIG.MAX_SIZE,
      percentage: '0%',
      isEmpty: true
    }
  }
}
