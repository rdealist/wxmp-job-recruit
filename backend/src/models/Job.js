/**
 * @fileoverview 职位数据模型
 * @description 定义职位数据结构和相关方法
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const mongoose = require('mongoose')

/**
 * 职位数据模型Schema
 */
const jobSchema = new mongoose.Schema({
  // 基本信息
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
    comment: '职位标题'
  },
  
  company: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
    comment: '公司名称'
  },
  
  salary: {
    type: String,
    required: true,
    maxlength: 50,
    comment: '薪资范围'
  },

  // 地理位置
  province: {
    type: String,
    required: true,
    maxlength: 20,
    comment: '省份'
  },
  
  city: {
    type: String,
    required: true,
    maxlength: 20,
    comment: '城市'
  },
  
  county: {
    type: String,
    default: '',
    maxlength: 20,
    comment: '区县'
  },
  
  address: {
    type: String,
    default: '',
    maxlength: 200,
    comment: '详细地址'
  },

  // 职位详情
  description: {
    type: String,
    required: true,
    maxlength: 2000,
    comment: '职位描述'
  },
  
  requirements: {
    type: String,
    default: '',
    maxlength: 1000,
    comment: '任职要求'
  },
  
  benefits: {
    type: String,
    default: '',
    maxlength: 1000,
    comment: '福利待遇'
  },

  // 职位分类
  category: {
    type: String,
    enum: ['construction', 'design', 'management', 'technical', 'other'],
    default: 'construction',
    comment: '职位类别'
  },
  
  type: {
    type: String,
    enum: ['fulltime', 'parttime', 'contract', 'internship'],
    default: 'fulltime',
    comment: '工作类型'
  },
  
  experience: {
    type: String,
    enum: ['none', '1-3', '3-5', '5-10', '10+'],
    default: 'none',
    comment: '经验要求'
  },
  
  education: {
    type: String,
    enum: ['none', 'junior', 'senior', 'college', 'bachelor', 'master', 'doctor'],
    default: 'none',
    comment: '学历要求'
  },

  // 技能标签
  skills: [{
    type: String,
    maxlength: 20,
    comment: '技能标签'
  }],

  // 联系信息
  contact: {
    type: String,
    required: true,
    comment: '联系方式'
  },
  
  contactPerson: {
    type: String,
    default: '',
    maxlength: 20,
    comment: '联系人'
  },
  
  contactTime: {
    type: String,
    default: '',
    maxlength: 100,
    comment: '联系时间'
  },

  // 发布者信息
  publisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    comment: '发布者ID'
  },
  
  publisherInfo: {
    nickName: String,
    avatar: String,
    phone: String
  },

  // 状态管理
  status: {
    type: Number,
    enum: [0, 1, 2, 3], // 0-草稿 1-已发布 2-已下架 3-已过期
    default: 1,
    index: true,
    comment: '职位状态'
  },
  
  reviewStatus: {
    type: Number,
    enum: [0, 1, 2], // 0-待审核 1-审核通过 2-审核拒绝
    default: 0,
    index: true,
    comment: '审核状态'
  },
  
  reviewReason: {
    type: String,
    default: '',
    comment: '审核意见'
  },

  // 时间信息
  publishTime: {
    type: Date,
    default: Date.now,
    index: true,
    comment: '发布时间'
  },
  
  expireTime: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
    },
    comment: '过期时间'
  },
  
  refreshTime: {
    type: Date,
    default: Date.now,
    comment: '刷新时间'
  },

  // 统计信息
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '查看次数'
  },
  
  shareCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '分享次数'
  },
  
  favoriteCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '收藏次数'
  },

  // 优先级和推荐
  priority: {
    type: Number,
    default: 0,
    comment: '优先级'
  },
  
  isRecommended: {
    type: Boolean,
    default: false,
    comment: '是否推荐'
  },
  
  isUrgent: {
    type: Boolean,
    default: false,
    comment: '是否紧急'
  },

  // 扩展字段
  extra: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    comment: '扩展信息'
  }
}, {
  timestamps: true,
  versionKey: false,
  collection: 'jobs'
})

/**
 * 索引定义
 */
jobSchema.index({ publisherId: 1 })
jobSchema.index({ status: 1, reviewStatus: 1 })
jobSchema.index({ publishTime: -1 })
jobSchema.index({ province: 1, city: 1 })
jobSchema.index({ category: 1, type: 1 })
jobSchema.index({ expireTime: 1 })
jobSchema.index({ 
  title: 'text', 
  company: 'text', 
  description: 'text',
  requirements: 'text'
}, { 
  name: 'job_search_index',
  default_language: 'none'
})

