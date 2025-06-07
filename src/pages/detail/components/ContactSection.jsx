/**
 * @fileoverview 联系信息组件
 * @description 显示职位的联系信息，包括联系人和联系方式
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import { maskContact, makePhoneCall, copyContact } from '../utils/detailUtils'
import './ContactSection.less'

/**
 * 联系信息组件
 * @param {Object} props - 组件属性
 * @param {Object} props.job - 职位数据对象
 * @param {boolean} props.isUnlocked - 是否已解锁联系方式
 * @param {Function} props.onUnlock - 解锁联系方式的回调函数
 * @returns {React.ReactElement} 联系信息组件
 */
const ContactSection = ({ job, isUnlocked, onUnlock }) => {
  const [isRevealing, setIsRevealing] = useState(false)

  if (!job) {
    return (
      <View className="contact-section">
        <View className="contact-section__loading">
          <Text className="contact-section__loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  /**
   * 处理解锁联系方式
   */
  const handleUnlock = async () => {
    if (isRevealing) return
    
    setIsRevealing(true)
    try {
      await onUnlock()
    } finally {
      setIsRevealing(false)
    }
  }

  /**
   * 处理拨打电话
   */
  const handleCall = () => {
    if (!isUnlocked || !job.contact) return
    makePhoneCall(job.contact, job.contactName)
  }

  /**
   * 处理复制联系方式
   */
  const handleCopy = () => {
    if (!isUnlocked || !job.contact) return
    copyContact(job.contact, '联系电话')
  }

  return (
    <View className="contact-section">
      <Text className="contact-section__title">联系方式</Text>
      
      {/* 联系人信息 */}
      <View className="contact-section__content">
        {job.contactName && (
          <View className="contact-section__item">
            <View className="contact-section__icon">
              <AtIcon value="user" size="20" color="#6697f5" />
            </View>
            <View className="contact-section__info">
              <Text className="contact-section__label">联系人</Text>
              <Text className="contact-section__value">{job.contactName}</Text>
            </View>
          </View>
        )}

        {/* 联系电话 */}
        <View className="contact-section__item">
          <View className="contact-section__icon">
            <AtIcon value="phone" size="20" color="#6697f5" />
          </View>
          <View className="contact-section__info">
            <Text className="contact-section__label">联系电话</Text>
            {isUnlocked ? (
              <View className="contact-section__contact-revealed">
                <Text className="contact-section__value contact-section__value--phone">
                  {job.contact}
                </Text>
                <View className="contact-section__actions">
                  <View 
                    className="contact-section__action-btn contact-section__action-btn--call"
                    onClick={handleCall}
                  >
                    <AtIcon value="phone" size="16" color="#ffffff" />
                    <Text className="contact-section__action-text">拨打</Text>
                  </View>
                  <View 
                    className="contact-section__action-btn contact-section__action-btn--copy"
                    onClick={handleCopy}
                  >
                    <AtIcon value="copy" size="16" color="#6697f5" />
                    <Text className="contact-section__action-text">复制</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="contact-section__contact-masked">
                <Text className="contact-section__value contact-section__value--masked">
                  {maskContact(job.contact)}
                </Text>
                <View 
                  className={`contact-section__unlock-btn ${isRevealing ? 'contact-section__unlock-btn--loading' : ''}`}
                  onClick={handleUnlock}
                >
                  {isRevealing ? (
                    <>
                      <AtIcon value="loading-3" size="16" color="#ffffff" />
                      <Text className="contact-section__unlock-text">解锁中...</Text>
                    </>
                  ) : (
                    <>
                      <AtIcon value="lock" size="16" color="#ffffff" />
                      <Text className="contact-section__unlock-text">分享解锁</Text>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 联系提示 */}
        <View className="contact-section__tips">
          <View className="contact-section__tip-header">
            <AtIcon value="info" size="16" color="#ff7d00" />
            <Text className="contact-section__tip-title">联系提示</Text>
          </View>
          <View className="contact-section__tip-content">
            <Text className="contact-section__tip-text">
              • 请在工作时间（9:00-18:00）联系，提高沟通效率
            </Text>
            <Text className="contact-section__tip-text">
              • 联系时请说明从"工程招聘"小程序看到此职位
            </Text>
            <Text className="contact-section__tip-text">
              • 建议提前准备好个人简历和相关作品
            </Text>
          </View>
        </View>

        {/* 隐私保护说明 */}
        {!isUnlocked && (
          <View className="contact-section__privacy">
            <View className="contact-section__privacy-header">
              <AtIcon value="lock" size="14" color="#86909c" />
              <Text className="contact-section__privacy-title">隐私保护</Text>
            </View>
            <Text className="contact-section__privacy-text">
              为保护招聘方隐私，联系方式需要通过分享解锁。分享后即可查看完整联系方式。
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default ContactSection
