/**
 * @fileoverview Redux Action 类型常量定义
 * @description 定义所有状态管理相关的 Action 类型常量，便于统一管理和避免拼写错误
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

/**
 * 筛选相关的 Action 类型
 * @description 处理职位筛选功能的状态变更
 */
export const FILTER_ACTIONS = {
  /** 设置筛选条件 */
  SET_FILTERS: 'SET_FILTERS',
  /** 重置筛选条件 */
  RESET_FILTERS: 'RESET_FILTERS',
  /** 应用筛选条件 */
  APPLY_FILTERS: 'APPLY_FILTERS'
}

/**
 * 职位相关的 Action 类型
 * @description 处理职位数据的增删改查操作
 */
export const JOB_ACTIONS = {
  /** 发布新职位 */
  PUBLISH_JOB: 'PUBLISH_JOB',
  /** 刷新职位列表 */
  REFRESH_JOBS: 'REFRESH_JOBS',
  /** 加载更多职位 */
  LOAD_MORE_JOBS: 'LOAD_MORE_JOBS'
}

/**
 * 用户相关的 Action 类型
 * @description 处理用户信息和权限相关的状态变更
 */
export const USER_ACTIONS = {
  /** 解锁指定日期的职位 */
  UNLOCK_DATE: 'UNLOCK_DATE',
  /** 更新用户信息 */
  UPDATE_USER_INFO: 'UPDATE_USER_INFO'
}

/**
 * 数据持久化相关的 Action 类型
 * @description 处理本地存储数据的加载和保存
 */
export const STORAGE_ACTIONS = {
  /** 加载持久化数据 */
  LOAD_PERSISTED_DATA: 'LOAD_PERSISTED_DATA',
  /** 保存数据到本地存储 */
  SAVE_TO_STORAGE: 'SAVE_TO_STORAGE'
}

/**
 * 所有 Action 类型的集合
 * @description 将所有 Action 类型合并为一个对象，便于统一导出和使用
 */
export const ACTIONS = {
  ...FILTER_ACTIONS,
  ...JOB_ACTIONS,
  ...USER_ACTIONS,
  ...STORAGE_ACTIONS
}

/**
 * Action 类型验证函数
 * @description 验证给定的 action type 是否为有效的 Action 类型
 * @param {string} actionType - 要验证的 Action 类型
 * @returns {boolean} 是否为有效的 Action 类型
 * @example
 * isValidActionType('SET_FILTERS') // true
 * isValidActionType('INVALID_ACTION') // false
 */
export const isValidActionType = (actionType) => {
  return Object.values(ACTIONS).includes(actionType)
}
