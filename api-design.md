# 工程招聘平台 - 后端API设计

## 🎯 概述

基于 Node.js + Express + MongoDB 的 RESTful API 设计，支持工程招聘小程序的核心业务功能。

## 📊 数据库设计

### 用户表 (users)
```javascript
{
  _id: ObjectId,
  openId: String,          // 微信openId
  nickName: String,        // 用户昵称
  avatar: String,          // 头像URL
  phone: String,           // 手机号（加密存储）
  createTime: Date,        // 注册时间
  lastLoginTime: Date,     // 最后登录时间
  status: Number           // 状态：1-正常 0-冻结
}
```

### 职位表 (jobs)
```javascript
{
  _id: ObjectId,
  title: String,           // 职位名称
  company: String,         // 公司名称
  salary: String,          // 薪资
  province: String,        // 省份
  city: String,           // 城市
  county: String,         // 区县
  description: String,     // 职位描述
  requirements: String,    // 任职要求
  contact: String,         // 联系方式（加密）
  publisherId: ObjectId,   // 发布者ID
  publishTime: Date,       // 发布时间
  viewCount: Number,       // 浏览次数
  status: Number,          // 状态：1-正常 2-审核中 0-下架
  tags: Array             // 职位标签
}
```

### 分享记录表 (shares)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // 分享用户ID
  jobId: ObjectId,         // 职位ID
  shareType: String,       // 分享类型：wechat/timeline/poster
  shareTime: Date,         // 分享时间
  unlockDate: String       // 解锁的日期（YYYY-MM-DD）
}
```

## 🔌 API接口设计

### 基础配置
- **Base URL**: `https://api.jobrecruit.com/v1`
- **认证方式**: JWT Token
- **请求格式**: JSON
- **响应格式**: JSON

### 统一响应格式
```javascript
{
  "code": 200,           // 状态码
  "message": "success",  // 消息
  "data": {},           // 数据
  "timestamp": 1640995200000
}
```

---

## 👤 用户管理

### 1. 微信登录
```
POST /auth/wechat/login
```

**请求参数:**
```javascript
{
  "code": "微信授权code",
  "encryptedData": "加密数据",
  "iv": "初始向量"
}
```

**响应:**
```javascript
{
  "code": 200,
  "data": {
    "token": "JWT_TOKEN",
    "userInfo": {
      "id": "用户ID",
      "nickName": "用户昵称",
      "avatar": "头像URL"
    }
  }
}
```

### 2. 获取用户信息
```
GET /auth/profile
Headers: Authorization: Bearer {token}
```

---

## 💼 职位管理

### 1. 获取职位列表
```
GET /jobs
```

**查询参数:**
- `page`: 页码（默认1）
- `size`: 每页数量（默认20，最大50）
- `province`: 省份筛选
- `city`: 城市筛选
- `keyword`: 搜索关键词
- `sortBy`: 排序方式（time/salary/view）
- `order`: 排序顺序（desc/asc）

**响应:**
```javascript
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "职位ID",
        "title": "建筑工程师",
        "company": "中建集团",
        "salary": "8000-12000",
        "province": "北京",
        "city": "朝阳区",
        "publishTime": "2024-01-01T10:00:00Z",
        "viewCount": 156,
        "isToday": true  // 是否今日发布
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 100,
      "hasMore": true
    }
  }
}
```

### 2. 获取职位详情
```
GET /jobs/{jobId}
Headers: Authorization: Bearer {token}
```

**响应:**
```javascript
{
  "code": 200,
  "data": {
    "id": "职位ID",
    "title": "建筑工程师",
    "company": "中建集团",
    "salary": "8000-12000",
    "province": "北京",
    "city": "朝阳区",
    "county": "",
    "description": "职位描述",
    "requirements": "任职要求",
    "contact": "138****8888",  // 根据权限显示
    "publishTime": "2024-01-01T10:00:00Z",
    "viewCount": 156,
    "isUnlocked": true,  // 当前用户是否已解锁
    "needShare": false   // 是否需要分享解锁
  }
}
```

### 3. 发布职位
```
POST /jobs
Headers: Authorization: Bearer {token}
```

