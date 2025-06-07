/**
 * @fileoverview 分享路由
 * @description 分享解锁相关的路由定义
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const express = require('express')
const router = express.Router()

// 导入中间件
const { rateLimitMiddleware } = require('../middleware/rateLimiter')
const { authenticateToken } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// 导入控制器
const shareController = require('../controllers/shareController')

/**
 * @swagger
 * tags:
 *   name: Shares
 *   description: 分享管理
 */

/**
 * @swagger
 * /api/v1/shares/unlock:
 *   post:
 *     summary: 分享解锁职位
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - shareType
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: 职位ID
 *               shareType:
 *                 type: string
 *                 enum: [wechat, timeline, poster, link]
 *                 description: 分享类型
 *               shareChannel:
 *                 type: string
 *                 enum: [friend, group, timeline, qrcode, copy]
 *                 description: 分享渠道
 *     responses:
 *       200:
 *         description: 解锁成功
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
 *                   example: 解锁成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     unlocked:
 *                       type: boolean
 *                       description: 是否解锁成功
 *                     shareId:
 *                       type: string
 *                       description: 分享记录ID
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 职位不存在
 */
router.post('/unlock',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(shareController.unlockJob)
)

/**
 * @swagger
 * /api/v1/shares/check:
 *   post:
 *     summary: 检查职位解锁状态
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: 职位ID
 *     responses:
 *       200:
 *         description: 检查成功
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
 *                   example: 检查成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     unlocked:
 *                       type: boolean
 *                       description: 是否已解锁
 *                     needShare:
 *                       type: boolean
 *                       description: 是否需要分享
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/check',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(shareController.checkUnlockStatus)
)

/**
 * @swagger
 * /api/v1/shares/poster:
 *   post:
 *     summary: 生成分享海报
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: 职位ID
 *               template:
 *                 type: string
 *                 enum: [default, simple, detailed]
 *                 default: default
 *                 description: 海报模板
 *     responses:
 *       200:
 *         description: 生成成功
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
 *                   example: 海报生成成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     posterUrl:
 *                       type: string
 *                       description: 海报图片URL
 *                     qrcodeUrl:
 *                       type: string
 *                       description: 小程序码URL
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 职位不存在
 */
router.post('/poster',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(shareController.generatePoster)
)

/**
 * @swagger
 * /api/v1/shares/statistics:
 *   get:
 *     summary: 获取分享统计
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 7
 *         description: 统计天数
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
 *                     totalShares:
 *                       type: number
 *                       description: 总分享次数
 *                     uniqueUsers:
 *                       type: number
 *                       description: 分享用户数
 *                     uniqueJobs:
 *                       type: number
 *                       description: 分享职位数
 *                     shareTypes:
 *                       type: object
 *                       description: 分享类型统计
 *                     dailyStats:
 *                       type: array
 *                       description: 每日统计
 *       401:
 *         description: 未授权
 */
router.get('/statistics',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(shareController.getShareStatistics)
)

/**
 * @swagger
 * /api/v1/shares/ranking:
 *   get:
 *     summary: 获取分享排行榜
 *     tags: [Shares]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 7
 *         description: 统计天数
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 排行榜数量
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
 *                       userId:
 *                         type: string
 *                         description: 用户ID
 *                       nickName:
 *                         type: string
 *                         description: 用户昵称
 *                       avatar:
 *                         type: string
 *                         description: 用户头像
 *                       shareCount:
 *                         type: number
 *                         description: 分享次数
 *                       totalClicks:
 *                         type: number
 *                         description: 总点击数
 *                       totalViews:
 *                         type: number
 *                         description: 总查看数
 */
router.get('/ranking',
  rateLimitMiddleware,
  asyncHandler(shareController.getShareRanking)
)

module.exports = router