/**
 * 虚拟字段
 */
jobSchema.virtual('isExpired').get(function() {
  return this.expireTime < new Date()
})

jobSchema.virtual('isToday').get(function() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return this.publishTime >= today
})

jobSchema.virtual('daysAgo').get(function() {
  const diffTime = Date.now() - this.publishTime.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
})

/**
 * 实例方法
 */

// 增加查看次数
jobSchema.methods.incrementViewCount = function() {
  this.viewCount += 1
  return this.save()
}

// 增加分享次数
jobSchema.methods.incrementShareCount = function() {
  this.shareCount += 1
  return this.save()
}

// 增加收藏次数
jobSchema.methods.incrementFavoriteCount = function() {
  this.favoriteCount += 1
  return this.save()
}

// 刷新职位
jobSchema.methods.refresh = function() {
  this.refreshTime = new Date()
  return this.save()
}

// 检查是否需要分享解锁
jobSchema.methods.needShareToUnlock = function() {
  return !this.isToday
}

// 获取职位摘要信息
jobSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    company: this.company,
    salary: this.salary,
    province: this.province,
    city: this.city,
    county: this.county,
    publishTime: this.publishTime,
    viewCount: this.viewCount,
    isToday: this.isToday,
    needShareToUnlock: this.needShareToUnlock()
  }
}

// 获取职位详细信息
jobSchema.methods.getDetailInfo = function(includeContact = false) {
  const info = {
    id: this._id,
    title: this.title,
    company: this.company,
    salary: this.salary,
    province: this.province,
    city: this.city,
    county: this.county,
    address: this.address,
    description: this.description,
    requirements: this.requirements,
    benefits: this.benefits,
    category: this.category,
    type: this.type,
    experience: this.experience,
    education: this.education,
    skills: this.skills,
    publishTime: this.publishTime,
    viewCount: this.viewCount,
    shareCount: this.shareCount,
    isToday: this.isToday,
    needShareToUnlock: this.needShareToUnlock(),
    publisherInfo: this.publisherInfo
  }

  if (includeContact) {
    info.contact = this.contact
    info.contactPerson = this.contactPerson
    info.contactTime = this.contactTime
  }

  return info
}

/**
 * 静态方法
 */

// 获取有效职位
jobSchema.statics.getActiveJobs = function() {
  return this.find({
    status: 1,
    reviewStatus: 1,
    expireTime: { $gt: new Date() }
  })
}

// 根据地区查找职位
jobSchema.statics.findByLocation = function(province, city, county) {
  const query = { province, status: 1, reviewStatus: 1 }
  if (city) query.city = city
  if (county) query.county = county
  
  return this.find(query).sort({ publishTime: -1 })
}

// 搜索职位
jobSchema.statics.searchJobs = function(keyword, filters = {}) {
  const query = {
    status: 1,
    reviewStatus: 1,
    expireTime: { $gt: new Date() }
  }

  // 关键词搜索
  if (keyword) {
    query.$text = { $search: keyword }
  }

  // 地区筛选
  if (filters.province) query.province = filters.province
  if (filters.city) query.city = filters.city
  if (filters.county) query.county = filters.county

  // 分类筛选
  if (filters.category) query.category = filters.category
  if (filters.type) query.type = filters.type
  if (filters.experience) query.experience = filters.experience

  return this.find(query).sort({ 
    isRecommended: -1, 
    priority: -1, 
    publishTime: -1 
  })
}

// 获取今日职位
jobSchema.statics.getTodayJobs = function() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return this.find({
    publishTime: { $gte: today },
    status: 1,
    reviewStatus: 1
  }).sort({ publishTime: -1 })
}

// 获取统计信息
jobSchema.statics.getStatistics = async function() {
  const total = await this.countDocuments({ status: 1, reviewStatus: 1 })
  const today = await this.countDocuments({
    publishTime: { $gte: new Date().setHours(0, 0, 0, 0) },
    status: 1,
    reviewStatus: 1
  })
  const pending = await this.countDocuments({ reviewStatus: 0 })
  
  return { total, today, pending }
}

/**
 * 中间件
 */

// 保存前处理
jobSchema.pre('save', function(next) {
  // 检查过期状态
  if (this.expireTime < new Date() && this.status === 1) {
    this.status = 3 // 设置为已过期
  }
  
  next()
})

// 删除前清理关联数据
jobSchema.pre('remove', async function(next) {
  try {
    // 删除相关的分享记录
    await mongoose.model('Share').deleteMany({ jobId: this._id })
    
    next()
  } catch (error) {
    next(error)
  }
})

module.exports = mongoose.model('Job', jobSchema)
