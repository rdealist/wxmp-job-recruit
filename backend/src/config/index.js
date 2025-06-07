/**
 * @fileoverview 应用主配置文件
 * @description 统一管理所有环境配置，支持开发、测试、生产环境
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const path = require('path')

/**
 * 环境变量配置
 */
const env = process.env.NODE_ENV || 'development'

/**
 * 基础配置
 */
const baseConfig = {
  // 应用基础信息
  app: {
    name: 'job-recruit-backend',
    version: require('../../package.json').version,
    description: '工程招聘小程序后端API服务'
  },

  // 服务器配置
  port: process.env.PORT || 3000,
  env,

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://localhost:3000'],
    credentials: true
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'job-recruit-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || 'your-wechat-app-id',
    appSecret: process.env.WECHAT_APP_SECRET || 'your-wechat-app-secret',
    apiUrl: 'https://api.weixin.qq.com'
  },

  // 腾讯云配置
  tencent: {
    secretId: process.env.TENCENT_SECRET_ID || 'your-secret-id',
    secretKey: process.env.TENCENT_SECRET_KEY || 'your-secret-key',
    region: process.env.TENCENT_REGION || 'ap-beijing',
    
    // COS对象存储配置
    cos: {
      bucket: process.env.TENCENT_COS_BUCKET || 'job-recruit-1234567890',
      region: process.env.TENCENT_COS_REGION || 'ap-beijing',
      domain: process.env.TENCENT_COS_DOMAIN || 'https://job-recruit-1234567890.cos.ap-beijing.myqcloud.com'
    }
  },

  // 文件上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    tempDir: path.join(__dirname, '../../temp'),
    
    // 图片处理配置
    image: {
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1080,
      thumbnailWidth: 300,
      thumbnailHeight: 200
    }
  },

  // 限流配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100次请求
    
    // 特殊接口限流
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5 // 登录接口15分钟最多5次
    },
    
    publish: {
      windowMs: 24 * 60 * 60 * 1000, // 24小时
      max: 10 // 每天最多发布10个职位
    }
  },

  // 分页配置
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100
  },

  // 缓存配置
  cache: {
    ttl: 60 * 60, // 1小时
    jobListTtl: 5 * 60, // 职位列表缓存5分钟
    userInfoTtl: 30 * 60, // 用户信息缓存30分钟
    statisticsTtl: 60 * 60 // 统计数据缓存1小时
  }
}

/**
 * 环境特定配置
 */
const envConfigs = {
  development: {
    // 开发环境数据库配置
    database: {
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job_recruit_dev',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        }
      },
      
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 0,
        keyPrefix: 'job_recruit_dev:'
      }
    },

    // 日志配置
    log: {
      level: 'debug',
      file: false,
      console: true
    }
  },

  test: {
    database: {
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job_recruit_test',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      },
      
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 1,
        keyPrefix: 'job_recruit_test:'
      }
    },

    log: {
      level: 'error',
      file: false,
      console: false
    }
  },

  production: {
    database: {
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://your-tencent-mongodb-uri/job_recruit',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: 50,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          ssl: true,
          sslValidate: true
        }
      },
      
      redis: {
        host: process.env.REDIS_HOST || 'your-tencent-redis-host',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || 'your-redis-password',
        db: process.env.REDIS_DB || 0,
        keyPrefix: 'job_recruit:',
        tls: true
      }
    },

    log: {
      level: 'info',
      file: true,
      console: false,
      filename: path.join(__dirname, '../../logs/app.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }
  }
}

/**
 * 合并配置
 */
const config = {
  ...baseConfig,
  ...envConfigs[env]
}

module.exports = config
