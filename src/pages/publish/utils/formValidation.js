/**
 * @fileoverview 表单验证工具函数
 * @description 提供发布页面表单的验证逻辑和错误处理
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import { formFieldConfig } from '../constants/formOptions'

/**
 * 验证单个字段
 * @description 根据字段配置验证单个表单字段的值
 * @param {string} fieldName - 字段名称
 * @param {any} value - 字段值
 * @param {Object} allValues - 所有表单值（用于关联验证）
 * @returns {string|null} 错误信息，无错误时返回null
 */
export const validateField = (fieldName, value, allValues = {}) => {
  const config = formFieldConfig[fieldName]
  if (!config) return null

  const { rules = [] } = config

  // 遍历验证规则
  for (const rule of rules) {
    // 必填验证
    if (rule.required && (!value || value.toString().trim() === '')) {
      return rule.message || `${config.label}是必填项`
    }

    // 跳过空值的其他验证（非必填字段）
    if (!value || value.toString().trim() === '') {
      continue
    }

    const stringValue = value.toString().trim()

    // 最小长度验证
    if (rule.min && stringValue.length < rule.min) {
      return rule.message || `${config.label}至少需要${rule.min}个字符`
    }

    // 最大长度验证
    if (rule.max && stringValue.length > rule.max) {
      return rule.message || `${config.label}不能超过${rule.max}个字符`
    }

    // 正则表达式验证
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return rule.message || `${config.label}格式不正确`
    }

    // 自定义验证函数
    if (rule.validator && typeof rule.validator === 'function') {
      const result = rule.validator(value, allValues)
      if (result !== true) {
        return result || `${config.label}验证失败`
      }
    }
  }

  return null
}

/**
 * 验证整个表单
 * @description 验证表单的所有字段，返回验证结果和错误信息
 * @param {Object} formData - 表单数据对象
 * @returns {Object} 验证结果 {isValid: boolean, errors: Object}
 */
export const validateForm = (formData) => {
  const errors = {}
  let isValid = true

  // 验证所有配置的字段
  Object.keys(formFieldConfig).forEach(fieldName => {
    const error = validateField(fieldName, formData[fieldName], formData)
    if (error) {
      errors[fieldName] = error
      isValid = false
    }
  })

  // 特殊验证：技能标签
  if (formData.tags && formData.tags.length > 10) {
    errors.tags = '技能标签不能超过10个'
    isValid = false
  }

  // 特殊验证：地区选择
  if (formData.location && !formData.district) {
    // 某些城市可能不需要选择区县，这里可以根据实际需求调整
  }

  return { isValid, errors }
}

/**
 * 实时验证字段
 * @description 用于表单输入时的实时验证，提供即时反馈
 * @param {string} fieldName - 字段名称
 * @param {any} value - 字段值
 * @param {Object} currentErrors - 当前错误状态
 * @param {Object} allValues - 所有表单值
 * @returns {Object} 更新后的错误状态
 */
export const validateFieldRealtime = (fieldName, value, currentErrors, allValues) => {
  const error = validateField(fieldName, value, allValues)
  const newErrors = { ...currentErrors }

  if (error) {
    newErrors[fieldName] = error
  } else {
    delete newErrors[fieldName]
  }

  return newErrors
}

/**
 * 清理表单数据
 * @description 清理和格式化表单数据，去除无效值
 * @param {Object} formData - 原始表单数据
 * @returns {Object} 清理后的表单数据
 */
export const sanitizeFormData = (formData) => {
  const cleaned = {}

  Object.keys(formData).forEach(key => {
    const value = formData[key]

    if (typeof value === 'string') {
      // 去除首尾空格
      const trimmed = value.trim()
      if (trimmed) {
        cleaned[key] = trimmed
      }
    } else if (Array.isArray(value)) {
      // 数组类型（如tags）
      const filteredArray = value.filter(item => 
        item && typeof item === 'string' && item.trim()
      ).map(item => item.trim())
      
      if (filteredArray.length > 0) {
        cleaned[key] = filteredArray
      }
    } else if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  })

  return cleaned
}

/**
 * 检查表单是否有变更
 * @description 比较当前表单数据与初始数据，判断是否有修改
 * @param {Object} currentData - 当前表单数据
 * @param {Object} initialData - 初始表单数据
 * @returns {boolean} 是否有变更
 */
export const hasFormChanged = (currentData, initialData) => {
  const currentKeys = Object.keys(currentData)
  const initialKeys = Object.keys(initialData)

  // 检查键的数量是否相同
  if (currentKeys.length !== initialKeys.length) {
    return true
  }

  // 检查每个字段的值
  for (const key of currentKeys) {
    const currentValue = currentData[key]
    const initialValue = initialData[key]

    // 处理数组类型
    if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
      if (currentValue.length !== initialValue.length) {
        return true
      }
      for (let i = 0; i < currentValue.length; i++) {
        if (currentValue[i] !== initialValue[i]) {
          return true
        }
      }
    } else if (currentValue !== initialValue) {
      return true
    }
  }

  return false
}

/**
 * 获取字段错误信息
 * @description 获取指定字段的错误信息，用于显示错误提示
 * @param {string} fieldName - 字段名称
 * @param {Object} errors - 错误对象
 * @returns {string|null} 错误信息
 */
export const getFieldError = (fieldName, errors) => {
  return errors[fieldName] || null
}

/**
 * 检查字段是否有错误
 * @description 检查指定字段是否存在验证错误
 * @param {string} fieldName - 字段名称
 * @param {Object} errors - 错误对象
 * @returns {boolean} 是否有错误
 */
export const hasFieldError = (fieldName, errors) => {
  return Boolean(errors[fieldName])
}

/**
 * 获取表单验证摘要
 * @description 生成表单验证结果的摘要信息
 * @param {Object} errors - 错误对象
 * @returns {Object} 验证摘要
 */
export const getValidationSummary = (errors) => {
  const errorFields = Object.keys(errors)
  const errorCount = errorFields.length

  return {
    hasErrors: errorCount > 0,
    errorCount,
    errorFields,
    firstError: errorCount > 0 ? errors[errorFields[0]] : null
  }
}

/**
 * 表单提交前的最终验证
 * @description 在表单提交前进行最终的完整验证
 * @param {Object} formData - 表单数据
 * @returns {Object} 验证结果和处理后的数据
 */
export const validateForSubmit = (formData) => {
  // 清理数据
  const cleanedData = sanitizeFormData(formData)
  
  // 验证清理后的数据
  const validation = validateForm(cleanedData)
  
  return {
    ...validation,
    cleanedData
  }
}

/**
 * 自定义验证规则
 * @description 提供一些常用的自定义验证规则
 */
export const customValidators = {
  /**
   * 验证手机号格式
   * @param {string} phone - 手机号
   * @returns {boolean|string} 验证结果
   */
  phone: (phone) => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone) || '请输入正确的手机号码'
  },

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean|string} 验证结果
   */
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) || '请输入正确的邮箱地址'
  },

  /**
   * 验证薪资格式
   * @param {string} salary - 薪资字符串
   * @returns {boolean|string} 验证结果
   */
  salary: (salary) => {
    // 允许格式：数字-数字K, 数字K以上, 面议
    const salaryRegex = /^(\d+-\d+K?|\d+K?以上|面议|待遇优厚)$/i
    return salaryRegex.test(salary) || '请输入正确的薪资格式，如：10-15K'
  }
}
