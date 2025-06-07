/**
 * @fileoverview 职位发布页面
 * @description 工程招聘小程序的职位发布功能主页面，采用模块化表单组件设计
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 * @updated 2024-12-05
 */

import React, { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

// 导入组件
import CustomTabBar from '../../components/CustomTabBar'
import BasicInfoForm from './components/BasicInfoForm'
import RequirementsForm from './components/RequirementsForm'
import DescriptionForm from './components/DescriptionForm'
import ContactForm from './components/ContactForm'

// 导入工具和常量
import useJobStore from '../../stores/jobStore'
import { defaultFormData } from './constants/formOptions'
import { validateForSubmit, hasFormChanged } from './utils/formValidation'

import './index.less'

/**
 * 职位发布页面组件
 * @returns {React.ReactElement} 发布页面组件
 */
const Publish = () => {
  const { publishJob, locations } = useJobStore()

  // 表单状态管理
  const [formData, setFormData] = useState(defaultFormData)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  /**
   * 处理表单输入变化
   * @description 统一处理所有表单字段的输入变化
   * @param {string} field - 字段名称
   * @param {any} value - 字段值
   */
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  /**
   * 处理选择器变化
   * @description 处理各种选择器组件的值变化
   * @param {string} field - 字段名称
   * @param {any} value - 选择的值
   */
  const handlePickerChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  /**
   * 处理技能标签变化
   * @description 更新技能标签列表
   * @param {Array<string>} newTags - 新的标签数组
   */
  const handleTagsChange = useCallback((newTags) => {
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }))

    // 清除标签相关错误
    if (errors.tags) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.tags
        return newErrors
      })
    }
  }, [errors])

  /**
   * 提交表单处理函数
   * @description 验证表单数据并提交发布职位
   */
  const handleSubmit = useCallback(async () => {
    // 使用工具函数进行最终验证
    const validation = validateForSubmit(formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      Taro.showToast({
        title: '请完善必填信息',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)

    try {
      // 构建完整地址
      const fullLocation = formData.district
        ? `${formData.location} ${formData.district}`
        : formData.location

      const jobData = {
        ...validation.cleanedData,
        location: fullLocation
      }

      const jobId = publishJob(jobData)

      Taro.showToast({
        title: '发布成功',
        icon: 'success'
      })

      // 延迟跳转到首页
      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/home/index'
        })
      }, 1500)

    } catch (error) {
      console.error('发布失败:', error)
      Taro.showToast({
        title: '发布失败，请重试',
        icon: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }, [formData, publishJob])

  /**
   * 重置表单处理函数
   * @description 清空所有表单数据
   */
  const handleReset = useCallback(() => {
    // 检查是否有未保存的更改
    if (hasFormChanged(formData, defaultFormData)) {
      Taro.showModal({
        title: '确认重置',
        content: '将清空所有已填写的内容，确定要重置吗？',
        success: (res) => {
          if (res.confirm) {
            setFormData(defaultFormData)
            setErrors({})
            Taro.showToast({
              title: '表单已重置',
              icon: 'success'
            })
          }
        }
      })
    } else {
      Taro.showToast({
        title: '表单已是空白状态',
        icon: 'none'
      })
    }
  }, [formData])



  return (
    <View className="publish page-with-tabbar">
      {/* 页面头部 */}
      <View className="publish__header">
        <Text className="publish__title">发布职位</Text>
        <Text className="publish__subtitle">让更多优秀人才发现您的岗位</Text>
      </View>

      {/* 表单内容 */}
      <View className="publish__form">
        {/* 基本信息表单组件 */}
        <BasicInfoForm
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          onPickerChange={handlePickerChange}
          locations={locations}
        />

        {/* 任职要求表单组件 */}
        <RequirementsForm
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          onPickerChange={handlePickerChange}
          onTagsChange={handleTagsChange}
        />

        {/* 详细描述表单组件 */}
        <DescriptionForm
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
        />

        {/* 联系信息表单组件 */}
        <ContactForm
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
        />
      </View>

      {/* 操作按钮 */}
      <View className="publish__actions">
        <View
          className="arco-btn arco-btn--large arco-btn--outline publish__btn publish__btn--secondary"
          onClick={handleReset}
        >
          <Text className="publish__btn-text">重置</Text>
        </View>
        <View
          className={`arco-btn arco-btn--large arco-btn--primary publish__btn publish__btn--primary ${
            submitting ? 'arco-btn--loading publish__btn--disabled' : ''
          }`}
          onClick={handleSubmit}
        >
          <Text className="publish__btn-text">
            {submitting ? '发布中...' : '立即发布'}
          </Text>
        </View>
      </View>

      {/* 自定义TabBar */}
      <CustomTabBar />
    </View>
  )
}

export default Publish 