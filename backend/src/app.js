/**
 * @fileoverview 工程招聘小程序后端应用入口文件
 * @description Express应用的主入口，配置中间件、路由和错误处理
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 * @updated 2024-12-05
 */

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')

// 导入配置文件
const config = require('./config/index')
const logger = require('./utils/logger')

// 导入数据库连接
const connectDB = require('./config/database')
const connectRedis = require('./config/redis')

// 导入中间件
const errorHandler = require('./middleware/errorHandler')
const rateLimiter = require('./middleware/rateLimiter')
const requestLogger = require('./middleware/requestLogger')

// 导入路由
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const jobRoutes = require('./routes/jobs')
const shareRoutes = require('./routes/shares')
const fileRoutes = require('./routes/files')
const adminRoutes = require('./routes/admin')
const statisticsRoutes = require('./routes/statistics')

/**
 * 创建Express应用实例
 */
const app = express()

/**
 * Swagger API文档配置
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '工程招聘小程序API',
      version: '1.0.0',
      description: '工程招聘小程序后端API接口文档',
      contact: {
        name: '工程招聘小程序团队',
        email: 'support@jobrecruit.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: '开发环境'
      },
      {
        url: 'https://api.jobrecruit.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

/**
 * 基础中间件配置
 */
app.use(helmet()) // 安全头设置
app.use(compression()) // 响应压缩
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求日志记录
app.use(requestLogger)

// 限流中间件
app.use(rateLimiter)

/**
 * API文档路由
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: require('../package.json').version
  })
})

/**
 * API路由配置
 */
const API_PREFIX = '/api/v1'

app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/users`, userRoutes)
app.use(`${API_PREFIX}/jobs`, jobRoutes)
app.use(`${API_PREFIX}/shares`, shareRoutes)
app.use(`${API_PREFIX}/files`, fileRoutes)
app.use(`${API_PREFIX}/admin`, adminRoutes)
app.use(`${API_PREFIX}/statistics`, statisticsRoutes)

/**
 * 404错误处理
 */
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  })
})

/**
 * 全局错误处理中间件
 */
app.use(errorHandler)

/**
 * 启动服务器
 */
const startServer = async () => {
  try {
    // 连接数据库
    await connectDB()
    logger.info('MongoDB数据库连接成功')

    // 连接Redis
    await connectRedis()
    logger.info('Redis缓存连接成功')

    // 启动HTTP服务器
    const server = app.listen(config.port, () => {
      logger.info(`服务器启动成功`)
      logger.info(`环境: ${config.env}`)
      logger.info(`端口: ${config.port}`)
      logger.info(`API文档: http://localhost:${config.port}/api-docs`)
    })

    // 优雅关闭处理
    const gracefulShutdown = (signal) => {
      logger.info(`收到${signal}信号，开始优雅关闭服务器...`)
      
      server.close(() => {
        logger.info('HTTP服务器已关闭')
        
        // 关闭数据库连接
        require('mongoose').connection.close(() => {
          logger.info('MongoDB连接已关闭')
          process.exit(0)
        })
      })
    }

    // 监听进程信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  } catch (error) {
    logger.error('服务器启动失败:', error)
    process.exit(1)
  }
}

// 启动应用
if (require.main === module) {
  startServer()
}

module.exports = app
