/**
 * @fileoverview 发布页面表单选项常量
 * @description 定义发布职位表单中使用的各种选项数据
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

/**
 * 工作经验选项
 * @description 职位发布时可选择的工作经验要求
 * @type {Array<string>}
 */
export const experienceOptions = [
  '不限',
  '应届毕业生',
  '1年以下',
  '1-3年',
  '3-5年',
  '5-10年',
  '10年以上'
]

/**
 * 学历要求选项
 * @description 职位发布时可选择的学历要求
 * @type {Array<string>}
 */
export const educationOptions = [
  '不限',
  '中专/中技',
  '高中',
  '大专',
  '本科',
  '硕士',
  '博士'
]

/**
 * 常用技能标签
 * @description 预设的技能标签，用户可以快速选择
 * @type {Array<Object>}
 */
export const commonSkillTags = [
  { category: '前端开发', tags: ['Vue', 'React', 'Angular', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Webpack'] },
  { category: '后端开发', tags: ['Java', 'Python', 'Node.js', 'PHP', 'Go', 'C++', 'Spring', 'Django'] },
  { category: '移动开发', tags: ['Android', 'iOS', 'React Native', 'Flutter', 'Kotlin', 'Swift'] },
  { category: '数据库', tags: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server'] },
  { category: '运维部署', tags: ['Docker', 'Kubernetes', 'Linux', 'AWS', 'Azure', 'Jenkins', 'Git'] },
  { category: '设计工具', tags: ['Photoshop', 'Sketch', 'Figma', 'Adobe XD', 'Illustrator'] },
  { category: '工程技能', tags: ['CAD', 'SolidWorks', 'AutoCAD', '项目管理', 'PLC', '电气设计'] }
]

/**
 * 薪资范围选项
 * @description 预设的薪资范围选项，方便用户快速选择
 * @type {Array<string>}
 */
export const salaryRangeOptions = [
  '3-5K',
  '5-8K',
  '8-12K',
  '12-18K',
  '18-25K',
  '25-35K',
  '35-50K',
  '50K以上',
  '面议'
]

/**
 * 公司规模选项
 * @description 公司规模分类选项
 * @type {Array<string>}
 */
export const companySizeOptions = [
  '20人以下',
  '20-99人',
  '100-499人',
  '500-999人',
  '1000-9999人',
  '10000人以上'
]

/**
 * 公司性质选项
 * @description 公司性质分类选项
 * @type {Array<string>}
 */
export const companyTypeOptions = [
  '民营企业',
  '外资企业',
  '国有企业',
  '股份制企业',
  '事业单位',
  '政府机关',
  '非营利组织',
  '创业公司'
]

/**
 * 工作类型选项
 * @description 工作类型分类选项
 * @type {Array<string>}
 */
export const jobTypeOptions = [
  '全职',
  '兼职',
  '实习',
  '劳务',
  '派遣'
]

/**
 * 表单字段配置
 * @description 定义表单各字段的配置信息
 * @type {Object}
 */
export const formFieldConfig = {
  title: {
    label: '职位名称',
    placeholder: '如：高级前端工程师',
    required: true,
    maxLength: 50,
    rules: [
      { required: true, message: '请输入职位名称' },
      { max: 50, message: '职位名称不能超过50个字符' }
    ]
  },
  company: {
    label: '公司名称',
    placeholder: '如：阿里巴巴集团',
    required: true,
    maxLength: 100,
    rules: [
      { required: true, message: '请输入公司名称' },
      { max: 100, message: '公司名称不能超过100个字符' }
    ]
  },
  location: {
    label: '工作地区',
    placeholder: '选择城市',
    required: true,
    rules: [
      { required: true, message: '请选择工作地区' }
    ]
  },
  salary: {
    label: '薪资范围',
    placeholder: '如：10-15K，面议',
    required: true,
    maxLength: 20,
    rules: [
      { required: true, message: '请输入薪资范围' },
      { max: 20, message: '薪资范围不能超过20个字符' }
    ]
  },
  description: {
    label: '职位描述',
    placeholder: '详细描述工作内容、职责要求等...',
    required: true,
    maxLength: 500,
    rules: [
      { required: true, message: '请输入职位描述' },
      { min: 20, message: '职位描述至少需要20个字符' },
      { max: 500, message: '职位描述不能超过500个字符' }
    ]
  },
  requirements: {
    label: '任职要求',
    placeholder: '详细描述任职要求...',
    required: false,
    maxLength: 300,
    rules: [
      { max: 300, message: '任职要求不能超过300个字符' }
    ]
  },
  benefits: {
    label: '福利待遇',
    placeholder: '描述公司福利、发展前景等...',
    required: false,
    maxLength: 200,
    rules: [
      { max: 200, message: '福利待遇不能超过200个字符' }
    ]
  },
  contactName: {
    label: '联系人',
    placeholder: '如：张经理',
    required: true,
    maxLength: 20,
    rules: [
      { required: true, message: '请输入联系人姓名' },
      { max: 20, message: '联系人姓名不能超过20个字符' }
    ]
  },
  contact: {
    label: '联系电话',
    placeholder: '请输入手机号码',
    required: true,
    type: 'number',
    rules: [
      { required: true, message: '请输入联系电话' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
    ]
  }
}

/**
 * 表单默认值
 * @description 定义表单的初始默认值
 * @type {Object}
 */
export const defaultFormData = {
  title: '',
  company: '',
  location: '',
  district: '',
  salary: '',
  experience: '',
  education: '',
  description: '',
  requirements: '',
  benefits: '',
  contact: '',
  contactName: '',
  tags: [],
  jobType: '全职',
  companySize: '',
  companyType: ''
}
