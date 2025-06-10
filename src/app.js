import React, { StrictMode } from 'react'
import { JobProvider } from './stores/jobStore'
import './app.less'
import './styles/animations.less'
import './styles/taro-ui-custom.less'

/**
 * 应用根组件
 * @description 使用函数组件和React.StrictMode确保React 18最佳实践
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {React.ReactElement} 应用根组件
 */
const App = ({ children }) => {
  return (
    <StrictMode>
      <JobProvider>
        {children}
      </JobProvider>
    </StrictMode>
  )
}

export default App
