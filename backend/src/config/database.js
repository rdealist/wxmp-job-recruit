/**
 * @fileoverview MongoDB数据库连接配置
 * @description 配置MongoDB连接，支持腾讯云MongoDB
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const mongoose = require('mongoose')
const config = require('./index')
const logger = require('../utils/logger')

/**
 * MongoDB连接配置
 */
const connectDB = async () => {
  try {
    // 设置mongoose配置
    mongoose.set('strictQuery', false)

    // 连接事件监听
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB连接成功')
    })

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB连接错误:', err)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB连接断开')
    })

    // 进程退出时关闭连接
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      logger.info('MongoDB连接已关闭')
      process.exit(0)
    })

    // 建立连接
    const conn = await mongoose.connect(
      config.database.mongodb.uri,
      config.database.mongodb.options
    )

    logger.info(`MongoDB连接成功: ${conn.connection.host}:${conn.connection.port}`)
    logger.info(`数据库名称: ${conn.connection.name}`)

    return conn

  } catch (error) {
    logger.error('MongoDB连接失败:', error.message)
    
    // 开发环境下显示详细错误信息
    if (config.env === 'development') {
      console.error('详细错误信息:', error)
    }
    
    process.exit(1)
  }
}

/**
 * 数据库健康检查
 */
const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }

    return {
      status: states[state] || 'unknown',
      readyState: state,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    }
  } catch (error) {
    logger.error('数据库健康检查失败:', error)
    return {
      status: 'error',
      error: error.message
    }
  }
}

/**
 * 创建数据库索引
 */
const createIndexes = async () => {
  try {
    const db = mongoose.connection.db

    // 用户表索引
    await db.collection('users').createIndex({ openId: 1 }, { unique: true })
    await db.collection('users').createIndex({ phone: 1 })
    await db.collection('users').createIndex({ createTime: -1 })

    // 职位表索引
    await db.collection('jobs').createIndex({ publisherId: 1 })
    await db.collection('jobs').createIndex({ status: 1 })
    await db.collection('jobs').createIndex({ publishTime: -1 })
    await db.collection('jobs').createIndex({ province: 1, city: 1 })
    await db.collection('jobs').createIndex({ 
      title: 'text', 
      company: 'text', 
      description: 'text' 
    }, { 
      name: 'job_search_index',
      default_language: 'none' // 支持中文搜索
    })

    // 分享记录表索引
    await db.collection('shares').createIndex({ userId: 1, jobId: 1 })
    await db.collection('shares').createIndex({ shareTime: -1 })
    await db.collection('shares').createIndex({ unlockDate: 1 })

    // 统计表索引
    await db.collection('statistics').createIndex({ date: 1 }, { unique: true })
    await db.collection('statistics').createIndex({ type: 1, date: -1 })

    logger.info('数据库索引创建完成')

  } catch (error) {
    logger.error('创建数据库索引失败:', error)
  }
}

/**
 * 数据库迁移和初始化
 */
const initializeDB = async () => {
  try {
    // 检查是否需要初始化数据
    const User = require('../models/User')
    const userCount = await User.countDocuments()

    if (userCount === 0) {
      logger.info('检测到空数据库，开始初始化...')
      
      // 创建管理员用户
      const adminUser = new User({
        openId: 'admin_' + Date.now(),
        nickName: '系统管理员',
        avatar: '',
        phone: '',
        role: 'admin',
        status: 1
      })
      
      await adminUser.save()
      logger.info('管理员用户创建成功')
    }

    // 创建索引
    await createIndexes()

  } catch (error) {
    logger.error('数据库初始化失败:', error)
  }
}

module.exports = {
  connectDB,
  checkDBHealth,
  createIndexes,
  initializeDB
}
