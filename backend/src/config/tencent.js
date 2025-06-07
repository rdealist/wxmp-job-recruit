/**
 * @fileoverview 腾讯云服务配置
 * @description 配置腾讯云COS对象存储等服务
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const COS = require('cos-nodejs-sdk-v5')
const tencentcloud = require('tencentcloud-sdk-nodejs')
const config = require('./index')
const logger = require('../utils/logger')

/**
 * 腾讯云COS对象存储客户端
 */
const cosClient = new COS({
  SecretId: config.tencent.secretId,
  SecretKey: config.tencent.secretKey,
  Region: config.tencent.cos.region,
  
  // 可选配置
  FileParallelLimit: 3,    // 控制文件上传并发数
  ChunkParallelLimit: 8,   // 控制单个文件下分片上传并发数
  ChunkSize: 1024 * 1024,  // 控制分片大小，单位B
  SliceSize: 1024 * 1024,  // 使用分片上传的文件大小阈值
  CopyChunkParallelLimit: 20, // 分片复制并发数
  CopyChunkSize: 1024 * 1024 * 10, // 分片复制阈值
  
  // 超时配置
  Timeout: 60000,
  KeepAlive: true,
  
  // 重试配置
  Retry: 3,
  RetryDelay: 1000
})

/**
 * COS文件上传服务
 */
class COSService {
  constructor() {
    this.bucket = config.tencent.cos.bucket
    this.region = config.tencent.cos.region
    this.domain = config.tencent.cos.domain
  }

  /**
   * 生成文件路径
   */
  generateFilePath(originalName, folder = 'uploads') {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = originalName.split('.').pop()
    const fileName = `${timestamp}_${randomStr}.${ext}`
    
    return `${folder}/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${fileName}`
  }

  /**
   * 上传文件到COS
   */
  async uploadFile(fileBuffer, originalName, folder = 'uploads') {
    try {
      const filePath = this.generateFilePath(originalName, folder)
      
      const result = await new Promise((resolve, reject) => {
        cosClient.putObject({
          Bucket: this.bucket,
          Region: this.region,
          Key: filePath,
          Body: fileBuffer,
          ContentLength: fileBuffer.length,
          
          // 设置文件权限为公共读
          ACL: 'public-read',
          
          // 设置缓存控制
          CacheControl: 'max-age=31536000',
          
          // 进度回调
          onProgress: (progressData) => {
            logger.debug(`文件上传进度: ${Math.round(progressData.percent * 100)}%`)
          }
        }, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      })

      const fileUrl = `${this.domain}/${filePath}`
      
      logger.info(`文件上传成功: ${fileUrl}`)
      
      return {
        success: true,
        url: fileUrl,
        path: filePath,
        size: fileBuffer.length,
        etag: result.ETag
      }

    } catch (error) {
      logger.error('COS文件上传失败:', error)
      throw new Error(`文件上传失败: ${error.message}`)
    }
  }

  /**
   * 删除COS文件
   */
  async deleteFile(filePath) {
    try {
      await new Promise((resolve, reject) => {
        cosClient.deleteObject({
          Bucket: this.bucket,
          Region: this.region,
          Key: filePath
        }, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      })

      logger.info(`文件删除成功: ${filePath}`)
      return true

    } catch (error) {
      logger.error('COS文件删除失败:', error)
      throw new Error(`文件删除失败: ${error.message}`)
    }
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(filePaths) {
    try {
      const objects = filePaths.map(path => ({ Key: path }))
      
      await new Promise((resolve, reject) => {
        cosClient.deleteMultipleObject({
          Bucket: this.bucket,
          Region: this.region,
          Objects: objects
        }, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      })

      logger.info(`批量删除文件成功: ${filePaths.length}个文件`)
      return true

    } catch (error) {
      logger.error('COS批量删除文件失败:', error)
      throw new Error(`批量删除文件失败: ${error.message}`)
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath) {
    try {
      const result = await new Promise((resolve, reject) => {
        cosClient.headObject({
          Bucket: this.bucket,
          Region: this.region,
          Key: filePath
        }, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      })

      return {
        exists: true,
        size: parseInt(result.headers['content-length']),
        lastModified: result.headers['last-modified'],
        etag: result.headers.etag,
        contentType: result.headers['content-type']
      }

    } catch (error) {
      if (error.statusCode === 404) {
        return { exists: false }
      }
      
      logger.error('获取COS文件信息失败:', error)
      throw new Error(`获取文件信息失败: ${error.message}`)
    }
  }

  /**
   * 生成预签名URL
   */
  async getSignedUrl(filePath, expires = 3600) {
    try {
      const url = await new Promise((resolve, reject) => {
        cosClient.getObjectUrl({
          Bucket: this.bucket,
          Region: this.region,
          Key: filePath,
          Sign: true,
          Expires: expires
        }, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data.Url)
          }
        })
      })

      return url

    } catch (error) {
      logger.error('生成COS预签名URL失败:', error)
      throw new Error(`生成预签名URL失败: ${error.message}`)
    }
  }

  /**
   * 检查COS服务状态
   */
  async checkServiceHealth() {
    try {
      await new Promise((resolve, reject) => {
        cosClient.getBucket({
          Bucket: this.bucket,
          Region: this.region
        }, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      })

      return {
        status: 'healthy',
        bucket: this.bucket,
        region: this.region
      }

    } catch (error) {
      logger.error('COS服务健康检查失败:', error)
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }
}

// 创建COS服务实例
const cosService = new COSService()

/**
 * 腾讯云其他服务客户端（可扩展）
 */
const TencentCloudClient = tencentcloud.cvm.v20170312.Client
const tencentCloudClient = new TencentCloudClient({
  credential: {
    secretId: config.tencent.secretId,
    secretKey: config.tencent.secretKey
  },
  region: config.tencent.region,
  profile: {
    httpProfile: {
      endpoint: "cvm.tencentcloudapi.com"
    }
  }
})

module.exports = {
  cosClient,
  cosService,
  tencentCloudClient
}
