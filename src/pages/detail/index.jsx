/**
 * @fileoverview 职位详情页面
 * @description 工程招聘小程序的职位详情展示页面，采用模块化组件设计
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 * @updated 2024-12-05
 */

import React, { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'

// 导入组件
import JobHeader from './components/JobHeader'
import JobDescription from './components/JobDescription'
import ContactSection from './components/ContactSection'
import ActionButtons from './components/ActionButtons'

// 导入工具和状态管理
import useJobStore from '../../stores/jobStore'
import { validateJobData, generateShareContent } from './utils/detailUtils'

import './index.less'

/**
 * 职位详情页面组件
 * @returns {React.ReactElement} 详情页面组件
 */
const Detail = () => {
  const router = useRouter()
  const { id } = router.params

  const { getJobById, isDateUnlocked, shareJob } = useJobStore()

  // 页面状态管理
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * 初始化页面数据
   * @description 根据路由参数加载职位数据
   */
  useEffect(() => {
    const loadJobData = async () => {
      setLoading(true)
      setError(null)

      try {
        if (!id) {
          throw new Error('缺少职位ID参数')
        }

        const jobData = getJobById(id)

        if (!jobData) {
          throw new Error('职位不存在或已被删除')
        }

        // 验证职位数据完整性
        const validation = validateJobData(jobData)
        if (!validation.isValid) {
          console.warn('职位数据不完整:', validation.errors)
        }

        setJob(jobData)
      } catch (error) {
        console.error('加载职位数据失败:', error)
        setError(error.message)

        Taro.showToast({
          title: error.message,
          icon: 'none'
        })

        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } finally {
        setLoading(false)
      }
    }

    loadJobData()
  }, [id, getJobById])

  /**
   * 处理分享解锁
   * @description 执行分享操作并解锁联系方式
   * @returns {Promise<boolean>} 分享是否成功
   */
  const handleShareUnlock = useCallback(async () => {
    if (!job) return false

    try {
      const success = await shareJob(job.id)
      if (success) {
        // 分享成功，重新获取职位信息以更新解锁状态
        const updatedJob = getJobById(id)
        if (updatedJob) {
          setJob(updatedJob)
        }
      }
      return success
    } catch (error) {
      console.error('分享失败:', error)
      throw error
    }
  }, [job, shareJob, getJobById, id])

  // 计算解锁状态
  const isUnlocked = job ? isDateUnlocked(job.publishDate) : false

  // 加载状态
  if (loading) {
    return (
      <View className="detail">
        <View className="detail__loading">
          <Text className="detail__loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  // 错误状态
  if (error || !job) {
    return (
      <View className="detail">
        <View className="detail__error">
          <Text className="detail__error-text">{error || '职位数据加载失败'}</Text>
        </View>
      </View>
    )
  }



  return (
    <View className="detail">
      {/* 职位头部信息组件 */}
      <JobHeader job={job} />

      {/* 职位描述组件 */}
      <JobDescription job={job} />

      {/* 联系信息组件 */}
      <ContactSection
        job={job}
        isUnlocked={isUnlocked}
        onUnlock={handleShareUnlock}
      />

      {/* 操作按钮组件 */}
      <ActionButtons
        job={job}
        onShare={handleShareUnlock}
        isUnlocked={isUnlocked}
      />
    </View>
  )
}

/**
 * 微信分享配置 - 分享给朋友
 * @description 配置分享给朋友时的内容
 * @returns {Object} 分享配置对象
 */
const onShareAppMessage = () => {
  try {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const { id } = currentPage.options

    if (!id) {
      return {
        title: '工程招聘职位分享',
        path: '/pages/home/index'
      }
    }

    // 注意：在分享回调中无法使用Hook，需要直接获取数据
    // 这里需要从全局状态或其他方式获取数据
    return {
      title: '工程招聘职位分享',
      path: `/pages/detail/index?id=${id}`
    }
  } catch (error) {
    console.error('分享配置失败:', error)
    return {
      title: '工程招聘职位分享',
      path: '/pages/home/index'
    }
  }
}

/**
 * 微信分享配置 - 分享到朋友圈
 * @description 配置分享到朋友圈时的内容
 * @returns {Object} 分享配置对象
 */
const onShareTimeline = () => {
  try {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const { id } = currentPage.options

    if (!id) {
      return {
        title: '优质工程职位推荐',
        query: ''
      }
    }

    return {
      title: '优质工程职位推荐',
      query: `id=${id}`
    }
  } catch (error) {
    console.error('朋友圈分享配置失败:', error)
    return {
      title: '优质工程职位推荐',
      query: ''
    }
  }
}

// 为函数组件添加分享方法
Detail.onShareAppMessage = onShareAppMessage
Detail.onShareTimeline = onShareTimeline

export default Detail 