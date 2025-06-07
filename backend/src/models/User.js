/**
 * @fileoverview 用户数据模型
 * @description 定义用户数据结构和相关方法
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

/**
 * 用户数据模型Schema
 */
const userSchema = new mongoose.Schema({
  // 微信相关信息
  openId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    comment: '微信openId'
  },
  
  unionId: {
    type: String,
    sparse: true,
    index: true,
    comment: '微信unionId'
  },
  
  sessionKey: {
    type: String,
    comment: '微信会话密钥'
  },

  // 用户基本信息
  nickName: {
    type: String,
    required: true,
    maxlength: 50,
    comment: '用户昵称'
  },
  
  avatar: {
    type: String,
    default: '',
    comment: '用户头像URL'
  },
  
  gender: {
    type: Number,
    enum: [0, 1, 2], // 0-未知 1-男 2-女
    default: 0,
    comment: '性别'
  },
  
  phone: {
    type: String,
    sparse: true,
    index: true,
    match: /^1[3-9]\d{9}$/,
    comment: '手机号码'
  },
  
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    comment: '邮箱地址'
  },

  // 地理位置信息
  province: {
    type: String,
    default: '',
    comment: '省份'
  },
  
  city: {
    type: String,
    default: '',
    comment: '城市'
  },
  
  county: {
    type: String,
    default: '',
    comment: '区县'
  },

  // 用户角色和权限
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
    comment: '用户角色'
  },
  
  permissions: [{
    type: String,
    comment: '用户权限列表'
  }],

  // 账户状态
  status: {
    type: Number,
    enum: [0, 1, 2], // 0-冻结 1-正常 2-待审核
    default: 1,
    comment: '账户状态'
  },
  
  isVerified: {
    type: Boolean,
    default: false,
    comment: '是否已验证'
  },

  // 统计信息
  publishCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '发布职位数量'
  },
  
  shareCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '分享次数'
  },
  
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '查看次数'
  },

  // 时间信息
  createTime: {
    type: Date,
    default: Date.now,
    index: true,
    comment: '注册时间'
  },
  
  lastLoginTime: {
    type: Date,
    default: Date.now,
    comment: '最后登录时间'
  },
  
  lastActiveTime: {
    type: Date,
    default: Date.now,
    comment: '最后活跃时间'
  },

  // 设置信息
  settings: {
    // 通知设置
    notifications: {
      jobReview: { type: Boolean, default: true },
      newMessage: { type: Boolean, default: true },
      systemUpdate: { type: Boolean, default: true }
    },
    
    // 隐私设置
    privacy: {
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false }
    }
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
  collection: 'users'
})

/**
 * 索引定义
 */
userSchema.index({ openId: 1 }, { unique: true })
userSchema.index({ phone: 1 }, { sparse: true })
userSchema.index({ createTime: -1 })
userSchema.index({ status: 1, role: 1 })
userSchema.index({ lastActiveTime: -1 })

/**
 * 虚拟字段
 */
userSchema.virtual('isActive').get(function() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return this.lastActiveTime > oneWeekAgo
})

userSchema.virtual('displayName').get(function() {
  return this.nickName || '匿名用户'
})

/**
 * 实例方法
 */

// 更新最后活跃时间
userSchema.methods.updateLastActive = function() {
  this.lastActiveTime = new Date()
  return this.save()
}

// 增加发布计数
userSchema.methods.incrementPublishCount = function() {
  this.publishCount += 1
  return this.save()
}

// 增加分享计数
userSchema.methods.incrementShareCount = function() {
  this.shareCount += 1
  return this.save()
}

// 增加查看计数
userSchema.methods.incrementViewCount = function() {
  this.viewCount += 1
  return this.save()
}

// 检查用户权限
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true
  return this.permissions.includes(permission)
}

// 获取用户公开信息
userSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    nickName: this.nickName,
    avatar: this.avatar,
    publishCount: this.publishCount,
    createTime: this.createTime,
    isActive: this.isActive
  }
}

// 获取用户详细信息（需要权限）
userSchema.methods.getDetailInfo = function() {
  return {
    id: this._id,
    nickName: this.nickName,
    avatar: this.avatar,
    gender: this.gender,
    phone: this.phone,
    email: this.email,
    province: this.province,
    city: this.city,
    county: this.county,
    publishCount: this.publishCount,
    shareCount: this.shareCount,
    viewCount: this.viewCount,
    createTime: this.createTime,
    lastLoginTime: this.lastLoginTime,
    isActive: this.isActive,
    settings: this.settings
  }
}

/**
 * 静态方法
 */

// 根据openId查找用户
userSchema.statics.findByOpenId = function(openId) {
  return this.findOne({ openId, status: { $ne: 0 } })
}

// 根据手机号查找用户
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone, status: { $ne: 0 } })
}

// 获取活跃用户
userSchema.statics.getActiveUsers = function(days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return this.find({
    lastActiveTime: { $gte: cutoffDate },
    status: 1
  }).sort({ lastActiveTime: -1 })
}

// 获取用户统计
userSchema.statics.getStatistics = async function() {
  const total = await this.countDocuments()
  const active = await this.countDocuments({
    lastActiveTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  })
  const today = await this.countDocuments({
    createTime: { $gte: new Date().setHours(0, 0, 0, 0) }
  })
  
  return { total, active, today }
}

/**
 * 中间件
 */

// 保存前处理
userSchema.pre('save', function(next) {
  // 更新时间戳
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date()
  }
  
  next()
})

// 删除前清理关联数据
userSchema.pre('remove', async function(next) {
  try {
    // 删除用户相关的职位
    await mongoose.model('Job').deleteMany({ publisherId: this._id })
    
    // 删除用户相关的分享记录
    await mongoose.model('Share').deleteMany({ userId: this._id })
    
    next()
  } catch (error) {
    next(error)
  }
})

/**
 * JSON转换时隐藏敏感字段
 */
userSchema.methods.toJSON = function() {
  const userObject = this.toObject()
  delete userObject.sessionKey
  delete userObject.openId
  delete userObject.__v
  return userObject
}

module.exports = mongoose.model('User', userSchema)
