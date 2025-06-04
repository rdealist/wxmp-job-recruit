import React, { useState } from 'react'
import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import useJobStore from '../../stores/jobStore'
import './index.less'

const Publish = () => {
  const { publishJob, locations } = useJobStore()
  
  const [formData, setFormData] = useState({
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
    tags: []
  })
  
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')

  // 城市和区县选择器数据
  const cityList = Object.keys(locations)
  const districtList = formData.location ? locations[formData.location] || [] : []

  // 经验选项
  const experienceOptions = [
    '不限',
    '应届毕业生',
    '1年以下',
    '1-3年',
    '3-5年',
    '5-10年',
    '10年以上'
  ]

  // 学历选项
  const educationOptions = [
    '不限',
    '中专/中技',
    '高中',
    '大专',
    '本科',
    '硕士',
    '博士'
  ]

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // 处理城市选择
  const handleCityChange = (e) => {
    const selectedCity = cityList[e.detail.value]
    handleInputChange('location', selectedCity)
    handleInputChange('district', '') // 重置区县
  }

  // 处理区县选择
  const handleDistrictChange = (e) => {
    const selectedDistrict = districtList[e.detail.value]
    handleInputChange('district', selectedDistrict)
  }

  // 处理经验选择
  const handleExperienceChange = (e) => {
    const selectedExperience = experienceOptions[e.detail.value]
    handleInputChange('experience', selectedExperience)
  }

  // 处理学历选择
  const handleEducationChange = (e) => {
    const selectedEducation = educationOptions[e.detail.value]
    handleInputChange('education', selectedEducation)
  }

  // 添加技能标签
  const handleAddTag = () => {
    if (!tagInput.trim()) return
    
    if (formData.tags.length >= 5) {
      Taro.showToast({
        title: '最多添加5个技能标签',
        icon: 'none'
      })
      return
    }
    
    if (formData.tags.includes(tagInput.trim())) {
      Taro.showToast({
        title: '标签已存在',
        icon: 'none'
      })
      return
    }

    handleInputChange('tags', [...formData.tags, tagInput.trim()])
    setTagInput('')
  }

  // 删除技能标签
  const handleRemoveTag = (index) => {
    const newTags = formData.tags.filter((_, i) => i !== index)
    handleInputChange('tags', newTags)
  }

  // 表单验证
  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入职位名称'
    }

    if (!formData.company.trim()) {
      newErrors.company = '请输入公司名称'
    }

    if (!formData.location) {
      newErrors.location = '请选择工作地区'
    }

    if (!formData.salary.trim()) {
      newErrors.salary = '请输入薪资范围'
    }

    if (!formData.contact.trim()) {
      newErrors.contact = '请输入联系方式'
    } else if (!/^1[3-9]\d{9}$/.test(formData.contact)) {
      newErrors.contact = '请输入正确的手机号码'
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = '请输入联系人姓名'
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入职位描述'
    } else if (formData.description.length < 20) {
      newErrors.description = '职位描述至少20个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
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
        ...formData,
        location: fullLocation
      }

      const jobId = publishJob(jobData)
      
      Taro.showToast({
        title: '发布成功',
        icon: 'success'
      })
      
      // 延迟跳转
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
  }

  // 重置表单
  const handleReset = () => {
    Taro.showModal({
      title: '确认重置',
      content: '将清空所有已填写的内容',
      success: (res) => {
        if (res.confirm) {
          setFormData({
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
            tags: []
          })
          setErrors({})
          setTagInput('')
        }
      }
    })
  }

  return (
    <View className="publish">
      <View className="publish__header">
        <Text className="publish__title">发布职位</Text>
        <Text className="publish__subtitle">让更多优秀人才发现您的岗位</Text>
      </View>

      <View className="publish__form">
        {/* 基本信息 */}
        <View className="publish__section">
          <Text className="publish__section-title">基本信息</Text>
          
          <View className="publish__field">
            <Text className="publish__label">职位名称 *</Text>
            <Input
              className={`publish__input ${errors.title ? 'publish__input--error' : ''}`}
              placeholder="如：高级前端工程师"
              value={formData.title}
              onInput={(e) => handleInputChange('title', e.detail.value)}
            />
            {errors.title && <Text className="publish__error">{errors.title}</Text>}
          </View>

          <View className="publish__field">
            <Text className="publish__label">公司名称 *</Text>
            <Input
              className={`publish__input ${errors.company ? 'publish__input--error' : ''}`}
              placeholder="如：阿里巴巴集团"
              value={formData.company}
              onInput={(e) => handleInputChange('company', e.detail.value)}
            />
            {errors.company && <Text className="publish__error">{errors.company}</Text>}
          </View>

          <View className="publish__field">
            <Text className="publish__label">工作地区 *</Text>
            <View className="publish__picker-group">
              <Picker
                mode="selector"
                range={cityList}
                value={cityList.indexOf(formData.location)}
                onChange={handleCityChange}
              >
                <View className={`publish__picker ${errors.location ? 'publish__picker--error' : ''}`}>
                  <Text className={formData.location ? 'publish__picker-text' : 'publish__picker-placeholder'}>
                    {formData.location || '选择城市'}
                  </Text>
                  <Text className="publish__picker-arrow">▼</Text>
                </View>
              </Picker>
              
              {formData.location && districtList.length > 0 && (
                <Picker
                  mode="selector"
                  range={districtList}
                  value={districtList.indexOf(formData.district)}
                  onChange={handleDistrictChange}
                >
                  <View className="publish__picker">
                    <Text className={formData.district ? 'publish__picker-text' : 'publish__picker-placeholder'}>
                      {formData.district || '选择区县'}
                    </Text>
                    <Text className="publish__picker-arrow">▼</Text>
                  </View>
                </Picker>
              )}
            </View>
            {errors.location && <Text className="publish__error">{errors.location}</Text>}
          </View>

          <View className="publish__field">
            <Text className="publish__label">薪资范围 *</Text>
            <Input
              className={`publish__input ${errors.salary ? 'publish__input--error' : ''}`}
              placeholder="如：10-15K，面议"
              value={formData.salary}
              onInput={(e) => handleInputChange('salary', e.detail.value)}
            />
            {errors.salary && <Text className="publish__error">{errors.salary}</Text>}
          </View>
        </View>

        {/* 任职要求 */}
        <View className="publish__section">
          <Text className="publish__section-title">任职要求</Text>
          
          <View className="publish__field">
            <Text className="publish__label">工作经验</Text>
            <Picker
              mode="selector"
              range={experienceOptions}
              value={experienceOptions.indexOf(formData.experience)}
              onChange={handleExperienceChange}
            >
              <View className="publish__picker">
                <Text className={formData.experience ? 'publish__picker-text' : 'publish__picker-placeholder'}>
                  {formData.experience || '选择经验要求'}
                </Text>
                <Text className="publish__picker-arrow">▼</Text>
              </View>
            </Picker>
          </View>

          <View className="publish__field">
            <Text className="publish__label">学历要求</Text>
            <Picker
              mode="selector"
              range={educationOptions}
              value={educationOptions.indexOf(formData.education)}
              onChange={handleEducationChange}
            >
              <View className="publish__picker">
                <Text className={formData.education ? 'publish__picker-text' : 'publish__picker-placeholder'}>
                  {formData.education || '选择学历要求'}
                </Text>
                <Text className="publish__picker-arrow">▼</Text>
              </View>
            </Picker>
          </View>

          <View className="publish__field">
            <Text className="publish__label">技能标签</Text>
            <View className="publish__tag-input">
              <Input
                className="publish__input"
                placeholder="输入技能关键词，如：React"
                value={tagInput}
                onInput={(e) => setTagInput(e.detail.value)}
                onConfirm={handleAddTag}
              />
              <View className="publish__tag-add" onClick={handleAddTag}>
                <Text className="publish__tag-add-text">添加</Text>
              </View>
            </View>
            {formData.tags.length > 0 && (
              <View className="publish__tags">
                {formData.tags.map((tag, index) => (
                  <View key={index} className="publish__tag">
                    <Text className="publish__tag-text">{tag}</Text>
                    <Text 
                      className="publish__tag-close"
                      onClick={() => handleRemoveTag(index)}
                    >
                      ×
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 详细描述 */}
        <View className="publish__section">
          <Text className="publish__section-title">详细描述</Text>
          
          <View className="publish__field">
            <Text className="publish__label">职位描述 *</Text>
            <Textarea
              className={`publish__textarea ${errors.description ? 'publish__textarea--error' : ''}`}
              placeholder="详细描述工作内容、职责要求等..."
              value={formData.description}
              onInput={(e) => handleInputChange('description', e.detail.value)}
              maxlength={500}
              showConfirmBar={false}
            />
            <View className="publish__textarea-counter">
              <Text className="publish__counter-text">{formData.description.length}/500</Text>
            </View>
            {errors.description && <Text className="publish__error">{errors.description}</Text>}
          </View>

          <View className="publish__field">
            <Text className="publish__label">任职要求</Text>
            <Textarea
              className="publish__textarea"
              placeholder="详细描述任职要求..."
              value={formData.requirements}
              onInput={(e) => handleInputChange('requirements', e.detail.value)}
              maxlength={300}
              showConfirmBar={false}
            />
            <View className="publish__textarea-counter">
              <Text className="publish__counter-text">{formData.requirements.length}/300</Text>
            </View>
          </View>

          <View className="publish__field">
            <Text className="publish__label">福利待遇</Text>
            <Textarea
              className="publish__textarea"
              placeholder="描述公司福利、发展前景等..."
              value={formData.benefits}
              onInput={(e) => handleInputChange('benefits', e.detail.value)}
              maxlength={200}
              showConfirmBar={false}
            />
            <View className="publish__textarea-counter">
              <Text className="publish__counter-text">{formData.benefits.length}/200</Text>
            </View>
          </View>
        </View>

        {/* 联系信息 */}
        <View className="publish__section">
          <Text className="publish__section-title">联系信息</Text>
          
          <View className="publish__field">
            <Text className="publish__label">联系人 *</Text>
            <Input
              className={`publish__input ${errors.contactName ? 'publish__input--error' : ''}`}
              placeholder="如：张经理"
              value={formData.contactName}
              onInput={(e) => handleInputChange('contactName', e.detail.value)}
            />
            {errors.contactName && <Text className="publish__error">{errors.contactName}</Text>}
          </View>

          <View className="publish__field">
            <Text className="publish__label">联系电话 *</Text>
            <Input
              className={`publish__input ${errors.contact ? 'publish__input--error' : ''}`}
              placeholder="请输入手机号码"
              type="number"
              value={formData.contact}
              onInput={(e) => handleInputChange('contact', e.detail.value)}
            />
            {errors.contact && <Text className="publish__error">{errors.contact}</Text>}
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className="publish__actions">
        <View className="publish__btn publish__btn--secondary" onClick={handleReset}>
          <Text className="publish__btn-text">重置</Text>
        </View>
        <View 
          className={`publish__btn publish__btn--primary ${submitting ? 'publish__btn--disabled' : ''}`}
          onClick={handleSubmit}
        >
          <Text className="publish__btn-text">
            {submitting ? '发布中...' : '立即发布'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Publish 