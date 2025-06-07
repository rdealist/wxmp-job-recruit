/**
 * @fileoverview 文件控制器
 * @description 处理文件上传和管理相关的业务逻辑
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const multer = require('multer')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs').promises
const { cosService } = require('../config/tencent')
const { 
  successResponse, 
  BusinessError, 
  ValidationError
} = require('../middleware/errorHandler')
const logger = require('../utils/logger')
const config = require('../config/index')

/**
 * 配置multer存储
 */
const storage = multer.memoryStorage()

/**
 * 文件过滤器
 */
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ValidationError(`不支持的文件类型: ${file.mimetype}`), false)
  }
}

/**
 * 配置multer
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
    files: 1
  }
})

/**
 * 图片处理函数
 */
const processImage = async (buffer, options = {}) => {
  try {
    const {
      width = config.upload.image.maxWidth,
      height = config.upload.image.maxHeight,
      quality = config.upload.image.quality,
      format = 'jpeg'
    } = options

    let processor = sharp(buffer)

    // 获取图片信息
    const metadata = await processor.metadata()
    
    // 如果图片尺寸超过限制，进行缩放
    if (metadata.width > width || metadata.height > height) {
      processor = processor.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    // 转换格式和压缩
    if (format === 'jpeg') {
      processor = processor.jpeg({ quality })
    } else if (format === 'png') {
      processor = processor.png({ quality })
    } else if (format === 'webp') {
      processor = processor.webp({ quality })
    }

    return await processor.toBuffer()

  } catch (error) {
    logger.error('图片处理失败:', error.message)
    throw new BusinessError('图片处理失败')
  }
}

/**
 * 生成缩略图
 */
const generateThumbnail = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize(config.upload.image.thumbnailWidth, config.upload.image.thumbnailHeight, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer()

  } catch (error) {
    logger.error('生成缩略图失败:', error.message)
    throw new BusinessError('生成缩略图失败')
  }
}

/**
 * 上传文件
 */
const uploadFile = async (req, res) => {
  // 使用multer中间件处理文件上传
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          throw new ValidationError('文件大小超过限制')
        }
        throw new ValidationError(`文件上传错误: ${err.message}`)
      }
      throw err
    }

    if (!req.file) {
      throw new ValidationError('请选择要上传的文件')
    }

    const { user } = req
    const { folder = 'uploads' } = req.body
    const file = req.file

    try {
      let processedBuffer = file.buffer
      let filename = file.originalname

      // 如果是图片，进行处理
      if (file.mimetype.startsWith('image/')) {
        processedBuffer = await processImage(file.buffer)
        
        // 更新文件名扩展名
        const ext = path.extname(filename)
        const baseName = path.basename(filename, ext)
        filename = `${baseName}.jpg`
      }

      // 上传到腾讯云COS
      const uploadResult = await cosService.uploadFile(
        processedBuffer,
        filename,
        folder
      )

      // 如果是图片，生成缩略图
      let thumbnailUrl = null
      if (file.mimetype.startsWith('image/')) {
        try {
          const thumbnailBuffer = await generateThumbnail(processedBuffer)
          const thumbnailResult = await cosService.uploadFile(
            thumbnailBuffer,
            `thumb_${filename}`,
            `${folder}/thumbnails`
          )
          thumbnailUrl = thumbnailResult.url
        } catch (thumbnailError) {
          logger.warn('生成缩略图失败:', thumbnailError.message)
        }
      }

      const fileInfo = {
        url: uploadResult.url,
        path: uploadResult.path,
        size: uploadResult.size,
        filename: filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        thumbnailUrl,
        uploadTime: new Date()
      }

      logger.logBusiness('文件上传', user._id, {
        filename: fileInfo.filename,
        size: fileInfo.size,
        folder
      })

      res.json(successResponse(fileInfo, '文件上传成功'))

    } catch (error) {
      logger.error('文件上传失败:', error.message)
      throw new BusinessError('文件上传失败')
    }
  })
}

/**
 * 上传头像
 */
