/**
 * @fileoverview 空状态组件
 * @description 通用的空状态展示组件，用于显示无数据、无搜索结果等状态
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React, { memo, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import './EmptyState.less'

/**
 * 空状态组件
 * @param {Object} props - 组件属性
 * @param {string} props.type - 空状态类型，可选值：'no-data' | 'no-search' | 'no-network' | 'error'
 * @param {string} props.title - 主标题文本
 * @param {string} props.description - 描述文本
 * @param {string} props.icon - 自定义图标名称
 * @param {string} props.iconColor - 图标颜色
 * @param {React.ReactNode} props.action - 操作按钮或其他操作元素
 * @param {string} props.className - 自定义样式类名
 * @returns {React.ReactElement} 空状态组件
 */
const EmptyState = memo(({
  type = 'no-data',
  title,
  description,
  icon,
  iconColor,
  action,
  className = ''
}) => {
  /**
   * 获取默认配置
   * @returns {Object} 默认配置对象
   */
  const getDefaultConfig = () => {
    const configs = {
      'no-data': {
        icon: 'file-text',
        iconColor: '#c9cdd4',
        title: '暂无数据',
        description: '当前没有相关数据'
      },
      'no-search': {
        icon: 'search',
        iconColor: '#c9cdd4',
        title: '无搜索结果',
        description: '试试其他关键词或筛选条件'
      },
      'no-network': {
        icon: 'wifi',
        iconColor: '#f53f3f',
        title: '网络连接失败',
        description: '请检查网络连接后重试'
      },
      'error': {
        icon: 'close-circle',
        iconColor: '#f53f3f',
        title: '加载失败',
        description: '数据加载出现问题，请稍后重试'
      }
    }

    return configs[type] || configs['no-data']
  }

  const defaultConfig = useMemo(() => getDefaultConfig(), [type])
  const finalIcon = icon || defaultConfig.icon
  const finalIconColor = iconColor || defaultConfig.iconColor
  const finalTitle = title || defaultConfig.title
  const finalDescription = description || defaultConfig.description

  const containerClass = useMemo(() => [
    'empty-state',
    `empty-state--${type}`,
    className
  ].filter(Boolean).join(' '), [type, className])

  return (
    <View className={containerClass}>
      <View className="empty-state__content">
        {/* 图标 */}
        <View className="empty-state__icon">
          <AtIcon 
            value={finalIcon} 
            size="64" 
            color={finalIconColor}
          />
        </View>

        {/* 标题 */}
        <Text className="empty-state__title">{finalTitle}</Text>

        {/* 描述 */}
        {finalDescription && (
          <Text className="empty-state__description">{finalDescription}</Text>
        )}

        {/* 操作区域 */}
        {action && (
          <View className="empty-state__action">
            {action}
          </View>
        )}
      </View>
    </View>
  )
})

// 设置displayName以便调试
EmptyState.displayName = 'EmptyState'

export default EmptyState
