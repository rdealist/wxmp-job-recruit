/**
 * @fileoverview 职位控制器
 * @description 处理职位相关的业务逻辑
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const Job = require('../models/Job')
const Share = require('../models/Share')
const { 
  successResponse, 
  paginationResponse,
  BusinessError, 
  ValidationError,
  NotFoundError
} = require('../middleware/errorHandler')
const { cacheService } = require('../config/redis')
const logger = require('../utils/logger')
const Joi = require('joi')
const config = require('../config/index')

/**
 * 验证schemas
 */
const schemas = {
  createJob: Joi.object({
    title: Joi.string().max(100).required().messages({
      'string.empty': '职位标题不能为空',
      'string.max': '职位标题不能超过100个字符',
      'any.required': '职位标题是必需的'
    }),
    company: Joi.string().max(100).required().messages({
      'string.empty': '公司名称不能为空',
      'string.max': '公司名称不能超过100个字符',
      'any.required': '公司名称是必需的'
    }),
    salary: Joi.string().max(50).required().messages({
      'string.empty': '薪资范围不能为空',
      'string.max': '薪资范围不能超过50个字符',
      'any.required': '薪资范围是必需的'
    }),
    province: Joi.string().max(20).required(),
    city: Joi.string().max(20).required(),
    county: Joi.string().max(20).optional().allow(''),
    address: Joi.string().max(200).optional().allow(''),
    description: Joi.string().max(2000).required().messages({
      'string.empty': '职位描述不能为空',
      'string.max': '职位描述不能超过2000个字符',
      'any.required': '职位描述是必需的'
    }),
    requirements: Joi.string().max(1000).optional().allow(''),
    benefits: Joi.string().max(1000).optional().allow(''),
    category: Joi.string().valid('construction', 'design', 'management', 'technical', 'other').optional(),
    type: Joi.string().valid('fulltime', 'parttime', 'contract', 'internship').optional(),
    experience: Joi.string().valid('none', '1-3', '3-5', '5-10', '10+').optional(),
    education: Joi.string().valid('none', 'junior', 'senior', 'college', 'bachelor', 'master', 'doctor').optional(),
    skills: Joi.array().items(Joi.string().max(20)).max(10).optional(),
    contact: Joi.string().required().messages({
      'string.empty': '联系方式不能为空',
      'any.required': '联系方式是必需的'
    }),
    contactPerson: Joi.string().max(20).optional().allow(''),
    contactTime: Joi.string().max(100).optional().allow('')
  }),

  updateJob: Joi.object({
    title: Joi.string().max(100).optional(),
    company: Joi.string().max(100).optional(),
    salary: Joi.string().max(50).optional(),
    province: Joi.string().max(20).optional(),
    city: Joi.string().max(20).optional(),
    county: Joi.string().max(20).optional(),
    address: Joi.string().max(200).optional(),
    description: Joi.string().max(2000).optional(),
    requirements: Joi.string().max(1000).optional(),
    benefits: Joi.string().max(1000).optional(),
    category: Joi.string().valid('construction', 'design', 'management', 'technical', 'other').optional(),
    type: Joi.string().valid('fulltime', 'parttime', 'contract', 'internship').optional(),
    experience: Joi.string().valid('none', '1-3', '3-5', '5-10', '10+').optional(),
    education: Joi.string().valid('none', 'junior', 'senior', 'college', 'bachelor', 'master', 'doctor').optional(),
    skills: Joi.array().items(Joi.string().max(20)).max(10).optional(),
    contact: Joi.string().optional(),
    contactPerson: Joi.string().max(20).optional(),
    contactTime: Joi.string().max(100).optional()
  }),

  getJobs: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    keyword: Joi.string().max(100).optional(),
    province: Joi.string().max(20).optional(),
    city: Joi.string().max(20).optional(),
    category: Joi.string().valid('construction', 'design', 'management', 'technical', 'other').optional(),
    type: Joi.string().valid('fulltime', 'parttime', 'contract', 'internship').optional(),
    sortBy: Joi.string().valid('publishTime', 'viewCount', 'salary').default('publishTime'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
}

/**
 * 获取职位列表
 */
const getJobs = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.getJobs.validate(req.query)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { page, limit, keyword, province, city, category, type, sortBy, sortOrder } = value

  try {
    // 构建查询条件
    const query = {
      status: 1,
      reviewStatus: 1,
      expireTime: { $gt: new Date() }
    }

    // 地区筛选
    if (province) query.province = province
    if (city) query.city = city
    if (category) query.category = category
    if (type) query.type = type

    // 关键词搜索
    if (keyword) {
      query.$text = { $search: keyword }
    }

    // 构建排序
    const sort = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    // 添加默认排序
    if (sortBy !== 'publishTime') {
      sort.publishTime = -1
    }

    // 分页计算
    const skip = (page - 1) * limit

    // 尝试从缓存获取
    const cacheKey = `jobs:list:${JSON.stringify({ query, sort, skip, limit })}`
    let cachedResult = await cacheService.get(cacheKey)
    
    if (cachedResult) {
      return res.json(paginationResponse(
        cachedResult.jobs,
        cachedResult.pagination,
        '获取成功'
      ))
    }

    // 查询数据库
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-contact -contactPerson -contactTime -publisherId')
        .lean(),
      Job.countDocuments(query)
    ])

    // 处理职位数据
    const processedJobs = jobs.map(job => ({
      ...job,
      isToday: new Date(job.publishTime).toDateString() === new Date().toDateString(),
      needShareToUnlock: new Date(job.publishTime).toDateString() !== new Date().toDateString()
    }))

    const pagination = { page, limit, total }
    
    // 缓存结果
    await cacheService.set(cacheKey, { jobs: processedJobs, pagination }, config.cache.jobListTtl)

    logger.logBusiness('获取职位列表', req.user?._id, { 
      page, limit, keyword, total: processedJobs.length 
    })

    res.json(paginationResponse(processedJobs, pagination, '获取成功'))

  } catch (error) {
    logger.error('获取职位列表失败:', error.message)
    throw new BusinessError('获取职位列表失败')
  }
}

