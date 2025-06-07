import React, { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import Taro from '@tarojs/taro'
import useJobStore from '../stores/jobStore'
import './FilterBar.less'

const FilterBar = () => {
  const { filters, locations, setFilters, resetFilters } = useJobStore()
  const [searchValue, setSearchValue] = useState(filters.keyword)

  // 处理搜索输入
  const handleSearchInput = (e) => {
    const value = e.detail.value
    setSearchValue(value)
  }

  // 处理搜索确认
  const handleSearchConfirm = () => {
    setFilters({ keyword: searchValue })
  }

  // 处理搜索清空
  const handleSearchClear = () => {
    setSearchValue('')
    setFilters({ keyword: '' })
  }

  // 显示地区选择器
  const handleLocationSelect = () => {
    const cityList = Object.keys(locations)
    
    Taro.showActionSheet({
      itemList: ['不限', ...cityList],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 选择不限
          setFilters({ location: '', district: '' })
        } else {
          const selectedCity = cityList[res.tapIndex - 1]
          const districts = locations[selectedCity]
          
          // 如果有区县，显示区县选择
          if (districts && districts.length > 0) {
            Taro.showActionSheet({
              itemList: ['不限区县', ...districts],
              success: (districtRes) => {
                if (districtRes.tapIndex === 0) {
                  setFilters({ location: selectedCity, district: '' })
                } else {
                  const selectedDistrict = districts[districtRes.tapIndex - 1]
                  setFilters({ location: selectedCity, district: selectedDistrict })
                }
              }
            })
          } else {
            setFilters({ location: selectedCity, district: '' })
          }
        }
      }
    })
  }

  // 获取当前位置显示文本
  const getLocationText = () => {
    if (!filters.location) return '选择地区'
    if (filters.district) {
      return `${filters.location} ${filters.district}`
    }
    return filters.location
  }

  // 重置所有筛选
  const handleReset = () => {
    setSearchValue('')
    resetFilters()
  }

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = filters.location || filters.keyword

  return (
    <View className="filter-bar">
      {/* 搜索框 */}
      <View className="filter-bar__search">
        <View className="filter-bar__search-input">
          <Input
            className="filter-bar__input"
            placeholder="搜索职位、公司、技能"
            value={searchValue}
            onInput={handleSearchInput}
            onConfirm={handleSearchConfirm}
            confirmType="search"
          />
          {searchValue && (
            <View className="filter-bar__clear" onClick={handleSearchClear}>
              <AtIcon value="close-circle" size="18" color="#9ca3af" />
            </View>
          )}
        </View>
        <View className="arco-btn arco-btn--primary arco-btn--medium filter-bar__search-btn" onClick={handleSearchConfirm}>
          <AtIcon value="search" size="18" color="#ffffff" />
        </View>
      </View>

      {/* 筛选按钮组 */}
      <View className="filter-bar__filters">
        {/* 地区筛选 */}
        <View
          className={`arco-btn arco-btn--small ${filters.location ? 'arco-btn--primary' : 'arco-btn--outline'} filter-bar__filter-btn ${filters.location ? 'filter-bar__filter-btn--active' : ''}`}
          onClick={handleLocationSelect}
        >
          <Text className="filter-bar__filter-text">
            {getLocationText()}
          </Text>
          <AtIcon value="chevron-down" size="14" color={filters.location ? "#ffffff" : "#6697f5"} />
        </View>

        {/* 重置按钮 */}
        {hasActiveFilters && (
          <View className="arco-btn arco-btn--small arco-btn--text filter-bar__reset" onClick={handleReset}>
            <Text className="filter-bar__reset-text">重置</Text>
          </View>
        )}
      </View>

      {/* 活跃筛选条件展示 */}
      {hasActiveFilters && (
        <View className="filter-bar__active-filters">
          {filters.location && (
            <View className="filter-bar__active-tag">
              <Text className="filter-bar__active-tag-text">
                {getLocationText()}
              </Text>
              <View
                className="filter-bar__active-tag-close"
                onClick={() => setFilters({ location: '', district: '' })}
              >
                <AtIcon value="close" size="12" color="#ffffff" />
              </View>
            </View>
          )}
          {filters.keyword && (
            <View className="filter-bar__active-tag">
              <Text className="filter-bar__active-tag-text">
                "{filters.keyword}"
              </Text>
              <View
                className="filter-bar__active-tag-close"
                onClick={() => setFilters({ keyword: '' })}
              >
                <AtIcon value="close" size="12" color="#ffffff" />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default FilterBar 