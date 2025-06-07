/**
 * @fileoverview 基本信息表单组件
 * @description 职位发布页面的基本信息表单，包括职位名称、公司、地区、薪资等字段
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import { salaryRangeOptions } from '../constants/formOptions'
import { hasFieldError, getFieldError } from '../utils/formValidation'
import './BasicInfoForm.less'

/**
 * 基本信息表单组件
 * @param {Object} props - 组件属性
 * @param {Object} props.formData - 表单数据
 * @param {Object} props.errors - 验证错误信息
 * @param {Function} props.onInputChange - 输入变化处理函数
 * @param {Function} props.onPickerChange - 选择器变化处理函数
 * @param {Object} props.locations - 地区数据
 * @returns {React.ReactElement} 基本信息表单组件
 */
const BasicInfoForm = ({
  formData,
  errors,
  onInputChange,
  onPickerChange,
  locations
}) => {
  // 获取城市列表
  const cityList = Object.keys(locations)
  
  // 获取当前城市的区县列表
  const districtList = formData.location ? locations[formData.location] || [] : []

  /**
   * 处理城市选择变化
   * @param {Object} e - 事件对象
   */
  const handleCityChange = (e) => {
    const selectedIndex = e.detail.value
    const selectedCity = cityList[selectedIndex]
    
    onPickerChange('location', selectedCity)
    // 清空区县选择
    if (formData.district) {
      onPickerChange('district', '')
    }
  }

  /**
   * 处理区县选择变化
   * @param {Object} e - 事件对象
   */
  const handleDistrictChange = (e) => {
    const selectedIndex = e.detail.value
    const selectedDistrict = districtList[selectedIndex]
    
    onPickerChange('district', selectedDistrict)
  }

  /**
   * 处理薪资快速选择
   * @param {Object} e - 事件对象
   */
  const handleSalaryQuickSelect = (e) => {
    const selectedIndex = e.detail.value
    const selectedSalary = salaryRangeOptions[selectedIndex]
    
    onInputChange('salary', selectedSalary)
  }

  return (
    <View className="basic-info-form">
      {/* 表单标题 */}
      <View className="basic-info-form__header">
        <Text className="basic-info-form__title">基本信息</Text>
        <Text className="basic-info-form__subtitle">请填写职位的基本信息</Text>
      </View>

      {/* 职位名称 */}
      <View className="basic-info-form__field">
        <Text className="basic-info-form__label">
          职位名称 <Text className="basic-info-form__required">*</Text>
        </Text>
        <Input
          className={`basic-info-form__input ${hasFieldError('title', errors) ? 'basic-info-form__input--error' : ''}`}
          placeholder="如：高级前端工程师"
          value={formData.title}
          onInput={(e) => onInputChange('title', e.detail.value)}
          maxlength={50}
        />
        {hasFieldError('title', errors) && (
          <Text className="basic-info-form__error">{getFieldError('title', errors)}</Text>
        )}
      </View>

      {/* 公司名称 */}
      <View className="basic-info-form__field">
        <Text className="basic-info-form__label">
          公司名称 <Text className="basic-info-form__required">*</Text>
        </Text>
        <Input
          className={`basic-info-form__input ${hasFieldError('company', errors) ? 'basic-info-form__input--error' : ''}`}
          placeholder="如：阿里巴巴集团"
          value={formData.company}
          onInput={(e) => onInputChange('company', e.detail.value)}
          maxlength={100}
        />
        {hasFieldError('company', errors) && (
          <Text className="basic-info-form__error">{getFieldError('company', errors)}</Text>
        )}
      </View>

      {/* 工作地区 */}
      <View className="basic-info-form__field">
        <Text className="basic-info-form__label">
          工作地区 <Text className="basic-info-form__required">*</Text>
        </Text>
        <View className="basic-info-form__picker-group">
          {/* 城市选择 */}
          <Picker
            mode="selector"
            range={cityList}
            value={cityList.indexOf(formData.location)}
            onChange={handleCityChange}
          >
            <View className={`basic-info-form__picker ${hasFieldError('location', errors) ? 'basic-info-form__picker--error' : ''}`}>
              <Text className={formData.location ? 'basic-info-form__picker-text' : 'basic-info-form__picker-placeholder'}>
                {formData.location || '选择城市'}
              </Text>
              <Text className="basic-info-form__picker-arrow">▼</Text>
            </View>
          </Picker>
          
          {/* 区县选择 */}
          {formData.location && districtList.length > 0 && (
            <Picker
              mode="selector"
              range={districtList}
              value={districtList.indexOf(formData.district)}
              onChange={handleDistrictChange}
            >
              <View className="basic-info-form__picker">
                <Text className={formData.district ? 'basic-info-form__picker-text' : 'basic-info-form__picker-placeholder'}>
                  {formData.district || '选择区县'}
                </Text>
                <Text className="basic-info-form__picker-arrow">▼</Text>
              </View>
            </Picker>
          )}
        </View>
        {hasFieldError('location', errors) && (
          <Text className="basic-info-form__error">{getFieldError('location', errors)}</Text>
        )}
      </View>

      {/* 薪资范围 */}
      <View className="basic-info-form__field">
        <Text className="basic-info-form__label">
          薪资范围 <Text className="basic-info-form__required">*</Text>
        </Text>
        
        {/* 薪资输入框 */}
        <Input
          className={`basic-info-form__input ${hasFieldError('salary', errors) ? 'basic-info-form__input--error' : ''}`}
          placeholder="如：10-15K，面议"
          value={formData.salary}
          onInput={(e) => onInputChange('salary', e.detail.value)}
          maxlength={20}
        />
        
        {/* 快速选择薪资 */}
        <View className="basic-info-form__quick-select">
          <Text className="basic-info-form__quick-label">快速选择：</Text>
          <Picker
            mode="selector"
            range={salaryRangeOptions}
            onChange={handleSalaryQuickSelect}
          >
            <View className="basic-info-form__quick-btn">
              <Text className="basic-info-form__quick-text">选择薪资范围</Text>
            </View>
          </Picker>
        </View>
        
        {hasFieldError('salary', errors) && (
          <Text className="basic-info-form__error">{getFieldError('salary', errors)}</Text>
        )}
      </View>

      {/* 表单提示 */}
      <View className="basic-info-form__tips">
        <Text className="basic-info-form__tip-text">
          💡 提示：准确的基本信息有助于吸引合适的候选人
        </Text>
      </View>
    </View>
  )
}

export default BasicInfoForm
