import React, { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import useJobStore from '../../stores/jobStore'
import './index.less'

const Detail = () => {
  const router = useRouter()
  const { id } = router.params
  
  const { getJobById, isDateUnlocked, shareJob } = useJobStore()
  const [job, setJob] = useState(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (id) {
      const jobData = getJobById(id)
      setJob(jobData)
      
      if (!jobData) {
        Taro.showToast({
          title: '职位不存在',
          icon: 'none'
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    }
  }, [id, getJobById])

  if (!job) {
    return (
      <View className="detail">
        <View className="detail__loading">
          <Text className="detail__loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  const isUnlocked = isDateUnlocked(job.publishDate)
  const isToday = job.publishDate === new Date().toDateString()
  const canView = isUnlocked || isToday

  // 处理分享
  const handleShare = async () => {
    setSharing(true)
    
    try {
      // 调用分享功能
      await Taro.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
      
      // 模拟分享成功
      const success = await shareJob(job.id)
      if (success) {
        // 分享成功，重新获取职位信息以更新解锁状态
        const updatedJob = getJobById(id)
        setJob(updatedJob)
      }
    } catch (error) {
      console.error('分享失败:', error)
      Taro.showToast({
        title: '分享失败，请重试',
        icon: 'error'
      })
    } finally {
      setSharing(false)
    }
  }

  // 拨打电话
  const handleCall = () => {
    if (!canView) {
      Taro.showToast({
        title: '请先分享解锁',
        icon: 'none'
      })
      return
    }

    Taro.showModal({
      title: '拨打电话',
      content: `确认拨打 ${job.contact} (${job.contactName}) 吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.makePhoneCall({
            phoneNumber: job.contact
          })
        }
      }
    })
  }

  // 复制联系方式
  const handleCopy = () => {
    if (!canView) {
      Taro.showToast({
        title: '请先分享解锁',
        icon: 'none'
      })
      return
    }

    Taro.setClipboardData({
      data: job.contact,
      success: () => {
        Taro.showToast({
          title: '联系方式已复制',
          icon: 'success'
        })
      }
    })
  }

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return (
    <View className="detail">
      {/* 职位头部信息 */}
      <View className="detail__header">
        <Text className="detail__title">{job.title}</Text>
        <Text className="detail__salary">{job.salary}</Text>
        <View className="detail__meta">
          <Text className="detail__company">{job.company}</Text>
          <Text className="detail__location">{job.location}</Text>
          <Text className="detail__time">{formatTime(job.publishTime)}</Text>
        </View>
      </View>

      {/* 职位要求 */}
      <View className="detail__section">
        <Text className="detail__section-title">职位要求</Text>
        <View className="detail__requirements">
          {job.experience && (
            <View className="detail__requirement-item">
              <Text className="detail__requirement-label">工作经验：</Text>
              <Text className="detail__requirement-value">{job.experience}</Text>
            </View>
          )}
          {job.education && (
            <View className="detail__requirement-item">
              <Text className="detail__requirement-label">学历要求：</Text>
              <Text className="detail__requirement-value">{job.education}</Text>
            </View>
          )}
        </View>

        {/* 技能标签 */}
        {job.tags && job.tags.length > 0 && (
          <View className="detail__tags">
            {job.tags.map((tag, index) => (
              <View key={index} className="detail__tag">
                <Text className="detail__tag-text">{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 职位描述 */}
      <View className="detail__section">
        <Text className="detail__section-title">职位描述</Text>
        <Text className="detail__description">{job.description}</Text>
      </View>

      {/* 任职要求 */}
      {job.requirements && (
        <View className="detail__section">
          <Text className="detail__section-title">任职要求</Text>
          <Text className="detail__description">{job.requirements}</Text>
        </View>
      )}

      {/* 福利待遇 */}
      {job.benefits && (
        <View className="detail__section">
          <Text className="detail__section-title">福利待遇</Text>
          <Text className="detail__description">{job.benefits}</Text>
        </View>
      )}

      {/* 联系信息 */}
      <View className="detail__section">
        <Text className="detail__section-title">联系信息</Text>
        
        {canView ? (
          <View className="detail__contact">
            <View className="detail__contact-item">
              <Text className="detail__contact-label">联系人：</Text>
              <Text className="detail__contact-value">{job.contactName}</Text>
            </View>
            <View className="detail__contact-item">
              <Text className="detail__contact-label">联系电话：</Text>
              <Text className="detail__contact-value">{job.contact}</Text>
            </View>
          </View>
        ) : (
          <View className="detail__locked">
            <View className="detail__locked-icon">🔒</View>
            <Text className="detail__locked-title">联系方式已锁定</Text>
            <Text className="detail__locked-desc">
              历史职位需要分享后才能查看完整联系方式
            </Text>
            <View 
              className={`detail__share-btn ${sharing ? 'detail__share-btn--loading' : ''}`}
              onClick={handleShare}
            >
              <Text className="detail__share-btn-text">
                {sharing ? '分享中...' : '分享解锁'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 底部操作栏 */}
      {canView && (
        <View className="detail__actions">
          <View className="detail__action-btn detail__action-btn--secondary" onClick={handleCopy}>
            <Text className="detail__action-text">复制联系方式</Text>
          </View>
          <View className="detail__action-btn detail__action-btn--primary" onClick={handleCall}>
            <Text className="detail__action-text">立即沟通</Text>
          </View>
        </View>
      )}

      {/* 分享按钮（历史职位且未解锁时显示） */}
      {!canView && (
        <View className="detail__bottom-share">
          <Button 
            className="detail__share-button"
            openType="share"
            loading={sharing}
            onClick={handleShare}
          >
            {sharing ? '分享中...' : '分享到微信解锁'}
          </Button>
        </View>
      )}
    </View>
  )
}

// 分享配置
Detail.onShareAppMessage = () => {
  const { getJobById } = useJobStore.getState()
  const pages = Taro.getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const { id } = currentPage.options
  const job = getJobById(id)

  return {
    title: job ? `${job.title} - ${job.company}` : '工程招聘职位分享',
    path: `/pages/detail/index?id=${id}`,
    imageUrl: '' // 可以设置分享图片
  }
}

Detail.onShareTimeline = () => {
  const { getJobById } = useJobStore.getState()
  const pages = Taro.getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const { id } = currentPage.options
  const job = getJobById(id)

  return {
    title: job ? `${job.title} - ${job.company} 招聘中` : '优质工程职位推荐',
    query: `id=${id}`,
    imageUrl: '' // 可以设置分享图片
  }
}

export default Detail 