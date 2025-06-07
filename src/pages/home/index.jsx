import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import JobCard from '../../components/JobCard'
import FilterBar from '../../components/FilterBar'
import CustomTabBar from '../../components/CustomTabBar'
import useJobStore from '../../stores/jobStore'
import './index.less'

const Home = () => {
  const { 
    filteredJobs, 
    getTodayJobs, 
    refreshJobs,
    applyFilters,
    resetFilters
  } = useJobStore()
  
  const [loading, setLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)

  // 下拉刷新
  usePullDownRefresh(async () => {
    setLoading(true)
    try {
      await refreshJobs()
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      Taro.showToast({
        title: '刷新失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  })

  // 检查筛选结果是否为空
  useEffect(() => {
    setIsEmpty(filteredJobs.length === 0)
  }, [filteredJobs])

  // 页面初始化时应用筛选（仅执行一次）
  useEffect(() => {
    applyFilters()
  }, []) // 空依赖数组，仅在组件挂载时执行一次

  // 获取今日职位数量
  const todayJobsCount = getTodayJobs().length

  // 手动刷新
  const handleRefresh = async () => {
    setLoading(true)
    await refreshJobs()
    setLoading(false)
  }

  return (
    <View className="home page-with-tabbar">
      {/* 筛选栏 */}
      <FilterBar />

      {/* 统计信息 */}
      <View className="home__stats">
        <View className="home__stats-item">
          <Text className="home__stats-number">{filteredJobs.length}</Text>
          <Text className="home__stats-label">个职位</Text>
        </View>
        <View className="home__stats-divider"></View>
        <View className="home__stats-item">
          <Text className="home__stats-number">{todayJobsCount}</Text>
          <Text className="home__stats-label">今日新增</Text>
        </View>
        {!loading && (
          <View className="arco-btn arco-btn--small arco-btn--outline home__refresh-btn" onClick={handleRefresh}>
            <AtIcon value="reload" size="14" color="#6697f5" />
            <Text className="home__refresh-text">刷新</Text>
          </View>
        )}
      </View>

      {/* 加载状态 */}
      {loading && (
        <View className="home__loading">
          <Text className="home__loading-text">老板、请稍等，正在努力查询</Text>
          <View className="home__loading-bar">
            <View className="home__loading-progress"></View>
          </View>
        </View>
      )}

      {/* 职位列表 */}
      {!loading && (
        <ScrollView
          className="home__list"
          scrollY
          enhanced
          showScrollbar={false}
        >
          {filteredJobs.length > 0 ? (
            <View className="home__jobs">
              {filteredJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  showLockStatus={true}
                />
              ))}
              
              {/* 底部提示 */}
              <View className="home__bottom-tip">
                <Text className="home__bottom-tip-text">
                  已显示全部职位 · 下拉刷新获取最新信息
                </Text>
              </View>
            </View>
          ) : (
            /* 空状态 */
            <View className="home__empty">
              <View className="home__empty-icon">
                <AtIcon value="search" size="48" color="#9ca3af" />
              </View>
              <Text className="home__empty-title">暂无匹配职位</Text>
              <Text className="home__empty-desc">
                试试调整筛选条件或搜索其他关键词
              </Text>
              <View
                className="arco-btn arco-btn--medium arco-btn--primary home__empty-btn"
                onClick={resetFilters}
              >
                <Text className="home__empty-btn-text">重置筛选</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* 自定义TabBar */}
      <CustomTabBar />
    </View>
  )
}

export default Home 