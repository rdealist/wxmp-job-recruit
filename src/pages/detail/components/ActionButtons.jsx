/**
 * @fileoverview 操作按钮组件
 * @description 详情页面的操作按钮，包括分享、收藏、投递简历等功能
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React, { useState, memo, useCallback } from 'react'
import { View, Text, Button } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import Taro from '@tarojs/taro'
import { generateShareContent } from '../utils/detailUtils'
import './ActionButtons.less'

/**
 * 操作按钮组件
 * @param {Object} props - 组件属性
 * @param {Object} props.job - 职位数据对象
 * @param {Function} props.onShare - 分享回调函数
 * @param {boolean} props.isUnlocked - 是否已解锁联系方式
 * @returns {React.ReactElement} 操作按钮组件
 */
const ActionButtons = memo(({ job, onShare, isUnlocked }) => {
  const [isSharing, setIsSharing] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  if (!job) {
    return null
  }

  /**
   * 处理分享操作
   */
  const handleShare = useCallback(async () => {
    if (isSharing) return

    setIsSharing(true)
    try {
      const success = await onShare()
      if (success) {
        Taro.showToast({
          title: '分享成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('分享失败:', error)
      Taro.showToast({
        title: '分享失败，请重试',
        icon: 'error'
      })
    } finally {
      setIsSharing(false)
    }
  }, [isSharing, onShare])

  /**
   * 处理收藏操作
   */
  const handleFavorite = useCallback(() => {
    // 这里可以实现收藏功能
    setIsFavorited(!isFavorited)
    Taro.showToast({
      title: isFavorited ? '已取消收藏' : '已收藏',
      icon: 'success'
    })
  }, [isFavorited])

  /**
   * 处理投递简历
   */
  const handleApply = useCallback(() => {
    if (!isUnlocked) {
      Taro.showToast({
        title: '请先解锁联系方式',
        icon: 'none'
      })
      return
    }

    Taro.showModal({
      title: '投递简历',
      content: '确认要投递简历到这个职位吗？',
      success: (res) => {
        if (res.confirm) {
          // 这里可以实现简历投递功能
          Taro.showToast({
            title: '简历投递成功',
            icon: 'success'
          })
        }
      }
    })
  }, [isUnlocked])

  /**
   * 处理举报操作
   */
  const handleReport = useCallback(() => {
    Taro.showActionSheet({
      itemList: ['虚假信息', '重复发布', '联系方式错误', '其他问题'],
      success: (res) => {
        const reasons = ['虚假信息', '重复发布', '联系方式错误', '其他问题']
        const reason = reasons[res.tapIndex]

        Taro.showModal({
          title: '举报确认',
          content: `确认举报该职位存在"${reason}"问题吗？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 这里可以实现举报功能
              Taro.showToast({
                title: '举报已提交',
                icon: 'success'
              })
            }
          }
        })
      }
    })
  }, [])

  /**
   * 处理返回首页
   */
  const handleBackHome = useCallback(() => {
    Taro.switchTab({
      url: '/pages/home/index'
    })
  }, [])

  return (
    <View className="action-buttons">
      {/* 主要操作按钮 */}
      <View className="action-buttons__main">
        {/* 分享按钮 */}
        <Button 
          className={`action-buttons__btn action-buttons__btn--share ${isSharing ? 'action-buttons__btn--loading' : ''}`}
          openType="share"
          onClick={handleShare}
          disabled={isSharing}
        >
          <View className="action-buttons__btn-content">
            {isSharing ? (
              <AtIcon value="loading-3" size="20" color="#6697f5" />
            ) : (
              <AtIcon value="share-2" size="20" color="#6697f5" />
            )}
            <Text className="action-buttons__btn-text">
              {isSharing ? '分享中...' : '分享解锁'}
            </Text>
          </View>
        </Button>

        {/* 投递简历按钮 */}
        <View 
          className={`action-buttons__btn action-buttons__btn--apply ${!isUnlocked ? 'action-buttons__btn--disabled' : ''}`}
          onClick={handleApply}
        >
          <View className="action-buttons__btn-content">
            <AtIcon value="mail" size="20" color="#ffffff" />
            <Text className="action-buttons__btn-text">投递简历</Text>
          </View>
        </View>
      </View>

      {/* 次要操作按钮 */}
      <View className="action-buttons__secondary">
        {/* 收藏按钮 */}
        <View 
          className="action-buttons__icon-btn"
          onClick={handleFavorite}
        >
          <AtIcon 
            value={isFavorited ? "heart-2" : "heart"} 
            size="24" 
            color={isFavorited ? "#f53f3f" : "#86909c"} 
          />
          <Text className={`action-buttons__icon-text ${isFavorited ? 'action-buttons__icon-text--active' : ''}`}>
            {isFavorited ? '已收藏' : '收藏'}
          </Text>
        </View>

        {/* 返回首页按钮 */}
        <View 
          className="action-buttons__icon-btn"
          onClick={handleBackHome}
        >
          <AtIcon value="home" size="24" color="#86909c" />
          <Text className="action-buttons__icon-text">首页</Text>
        </View>

        {/* 举报按钮 */}
        <View 
          className="action-buttons__icon-btn"
          onClick={handleReport}
        >
          <AtIcon value="alert-circle" size="24" color="#86909c" />
          <Text className="action-buttons__icon-text">举报</Text>
        </View>
      </View>

      {/* 解锁状态提示 */}
      {!isUnlocked && (
        <View className="action-buttons__unlock-tip">
          <AtIcon value="info" size="16" color="#ff7d00" />
          <Text className="action-buttons__unlock-text">
            分享职位即可解锁联系方式，查看完整信息
          </Text>
        </View>
      )}
    </View>
  )
})

// 设置displayName以便调试
ActionButtons.displayName = 'ActionButtons'

export default ActionButtons
