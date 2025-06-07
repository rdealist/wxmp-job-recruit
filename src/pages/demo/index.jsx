import React from 'react'
import { View, Text } from '@tarojs/components'
import './index.less'

const Demo = () => {
  return (
    <View className="demo">
      <View className="demo__header">
        <Text className="demo__title">UI组件展示</Text>
        <Text className="demo__subtitle">现代化设计系统演示</Text>
      </View>

      <View className="demo__section">
        <Text className="demo__section-title">Arco Design 按钮组件</Text>
        <View className="demo__buttons">
          <View className="arco-btn arco-btn--primary arco-btn--medium">主要按钮</View>
          <View className="arco-btn arco-btn--secondary arco-btn--medium">次要按钮</View>
          <View className="arco-btn arco-btn--outline arco-btn--medium">边框按钮</View>
          <View className="arco-btn arco-btn--dashed arco-btn--medium">虚线按钮</View>
          <View className="arco-btn arco-btn--text arco-btn--medium">文本按钮</View>
          <View className="arco-btn arco-btn--link arco-btn--medium">链接按钮</View>
        </View>

        <Text className="demo__subsection-title">尺寸变体</Text>
        <View className="demo__buttons">
          <View className="arco-btn arco-btn--primary arco-btn--mini">Mini</View>
          <View className="arco-btn arco-btn--primary arco-btn--small">Small</View>
          <View className="arco-btn arco-btn--primary arco-btn--medium">Medium</View>
          <View className="arco-btn arco-btn--primary arco-btn--large">Large</View>
        </View>

        <Text className="demo__subsection-title">状态变体</Text>
        <View className="demo__buttons">
          <View className="arco-btn arco-btn--primary arco-btn--success arco-btn--medium">成功按钮</View>
          <View className="arco-btn arco-btn--primary arco-btn--warning arco-btn--medium">警告按钮</View>
          <View className="arco-btn arco-btn--primary arco-btn--danger arco-btn--medium">危险按钮</View>
          <View className="arco-btn arco-btn--primary arco-btn--medium arco-btn--loading">加载中</View>
        </View>

        <Text className="demo__subsection-title">形状变体</Text>
        <View className="demo__buttons">
          <View className="arco-btn arco-btn--primary arco-btn--medium arco-btn--round">圆角按钮</View>
          <View className="arco-btn arco-btn--primary arco-btn--medium arco-btn--circle">🔍</View>
          <View className="arco-btn arco-btn--primary arco-btn--medium arco-btn--long">长按钮</View>
        </View>
      </View>

      <View className="demo__section">
        <Text className="demo__section-title">标签组件</Text>
        <View className="demo__tags">
          <View className="tag">默认标签</View>
          <View className="tag tag--primary">主要标签</View>
          <View className="tag tag--success">成功标签</View>
          <View className="tag tag--warning">警告标签</View>
          <View className="tag tag--error">错误标签</View>
          <View className="tag tag--gray">灰色标签</View>
        </View>
      </View>

      <View className="demo__section">
        <Text className="demo__section-title">卡片组件</Text>
        <View className="card">
          <Text className="demo__card-title">标准卡片</Text>
          <Text className="demo__card-content">这是一个标准的卡片组件，具有现代化的设计风格。</Text>
        </View>
        <View className="card card--elevated">
          <Text className="demo__card-title">高级卡片</Text>
          <Text className="demo__card-content">这是一个带有更强阴影效果的高级卡片。</Text>
        </View>
      </View>

      <View className="demo__section">
        <Text className="demo__section-title">输入框组件</Text>
        <View className="demo__inputs">
          <View className="input" placeholder="请输入内容" />
          <View className="input input--error" placeholder="错误状态输入框" />
          <View className="input input--success" placeholder="成功状态输入框" />
        </View>
      </View>

      <View className="demo__section">
        <Text className="demo__section-title">动画效果</Text>
        <View className="demo__animations">
          <View className="demo__animation-item animate-fadeIn">淡入动画</View>
          <View className="demo__animation-item animate-fadeInUp">向上淡入</View>
          <View className="demo__animation-item animate-scaleIn">缩放动画</View>
          <View className="demo__animation-item animate-pulse">脉冲动画</View>
        </View>
      </View>

      <View className="demo__section">
        <Text className="demo__section-title">工具类展示</Text>
        <View className="demo__utils">
          <View className="flex flex-center p-4 m-2" style={{background: '#f0f9ff', borderRadius: '8px'}}>
            <Text className="text-primary font-semibold">居中布局</Text>
          </View>
          <View className="flex flex-between-center p-4 m-2" style={{background: '#f0fdf4', borderRadius: '8px'}}>
            <Text className="text-success">左侧文本</Text>
            <Text className="text-success">右侧文本</Text>
          </View>
          <View className="flex flex-col p-4 m-2" style={{background: '#fffbeb', borderRadius: '8px'}}>
            <Text className="text-warning font-bold">标题</Text>
            <Text className="text-warning text-sm">描述文本</Text>
          </View>
        </View>
      </View>

      <View className="demo__section">
        <Text className="demo__section-title">颜色系统</Text>
        <View className="demo__colors">
          <View className="demo__color-item" style={{background: '#6697f5'}}>
            <Text className="demo__color-text">Primary</Text>
          </View>
          <View className="demo__color-item" style={{background: '#22c55e'}}>
            <Text className="demo__color-text">Success</Text>
          </View>
          <View className="demo__color-item" style={{background: '#f59e0b'}}>
            <Text className="demo__color-text">Warning</Text>
          </View>
          <View className="demo__color-item" style={{background: '#ef4444'}}>
            <Text className="demo__color-text">Error</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default Demo
