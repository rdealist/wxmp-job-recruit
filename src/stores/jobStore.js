import React, { createContext, useContext, useReducer, useEffect } from 'react'
import Taro from '@tarojs/taro'

// 模拟职位数据
const mockJobs = [
  {
    id: '1',
    title: '高级前端工程师',
    company: '阿里巴巴',
    location: '杭州市',
    salary: '20-35K',
    experience: '3-5年',
    education: '本科',
    tags: ['Vue', 'React', 'TypeScript'],
    description: '负责前端架构设计，参与核心业务开发...',
    contact: '13812345678',
    contactName: '张经理',
    publishTime: new Date().toISOString(),
    publishDate: new Date().toDateString(),
    requirements: '熟练掌握Vue/React框架，有大型项目经验',
    benefits: '五险一金，带薪年假，股票期权'
  },
  {
    id: '2',
    title: '建筑工程师',
    company: '中建集团',
    location: '上海市',
    salary: '15-25K',
    experience: '5年以上',
    education: '本科',
    tags: ['土木工程', 'CAD', '项目管理'],
    description: '负责建筑工程设计、施工管理...',
    contact: '13698765432',
    contactName: '李工',
    publishTime: new Date(Date.now() - 86400000).toISOString(),
    publishDate: new Date(Date.now() - 86400000).toDateString(),
    requirements: '土木工程相关专业，熟悉建筑规范',
    benefits: '五险一金，项目奖金，技能培训'
  },
  {
    id: '3',
    title: '机械设计工程师',
    company: '三一重工',
    location: '长沙市',
    salary: '12-20K',
    experience: '3年以上',
    education: '本科',
    tags: ['机械设计', 'SolidWorks', '工艺改进'],
    description: '负责机械产品设计与优化...',
    contact: '13566778899',
    contactName: '王总',
    publishTime: new Date(Date.now() - 172800000).toISOString(),
    publishDate: new Date(Date.now() - 172800000).toDateString(),
    requirements: '机械相关专业，熟练使用设计软件',
    benefits: '五险一金，年终奖，职业发展'
  }
]

// 地区数据
const locations = {
  '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区'],
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区'],
  '广州市': ['天河区', '越秀区', '荔湾区', '海珠区', '白云区'],
  '深圳市': ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区'],
  '杭州市': ['西湖区', '拱墅区', '江干区', '下城区', '上城区'],
  '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区'],
  '重庆市': ['渝中区', '江北区', '南岸区', '九龙坡区', '沙坪坝区'],
  '武汉市': ['江汉区', '江岸区', '硚口区', '汉阳区', '武昌区'],
  '西安市': ['新城区', '碑林区', '莲湖区', '雁塔区', '未央区'],
  '长沙市': ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区']
}

// 初始状态
const initialState = {
  jobs: mockJobs,
  filteredJobs: mockJobs,
  filters: {
    location: '',
    district: '',
    keyword: ''
  },
  unlockedDates: {},
  userInfo: {
    avatar: 'https://avatars.dicebear.com/api/avataaars/user.svg',
    nickname: '工程师小王',
    phone: '138****8888',
    publishCount: 0
  },
  locations
}

// Action 类型
const ACTIONS = {
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  APPLY_FILTERS: 'APPLY_FILTERS',
  PUBLISH_JOB: 'PUBLISH_JOB',
  UNLOCK_DATE: 'UNLOCK_DATE',
  REFRESH_JOBS: 'REFRESH_JOBS',
  LOAD_PERSISTED_DATA: 'LOAD_PERSISTED_DATA'
}

// 筛选逻辑函数
function applyFiltersToJobs(jobs, filters) {
  let filtered = [...jobs]
  
  if (filters.location) {
    filtered = filtered.filter(job => job.location.includes(filters.location))
  }
  
  if (filters.district) {
    filtered = filtered.filter(job => job.location.includes(filters.district))
  }
  
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    filtered = filtered.filter(job =>
      job.title.toLowerCase().includes(keyword) ||
      job.company.toLowerCase().includes(keyword) ||
      job.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }
  
  return filtered
}

