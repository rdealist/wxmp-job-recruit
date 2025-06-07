/**
 * @fileoverview 认证路由
 * @description 用户认证相关的路由定义
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const express = require('express')
const router = express.Router()

// 导入中间件
const { authRateLimit } = require('../middleware/rateLimiter')
const { authenticateToken } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// 导入控制器
const authController = require('../controllers/authController')

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 用户认证管理
 */

/**
 * @swagger
 * /api/v1/auth/wechat/login:
 *   post:
 *     summary: 微信小程序登录
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 微信授权code
 *               encryptedData:
 *                 type: string
 *                 description: 加密的用户数据
 *               iv:
 *                 type: string
 *                 description: 初始向量
 *     responses:
 *       200:
 *         description: 登录成功
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
 *                   example: 登录成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT访问令牌
 *                     refreshToken:
 *                       type: string
 *                       description: 刷新令牌
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 微信登录失败
 */
router.post('/wechat/login', 
  authRateLimit,
  asyncHandler(authController.wechatLogin)
)

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *     responses:
 *       200:
 *         description: 刷新成功
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
 *                   example: 令牌刷新成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: 新的JWT访问令牌
 *                     refreshToken:
 *                       type: string
 *                       description: 新的刷新令牌
 *       400:
 *         description: 刷新令牌无效
 *       401:
 *         description: 刷新令牌已过期
 */
router.post('/refresh',
  authRateLimit,
  asyncHandler(authController.refreshToken)
)

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
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
 *                   example: 登出成功
 *       401:
 *         description: 未授权
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(authController.logout)
)

/**
 * @swagger
 * /api/v1/auth/phone:
 *   post:
 *     summary: 获取用户手机号
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 微信获取手机号的code
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
 *                   example: 手机号获取成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                       description: 手机号码
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/phone',
  authenticateToken,
  authRateLimit,
  asyncHandler(authController.getPhoneNumber)
)

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [Auth]
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
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权
 */
router.get('/profile',
  authenticateToken,
  asyncHandler(authController.getProfile)
)

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     summary: 更新用户信息
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickName:
 *                 type: string
 *                 description: 用户昵称
 *               avatar:
 *                 type: string
 *                 description: 头像URL
 *               gender:
 *                 type: number
 *                 enum: [0, 1, 2]
 *                 description: 性别 0-未知 1-男 2-女
 *               province:
 *                 type: string
 *                 description: 省份
 *               city:
 *                 type: string
 *                 description: 城市
 *               county:
 *                 type: string
 *                 description: 区县
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                   example: 更新成功
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.put('/profile',
  authenticateToken,
  asyncHandler(authController.updateProfile)
)

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 用户ID
 *         nickName:
 *           type: string
 *           description: 用户昵称
 *         avatar:
 *           type: string
 *           description: 头像URL
 *         gender:
 *           type: number
 *           enum: [0, 1, 2]
 *           description: 性别
 *         phone:
 *           type: string
 *           description: 手机号码
 *         province:
 *           type: string
 *           description: 省份
 *         city:
 *           type: string
 *           description: 城市
 *         county:
 *           type: string
 *           description: 区县
 *         role:
 *           type: string
 *           enum: [user, admin, moderator]
 *           description: 用户角色
 *         status:
 *           type: number
 *           enum: [0, 1, 2]
 *           description: 账户状态
 *         publishCount:
 *           type: number
 *           description: 发布职位数量
 *         shareCount:
 *           type: number
 *           description: 分享次数
 *         createTime:
 *           type: string
 *           format: date-time
 *           description: 注册时间
 *         lastLoginTime:
 *           type: string
 *           format: date-time
 *           description: 最后登录时间
 */

module.exports = router
