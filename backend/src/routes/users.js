/**
 * @fileoverview 用户路由
 * @description 用户管理相关的路由定义
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const express = require('express')
const router = express.Router()

// 导入中间件
const { rateLimitMiddleware } = require('../middleware/rateLimiter')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// 导入控制器
const userController = require('../controllers/userController')

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户管理
 */

/**
 * @swagger
 * /api/v1/users/me/jobs:
 *   get:
 *     summary: 获取我发布的职位
 *     tags: [Users]
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
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2, 3]
 *         description: 职位状态
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/me/jobs',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(userController.getMyJobs)
)

/**
 * @swagger
 * /api/v1/users/me/shares:
 *   get:
 *     summary: 获取我的分享记录
 *     tags: [Users]
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
 */
router.get('/me/shares',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(userController.getMyShares)
)

/**
 * @swagger
 * /api/v1/users/me/statistics:
 *   get:
 *     summary: 获取我的统计信息
 *     tags: [Users]
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
 *                     publishCount:
 *                       type: number
 *                       description: 发布职位数量
 *                     shareCount:
 *                       type: number
 *                       description: 分享次数
 *                     viewCount:
 *                       type: number
 *                       description: 查看次数
 *                     todayPublish:
 *                       type: number
 *                       description: 今日发布数量
 *                     todayShare:
 *                       type: number
 *                       description: 今日分享次数
 *       401:
 *         description: 未授权
 */
router.get('/me/statistics',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(userController.getMyStatistics)
)

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: 获取用户公开信息
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 用户不存在
 */
router.get('/:id',
  rateLimitMiddleware,
  asyncHandler(userController.getUserPublicInfo)
)

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 获取用户列表（管理员）
 *     tags: [Users]
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
router.get('/',
  authenticateToken,
  requireAdmin,
  rateLimitMiddleware,
  asyncHandler(userController.getUsers)
)

/**
 * @swagger
 * /api/v1/users/{id}/status:
 *   put:
 *     summary: 更新用户状态（管理员）
 *     tags: [Users]
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
router.put('/:id/status',
  authenticateToken,
  requireAdmin,
  asyncHandler(userController.updateUserStatus)
)

module.exports = router