**请求参数:**
```javascript
{
  "title": "建筑工程师",
  "company": "中建集团",
  "salary": "8000-12000",
  "province": "北京",
  "city": "朝阳区",
  "county": "",
  "description": "职位描述...",
  "requirements": "任职要求...",
  "contact": "13812345678"
}
```

**响应:**
```javascript
{
  "code": 200,
  "data": {
    "id": "新职位ID",
    "message": "发布成功，等待审核"
  }
}
```

### 4. 我的发布
```
GET /jobs/my
Headers: Authorization: Bearer {token}
```

---

## 📱 分享系统

### 1. 记录分享行为
```
POST /share/record
Headers: Authorization: Bearer {token}
```

**请求参数:**
```javascript
{
  "jobId": "职位ID",
  "shareType": "wechat", // wechat/timeline/poster
  "shareDate": "2024-01-01"  // 解锁的日期
}
```

### 2. 检查解锁状态
```
GET /share/unlock-status
Headers: Authorization: Bearer {token}
```

**查询参数:**
- `date`: 查询日期（YYYY-MM-DD）

**响应:**
```javascript
{
  "code": 200,
  "data": {
    "unlockedDates": ["2024-01-01", "2024-01-02"],
    "todayShared": false
  }
}
```

### 3. 生成分享海报
```
POST /share/poster
Headers: Authorization: Bearer {token}
```

**请求参数:**
```javascript
{
  "jobId": "职位ID",
  "template": "default"  // 海报模板
}
```

---

## 🏢 管理后台 API

### 1. 管理员登录
```
POST /admin/auth/login
```

### 2. 职位审核
```
PUT /admin/jobs/{jobId}/review
```

**请求参数:**
```javascript
{
  "status": 1,  // 1-通过 0-拒绝
  "reason": "审核意见"
}
```

### 3. 用户管理
```
GET /admin/users
PUT /admin/users/{userId}/status
```

### 4. 数据统计
```
GET /admin/statistics
```

**响应:**
```javascript
{
  "code": 200,
  "data": {
    "totalJobs": 1000,
    "totalUsers": 500,
    "todayJobs": 50,
    "todayShares": 200,
    "activeUsers": 300
  }
}
```

---

## 🔒 安全机制

### 1. 数据加密
- 手机号使用 AES 加密存储
- 敏感信息传输 HTTPS
- API 接口签名验证

### 2. 权限控制
- JWT Token 认证
- 接口访问频率限制
- 敏感操作二次验证

### 3. 内容审核
- 职位信息人工审核
- 敏感词过滤
- 图片内容识别

---

## 📈 性能优化

### 1. 缓存策略
- Redis 缓存热门职位
- CDN 加速静态资源
- 数据库查询优化

### 2. 限流策略
```javascript
// 用户维度限流
const userLimits = {
  publishJob: "5/day",      // 每日发布5条
  shareRecord: "50/day",    // 每日分享50次
  viewDetail: "200/hour"    // 每小时查看200次
}
```

### 3. 监控告警
- API 响应时间监控
- 错误率监控
- 数据库性能监控

---

## 🚀 部署架构

### 1. 服务架构
```
负载均衡器 -> API网关 -> 应用服务器 -> 数据库
              ↓
            缓存层(Redis)
```

### 2. 环境配置
- **开发环境**: 单机部署
- **测试环境**: 容器化部署
- **生产环境**: 集群部署 + 自动扩缩容

### 3. 备份策略
- 数据库每日全量备份
- 增量备份 + 日志备份
- 异地容灾备份

---

## 📝 开发规范

### 1. 接口文档
- 使用 Swagger 自动生成
- 接口变更版本控制
- Mock 数据支持

### 2. 错误码设计
```javascript
const ERROR_CODES = {
  SUCCESS: 200,
  INVALID_PARAM: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  
  // 业务错误码
  USER_NOT_EXIST: 1001,
  JOB_NOT_FOUND: 2001,
  SHARE_LIMIT_EXCEEDED: 3001
}
```

### 3. 日志规范
- 结构化日志记录
- 关键操作全链路追踪
- 错误日志实时告警

---

这套API设计文档涵盖了工程招聘平台的核心功能，可根据实际需求进行调整和扩展。 