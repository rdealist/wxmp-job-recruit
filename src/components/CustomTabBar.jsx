import React from 'react'
import { View, Text } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import Taro from '@tarojs/taro'
import './CustomTabBar.less'

const CustomTabBar = () => {
  const [selected, setSelected] = React.useState(0)
  
  const tabList = [
    {
      pagePath: '/pages/home/index',
      text: '招聘',
      iconType: 'home',
      title: '招聘'
    },
    {
      pagePath: '/pages/publish/index', 
      text: '发布',
      iconType: 'add-circle',
      title: '发布'
    },
    {
      pagePath: '/pages/user/index',
      text: '我的', 
      iconType: 'user',
      title: '我的'
    }
  ]

  React.useEffect(() => {
    // 获取当前页面路径
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentRoute = currentPage.route
    
    // 根据当前路径设置选中状态
    const currentIndex = tabList.findIndex(item => 
      item.pagePath.includes(currentRoute.split('/').pop())
    )
    if (currentIndex !== -1) {
      setSelected(currentIndex)
    }
  }, [])

  const switchTab = (index) => {
    const url = tabList[index].pagePath
    setSelected(index)
    Taro.switchTab({ url })
  }

  return (
    <View className="custom-tab-bar">
      <View className="custom-tab-bar__border"></View>
      {tabList.map((item, index) => (
        <View
          key={index}
          className={`custom-tab-bar__item ${selected === index ? 'custom-tab-bar__item--active' : ''}`}
          onClick={() => switchTab(index)}
        >
          <View className="custom-tab-bar__icon">
            <AtIcon 
              value={item.iconType} 
              size="24" 
              color={selected === index ? '#6697f5' : '#9ca3af'} 
            />
          </View>
          <Text className={`custom-tab-bar__text ${selected === index ? 'custom-tab-bar__text--active' : ''}`}>
            {item.text}
          </Text>
        </View>
      ))}
    </View>
  )
}

export default CustomTabBar
