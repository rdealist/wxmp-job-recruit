/**
 * @fileoverview 文件路由
 * @description 文件上传和管理相关的路由定义
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
const fileController = require('../controllers/fileController')

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: 文件管理
 */

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     summary: 上传文件
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 要上传的文件
 *               folder:
 *                 type: string
 *                 enum: [avatars, posters, documents]
 *                 default: uploads
 *                 description: 上传文件夹
 *     responses:
 *       200:
 *         description: 上传成功
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
 *                   example: 文件上传成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: 文件访问URL
 *                     path:
 *                       type: string
 *                       description: 文件路径
 *                     size:
 *                       type: number
 *                       description: 文件大小（字节）
 *                     filename:
 *                       type: string
 *                       description: 文件名
 *                     mimetype:
 *                       type: string
 *                       description: 文件类型
 *       400:
 *         description: 请求参数错误或文件格式不支持
 *       401:
 *         description: 未授权
 *       413:
 *         description: 文件过大
 */
router.post('/upload',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(fileController.uploadFile)
)

/**
 * @swagger
 * /api/v1/files/upload/avatar:
 *   post:
 *     summary: 上传头像
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 头像文件
 *     responses:
 *       200:
 *         description: 上传成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/upload/avatar',
  authenticateToken,
  rateLimitMiddleware,
  asyncHandler(fileController.uploadAvatar)
)

/**
 * @swagger
 * /api/v1/files/{path}:
 *   delete:
 *     summary: 删除文件
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 文件路径
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 文件不存在
 */
router.delete('/:path(*)',
  authenticateToken,
  asyncHandler(fileController.deleteFile)
)

module.exports = router
