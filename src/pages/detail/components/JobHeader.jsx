/**
 * @fileoverview 职位头部信息组件
 * @description 显示职位的基本信息，包括标题、薪资、公司、地点等
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React from 'react'
import { View, Text } from '@tarojs/components'
import { formatTime, getJobStatusTags } from '../utils/detailUtils'
import './JobHeader.less'

/**
 * 职位头部信息组件
 * @param {Object} props - 组件属性
 * @param {Object} props.job - 职位数据对象
 * @returns {React.ReactElement} 职位头部组件
 */
const JobHeader = ({ job }) => {
  if (!job) {
    return (
      <View className="job-header">
        <View className="job-header__loading">
          <Text className="job-header__loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  // 获取职位状态标签
  const statusTags = getJobStatusTags(job)

  return (
    <View className="job-header">
      {/* 职位标题和薪资 */}
      <View className="job-header__main">
        <Text className="job-header__title">{job.title}</Text>
        <Text className="job-header__salary">{job.salary}</Text>
      </View>

      {/* 状态标签 */}
      {statusTags.length > 0 && (
        <View className="job-header__tags">
          {statusTags.map((tag, index) => (
            <View 
              key={index} 
              className={`job-header__tag job-header__tag--${tag.type}`}
              style={{ borderColor: tag.color, color: tag.color }}
            >
              <Text className="job-header__tag-text">{tag.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 公司和地点信息 */}
      <View className="job-header__meta">
        <View className="job-header__meta-item">
          <Text className="job-header__company">{job.company}</Text>
        </View>
        <View className="job-header__meta-item">
          <Text className="job-header__location">{job.location}</Text>
        </View>
        <View className="job-header__meta-item">
          <Text className="job-header__time">{formatTime(job.publishTime)}</Text>
        </View>
      </View>

      {/* 工作要求信息 */}
      <View className="job-header__requirements">
        {job.experience && (
          <View className="job-header__requirement-item">
            <Text className="job-header__requirement-label">经验：</Text>
            <Text className="job-header__requirement-value">{job.experience}</Text>
          </View>
        )}
        {job.education && (
          <View className="job-header__requirement-item">
            <Text className="job-header__requirement-label">学历：</Text>
            <Text className="job-header__requirement-value">{job.education}</Text>
          </View>
        )}
      </View>

      {/* 技能标签 */}
      {job.tags && job.tags.length > 0 && (
        <View className="job-header__skills">
          <Text className="job-header__skills-title">技能要求</Text>
          <View className="job-header__skills-list">
            {job.tags.map((tag, index) => (
              <View key={index} className="job-header__skill-tag">
                <Text className="job-header__skill-text">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

export default JobHeader
