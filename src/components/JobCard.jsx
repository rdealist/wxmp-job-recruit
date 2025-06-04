import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import useJobStore from '../stores/jobStore'
import './JobCard.less'

const JobCard = ({ job, showLockStatus = true }) => {
  const { isDateUnlocked } = useJobStore()
  const isUnlocked = isDateUnlocked(job.publishDate)
  const isToday = job.publishDate === new Date().toDateString()

  // 格式化时间显示
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days === 2) return '前天'
    return `${days}天前`
  }

  // 脱敏处理联系方式
  const maskContact = (contact) => {
    if (!contact) return ''
    if (contact.length === 11) {
      return contact.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }
    return contact
  }

  // 点击卡片跳转详情
  const handleCardClick = () => {
    if (!isUnlocked && !isToday && showLockStatus) {
      Taro.showModal({
        title: '内容已锁定',
        content: '历史内容需要分享后解锁查看',
        confirmText: '去分享',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({
              url: `/pages/detail/index?id=${job.id}`
            })
          }
        }
      })
    } else {
      Taro.navigateTo({
        url: `/pages/detail/index?id=${job.id}`
      })
    }
  }

  return (
    <View className="job-card" onClick={handleCardClick}>
      {/* 锁定状态遮罩 */}
      {!isUnlocked && !isToday && showLockStatus && (
        <View className="job-card__lock-mask">
          <View className="job-card__lock-icon">🔒</View>
          <Text className="job-card__lock-text">分享解锁</Text>
        </View>
      )}
      
      {/* 卡片头部 */}
      <View className="job-card__header">
        <View className="job-card__title-section">
          <Text className="job-card__title">{job.title}</Text>
          <Text className="job-card__salary">{job.salary}</Text>
        </View>
        <View className="job-card__time">
          <Text className="job-card__time-text">{formatTime(job.publishTime)}</Text>
        </View>
      </View>

      {/* 公司信息 */}
      <View className="job-card__company">
        <Text className="job-card__company-name">{job.company}</Text>
        <Text className="job-card__location">{job.location}</Text>
      </View>

      {/* 职位要求 */}
      <View className="job-card__requirements">
        <Text className="job-card__experience">{job.experience}</Text>
        <Text className="job-card__education">{job.education}</Text>
      </View>

      {/* 技能标签 */}
      <View className="job-card__tags">
        {job.tags && job.tags.slice(0, 3).map((tag, index) => (
          <View key={index} className="job-card__tag">
            <Text className="job-card__tag-text">{tag}</Text>
          </View>
        ))}
        {job.tags && job.tags.length > 3 && (
          <View className="job-card__tag job-card__tag--more">
            <Text className="job-card__tag-text">+{job.tags.length - 3}</Text>
          </View>
        )}
      </View>

      {/* 联系信息（根据解锁状态显示） */}
      {(isUnlocked || isToday) && (
        <View className="job-card__contact">
          <Text className="job-card__contact-name">{job.contactName}</Text>
          <Text className="job-card__contact-phone">
            {showLockStatus ? maskContact(job.contact) : job.contact}
          </Text>
        </View>
      )}

      {/* 职位描述预览 */}
      <View className="job-card__description">
        <Text className="job-card__description-text">
          {job.description && job.description.length > 50 
            ? `${job.description.substring(0, 50)}...` 
            : job.description}
        </Text>
      </View>

      {/* 今日标识 */}
      {isToday && (
        <View className="job-card__today-badge">
          <Text className="job-card__today-text">今日</Text>
        </View>
      )}
    </View>
  )
}

export default JobCard 