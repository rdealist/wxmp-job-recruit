/**
 * @fileoverview 职位路由
 * @description 职位管理相关的路由定义
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const express = require('express')
const router = express.Router()

// 导入中间件
const { rateLimitMiddleware, publishRateLimit } = require('../middleware/rateLimiter')
const { authenticateToken, optionalAuth, requireOwnership } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// 导入控制器
const jobController = require('../controllers/jobController')

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: 职位管理
 */

/**
 * @swagger
 * /api/v1/jobs:
 *   get:
 *     summary: 获取职位列表
 *     tags: [Jobs]
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
 *         name: province
 *         schema:
 *           type: string
 *         description: 省份
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: 城市
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [construction, design, management, technical, other]
 *         description: 职位类别
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [fulltime, parttime, contract, internship]
 *         description: 工作类型
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [publishTime, viewCount, salary]
 *           default: publishTime
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JobSummary'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(jobController.getJobs)
)

/**
 * @swagger
 * /api/v1/jobs/today:
 *   get:
 *     summary: 获取今日职位
 *     tags: [Jobs]
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
 */
router.get('/today',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(jobController.getTodayJobs)
)

/**
 * @swagger
 * /api/v1/jobs/search:
 *   get:
 *     summary: 搜索职位
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: 搜索关键词
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
 *         description: 搜索成功
 */
router.get('/search',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(jobController.searchJobs)
)

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   get:
 *     summary: 获取职位详情
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 职位ID
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
 *                   $ref: '#/components/schemas/JobDetail'
 *       404:
 *         description: 职位不存在
 */
router.get('/:id',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(jobController.getJobDetail)
)

/**
 * @swagger
 * /api/v1/jobs:
 *   post:
 *     summary: 发布职位
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobCreate'
 *     responses:
 *       201:
 *         description: 发布成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: 职位发布成功
 *                 data:
 *                   $ref: '#/components/schemas/JobDetail'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/',
  authenticateToken,
  publishRateLimit,
  asyncHandler(jobController.createJob)
)

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   put:
 *     summary: 更新职位
 *     tags: [Jobs]
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
 *             $ref: '#/components/schemas/JobUpdate'
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       404:
 *         description: 职位不存在
 */
router.put('/:id',
  authenticateToken,
  requireOwnership('id', 'publisherId'),
  asyncHandler(jobController.updateJob)
)

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   delete:
 *     summary: 删除职位
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 职位ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       404:
 *         description: 职位不存在
 */
router.delete('/:id',
  authenticateToken,
  requireOwnership('id', 'publisherId'),
  asyncHandler(jobController.deleteJob)
)

/**
 * @swagger
 * /api/v1/jobs/{id}/refresh:
 *   post:
 *     summary: 刷新职位
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 职位ID
 *     responses:
 *       200:
 *         description: 刷新成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       404:
 *         description: 职位不存在
 */
router.post('/:id/refresh',
  authenticateToken,
  requireOwnership('id', 'publisherId'),
  asyncHandler(jobController.refreshJob)
)

module.exports = router
