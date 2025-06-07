/**
 * @fileoverview 职位数据模块
 * @description 管理职位相关的数据和业务逻辑，包括模拟数据、地区数据等
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

/**
 * 模拟职位数据
 * @description 用于开发和演示的模拟职位数据，包含各种类型的工程职位
 * @type {Array<Object>}
 */
export const mockJobs = [
  {
    id: '1',
    title: '高级前端工程师',
    company: '阿里巴巴',
    location: '杭州市',
    salary: '20-35K',
    experience: '3-5年',
    education: '本科',
    tags: ['Vue', 'React', 'TypeScript'],
    description: '负责前端架构设计，参与核心业务开发，优化用户体验，提升页面性能。需要具备扎实的前端基础知识和丰富的项目经验。',
    contact: '13812345678',
    contactName: '张经理',
    publishTime: new Date().toISOString(),
    publishDate: new Date().toDateString(),
    requirements: '熟练掌握Vue/React框架，有大型项目经验，了解前端工程化，具备良好的代码规范意识。',
    benefits: '五险一金，带薪年假，股票期权，弹性工作制，技术培训，团队建设活动。'
  },
  {
    id: '2',
    title: '建筑工程师',
    company: '中建集团',
    location: '上海市',
    salary: '15-25K',
    experience: '5年以上',
    education: '本科',
    tags: ['土木工程', 'CAD', '项目管理'],
    description: '负责建筑工程设计、施工管理、质量控制等工作。参与大型基础设施建设项目，确保工程质量和进度。',
    contact: '13698765432',
    contactName: '李工',
    publishTime: new Date(Date.now() - 86400000).toISOString(),
    publishDate: new Date(Date.now() - 86400000).toDateString(),
    requirements: '土木工程相关专业，熟悉建筑规范，具备项目管理经验，持有相关执业资格证书。',
    benefits: '五险一金，项目奖金，技能培训，职业发展通道，住房补贴。'
  },
  {
    id: '3',
    title: '机械设计工程师',
    company: '三一重工',
    location: '长沙市',
    salary: '12-20K',
    experience: '3年以上',
    education: '本科',
    tags: ['机械设计', 'SolidWorks', '工艺改进'],
    description: '负责机械产品设计与优化，参与新产品研发，改进生产工艺，提升产品质量和生产效率。',
    contact: '13566778899',
    contactName: '王总',
    publishTime: new Date(Date.now() - 172800000).toISOString(),
    publishDate: new Date(Date.now() - 172800000).toDateString(),
    requirements: '机械相关专业，熟练使用设计软件，具备产品设计经验，了解制造工艺。',
    benefits: '五险一金，年终奖，职业发展，技术培训，员工食堂，班车接送。'
  },
  {
    id: '4',
    title: '电气工程师',
    company: '国家电网',
    location: '北京市',
    salary: '18-28K',
    experience: '3-5年',
    education: '本科',
    tags: ['电气设计', 'PLC', '自动化'],
    description: '负责电气系统设计、设备选型、调试维护等工作。参与智能电网建设，推进电力系统现代化。',
    contact: '13712345678',
    contactName: '刘工',
    publishTime: new Date(Date.now() - 259200000).toISOString(),
    publishDate: new Date(Date.now() - 259200000).toDateString(),
    requirements: '电气工程及其自动化专业，熟悉电气设计规范，具备PLC编程能力。',
    benefits: '五险一金，绩效奖金，培训机会，稳定发展，国企待遇。'
  }
]

/**
 * 地区数据配置
 * @description 包含主要城市及其下属区县的数据结构
 * @type {Object<string, Array<string>>}
 */
export const locations = {
  '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '门头沟区', '房山区'],
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区'],
  '广州市': ['天河区', '越秀区', '荔湾区', '海珠区', '白云区', '黄埔区', '番禺区', '花都区'],
  '深圳市': ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区'],
  '杭州市': ['西湖区', '拱墅区', '江干区', '下城区', '上城区', '滨江区', '萧山区', '余杭区'],
  '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区'],
  '重庆市': ['渝中区', '江北区', '南岸区', '九龙坡区', '沙坪坝区', '大渡口区', '渝北区', '巴南区'],
  '武汉市': ['江汉区', '江岸区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '蔡甸区'],
  '西安市': ['新城区', '碑林区', '莲湖区', '雁塔区', '未央区', '灞桥区', '阎良区', '临潼区'],
  '长沙市': ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区', '望城区', '长沙县', '浏阳市']
}

/**
 * 职位数据工具函数集合
 */
export const jobDataUtils = {
  /**
   * 生成新的职位ID
   * @description 基于时间戳生成唯一的职位ID
   * @returns {string} 新的职位ID
   */
  generateJobId: () => {
    return Date.now().toString()
  },

  /**
   * 创建新职位对象
   * @description 根据提供的数据创建完整的职位对象
   * @param {Object} jobData - 职位基础数据
   * @returns {Object} 完整的职位对象
   */
  createJobObject: (jobData) => {
    const now = new Date()
    return {
      id: jobDataUtils.generateJobId(),
      ...jobData,
      publishTime: now.toISOString(),
      publishDate: now.toDateString(),
      // 确保必要字段存在
      tags: jobData.tags || [],
      requirements: jobData.requirements || '',
      benefits: jobData.benefits || ''
    }
  },

  /**
   * 验证职位数据完整性
   * @description 检查职位数据是否包含所有必需字段
   * @param {Object} jobData - 要验证的职位数据
   * @returns {Object} 验证结果对象
   */
  validateJobData: (jobData) => {
    const requiredFields = ['title', 'company', 'location', 'salary', 'description', 'contact', 'contactName']
    const errors = {}
    
    requiredFields.forEach(field => {
      if (!jobData[field] || jobData[field].trim() === '') {
        errors[field] = `${field} 是必填字段`
      }
    })

    // 验证联系电话格式
    if (jobData.contact && !/^1[3-9]\d{9}$/.test(jobData.contact)) {
      errors.contact = '请输入正确的手机号码'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  },

  /**
   * 获取今日发布的职位
   * @description 筛选出今天发布的所有职位
   * @param {Array<Object>} jobs - 职位列表
   * @returns {Array<Object>} 今日发布的职位列表
   */
  getTodayJobs: (jobs) => {
    const today = new Date().toDateString()
    return jobs.filter(job => job.publishDate === today)
  },

  /**
   * 根据ID查找职位
   * @description 在职位列表中查找指定ID的职位
   * @param {Array<Object>} jobs - 职位列表
   * @param {string} jobId - 职位ID
   * @returns {Object|null} 找到的职位对象，未找到时返回null
   */
  findJobById: (jobs, jobId) => {
    return jobs.find(job => job.id === jobId) || null
  },

  /**
   * 获取城市列表
   * @description 获取所有可选择的城市列表
   * @returns {Array<string>} 城市名称数组
   */
  getCityList: () => {
    return Object.keys(locations)
  },

  /**
   * 获取指定城市的区县列表
   * @description 根据城市名称获取其下属区县列表
   * @param {string} city - 城市名称
   * @returns {Array<string>} 区县名称数组
   */
  getDistrictList: (city) => {
    return locations[city] || []
  },

  /**
   * 格式化职位发布时间
   * @description 将职位发布时间格式化为易读的相对时间
   * @param {string} publishTime - 发布时间的ISO字符串
   * @returns {string} 格式化后的时间字符串
   */
  formatPublishTime: (publishTime) => {
    const date = new Date(publishTime)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days === 2) return '前天'
    return `${days}天前`
  }
}