/**
 * 获取今日职位
 */
const getTodayJobs = async (req, res) => {
  const { page = 1, limit = 20 } = req.query

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const query = {
      publishTime: { $gte: today },
      status: 1,
      reviewStatus: 1
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ publishTime: -1 })
        .skip(skip)
        .limit(limit)
        .select('-publisherId')
        .lean(),
      Job.countDocuments(query)
    ])

    const processedJobs = jobs.map(job => ({
      ...job,
      isToday: true,
      needShareToUnlock: false
    }))

    const pagination = { page: parseInt(page), limit: parseInt(limit), total }

    logger.logBusiness('获取今日职位', req.user?._id, { total: processedJobs.length })

    res.json(paginationResponse(processedJobs, pagination, '获取成功'))

  } catch (error) {
    logger.error('获取今日职位失败:', error.message)
    throw new BusinessError('获取今日职位失败')
  }
}

/**
 * 搜索职位
 */
const searchJobs = async (req, res) => {
  const { q: keyword, page = 1, limit = 20 } = req.query

  if (!keyword) {
    throw new ValidationError('搜索关键词不能为空')
  }

  try {
    const query = {
      $text: { $search: keyword },
      status: 1,
      reviewStatus: 1,
      expireTime: { $gt: new Date() }
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      Job.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, publishTime: -1 })
        .skip(skip)
        .limit(limit)
        .select('-contact -contactPerson -contactTime -publisherId')
        .lean(),
      Job.countDocuments(query)
    ])

    const processedJobs = jobs.map(job => ({
      ...job,
      isToday: new Date(job.publishTime).toDateString() === new Date().toDateString(),
      needShareToUnlock: new Date(job.publishTime).toDateString() !== new Date().toDateString()
    }))

    const pagination = { page: parseInt(page), limit: parseInt(limit), total }

    logger.logBusiness('搜索职位', req.user?._id, { keyword, total: processedJobs.length })

    res.json(paginationResponse(processedJobs, pagination, '搜索成功'))

  } catch (error) {
    logger.error('搜索职位失败:', error.message)
    throw new BusinessError('搜索职位失败')
  }
}

/**
 * 获取职位详情
 */
