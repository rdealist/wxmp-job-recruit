/**
 * @fileoverview 主状态管理文件
 * @description 工程招聘小程序的核心状态管理，使用 React Context + useReducer 模式
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 * @updated 2024-12-05
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import Taro from '@tarojs/taro'

// 导入模块化的功能组件
import { ACTIONS } from './constants/actionTypes'
import { saveToStorage, loadFromStorage } from './utils/storageUtils'
import { mockJobs, locations, jobDataUtils } from './modules/jobData'
import { defaultFilters, filterUtils } from './modules/filterModule'
import { defaultUserInfo, userUtils } from './modules/userModule'

/**
 * 应用初始状态
 * @description 定义应用的初始状态结构，包含所有必要的数据字段
 */
const initialState = {
  /** 所有职位数据 */
  jobs: mockJobs,
  /** 经过筛选的职位数据 */
  filteredJobs: mockJobs,
  /** 当前筛选条件 */
  filters: defaultFilters,
  /** 已解锁的日期记录 */
  unlockedDates: {},
  /** 用户信息 */
  userInfo: defaultUserInfo,
  /** 地区数据 */
  locations,
  /** 应用加载状态 */
  loading: false,
  /** 错误信息 */
  error: null
}

/**
 * 状态管理 Reducer 函数
 * @description 处理所有状态变更的核心函数，根据 action 类型执行相应的状态更新
 * @param {Object} state - 当前状态
 * @param {Object} action - 要执行的动作对象
 * @returns {Object} 新的状态对象
 */

function jobReducer(state, action) {
  switch (action.type) {
    // 筛选相关操作
    case ACTIONS.SET_FILTERS:
      const newFilters = { ...state.filters, ...action.payload }
      const filteredJobs = filterUtils.applyFilters(state.jobs, newFilters)
      return {
        ...state,
        filters: newFilters,
        filteredJobs,
        error: null
      }

    case ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: defaultFilters,
        filteredJobs: state.jobs,
        error: null
      }

    case ACTIONS.APPLY_FILTERS:
      return {
        ...state,
        filteredJobs: filterUtils.applyFilters(state.jobs, state.filters),
        error: null
      }

    // 职位相关操作
    case ACTIONS.PUBLISH_JOB:
      const newJob = jobDataUtils.createJobObject(action.payload)
      const updatedJobs = [newJob, ...state.jobs]
      return {
        ...state,
        jobs: updatedJobs,
        filteredJobs: filterUtils.applyFilters(updatedJobs, state.filters),
        userInfo: {
          ...state.userInfo,
          publishCount: state.userInfo.publishCount + 1
        },
        error: null
      }

    case ACTIONS.REFRESH_JOBS:
      return {
        ...state,
        jobs: mockJobs,
        filteredJobs: filterUtils.applyFilters(mockJobs, state.filters),
        loading: false,
        error: null
      }

    // 用户相关操作
    case ACTIONS.UNLOCK_DATE:
      return {
        ...state,
        unlockedDates: userUtils.unlockDate(action.payload, state.unlockedDates),
        error: null
      }

    case ACTIONS.UPDATE_USER_INFO:
      return {
        ...state,
        userInfo: userUtils.updateUserInfo(state.userInfo, action.payload),
        error: null
      }

    // 数据持久化操作
    case ACTIONS.LOAD_PERSISTED_DATA:
      return {
        ...state,
        ...action.payload,
        error: null
      }

    // 加载状态管理
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }

    default:
      console.warn('未知的 Action 类型:', action.type)
      return state
  }
}

/**
 * React Context 对象
 * @description 创建用于状态共享的 Context 对象
 */
const JobContext = createContext()

/**
 * 状态管理 Provider 组件
 * @description 为整个应用提供状态管理功能的顶层组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {React.ReactElement} Provider 组件
 */
