/**
 * @fileoverview 任职要求表单组件
 * @description 职位发布页面的任职要求表单，包括工作经验、学历要求、技能标签等
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React, { useState } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import { experienceOptions, educationOptions, commonSkillTags } from '../constants/formOptions'
import { hasFieldError, getFieldError } from '../utils/formValidation'
import './RequirementsForm.less'

/**
 * 任职要求表单组件
 * @param {Object} props - 组件属性
 * @param {Object} props.formData - 表单数据
 * @param {Object} props.errors - 验证错误信息
 * @param {Function} props.onInputChange - 输入变化处理函数
 * @param {Function} props.onPickerChange - 选择器变化处理函数
 * @param {Function} props.onTagsChange - 标签变化处理函数
 * @returns {React.ReactElement} 任职要求表单组件
 */
const RequirementsForm = ({
  formData,
  errors,
  onInputChange,
  onPickerChange,
  onTagsChange
}) => {
  const [tagInput, setTagInput] = useState('')
  const [showSkillCategories, setShowSkillCategories] = useState(false)

  /**
   * 处理工作经验选择变化
   * @param {Object} e - 事件对象
   */
  const handleExperienceChange = (e) => {
    const selectedIndex = e.detail.value
    const selectedExperience = experienceOptions[selectedIndex]
    onPickerChange('experience', selectedExperience)
  }

  /**
   * 处理学历要求选择变化
   * @param {Object} e - 事件对象
   */
  const handleEducationChange = (e) => {
    const selectedIndex = e.detail.value
    const selectedEducation = educationOptions[selectedIndex]
    onPickerChange('education', selectedEducation)
  }

  /**
   * 添加技能标签
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag) return

    // 检查是否已存在
    if (formData.tags.includes(trimmedTag)) {
      setTagInput('')
      return
    }

    // 检查标签数量限制
    if (formData.tags.length >= 10) {
      return
    }

    const newTags = [...formData.tags, trimmedTag]
    onTagsChange(newTags)
    setTagInput('')
  }

  /**
   * 移除技能标签
   * @param {number} index - 要移除的标签索引
   */
  const handleRemoveTag = (index) => {
    const newTags = formData.tags.filter((_, i) => i !== index)
    onTagsChange(newTags)
  }

  /**
   * 从预设标签中添加
   * @param {string} tag - 要添加的标签
   */
  const handleAddPresetTag = (tag) => {
    if (formData.tags.includes(tag) || formData.tags.length >= 10) {
      return
    }

    const newTags = [...formData.tags, tag]
    onTagsChange(newTags)
  }

  /**
   * 切换技能分类显示
   */
  const toggleSkillCategories = () => {
    setShowSkillCategories(!showSkillCategories)
  }

  return (
    <View className="requirements-form">
      {/* 表单标题 */}
      <View className="requirements-form__header">
        <Text className="requirements-form__title">任职要求</Text>
        <Text className="requirements-form__subtitle">设置职位的具体要求</Text>
      </View>

      {/* 工作经验 */}
      <View className="requirements-form__field">
        <Text className="requirements-form__label">工作经验</Text>
        <Picker
          mode="selector"
          range={experienceOptions}
          value={experienceOptions.indexOf(formData.experience)}
          onChange={handleExperienceChange}
        >
          <View className="requirements-form__picker">
            <Text className={formData.experience ? 'requirements-form__picker-text' : 'requirements-form__picker-placeholder'}>
              {formData.experience || '选择经验要求'}
            </Text>
            <Text className="requirements-form__picker-arrow">▼</Text>
          </View>
        </Picker>
      </View>

      {/* 学历要求 */}
      <View className="requirements-form__field">
        <Text className="requirements-form__label">学历要求</Text>
        <Picker
          mode="selector"
          range={educationOptions}
          value={educationOptions.indexOf(formData.education)}
          onChange={handleEducationChange}
        >
          <View className="requirements-form__picker">
            <Text className={formData.education ? 'requirements-form__picker-text' : 'requirements-form__picker-placeholder'}>
              {formData.education || '选择学历要求'}
            </Text>
            <Text className="requirements-form__picker-arrow">▼</Text>
          </View>
        </Picker>
      </View>

      {/* 技能标签 */}
      <View className="requirements-form__field">
        <Text className="requirements-form__label">
          技能标签
          <Text className="requirements-form__label-tip">（最多10个）</Text>
        </Text>
        
        {/* 标签输入 */}
        <View className="requirements-form__tag-input">
          <Input
            className="requirements-form__input"
            placeholder="输入技能关键词，如：React"
            value={tagInput}
            onInput={(e) => setTagInput(e.detail.value)}
            onConfirm={handleAddTag}
            maxlength={20}
          />
          <View 
            className={`requirements-form__add-btn ${!tagInput.trim() ? 'requirements-form__add-btn--disabled' : ''}`}
            onClick={handleAddTag}
          >
            <Text className="requirements-form__add-text">添加</Text>
          </View>
        </View>

        {/* 已添加的标签 */}
        {formData.tags.length > 0 && (
          <View className="requirements-form__tags">
            {formData.tags.map((tag, index) => (
              <View key={index} className="requirements-form__tag">
                <Text className="requirements-form__tag-text">{tag}</Text>
                <View
                  className="requirements-form__tag-close"
                  onClick={() => handleRemoveTag(index)}
                >
                  <AtIcon value="close" size="12" color="#6697f5" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 快速选择技能 */}
        <View className="requirements-form__quick-skills">
          <View className="requirements-form__quick-header" onClick={toggleSkillCategories}>
            <Text className="requirements-form__quick-title">快速选择常用技能</Text>
            <AtIcon 
              value={showSkillCategories ? "chevron-up" : "chevron-down"} 
              size="16" 
              color="#6697f5" 
            />
          </View>
          
          {showSkillCategories && (
            <View className="requirements-form__skill-categories">
              {commonSkillTags.map((category, categoryIndex) => (
                <View key={categoryIndex} className="requirements-form__skill-category">
                  <Text className="requirements-form__category-title">{category.category}</Text>
                  <View className="requirements-form__category-tags">
                    {category.tags.map((tag, tagIndex) => (
                      <View
                        key={tagIndex}
                        className={`requirements-form__preset-tag ${
                          formData.tags.includes(tag) ? 'requirements-form__preset-tag--selected' : ''
                        }`}
                        onClick={() => handleAddPresetTag(tag)}
                      >
                        <Text className="requirements-form__preset-tag-text">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {hasFieldError('tags', errors) && (
          <Text className="requirements-form__error">{getFieldError('tags', errors)}</Text>
        )}
      </View>

      {/* 表单提示 */}
      <View className="requirements-form__tips">
        <Text className="requirements-form__tip-text">
          💡 提示：明确的任职要求有助于筛选合适的候选人，提高招聘效率
        </Text>
      </View>
    </View>
  )
}

export default RequirementsForm
