/**
 * @fileoverview 测试服务器启动文件
 * @description 用于快速启动和测试后端服务
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const express = require('express')
const cors = require('cors')

// 创建简单的测试服务器
const app = express()
const port = process.env.PORT || 3000

// 基础中间件
app.use(cors())
app.use(express.json())

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '工程招聘小程序后端服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'test'
  })
})

// 测试接口
app.get('/api/v1/test', (req, res) => {
  res.json({
    code: 200,
    message: 'API测试成功',
    data: {
      server: '工程招聘小程序后端',
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  })
})

// 模拟职位列表接口
app.get('/api/v1/jobs', (req, res) => {
  const mockJobs = [
    {
      id: '1',
      title: '前端开发工程师',
      company: '科技有限公司',
      salary: '8K-15K',
      province: '北京',
      city: '北京',
      publishTime: new Date().toISOString(),
      isToday: true,
      needShareToUnlock: false
    },
    {
      id: '2',
      title: '后端开发工程师',
      company: '互联网公司',
      salary: '10K-18K',
      province: '上海',
      city: '上海',
      publishTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isToday: false,
      needShareToUnlock: true
    }
  ]

  res.json({
    code: 200,
    message: '获取成功',
    data: mockJobs,
    pagination: {
      page: 1,
      limit: 20,
      total: mockJobs.length,
      pages: 1,
      hasNext: false,
      hasPrev: false
    }
  })
})

// 模拟用户登录接口
app.post('/api/v1/auth/wechat/login', (req, res) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).json({
      code: 400,
      message: '微信授权code不能为空'
    })
  }

  // 模拟登录成功
  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: 'mock-user-id',
        nickName: '测试用户',
        avatar: '',
        role: 'user',
        publishCount: 0,
        shareCount: 0,
        createTime: new Date().toISOString()
      }
    }
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    path: req.originalUrl
  })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: err.message
  })
})

// 启动服务器
app.listen(port, () => {
  console.log(`
🚀 工程招聘小程序后端测试服务器启动成功！

📍 服务地址: http://localhost:${port}
🔍 健康检查: http://localhost:${port}/health
🧪 API测试: http://localhost:${port}/api/v1/test
📋 职位列表: http://localhost:${port}/api/v1/jobs

⚠️  注意：这是测试服务器，使用模拟数据
   完整功能请使用: npm run dev
  `)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...')
  process.exit(0)
})