export const JobProvider = ({ children }) => {
  const [state, dispatch] = useReducer(jobReducer, initialState)

  /**
   * 从本地存储加载持久化数据
   * @description 应用启动时从本地存储恢复用户数据和解锁记录
   */
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedData = loadFromStorage()
        if (savedData) {
          dispatch({
            type: ACTIONS.LOAD_PERSISTED_DATA,
            payload: {
              unlockedDates: savedData.unlockedDates || {},
              userInfo: savedData.userInfo || state.userInfo
            }
          })
          console.log('持久化数据加载成功')
        }
      } catch (error) {
        console.error('加载持久化数据失败:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: '数据加载失败，请重试'
        })
      }
    }

    loadPersistedData()
  }, [])

  /**
   * 保存重要数据到本地存储
   * @description 当用户信息或解锁记录发生变化时自动保存到本地存储
   */
  useEffect(() => {
    const saveData = async () => {
      try {
        const success = saveToStorage({
          unlockedDates: state.unlockedDates,
          userInfo: state.userInfo
        })

        if (!success) {
          console.warn('数据保存失败')
        }
      } catch (error) {
        console.error('保存持久化数据失败:', error)
      }
    }

    // 避免初始化时立即保存
    if (state.userInfo.publishCount > 0 || Object.keys(state.unlockedDates).length > 0) {
      saveData()
    }
  }, [state.unlockedDates, state.userInfo])

  /**
   * Action 创建函数集合
   * @description 提供给组件使用的状态操作函数
   */
  const actions = {
    /**
     * 设置筛选条件
     * @param {Object} filters - 新的筛选条件
     */
    setFilters: (filters) => {
      const validatedFilters = filterUtils.sanitizeFilters(filters)
      dispatch({ type: ACTIONS.SET_FILTERS, payload: validatedFilters })
    },

    /**
     * 重置所有筛选条件
     */
    resetFilters: () => {
      dispatch({ type: ACTIONS.RESET_FILTERS })
    },

    /**
     * 应用当前筛选条件
     */
    applyFilters: () => {
      dispatch({ type: ACTIONS.APPLY_FILTERS })
    },

    /**
     * 发布新职位
     * @param {Object} jobData - 职位数据
     * @returns {string} 新职位的ID
     */
    publishJob: (jobData) => {
      const validation = jobDataUtils.validateJobData(jobData)
      if (!validation.isValid) {
        throw new Error('职位数据验证失败')
      }

      dispatch({ type: ACTIONS.PUBLISH_JOB, payload: jobData })
      return jobDataUtils.generateJobId()
    },

    /**
     * 解锁指定日期
     * @param {string} date - 要解锁的日期
     */
    unlockDate: (date) => {
      dispatch({ type: ACTIONS.UNLOCK_DATE, payload: date })
    },

    /**
     * 刷新职位列表
     * @returns {Promise<void>} 刷新操作的Promise
     */
    refreshJobs: async () => {
      dispatch({ type: 'SET_LOADING', payload: true })

      return new Promise(resolve => {
        setTimeout(() => {
          dispatch({ type: ACTIONS.REFRESH_JOBS })
          resolve()
        }, 1000)
      })
    },

    /**
     * 更新用户信息
     * @param {Object} updates - 要更新的用户信息
     */
    updateUserInfo: (updates) => {
      dispatch({ type: ACTIONS.UPDATE_USER_INFO, payload: updates })
    }
  }

  /**
   * 辅助函数集合
   * @description 提供常用的数据查询和处理函数
   */
  const helpers = {
    /** 获取今日发布的职位 */
    getTodayJobs: () => jobDataUtils.getTodayJobs(state.jobs),

    /** 检查日期是否已解锁 */
    isDateUnlocked: (date) => userUtils.isDateUnlocked(date, state.unlockedDates),

    /** 根据ID查找职位 */
    getJobById: (id) => jobDataUtils.findJobById(state.jobs, id),

    /** 获取用户发布的职位 */
    getUserJobs: () => userUtils.getUserJobs(state.jobs, state.userInfo),

    /** 处理分享解锁 */
    shareJob: async (jobId) => {
      const result = await userUtils.handleShareUnlock(
        jobId,
        state.jobs,
        state.unlockedDates
      )

      if (result.success) {
        dispatch({
          type: ACTIONS.LOAD_PERSISTED_DATA,
          payload: { unlockedDates: result.unlockedDates }
        })
      }

      return result.success
    },

    /** 获取用户统计信息 */
    getUserStats: () => userUtils.getUserStats(
      state.userInfo,
      helpers.getUserJobs(),
      state.unlockedDates
    )
  }

  // 合并状态、操作函数和辅助函数
  const contextValue = {
    ...state,
    ...actions,
    ...helpers
  }

  return (
    <JobContext.Provider value={contextValue}>
      {children}
    </JobContext.Provider>
  )
}

/**
 * 自定义 Hook - 使用状态管理
 * @description 提供访问全局状态和操作函数的Hook
 * @returns {Object} 包含状态和操作函数的对象
 * @throws {Error} 当在 JobProvider 外部使用时抛出错误
 * @example
 * const { jobs, setFilters, publishJob } = useJobStore()
 */
const useJobStore = () => {
  const context = useContext(JobContext)
  if (!context) {
    throw new Error('useJobStore 必须在 JobProvider 内部使用')
  }
  return context
}

export default useJobStore