// Reducer
function jobReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_FILTERS:
      const newFilters = { ...state.filters, ...action.payload }
      const filteredJobs = applyFiltersToJobs(state.jobs, newFilters)
      return {
        ...state,
        filters: newFilters,
        filteredJobs
      }
      
    case ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: { location: '', district: '', keyword: '' },
        filteredJobs: state.jobs
      }
      
    case ACTIONS.APPLY_FILTERS:
      return {
        ...state,
        filteredJobs: applyFiltersToJobs(state.jobs, state.filters)
      }
      
    case ACTIONS.PUBLISH_JOB:
      const newJob = {
        id: Date.now().toString(),
        ...action.payload,
        publishTime: new Date().toISOString(),
        publishDate: new Date().toDateString()
      }
      return {
        ...state,
        jobs: [newJob, ...state.jobs],
        filteredJobs: [newJob, ...state.filteredJobs],
        userInfo: {
          ...state.userInfo,
          publishCount: state.userInfo.publishCount + 1
        }
      }
      
    case ACTIONS.UNLOCK_DATE:
      return {
        ...state,
        unlockedDates: {
          ...state.unlockedDates,
          [action.payload]: true
        }
      }
      
    case ACTIONS.REFRESH_JOBS:
      return {
        ...state,
        jobs: mockJobs,
        filteredJobs: applyFiltersToJobs(mockJobs, state.filters)
      }
      
    case ACTIONS.LOAD_PERSISTED_DATA:
      return {
        ...state,
        ...action.payload
      }
      
    default:
      return state
  }
}

// Context
const JobContext = createContext()

// Provider 组件
export const JobProvider = ({ children }) => {
  const [state, dispatch] = useReducer(jobReducer, initialState)
  
  // 从本地存储加载数据
  useEffect(() => {
    try {
      const savedData = Taro.getStorageSync('job-storage')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        if (parsedData.state) {
          dispatch({
            type: ACTIONS.LOAD_PERSISTED_DATA,
            payload: {
              unlockedDates: parsedData.state.unlockedDates || {},
              userInfo: parsedData.state.userInfo || state.userInfo
            }
          })
        }
      }
    } catch (error) {
      console.error('加载持久化数据失败:', error)
    }
  }, [])
  
  // 持久化重要数据
  useEffect(() => {
    try {
      const dataToSave = {
        state: {
          unlockedDates: state.unlockedDates,
          userInfo: state.userInfo
        },
        version: 0
      }
      Taro.setStorageSync('job-storage', JSON.stringify(dataToSave))
    } catch (error) {
      console.error('保存持久化数据失败:', error)
    }
  }, [state.unlockedDates, state.userInfo])
  
  // Actions
  const actions = {
    setFilters: (filters) => {
      dispatch({ type: ACTIONS.SET_FILTERS, payload: filters })
    },
    
    resetFilters: () => {
      dispatch({ type: ACTIONS.RESET_FILTERS })
    },
    
    applyFilters: () => {
      dispatch({ type: ACTIONS.APPLY_FILTERS })
    },
    
    publishJob: (jobData) => {
      dispatch({ type: ACTIONS.PUBLISH_JOB, payload: jobData })
      return Date.now().toString()
    },
    
    unlockDate: (date) => {
      dispatch({ type: ACTIONS.UNLOCK_DATE, payload: date })
    },
    
    refreshJobs: async () => {
      return new Promise(resolve => {
        setTimeout(() => {
          dispatch({ type: ACTIONS.REFRESH_JOBS })
          resolve()
        }, 1000)
      })
    },
    
    // 辅助函数
    getTodayJobs: () => {
      const today = new Date().toDateString()
      return state.jobs.filter(job => job.publishDate === today)
    },
    
    isDateUnlocked: (date) => {
      const today = new Date().toDateString()
      return date === today || state.unlockedDates[date] || false
    },
    
    getJobById: (id) => {
      return state.jobs.find(job => job.id === id)
    },
    
    getUserJobs: () => {
      const userPhone = state.userInfo.phone
      return state.jobs.filter(job => job.contact.includes(userPhone.slice(3, 7)))
    },
    
    shareJob: async (jobId) => {
      try {
        const job = state.jobs.find(job => job.id === jobId)
        if (!job) return false
        
        actions.unlockDate(job.publishDate)
        
        Taro.showToast({
          title: '分享成功，已解锁历史内容',
          icon: 'success'
        })
        
        return true
      } catch (error) {
        console.error('分享失败:', error)
        Taro.showToast({
          title: '分享失败，请重试',
          icon: 'error'
        })
        return false
      }
    }
  }
  
  return (
    <JobContext.Provider value={{ ...state, ...actions }}>
      {children}
    </JobContext.Provider>
  )
}

// Hook
const useJobStore = () => {
  const context = useContext(JobContext)
  if (!context) {
    throw new Error('useJobStore must be used within a JobProvider')
  }
  return context
}

export default useJobStore 