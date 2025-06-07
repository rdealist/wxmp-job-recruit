/**
 * @fileoverview 分享记录数据模型
 * @description 定义分享记录数据结构和相关方法
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const mongoose = require('mongoose')

/**
 * 分享记录数据模型Schema
 */
const shareSchema = new mongoose.Schema({
  // 关联信息
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    comment: '分享用户ID'
  },
  
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
    comment: '职位ID'
  },

  // 分享信息
  shareType: {
    type: String,
    enum: ['wechat', 'timeline', 'poster', 'link'],
    required: true,
    comment: '分享类型'
  },
  
  shareChannel: {
    type: String,
    enum: ['friend', 'group', 'timeline', 'qrcode', 'copy'],
    default: 'friend',
    comment: '分享渠道'
  },
  
  shareTime: {
    type: Date,
    default: Date.now,
    index: true,
    comment: '分享时间'
  },

  // 解锁信息
  unlockDate: {
    type: String,
    required: true,
    index: true,
    comment: '解锁的日期 YYYY-MM-DD'
  },
  
  unlockTime: {
    type: Date,
    default: Date.now,
    comment: '解锁时间'
  },

  // 分享来源信息
  sourceInfo: {
    ip: {
      type: String,
      comment: 'IP地址'
    },
    userAgent: {
      type: String,
      comment: '用户代理'
    },
    platform: {
      type: String,
      enum: ['weapp', 'h5', 'app'],
      default: 'weapp',
      comment: '分享平台'
    },
    version: {
      type: String,
      comment: '应用版本'
    }
  },

  // 分享效果统计
  clickCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '点击次数'
  },
  
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '查看次数'
  },
  
  convertCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: '转化次数'
  },

  // 状态信息
  status: {
    type: Number,
    enum: [0, 1, 2], // 0-无效 1-有效 2-已过期
    default: 1,
    comment: '分享状态'
  },
  
  isValid: {
    type: Boolean,
    default: true,
    comment: '是否有效'
  },

  // 过期时间
  expireTime: {
    type: Date,
    default: function() {
      // 分享记录7天后过期
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    comment: '过期时间'
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
  collection: 'shares'
})

/**
 * 索引定义
 */
shareSchema.index({ userId: 1, jobId: 1 })
shareSchema.index({ shareTime: -1 })
shareSchema.index({ unlockDate: 1 })
shareSchema.index({ userId: 1, unlockDate: 1 })
shareSchema.index({ expireTime: 1 })
shareSchema.index({ status: 1, isValid: 1 })

/**
 * 复合索引
 */
shareSchema.index({ userId: 1, jobId: 1, unlockDate: 1 }, { unique: true })

/**
 * 虚拟字段
 */
shareSchema.virtual('isExpired').get(function() {
  return this.expireTime < new Date()
})

shareSchema.virtual('isToday').get(function() {
  const today = new Date().toISOString().split('T')[0]
  return this.unlockDate === today
})

shareSchema.virtual('daysAgo').get(function() {
  const diffTime = Date.now() - this.shareTime.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
})

/**
 * 实例方法
 */

// 增加点击次数
shareSchema.methods.incrementClickCount = function() {
  this.clickCount += 1
  return this.save()
}

// 增加查看次数
shareSchema.methods.incrementViewCount = function() {
  this.viewCount += 1
  return this.save()
}

// 增加转化次数
shareSchema.methods.incrementConvertCount = function() {
  this.convertCount += 1
  return this.save()
}

// 检查是否有效
shareSchema.methods.checkValidity = function() {
  if (this.expireTime < new Date()) {
    this.status = 2
    this.isValid = false
    return this.save()
  }
  return Promise.resolve(this)
}

// 获取分享统计信息
shareSchema.methods.getStats = function() {
  return {
    id: this._id,
    shareType: this.shareType,
    shareChannel: this.shareChannel,
    shareTime: this.shareTime,
    unlockDate: this.unlockDate,
    clickCount: this.clickCount,
    viewCount: this.viewCount,
    convertCount: this.convertCount,
    isValid: this.isValid,
    isExpired: this.isExpired,
    daysAgo: this.daysAgo
  }
}