const getJobDetail = async (req, res) => {
  const { id } = req.params

  try {
    const job = await Job.findById(id)
      .populate('publisherId', 'nickName avatar')
      .lean()

    if (!job) {
      throw new NotFoundError('职位不存在')
    }

    // 检查职位状态
    if (job.status !== 1 || job.reviewStatus !== 1) {
      throw new NotFoundError('职位不存在或已下架')
    }

    // 增加查看次数
    await Job.findByIdAndUpdate(id, { $inc: { viewCount: 1 } })

    // 处理职位数据
    const isToday = new Date(job.publishTime).toDateString() === new Date().toDateString()
    const needShareToUnlock = !isToday

    let includeContact = isToday

    // 如果是历史职位，检查用户是否已解锁
    if (!isToday && req.user) {
      const isUnlocked = await Share.checkUnlocked(req.user._id, id)
      includeContact = isUnlocked
    }

    const jobDetail = {
      ...job,
      isToday,
      needShareToUnlock,
      isUnlocked: includeContact,
      publisherInfo: job.publisherId
    }

    // 移除敏感信息
    delete jobDetail.publisherId
    if (!includeContact) {
      delete jobDetail.contact
      delete jobDetail.contactPerson
      delete jobDetail.contactTime
    }

    logger.logBusiness('查看职位详情', req.user?._id, { jobId: id })

    res.json(successResponse(jobDetail, '获取成功'))

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    logger.error('获取职位详情失败:', error.message)
    throw new BusinessError('获取职位详情失败')
  }
}

/**
 * 创建职位
 */
const createJob = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.createJob.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { user } = req

  try {
    // 创建职位对象
    const jobData = {
      ...value,
      publisherId: user._id,
      publisherInfo: {
        nickName: user.nickName,
        avatar: user.avatar,
        phone: user.phone
      },
      status: 1,
      reviewStatus: 0 // 待审核
    }

    const job = new Job(jobData)
    await job.save()

    // 更新用户发布计数
    await user.incrementPublishCount()

    // 清除相关缓存
    await cacheService.delPattern('jobs:list:*')

    logger.logBusiness('发布职位', user._id, { jobId: job._id, title: job.title })

    res.status(201).json(successResponse(job.getDetailInfo(true), '职位发布成功'))

  } catch (error) {
    logger.error('创建职位失败:', error.message)
    throw new BusinessError('职位发布失败')
  }
}

/**
 * 更新职位
 */
const updateJob = async (req, res) => {
  // 参数验证
  const { error, value } = schemas.updateJob.validate(req.body)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { resource: job } = req

  try {
    // 更新职位信息
    Object.assign(job, value)
    job.reviewStatus = 0 // 重新审核
    await job.save()

    // 清除相关缓存
    await cacheService.delPattern('jobs:list:*')

    logger.logBusiness('更新职位', req.user._id, { jobId: job._id })

    res.json(successResponse(job.getDetailInfo(true), '职位更新成功'))

  } catch (error) {
    logger.error('更新职位失败:', error.message)
    throw new BusinessError('职位更新失败')
  }
}

/**
 * 删除职位
 */
const deleteJob = async (req, res) => {
  const { resource: job } = req

  try {
    // 软删除：设置状态为已下架
    job.status = 2
    await job.save()

    // 清除相关缓存
    await cacheService.delPattern('jobs:list:*')

    logger.logBusiness('删除职位', req.user._id, { jobId: job._id })

    res.json(successResponse(null, '职位删除成功'))

  } catch (error) {
    logger.error('删除职位失败:', error.message)
    throw new BusinessError('职位删除失败')
  }
}

/**
 * 刷新职位
 */
const refreshJob = async (req, res) => {
  const { resource: job } = req

  try {
    // 更新刷新时间
    job.refreshTime = new Date()
    await job.save()

    // 清除相关缓存
    await cacheService.delPattern('jobs:list:*')

    logger.logBusiness('刷新职位', req.user._id, { jobId: job._id })

    res.json(successResponse(null, '职位刷新成功'))

  } catch (error) {
    logger.error('刷新职位失败:', error.message)
    throw new BusinessError('职位刷新失败')
  }
}

module.exports = {
  getJobs,
  getTodayJobs,
  searchJobs,
  getJobDetail,
  createJob,
  updateJob,
  deleteJob,
  refreshJob
}
