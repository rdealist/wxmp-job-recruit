# 工程招聘小程序后端API

基于 Node.js + Express + MongoDB + Redis 构建的工程招聘小程序后端服务，集成腾讯云服务。

## ✨ 核心特性

- **微信小程序登录** - 支持微信小程序授权登录
- **职位管理** - 完整的职位CRUD操作和搜索筛选
- **分享解锁机制** - 今日免费，历史职位分享解锁
- **文件上传** - 集成腾讯云COS对象存储
- **权限控制** - 基于JWT的认证和角色权限管理
- **API限流** - 多层级限流保护
- **数据缓存** - Redis缓存提升性能
- **日志监控** - 完整的请求日志和错误监控
- **API文档** - Swagger自动生成的API文档

## 🛠 技术栈

- **框架**: Express.js 4.18+
- **数据库**: MongoDB (腾讯云)
- **缓存**: Redis (腾讯云)
- **云服务**: 腾讯云COS对象存储
- **认证**: JWT + 微信小程序登录
- **文档**: Swagger/OpenAPI 3.0
- **日志**: Winston
- **测试**: Jest + Supertest

## 📁 项目结构

```
backend/
├── src/
│   ├── controllers/     # 控制器层
│   ├── models/         # 数据模型
│   ├── routes/         # 路由定义
│   ├── middleware/     # 中间件
│   ├── services/       # 业务逻辑层
│   ├── utils/          # 工具函数
│   ├── config/         # 配置文件
│   └── app.js          # 应用入口
├── tests/              # 测试文件
├── docs/               # API文档
├── logs/               # 日志文件
├── .env.example        # 环境配置示例
├── package.json
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MongoDB >= 4.4
- Redis >= 6.0
- npm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd backend

# 安装依赖
npm install
```

### 环境配置

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件，填入实际配置值
vim .env
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 运行测试
npm test
```

### 访问服务

- **API服务**: http://localhost:3000
- **API文档**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/health

## 📊 API接口

### 认证相关
- `POST /api/v1/auth/wechat/login` - 微信小程序登录
- `POST /api/v1/auth/refresh` - 刷新访问令牌
- `POST /api/v1/auth/logout` - 用户登出
- `GET /api/v1/auth/profile` - 获取用户信息
- `PUT /api/v1/auth/profile` - 更新用户信息

### 职位管理
- `GET /api/v1/jobs` - 获取职位列表
- `GET /api/v1/jobs/today` - 获取今日职位
- `GET /api/v1/jobs/search` - 搜索职位
- `GET /api/v1/jobs/:id` - 获取职位详情
- `POST /api/v1/jobs` - 发布职位
- `PUT /api/v1/jobs/:id` - 更新职位
- `DELETE /api/v1/jobs/:id` - 删除职位

### 分享管理
- `POST /api/v1/shares/unlock` - 分享解锁职位
- `POST /api/v1/shares/check` - 检查解锁状态
- `POST /api/v1/shares/poster` - 生成分享海报
- `GET /api/v1/shares/statistics` - 分享统计

### 文件管理
- `POST /api/v1/files/upload` - 上传文件
- `POST /api/v1/files/upload/avatar` - 上传头像
- `DELETE /api/v1/files/:path` - 删除文件

### 用户管理
- `GET /api/v1/users/me/jobs` - 我的职位
- `GET /api/v1/users/me/shares` - 我的分享
- `GET /api/v1/users/me/statistics` - 我的统计

### 管理后台
- `GET /api/v1/admin/dashboard` - 仪表盘数据
- `GET /api/v1/admin/jobs/pending` - 待审核职位
- `PUT /api/v1/admin/jobs/:id/review` - 审核职位
- `GET /api/v1/admin/users` - 用户列表
- `PUT /api/v1/admin/users/:id/status` - 更新用户状态

## 🔧 配置说明

### 数据库配置

```javascript
// MongoDB连接
MONGODB_URI=mongodb://localhost:27017/job_recruit_dev

// Redis连接
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 微信小程序配置

```javascript
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
```

### 腾讯云配置

```javascript
// 基础配置
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
TENCENT_REGION=ap-beijing

// COS对象存储
TENCENT_COS_BUCKET=your-bucket-name
TENCENT_COS_REGION=ap-beijing
TENCENT_COS_DOMAIN=https://your-domain.com
```

## 🔒 安全特性

- **JWT认证** - 基于JSON Web Token的用户认证
- **API限流** - 多层级限流防护
- **参数验证** - Joi参数验证
- **错误处理** - 统一错误处理和响应
- **日志记录** - 完整的操作日志
- **CORS配置** - 跨域请求控制

## 📈 性能优化

- **Redis缓存** - 热点数据缓存
- **数据库索引** - 优化查询性能
- **分页查询** - 大数据量分页处理
- **压缩中间件** - 响应数据压缩
- **连接池** - 数据库连接池管理

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 📝 开发规范

### 代码风格
- 使用ESLint进行代码检查
- 遵循JavaScript Standard Style
- 函数和变量使用驼峰命名
- 常量使用大写下划线命名

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 🚀 部署

### Docker部署

```bash
# 构建镜像
docker build -t job-recruit-backend .

# 运行容器
docker run -d -p 3000:3000 --env-file .env job-recruit-backend
```

### PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name job-recruit-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs job-recruit-backend
```

## 📞 技术支持

如有技术问题或建议，欢迎通过以下方式联系：

- 📧 Email: support@jobrecruit.com
- 💬 微信: jobservice
- 🔗 GitHub Issues: [项目地址]

## 📜 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
