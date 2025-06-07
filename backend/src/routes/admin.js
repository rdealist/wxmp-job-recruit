/**
 * @fileoverview 管理员路由
 * @description 管理后台相关的路由定义
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const express = require('express')
const router = express.Router()

// 导入中间件
const { rateLimitMiddleware, strictRateLimit } = require('../middleware/rateLimiter')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// 导入控制器
const adminController = require('../controllers/adminController')

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: 管理后台
 */

// 所有管理员路由都需要认证和管理员权限
router.use(authenticateToken)
router.use(requireAdmin)
router.use(strictRateLimit)

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: 获取管理后台仪表盘数据
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         active:
 *                           type: number
 *                         today:
 *                           type: number
 *                     jobs:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         today:
 *                           type: number
 *                         pending:
 *                           type: number
 *                     shares:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         today:
 *                           type: number
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 */
router.get('/dashboard',
  asyncHandler(adminController.getDashboard)
)

/**
 * @swagger
 * /api/v1/admin/jobs/pending:
 *   get:
 *     summary: 获取待审核职位列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 */
router.get('/jobs/pending',
  asyncHandler(adminController.getPendingJobs)
)

/**
 * @swagger
 * /api/v1/admin/jobs/{id}/review:
 *   put:
 *     summary: 审核职位
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 职位ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: 审核状态 1-通过 2-拒绝
 *               reason:
 *                 type: string
 *                 description: 审核意见
 *     responses:
 *       200:
 *         description: 审核成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 职位不存在
 */
router.put('/jobs/:id/review',
  asyncHandler(adminController.reviewJob)
)

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *         description: 用户状态
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, moderator]
 *         description: 用户角色
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 */
router.get('/users',
  asyncHandler(adminController.getUsers)
)

/**
 * @swagger
 * /api/v1/admin/users/{id}/status:
 *   put:
 *     summary: 更新用户状态
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: 用户状态 0-冻结 1-正常 2-待审核
 *               reason:
 *                 type: string
 *                 description: 操作原因
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 用户不存在
 */
router.put('/users/:id/status',
  asyncHandler(adminController.updateUserStatus)
)

/**
 * @swagger
 * /api/v1/admin/statistics:
 *   get:
 *     summary: 获取系统统计数据
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: 统计天数
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 */
router.get('/statistics',
  asyncHandler(adminController.getStatistics)
)

/**
 * @swagger
 * /api/v1/admin/system/health:
 *   get:
 *     summary: 获取系统健康状态
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       description: 数据库状态
 *                     redis:
 *                       type: object
 *                       description: Redis状态
 *                     wechat:
 *                       type: object
 *                       description: 微信服务状态
 *                     cos:
 *                       type: object
 *                       description: 腾讯云COS状态
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 */
router.get('/system/health',
  asyncHandler(adminController.getSystemHealth)
)

module.exports = router
