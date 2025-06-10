import React, { memo, useCallback, useMemo } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import Taro from '@tarojs/taro'
import CustomTabBar from '../../components/CustomTabBar'
import useJobStore from '../../stores/jobStore'
import './index.less'

const User = memo(() => {
  const { userInfo, getUserJobs } = useJobStore()
  const myJobs = useMemo(() => getUserJobs(), [getUserJobs])

  // 跳转到我的发布
  const handleMyJobs = useCallback(() => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }, [])

  // 联系客服
  const handleContact = useCallback(() => {
    Taro.showModal({
      title: '联系客服',
      content: '如有问题请联系客服微信：jobservice',
      showCancel: false
    })
  }, [])

  // 关于我们
  const handleAbout = useCallback(() => {
    Taro.showModal({
      title: '关于工程招聘',
      content: '专业的工程行业招聘平台，致力于连接优秀人才与企业',
      showCancel: false
    })
  }, [])

  // 设置
  const handleSettings = useCallback(() => {
    Taro.showActionSheet({
      itemList: ['清除缓存', '意见反馈', '隐私政策'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            Taro.clearStorage({
              success: () => {
                Taro.showToast({
                  title: '缓存已清除',
                  icon: 'success'
                })
              }
            })
            break
          case 1:
            Taro.showToast({
              title: '感谢您的反馈',
              icon: 'none'
            })
            break
          case 2:
            Taro.showToast({
              title: '查看隐私政策',
              icon: 'none'
            })
            break
        }
      }
    })
  }, [])

  return (
    <View className="user page-with-tabbar">
      {/* 用户信息卡片 */}
      <View className="user__profile">
        <View className="user__avatar-section">
          <Image 
            className="user__avatar" 
            src={userInfo.avatar}
            mode="aspectFill"
          />
          <View className="user__edit-btn">
            <AtIcon value="edit" size="14" color="#6697f5" />
          </View>
        </View>
        
        <View className="user__info">
          <Text className="user__nickname">{userInfo.nickname}</Text>
          <Text className="user__phone">{userInfo.phone}</Text>
        </View>

        <View className="user__stats">
          <View className="user__stat-item">
            <Text className="user__stat-number">{userInfo.publishCount}</Text>
            <Text className="user__stat-label">发布职位</Text>
          </View>
          <View className="user__stat-divider"></View>
          <View className="user__stat-item">
            <Text className="user__stat-number">{myJobs.length}</Text>
            <Text className="user__stat-label">我的记录</Text>
          </View>
        </View>
      </View>

      {/* 功能菜单 */}
      <View className="user__menu">
        <View className="user__menu-item" onClick={handleMyJobs}>
          <View className="user__menu-icon">📝</View>
          <Text className="user__menu-text">我的发布</Text>
          <Text className="user__menu-arrow">›</Text>
        </View>

        <View className="user__menu-item" onClick={handleContact}>
          <View className="user__menu-icon">💬</View>
          <Text className="user__menu-text">联系客服</Text>
          <Text className="user__menu-arrow">›</Text>
        </View>

        <View className="user__menu-item" onClick={handleAbout}>
          <View className="user__menu-icon">ℹ️</View>
          <Text className="user__menu-text">关于我们</Text>
          <Text className="user__menu-arrow">›</Text>
        </View>

        <View className="user__menu-item" onClick={handleSettings}>
          <View className="user__menu-icon">⚙️</View>
          <Text className="user__menu-text">设置</Text>
          <Text className="user__menu-arrow">›</Text>
        </View>
      </View>

      {/* 最近发布 */}
      {myJobs.length > 0 && (
        <View className="user__recent">
          <Text className="user__recent-title">最近发布</Text>
          {myJobs.slice(0, 3).map((job) => (
            <View 
              key={job.id} 
              className="user__recent-item"
              onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${job.id}` })}
            >
              <View className="user__recent-info">
                <Text className="user__recent-job-title">{job.title}</Text>
                <Text className="user__recent-company">{job.company}</Text>
              </View>
              <View className="user__recent-meta">
                <Text className="user__recent-salary">{job.salary}</Text>
                <Text className="user__recent-time">
                  {new Date(job.publishTime).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 版本信息 */}
      <View className="user__footer">
        <Text className="user__version">工程招聘 v1.0.0</Text>
        <Text className="user__copyright">© 2024 All Rights Reserved</Text>
      </View>

      {/* 自定义TabBar */}
      <CustomTabBar />
    </View>
  )
})

// 设置displayName以便调试
User.displayName = 'User'

export default User