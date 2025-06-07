/**
 * @fileoverview Redis缓存连接配置
 * @description 配置Redis连接，支持腾讯云Redis
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const redis = require('redis')
const config = require('./index')
const logger = require('../utils/logger')

let redisClient = null

/**
 * 创建Redis连接
 */
const connectRedis = async () => {
  try {
    // 创建Redis客户端
    redisClient = redis.createClient({
      host: config.database.redis.host,
      port: config.database.redis.port,
      password: config.database.redis.password,
      db: config.database.redis.db,
      
      // 连接选项
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      
      // 生产环境TLS配置
      ...(config.env === 'production' && config.database.redis.tls && {
        tls: {}
      })
    })

    // 连接事件监听
    redisClient.on('connect', () => {
      logger.info('Redis连接建立')
    })

    redisClient.on('ready', () => {
      logger.info('Redis连接就绪')
    })

    redisClient.on('error', (err) => {
      logger.error('Redis连接错误:', err.message)
    })

    redisClient.on('close', () => {
      logger.warn('Redis连接关闭')
    })

    redisClient.on('reconnecting', () => {
      logger.info('Redis重新连接中...')
    })

    // 建立连接
    await redisClient.connect()
    
    // 测试连接
    await redisClient.ping()
    
    logger.info(`Redis连接成功: ${config.database.redis.host}:${config.database.redis.port}`)
    
    return redisClient

  } catch (error) {
    logger.error('Redis连接失败:', error.message)
    
    if (config.env === 'development') {
      console.error('详细错误信息:', error)
    }
    
    throw error
  }
}

/**
 * 获取Redis客户端实例
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis客户端未初始化')
  }
  return redisClient
}

/**
 * Redis健康检查
 */
const checkRedisHealth = async () => {
  try {
    if (!redisClient) {
      return { status: 'disconnected', error: 'Redis客户端未初始化' }
    }

    const startTime = Date.now()
    await redisClient.ping()
    const responseTime = Date.now() - startTime

    return {
      status: 'connected',
      responseTime: `${responseTime}ms`,
      host: config.database.redis.host,
      port: config.database.redis.port,
      db: config.database.redis.db
    }

  } catch (error) {
    logger.error('Redis健康检查失败:', error)
    return {
      status: 'error',
      error: error.message
    }
  }
}

/**
 * 缓存工具类
 */
class CacheService {
  constructor() {
    this.keyPrefix = config.database.redis.keyPrefix || ''
  }

  /**
   * 生成缓存键名
   */
  generateKey(key) {
    return `${this.keyPrefix}${key}`
  }

  /**
   * 设置缓存
   */
  async set(key, value, ttl = config.cache.ttl) {
    try {
      const client = getRedisClient()
      const cacheKey = this.generateKey(key)
      const serializedValue = JSON.stringify(value)
      
      if (ttl > 0) {
        await client.setEx(cacheKey, ttl, serializedValue)
      } else {
        await client.set(cacheKey, serializedValue)
      }
      
      return true
    } catch (error) {
      logger.error('设置缓存失败:', error)
      return false
    }
  }

  /**
   * 获取缓存
   */
  async get(key) {
    try {
      const client = getRedisClient()
      const cacheKey = this.generateKey(key)
      const value = await client.get(cacheKey)
      
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error('获取缓存失败:', error)
      return null
    }
  }

  /**
   * 删除缓存
   */
  async del(key) {
    try {
      const client = getRedisClient()
      const cacheKey = this.generateKey(key)
      await client.del(cacheKey)
      return true
    } catch (error) {
      logger.error('删除缓存失败:', error)
      return false
    }
  }

  /**
   * 批量删除缓存
   */
  async delPattern(pattern) {
    try {
      const client = getRedisClient()
      const cachePattern = this.generateKey(pattern)
      const keys = await client.keys(cachePattern)
      
      if (keys.length > 0) {
        await client.del(keys)
      }
      
      return keys.length
    } catch (error) {
      logger.error('批量删除缓存失败:', error)
      return 0
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key) {
    try {
      const client = getRedisClient()
      const cacheKey = this.generateKey(key)
      const result = await client.exists(cacheKey)
      return result === 1
    } catch (error) {
      logger.error('检查缓存存在性失败:', error)
      return false
    }
  }

  /**
   * 设置缓存过期时间
   */
  async expire(key, ttl) {
    try {
      const client = getRedisClient()
      const cacheKey = this.generateKey(key)
      await client.expire(cacheKey, ttl)
      return true
    } catch (error) {
      logger.error('设置缓存过期时间失败:', error)
      return false
    }
  }

  /**
   * 获取缓存剩余过期时间
   */
  async ttl(key) {
    try {
      const client = getRedisClient()
      const cacheKey = this.generateKey(key)
      return await client.ttl(cacheKey)
    } catch (error) {
      logger.error('获取缓存过期时间失败:', error)
      return -1
    }
  }
}

// 创建缓存服务实例
const cacheService = new CacheService()

module.exports = {
  connectRedis,
  getRedisClient,
  checkRedisHealth,
  cacheService
}
