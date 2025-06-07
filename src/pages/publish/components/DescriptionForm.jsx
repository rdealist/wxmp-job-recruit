/**
 * @fileoverview 详细描述表单组件
 * @description 职位发布页面的详细描述表单，包括职位描述、任职要求、福利待遇等
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React from 'react'
import { View, Text, Textarea } from '@tarojs/components'
import { hasFieldError, getFieldError } from '../utils/formValidation'
import './DescriptionForm.less'

/**
 * 详细描述表单组件
 * @param {Object} props - 组件属性
 * @param {Object} props.formData - 表单数据
 * @param {Object} props.errors - 验证错误信息
 * @param {Function} props.onInputChange - 输入变化处理函数
 * @returns {React.ReactElement} 详细描述表单组件
 */
const DescriptionForm = ({
  formData,
  errors,
  onInputChange
}) => {
  /**
   * 处理文本域输入变化
   * @param {string} fieldName - 字段名称
   * @param {Object} e - 事件对象
   */
  const handleTextareaChange = (fieldName, e) => {
    onInputChange(fieldName, e.detail.value)
  }

  /**
   * 获取字符计数显示
   * @param {string} text - 文本内容
   * @param {number} maxLength - 最大长度
   * @returns {string} 计数显示文本
   */
  const getCharCount = (text, maxLength) => {
    const currentLength = text ? text.length : 0
    return `${currentLength}/${maxLength}`
  }

  /**
   * 检查字符数是否接近限制
   * @param {string} text - 文本内容
   * @param {number} maxLength - 最大长度
   * @returns {boolean} 是否接近限制
   */
  const isNearLimit = (text, maxLength) => {
    const currentLength = text ? text.length : 0
    return currentLength / maxLength > 0.8
  }

  return (
    <View className="description-form">
      {/* 表单标题 */}
      <View className="description-form__header">
        <Text className="description-form__title">详细描述</Text>
        <Text className="description-form__subtitle">详细描述职位信息，吸引优秀候选人</Text>
      </View>

      {/* 职位描述 */}
      <View className="description-form__field">
        <Text className="description-form__label">
          职位描述 <Text className="description-form__required">*</Text>
        </Text>
        <Text className="description-form__hint">
          详细描述工作内容、职责要求、工作环境等信息
        </Text>
        <Textarea
          className={`description-form__textarea ${hasFieldError('description', errors) ? 'description-form__textarea--error' : ''}`}
          placeholder="请详细描述：&#10;1. 主要工作内容和职责&#10;2. 具体技能要求&#10;3. 工作环境和团队情况&#10;4. 发展机会和挑战..."
          value={formData.description}
          onInput={(e) => handleTextareaChange('description', e)}
          maxlength={500}
          showConfirmBar={false}
          autoHeight
        />
        <View className="description-form__textarea-footer">
          <View className="description-form__textarea-counter">
            <Text className={`description-form__counter-text ${
              isNearLimit(formData.description, 500) ? 'description-form__counter-text--warning' : ''
            }`}>
              {getCharCount(formData.description, 500)}
            </Text>
          </View>
        </View>
        {hasFieldError('description', errors) && (
          <Text className="description-form__error">{getFieldError('description', errors)}</Text>
        )}
      </View>

      {/* 任职要求 */}
      <View className="description-form__field">
        <Text className="description-form__label">任职要求</Text>
        <Text className="description-form__hint">
          描述候选人需要具备的专业技能、工作经验等要求
        </Text>
        <Textarea
          className="description-form__textarea"
          placeholder="请详细描述：&#10;1. 专业技能要求&#10;2. 工作经验要求&#10;3. 教育背景要求&#10;4. 个人素质要求..."
          value={formData.requirements}
          onInput={(e) => handleTextareaChange('requirements', e)}
          maxlength={300}
          showConfirmBar={false}
          autoHeight
        />
        <View className="description-form__textarea-footer">
          <View className="description-form__textarea-counter">
            <Text className={`description-form__counter-text ${
              isNearLimit(formData.requirements, 300) ? 'description-form__counter-text--warning' : ''
            }`}>
              {getCharCount(formData.requirements, 300)}
            </Text>
          </View>
        </View>
        {hasFieldError('requirements', errors) && (
          <Text className="description-form__error">{getFieldError('requirements', errors)}</Text>
        )}
      </View>

      {/* 福利待遇 */}
      <View className="description-form__field">
        <Text className="description-form__label">福利待遇</Text>
        <Text className="description-form__hint">
          描述公司提供的福利待遇、发展机会等吸引人的条件
        </Text>
        <Textarea
          className="description-form__textarea"
          placeholder="请详细描述：&#10;1. 薪资福利（五险一金、年终奖等）&#10;2. 假期制度（带薪年假、弹性工作等）&#10;3. 发展机会（培训、晋升等）&#10;4. 其他福利（餐补、交通、团建等）..."
          value={formData.benefits}
          onInput={(e) => handleTextareaChange('benefits', e)}
          maxlength={200}
          showConfirmBar={false}
          autoHeight
        />
        <View className="description-form__textarea-footer">
          <View className="description-form__textarea-counter">
            <Text className={`description-form__counter-text ${
              isNearLimit(formData.benefits, 200) ? 'description-form__counter-text--warning' : ''
            }`}>
              {getCharCount(formData.benefits, 200)}
            </Text>
          </View>
        </View>
        {hasFieldError('benefits', errors) && (
          <Text className="description-form__error">{getFieldError('benefits', errors)}</Text>
        )}
      </View>

      {/* 写作建议 */}
      <View className="description-form__tips">
        <Text className="description-form__tip-title">💡 写作建议</Text>
        <View className="description-form__tip-list">
          <Text className="description-form__tip-item">• 使用具体的数字和案例，让描述更有说服力</Text>
          <Text className="description-form__tip-item">• 突出职位的亮点和发展机会</Text>
          <Text className="description-form__tip-item">• 保持语言简洁明了，避免过于复杂的表述</Text>
          <Text className="description-form__tip-item">• 展现公司文化和团队氛围</Text>
        </View>
      </View>
    </View>
  )
}

export default DescriptionForm
