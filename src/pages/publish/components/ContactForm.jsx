/**
 * @fileoverview 联系信息表单组件
 * @description 职位发布页面的联系信息表单，包括联系人和联系电话
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React, { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import Taro from '@tarojs/taro'
import { hasFieldError, getFieldError, customValidators } from '../utils/formValidation'
import './ContactForm.less'

/**
 * 联系信息表单组件
 * @param {Object} props - 组件属性
 * @param {Object} props.formData - 表单数据
 * @param {Object} props.errors - 验证错误信息
 * @param {Function} props.onInputChange - 输入变化处理函数
 * @returns {React.ReactElement} 联系信息表单组件
 */
const ContactForm = ({
  formData,
  errors,
  onInputChange
}) => {
  const [showPhonePreview, setShowPhonePreview] = useState(false)

  /**
   * 处理联系人输入变化
   * @param {Object} e - 事件对象
   */
  const handleContactNameChange = (e) => {
    const value = e.detail.value
    // 过滤特殊字符，只保留中文、英文、数字和常见符号
    const filteredValue = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\-\.]/g, '')
    onInputChange('contactName', filteredValue)
  }

  /**
   * 处理电话号码输入变化
   * @param {Object} e - 事件对象
   */
  const handleContactChange = (e) => {
    const value = e.detail.value
    // 只保留数字
    const numbersOnly = value.replace(/\D/g, '')
    // 限制长度为11位
    const limitedValue = numbersOnly.slice(0, 11)
    onInputChange('contact', limitedValue)
  }

  /**
   * 格式化电话号码显示
   * @param {string} phone - 电话号码
   * @returns {string} 格式化后的电话号码
   */
  const formatPhoneDisplay = (phone) => {
    if (!phone) return ''
    if (phone.length <= 3) return phone
    if (phone.length <= 7) return `${phone.slice(0, 3)} ${phone.slice(3)}`
    return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`
  }

  /**
   * 验证电话号码格式
   * @param {string} phone - 电话号码
   * @returns {boolean} 是否有效
   */
  const isValidPhone = (phone) => {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  /**
   * 切换电话预览显示
   */
  const togglePhonePreview = () => {
    setShowPhonePreview(!showPhonePreview)
  }

  /**
   * 获取电话号码输入提示
   * @returns {string} 提示文本
   */
  const getPhoneInputHint = () => {
    const phone = formData.contact
    if (!phone) return '请输入11位手机号码'
    if (phone.length < 11) return `还需输入${11 - phone.length}位数字`
    if (!isValidPhone(phone)) return '手机号码格式不正确'
    return '手机号码格式正确'
  }

  /**
   * 获取电话号码输入状态
   * @returns {string} 状态类型：'default' | 'success' | 'error'
   */
  const getPhoneInputStatus = () => {
    const phone = formData.contact
    if (!phone) return 'default'
    if (phone.length === 11 && isValidPhone(phone)) return 'success'
    if (phone.length > 0) return 'error'
    return 'default'
  }

  return (
    <View className="contact-form">
      {/* 表单标题 */}
      <View className="contact-form__header">
        <Text className="contact-form__title">联系信息</Text>
        <Text className="contact-form__subtitle">提供准确的联系方式，方便候选人与您沟通</Text>
      </View>

      {/* 联系人 */}
      <View className="contact-form__field">
        <Text className="contact-form__label">
          联系人 <Text className="contact-form__required">*</Text>
        </Text>
        <Text className="contact-form__hint">
          请输入真实姓名或职位，如：张经理、HR小王
        </Text>
        <Input
          className={`contact-form__input ${hasFieldError('contactName', errors) ? 'contact-form__input--error' : ''}`}
          placeholder="如：张经理"
          value={formData.contactName}
          onInput={handleContactNameChange}
          maxlength={20}
        />
        {hasFieldError('contactName', errors) && (
          <Text className="contact-form__error">{getFieldError('contactName', errors)}</Text>
        )}
      </View>

      {/* 联系电话 */}
      <View className="contact-form__field">
        <Text className="contact-form__label">
          联系电话 <Text className="contact-form__required">*</Text>
        </Text>
        <Text className="contact-form__hint">
          请输入真实有效的手机号码，候选人将通过此号码联系您
        </Text>
        
        {/* 电话输入框 */}
        <View className="contact-form__phone-input">
          <Input
            className={`contact-form__input contact-form__input--phone contact-form__input--${getPhoneInputStatus()} ${
              hasFieldError('contact', errors) ? 'contact-form__input--error' : ''
            }`}
            placeholder="请输入手机号码"
            type="number"
            value={formData.contact}
            onInput={handleContactChange}
            maxlength={11}
          />
          
          {/* 输入状态图标 */}
          <View className="contact-form__phone-status">
            {getPhoneInputStatus() === 'success' && (
              <AtIcon value="check-circle" size="20" color="#00b42a" />
            )}
            {getPhoneInputStatus() === 'error' && (
              <AtIcon value="close-circle" size="20" color="#f53f3f" />
            )}
          </View>
        </View>

        {/* 电话格式化显示 */}
        {formData.contact && (
          <View className="contact-form__phone-preview">
            <Text className="contact-form__preview-label">格式化显示：</Text>
            <Text className="contact-form__preview-text">
              {formatPhoneDisplay(formData.contact)}
            </Text>
          </View>
        )}

        {/* 输入提示 */}
        <View className="contact-form__phone-hint">
          <Text className={`contact-form__hint-text contact-form__hint-text--${getPhoneInputStatus()}`}>
            {getPhoneInputHint()}
          </Text>
        </View>

        {hasFieldError('contact', errors) && (
          <Text className="contact-form__error">{getFieldError('contact', errors)}</Text>
        )}
      </View>

      {/* 隐私说明 */}
      <View className="contact-form__privacy">
        <View className="contact-form__privacy-header">
          <AtIcon value="lock" size="16" color="#6697f5" />
          <Text className="contact-form__privacy-title">隐私保护</Text>
        </View>
        <View className="contact-form__privacy-content">
          <Text className="contact-form__privacy-text">
            • 您的联系方式仅对感兴趣的候选人可见
          </Text>
          <Text className="contact-form__privacy-text">
            • 我们承诺不会将您的信息用于其他用途
          </Text>
          <Text className="contact-form__privacy-text">
            • 您可以随时修改或删除发布的职位信息
          </Text>
        </View>
      </View>

      {/* 联系建议 */}
      <View className="contact-form__tips">
        <Text className="contact-form__tip-title">📞 联系建议</Text>
        <View className="contact-form__tip-list">
          <Text className="contact-form__tip-item">• 保持电话畅通，及时回复候选人咨询</Text>
          <Text className="contact-form__tip-item">• 建议设置专门的招聘联系时间</Text>
          <Text className="contact-form__tip-item">• 可以准备简单的电话面试问题</Text>
          <Text className="contact-form__tip-item">• 礼貌专业的沟通有助于提升公司形象</Text>
        </View>
      </View>
    </View>
  )
}

export default ContactForm
