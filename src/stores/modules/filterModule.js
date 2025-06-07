/**
 * @fileoverview 筛选功能模块
 * @description 处理职位筛选相关的业务逻辑，包括筛选条件管理、筛选算法等
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

/**
 * 默认筛选条件
 * @description 定义筛选功能的初始状态
 * @type {Object}
 */
export const defaultFilters = {
  /** 选择的城市 */
  location: '',
  /** 选择的区县 */
  district: '',
  /** 搜索关键词 */
  keyword: '',
  /** 薪资范围筛选 */
  salaryRange: '',
  /** 工作经验筛选 */
  experience: '',
  /** 学历要求筛选 */
  education: ''
}

/**
 * 筛选条件验证规则
 * @description 定义各个筛选条件的验证规则
 */
const filterValidationRules = {
  location: {
    maxLength: 20,
    pattern: /^[\u4e00-\u9fa5]+$/,
    message: '地区名称只能包含中文字符'
  },
  district: {
    maxLength: 20,
    pattern: /^[\u4e00-\u9fa5]+$/,
    message: '区县名称只能包含中文字符'
  },
  keyword: {
    maxLength: 50,
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/,
    message: '关键词只能包含中文、英文、数字和空格'
  }
}

/**
 * 筛选功能工具函数集合
 */
export const filterUtils = {
  /**
   * 应用筛选条件到职位列表
   * @description 根据筛选条件过滤职位列表，支持多条件组合筛选
   * @param {Array<Object>} jobs - 原始职位列表
   * @param {Object} filters - 筛选条件对象
   * @returns {Array<Object>} 筛选后的职位列表
   * @example
   * const filteredJobs = filterUtils.applyFilters(jobs, {
   *   location: '北京市',
   *   keyword: '前端'
   * })
   */
  applyFilters: (jobs, filters) => {
    if (!Array.isArray(jobs)) {
      console.warn('职位列表必须是数组格式')
      return []
    }

    let filtered = [...jobs]

    // 地区筛选
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location && job.location.includes(filters.location)
      )
    }

    // 区县筛选
    if (filters.district) {
      filtered = filtered.filter(job => 
        job.location && job.location.includes(filters.district)
      )
    }

    // 关键词搜索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase().trim()
      filtered = filtered.filter(job => {
        // 在职位标题中搜索
        const titleMatch = job.title && job.title.toLowerCase().includes(keyword)
        // 在公司名称中搜索
        const companyMatch = job.company && job.company.toLowerCase().includes(keyword)
        // 在技能标签中搜索
        const tagsMatch = job.tags && job.tags.some(tag => 
          tag.toLowerCase().includes(keyword)
        )
        // 在职位描述中搜索
        const descMatch = job.description && job.description.toLowerCase().includes(keyword)
        
        return titleMatch || companyMatch || tagsMatch || descMatch
      })
    }

    // 薪资范围筛选
    if (filters.salaryRange) {
      filtered = filterUtils.filterBySalaryRange(filtered, filters.salaryRange)
    }

    // 工作经验筛选
    if (filters.experience) {
      filtered = filtered.filter(job => 
        job.experience && job.experience === filters.experience
      )
    }

    // 学历要求筛选
    if (filters.education) {
      filtered = filtered.filter(job => 
        job.education && job.education === filters.education
      )
    }

    return filtered
  },

  /**
   * 根据薪资范围筛选职位
   * @description 解析薪资字符串并进行范围筛选
   * @param {Array<Object>} jobs - 职位列表
   * @param {string} salaryRange - 薪资范围字符串，如 "10-20K"
   * @returns {Array<Object>} 筛选后的职位列表
   * @private
   */
  filterBySalaryRange: (jobs, salaryRange) => {
    const parseRange = filterUtils.parseSalaryRange(salaryRange)
    if (!parseRange) return jobs

    return jobs.filter(job => {
      const jobSalary = filterUtils.parseSalaryRange(job.salary)
      if (!jobSalary) return false

      // 检查薪资范围是否有重叠
      return jobSalary.max >= parseRange.min && jobSalary.min <= parseRange.max
    })
  },

  /**
   * 解析薪资字符串
   * @description 将薪资字符串解析为数值范围
   * @param {string} salaryStr - 薪资字符串，如 "10-20K", "面议"
   * @returns {Object|null} 解析结果 {min, max} 或 null
   * @example
   * parseSalaryRange("10-20K") // {min: 10, max: 20}
   * parseSalaryRange("面议") // null
   */
  parseSalaryRange: (salaryStr) => {
    if (!salaryStr || typeof salaryStr !== 'string') return null

    // 处理 "面议" 等特殊情况
    if (salaryStr.includes('面议') || salaryStr.includes('待遇优厚')) {
      return null
    }

    // 匹配 "数字-数字K" 格式
    const match = salaryStr.match(/(\d+)-(\d+)K?/i)
    if (match) {
      return {
        min: parseInt(match[1], 10),
        max: parseInt(match[2], 10)
      }
    }

    // 匹配单个数字格式 "数字K以上"
    const singleMatch = salaryStr.match(/(\d+)K?以上/i)
    if (singleMatch) {
      return {
        min: parseInt(singleMatch[1], 10),
        max: Infinity
      }
    }

    return null
  },

  /**
   * 验证筛选条件
   * @description 验证筛选条件的有效性
   * @param {Object} filters - 筛选条件对象
   * @returns {Object} 验证结果 {isValid, errors}
   */
  validateFilters: (filters) => {
    const errors = {}

    Object.keys(filters).forEach(key => {
      const value = filters[key]
      const rule = filterValidationRules[key]

      if (rule && value) {
        // 检查长度限制
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[key] = `${key} 长度不能超过 ${rule.maxLength} 个字符`
        }

        // 检查格式规则
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[key] = rule.message
        }
      }
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  },

  /**
   * 清理筛选条件
   * @description 清理筛选条件中的无效值
   * @param {Object} filters - 原始筛选条件
   * @returns {Object} 清理后的筛选条件
   */
  sanitizeFilters: (filters) => {
    const sanitized = {}

    Object.keys(filters).forEach(key => {
      const value = filters[key]
      if (typeof value === 'string') {
        // 去除首尾空格
        const trimmed = value.trim()
        if (trimmed) {
          sanitized[key] = trimmed
        }
      } else if (value !== null && value !== undefined) {
        sanitized[key] = value
      }
    })

    return sanitized
  },

  /**
   * 检查是否有活跃的筛选条件
   * @description 判断当前是否设置了任何筛选条件
   * @param {Object} filters - 筛选条件对象
   * @returns {boolean} 是否有活跃的筛选条件
   */
  hasActiveFilters: (filters) => {
    return Object.values(filters).some(value => 
      value && value.toString().trim() !== ''
    )
  },

  /**
   * 获取筛选条件摘要
   * @description 生成筛选条件的文字描述
   * @param {Object} filters - 筛选条件对象
   * @returns {string} 筛选条件摘要
   */
  getFilterSummary: (filters) => {
    const parts = []

    if (filters.location) {
      const locationText = filters.district 
        ? `${filters.location} ${filters.district}`
        : filters.location
      parts.push(`地区: ${locationText}`)
    }

    if (filters.keyword) {
      parts.push(`关键词: "${filters.keyword}"`)
    }

    if (filters.salaryRange) {
      parts.push(`薪资: ${filters.salaryRange}`)
    }

    if (filters.experience) {
      parts.push(`经验: ${filters.experience}`)
    }

    if (filters.education) {
      parts.push(`学历: ${filters.education}`)
    }

    return parts.length > 0 ? parts.join(', ') : '无筛选条件'
  }
}
