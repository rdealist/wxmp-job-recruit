/**
 * @fileoverview 加载组件
 * @description 通用的加载状态组件，支持多种样式和自定义文本
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React from 'react'
import { View, Text } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import './LoadingSpinner.less'

/**
 * 加载组件
 * @param {Object} props - 组件属性
 * @param {string} props.text - 加载文本，默认为"加载中..."
 * @param {string} props.size - 尺寸大小，可选值：'small' | 'medium' | 'large'
 * @param {string} props.type - 加载样式类型，可选值：'spinner' | 'dots' | 'pulse'
 * @param {boolean} props.overlay - 是否显示遮罩层
 * @param {string} props.className - 自定义样式类名
 * @returns {React.ReactElement} 加载组件
 */
const LoadingSpinner = ({
  text = '加载中...',
  size = 'medium',
  type = 'spinner',
  overlay = false,
  className = ''
}) => {
  /**
   * 渲染加载图标
   * @returns {React.ReactElement} 加载图标组件
   */
  const renderLoadingIcon = () => {
    const iconSize = {
      small: 16,
      medium: 24,
      large: 32
    }[size]

    switch (type) {
      case 'dots':
        return (
          <View className={`loading-spinner__dots loading-spinner__dots--${size}`}>
            <View className="loading-spinner__dot"></View>
            <View className="loading-spinner__dot"></View>
            <View className="loading-spinner__dot"></View>
          </View>
        )
      
      case 'pulse':
        return (
          <View className={`loading-spinner__pulse loading-spinner__pulse--${size}`}>
            <View className="loading-spinner__pulse-circle"></View>
          </View>
        )
      
      case 'spinner':
      default:
        return (
          <AtIcon 
            value="loading-3" 
            size={iconSize} 
            color="#6697f5" 
            className="loading-spinner__icon"
          />
        )
    }
  }

  const containerClass = [
    'loading-spinner',
    `loading-spinner--${size}`,
    `loading-spinner--${type}`,
    overlay ? 'loading-spinner--overlay' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <View className={containerClass}>
      <View className="loading-spinner__content">
        {renderLoadingIcon()}
        {text && (
          <Text className="loading-spinner__text">{text}</Text>
        )}
      </View>
    </View>
  )
}

export default LoadingSpinner