const uploadAvatar = async (req, res) => {
  // 使用multer中间件处理头像上传
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          throw new ValidationError('头像文件大小超过限制')
        }
        throw new ValidationError(`头像上传错误: ${err.message}`)
      }
      throw err
    }

    if (!req.file) {
      throw new ValidationError('请选择头像文件')
    }

    const { user } = req
    const file = req.file

    try {
      // 验证是否为图片
      if (!file.mimetype.startsWith('image/')) {
        throw new ValidationError('头像必须是图片文件')
      }

      // 处理头像图片（固定尺寸）
      const avatarBuffer = await sharp(file.buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toBuffer()

      // 生成文件名
      const filename = `avatar_${user._id}_${Date.now()}.jpg`

      // 上传到腾讯云COS
      const uploadResult = await cosService.uploadFile(
        avatarBuffer,
        filename,
        'avatars'
      )

      // 更新用户头像
      const oldAvatar = user.avatar
      user.avatar = uploadResult.url
      await user.save()

      // 删除旧头像（如果存在且是COS上的文件）
      if (oldAvatar && oldAvatar.includes(config.tencent.cos.domain)) {
        try {
          const oldPath = oldAvatar.replace(config.tencent.cos.domain + '/', '')
          await cosService.deleteFile(oldPath)
        } catch (deleteError) {
          logger.warn('删除旧头像失败:', deleteError.message)
        }
      }

      const avatarInfo = {
        url: uploadResult.url,
        path: uploadResult.path,
        size: uploadResult.size,
        filename: filename,
        uploadTime: new Date()
      }

      logger.logBusiness('上传头像', user._id, {
        filename: avatarInfo.filename,
        size: avatarInfo.size
      })

      res.json(successResponse(avatarInfo, '头像上传成功'))

    } catch (error) {
      logger.error('头像上传失败:', error.message)
      throw new BusinessError('头像上传失败')
    }
  })
}

/**
 * 删除文件
 */
const deleteFile = async (req, res) => {
  const { path: filePath } = req.params
  const { user } = req

  try {
    if (!filePath) {
      throw new ValidationError('文件路径不能为空')
    }

    // 检查文件是否存在
    const fileInfo = await cosService.getFileInfo(filePath)
    
    if (!fileInfo.exists) {
      throw new BusinessError('文件不存在')
    }

    // 删除文件
    await cosService.deleteFile(filePath)

    logger.logBusiness('删除文件', user._id, { filePath })

    res.json(successResponse(null, '文件删除成功'))

  } catch (error) {
    logger.error('删除文件失败:', error.message)
    throw new BusinessError('删除文件失败')
  }
}

/**
 * 批量删除文件
 */
const deleteFiles = async (req, res) => {
  const { paths } = req.body
  const { user } = req

  try {
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      throw new ValidationError('文件路径列表不能为空')
    }

    if (paths.length > 100) {
      throw new ValidationError('一次最多删除100个文件')
    }

    // 批量删除文件
    await cosService.deleteFiles(paths)

    logger.logBusiness('批量删除文件', user._id, { 
      count: paths.length,
      paths: paths.slice(0, 5) // 只记录前5个路径
    })

    res.json(successResponse({
      deletedCount: paths.length
    }, '文件批量删除成功'))

  } catch (error) {
    logger.error('批量删除文件失败:', error.message)
    throw new BusinessError('批量删除文件失败')
  }
}

/**
 * 获取文件信息
 */
const getFileInfo = async (req, res) => {
  const { path: filePath } = req.params

  try {
    if (!filePath) {
      throw new ValidationError('文件路径不能为空')
    }

    const fileInfo = await cosService.getFileInfo(filePath)

    if (!fileInfo.exists) {
      throw new BusinessError('文件不存在')
    }

    res.json(successResponse(fileInfo, '获取文件信息成功'))

  } catch (error) {
    logger.error('获取文件信息失败:', error.message)
    throw new BusinessError('获取文件信息失败')
  }
}

/**
 * 生成预签名URL
 */
const getSignedUrl = async (req, res) => {
  const { path: filePath } = req.params
  const { expires = 3600 } = req.query

  try {
    if (!filePath) {
      throw new ValidationError('文件路径不能为空')
    }

    const signedUrl = await cosService.getSignedUrl(filePath, parseInt(expires))

    res.json(successResponse({
      url: signedUrl,
      expires: parseInt(expires)
    }, '生成预签名URL成功'))

  } catch (error) {
    logger.error('生成预签名URL失败:', error.message)
    throw new BusinessError('生成预签名URL失败')
  }
}

module.exports = {
  uploadFile,
  uploadAvatar,
  deleteFile,
  deleteFiles,
  getFileInfo,
  getSignedUrl
}