/**
 * 静态方法
 */

// 检查用户是否已解锁某个职位
shareSchema.statics.checkUnlocked = async function(userId, jobId) {
  const today = new Date().toISOString().split('T')[0]
  
  const share = await this.findOne({
    userId,
    jobId,
    unlockDate: today,
    status: 1,
    isValid: true
  })
  
  return !!share
}

// 创建分享记录
shareSchema.statics.createShare = async function(userId, jobId, shareType, shareChannel, sourceInfo = {}) {
  const today = new Date().toISOString().split('T')[0]
  
  // 检查是否已经分享过
  const existingShare = await this.findOne({
    userId,
    jobId,
    unlockDate: today
  })
  
  if (existingShare) {
    // 更新分享信息
    existingShare.shareType = shareType
    existingShare.shareChannel = shareChannel
    existingShare.shareTime = new Date()
    existingShare.sourceInfo = { ...existingShare.sourceInfo, ...sourceInfo }
    return await existingShare.save()
  }
  
  // 创建新的分享记录
  const share = new this({
    userId,
    jobId,
    shareType,
    shareChannel,
    unlockDate: today,
    sourceInfo
  })
  
  return await share.save()
}

// 获取用户的分享记录
shareSchema.statics.getUserShares = function(userId, limit = 20, skip = 0) {
  return this.find({ userId, status: 1 })
    .populate('jobId', 'title company salary province city publishTime')
    .sort({ shareTime: -1 })
    .limit(limit)
    .skip(skip)
}

// 获取职位的分享记录
shareSchema.statics.getJobShares = function(jobId, limit = 20, skip = 0) {
  return this.find({ jobId, status: 1 })
    .populate('userId', 'nickName avatar')
    .sort({ shareTime: -1 })
    .limit(limit)
    .skip(skip)
}

// 获取今日分享统计
shareSchema.statics.getTodayStats = async function() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const totalShares = await this.countDocuments({
    shareTime: { $gte: today },
    status: 1
  })
  
  const uniqueUsers = await this.distinct('userId', {
    shareTime: { $gte: today },
    status: 1
  })
  
  const uniqueJobs = await this.distinct('jobId', {
    shareTime: { $gte: today },
    status: 1
  })
  
  return {
    totalShares,
    uniqueUsers: uniqueUsers.length,
    uniqueJobs: uniqueJobs.length
  }
}

// 获取分享排行榜
shareSchema.statics.getShareRanking = async function(days = 7, limit = 10) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const ranking = await this.aggregate([
    {
      $match: {
        shareTime: { $gte: startDate },
        status: 1
      }
    },
    {
      $group: {
        _id: '$userId',
        shareCount: { $sum: 1 },
        totalClicks: { $sum: '$clickCount' },
        totalViews: { $sum: '$viewCount' },
        totalConverts: { $sum: '$convertCount' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        nickName: '$user.nickName',
        avatar: '$user.avatar',
        shareCount: 1,
        totalClicks: 1,
        totalViews: 1,
        totalConverts: 1
      }
    },
    {
      $sort: { shareCount: -1 }
    },
    {
      $limit: limit
    }
  ])
  
  return ranking
}

// 清理过期记录
shareSchema.statics.cleanExpiredShares = async function() {
  const result = await this.deleteMany({
    expireTime: { $lt: new Date() }
  })
  
  return result.deletedCount
}

/**
 * 中间件
 */

// 保存前处理
shareSchema.pre('save', function(next) {
  // 检查过期状态
  if (this.expireTime < new Date()) {
    this.status = 2
    this.isValid = false
  }
  
  next()
})

// 查询前处理
shareSchema.pre(/^find/, function(next) {
  // 默认只查询有效记录
  if (!this.getQuery().status) {
    this.where({ status: { $ne: 0 } })
  }
  
  next()
})

/**
 * JSON转换时的字段处理
 */
shareSchema.methods.toJSON = function() {
  const shareObject = this.toObject()
  delete shareObject.__v
  return shareObject
}

module.exports = mongoose.model('Share', shareSchema)
