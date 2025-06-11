/**
 * @fileoverview 职位描述组件
 * @description 显示职位的详细描述信息
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React, { useState, memo, useCallback, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import './JobDescription.less'

/**
 * 职位描述组件
 * @param {Object} props - 组件属性
 * @param {Object} props.job - 职位数据对象
 * @returns {React.ReactElement} 职位描述组件
 */
const JobDescription = memo(({ job }) => {
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    requirements: false,
    benefits: false
  })

  if (!job) {
    return (
      <View className="job-description">
        <View className="job-description__loading">
          <Text className="job-description__loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  /**
   * 切换展开/收起状态
   * @param {string} section - 要切换的部分
   */
  const toggleExpanded = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  /**
   * 判断文本是否需要展开功能
   * @param {string} text - 文本内容
   * @param {number} maxLength - 最大显示长度
   * @returns {boolean} 是否需要展开功能
   */
  const needsExpansion = useCallback((text, maxLength = 100) => {
    return text && text.length > maxLength
  }, [])

  /**
   * 获取显示的文本内容
   * @param {string} text - 原始文本
   * @param {boolean} isExpanded - 是否已展开
   * @param {number} maxLength - 最大显示长度
   * @returns {string} 处理后的文本
   */
  const getDisplayText = useCallback((text, isExpanded, maxLength = 100) => {
    if (!text) return ''
    if (isExpanded || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }, [])

  return (
    <View className="job-description">
      {/* 职位描述 */}
      {job.description && (
        <View className="job-description__section">
          <Text className="job-description__title">职位描述</Text>
          <View className="job-description__content">
            <Text className="job-description__text">
              {getDisplayText(job.description, expandedSections.description)}
            </Text>
            {needsExpansion(job.description) && (
              <View 
                className="job-description__expand-btn"
                onClick={() => toggleExpanded('description')}
              >
                <Text className="job-description__expand-text">
                  {expandedSections.description ? '收起' : '展开'}
                </Text>
                <AtIcon 
                  value={expandedSections.description ? 'chevron-up' : 'chevron-down'} 
                  size="14" 
                  color="#6697f5" 
                />
              </View>
            )}
          </View>
        </View>
      )}

      {/* 任职要求 */}
      {job.requirements && (
        <View className="job-description__section">
          <Text className="job-description__title">任职要求</Text>
          <View className="job-description__content">
            <Text className="job-description__text">
              {getDisplayText(job.requirements, expandedSections.requirements)}
            </Text>
            {needsExpansion(job.requirements) && (
              <View 
                className="job-description__expand-btn"
                onClick={() => toggleExpanded('requirements')}
              >
                <Text className="job-description__expand-text">
                  {expandedSections.requirements ? '收起' : '展开'}
                </Text>
                <AtIcon 
                  value={expandedSections.requirements ? 'chevron-up' : 'chevron-down'} 
                  size="14" 
                  color="#6697f5" 
                />
              </View>
            )}
          </View>
        </View>
      )}

      {/* 福利待遇 */}
      {job.benefits && (
        <View className="job-description__section">
          <Text className="job-description__title">福利待遇</Text>
          <View className="job-description__content">
            <Text className="job-description__text">
              {getDisplayText(job.benefits, expandedSections.benefits)}
            </Text>
            {needsExpansion(job.benefits) && (
              <View 
                className="job-description__expand-btn"
                onClick={() => toggleExpanded('benefits')}
              >
                <Text className="job-description__expand-text">
                  {expandedSections.benefits ? '收起' : '展开'}
                </Text>
                <AtIcon 
                  value={expandedSections.benefits ? 'chevron-up' : 'chevron-down'} 
                  size="14" 
                  color="#6697f5" 
                />
              </View>
            )}
          </View>
        </View>
      )}

      {/* 如果没有任何描述信息 */}
      {!job.description && !job.requirements && !job.benefits && (
        <View className="job-description__empty">
          <AtIcon value="file-text" size="48" color="#c9cdd4" />
          <Text className="job-description__empty-text">暂无详细描述</Text>
        </View>
      )}
    </View>
  )
})

// 设置displayName以便调试
JobDescription.displayName = 'JobDescription'

export default JobDescription
