/**
 * @fileoverview 统计路由
 * @description 数据统计相关的路由定义
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const express = require('express')
const router = express.Router()

// 导入中间件
const { rateLimitMiddleware } = require('../middleware/rateLimiter')
const { optionalAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// 导入控制器
const statisticsController = require('../controllers/statisticsController')

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: 数据统计
 */

/**
 * @swagger
 * /api/v1/statistics/overview:
 *   get:
 *     summary: 获取平台概览统计
 *     tags: [Statistics]
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
 *                     totalJobs:
 *                       type: number
 *                       description: 总职位数
 *                     totalUsers:
 *                       type: number
 *                       description: 总用户数
 *                     todayJobs:
 *                       type: number
 *                       description: 今日新增职位
 *                     todayShares:
 *                       type: number
 *                       description: 今日分享次数
 *                     activeUsers:
 *                       type: number
 *                       description: 活跃用户数
 */
router.get('/overview',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(statisticsController.getOverview)
)

/**
 * @swagger
 * /api/v1/statistics/jobs:
 *   get:
 *     summary: 获取职位统计
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: 统计天数
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: 分组方式
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/jobs',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(statisticsController.getJobStatistics)
)

/**
 * @swagger
 * /api/v1/statistics/regions:
 *   get:
 *     summary: 获取地区统计
 *     tags: [Statistics]
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
 *                     type: object
 *                     properties:
 *                       province:
 *                         type: string
 *                         description: 省份
 *                       city:
 *                         type: string
 *                         description: 城市
 *                       count:
 *                         type: number
 *                         description: 职位数量
 */
router.get('/regions',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(statisticsController.getRegionStatistics)
)

/**
 * @swagger
 * /api/v1/statistics/categories:
 *   get:
 *     summary: 获取职位分类统计
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/categories',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(statisticsController.getCategoryStatistics)
)

/**
 * @swagger
 * /api/v1/statistics/trends:
 *   get:
 *     summary: 获取趋势统计
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 7
 *           maximum: 365
 *           default: 30
 *         description: 统计天数
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: string
 *           enum: [jobs, users, shares, views]
 *           default: jobs
 *         description: 统计指标
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/trends',
  optionalAuth,
  rateLimitMiddleware,
  asyncHandler(statisticsController.getTrendStatistics)
)

module.exports = router
