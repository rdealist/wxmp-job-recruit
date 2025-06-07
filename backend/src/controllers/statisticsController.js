/**
 * @fileoverview 统计控制器
 * @description 处理数据统计相关的业务逻辑
 * @author 工程招聘小程序团队
 * @created 2024-12-05
 */

const User = require('../models/User')
const Job = require('../models/Job')
const Share = require('../models/Share')
const { 
  successResponse, 
  BusinessError
} = require('../middleware/errorHandler')
const { cacheService } = require('../config/redis')
const logger = require('../utils/logger')

/**
 * 获取平台概览统计
 */
const getOverview = async (req, res) => {
  try {
    // 检查缓存
    const cacheKey = 'statistics:overview'
    let overview = await cacheService.get(cacheKey)
    
    if (!overview) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 并行查询统计数据
      const [
        totalJobs,
        totalUsers,
        todayJobs,
        todayShares,
        activeUsers,
        totalViews
      ] = await Promise.all([
        Job.countDocuments({ status: 1, reviewStatus: 1 }),
        User.countDocuments({ status: 1 }),
        Job.countDocuments({ 
          publishTime: { $gte: today }, 
          status: 1, 
          reviewStatus: 1 
        }),
        Share.countDocuments({ 
          shareTime: { $gte: today }, 
          status: 1 
        }),
        User.countDocuments({
          lastActiveTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: 1
        }),
        Job.aggregate([
          { $match: { status: 1, reviewStatus: 1 } },
          { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
        ])
      ])

      overview = {
        totalJobs,
        totalUsers,
        todayJobs,
        todayShares,
        activeUsers,
        totalViews: totalViews[0]?.totalViews || 0,
        lastUpdated: new Date()
      }

      // 缓存概览数据
      await cacheService.set(cacheKey, overview, 10 * 60) // 10分钟
    }

    logger.logBusiness('获取平台概览', req.user?._id)

    res.json(successResponse(overview, '获取成功'))

  } catch (error) {
    logger.error('获取平台概览失败:', error.message)
    throw new BusinessError('获取平台概览失败')
  }
}

/**
 * 获取职位统计
 */
const getJobStatistics = async (req, res) => {
  const { days = 30, groupBy = 'day' } = req.query

  try {
    const cacheKey = `statistics:jobs:${days}:${groupBy}`
    let statistics = await cacheService.get(cacheKey)
    
    if (!statistics) {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      // 根据分组方式设置日期格式
      let dateFormat
      switch (groupBy) {
        case 'week':
          dateFormat = '%Y-W%U'
          break
        case 'month':
          dateFormat = '%Y-%m'
          break
        default:
          dateFormat = '%Y-%m-%d'
      }

      // 获取职位发布趋势
      const publishTrend = await Job.aggregate([
        { 
          $match: { 
            publishTime: { $gte: startDate },
            status: 1,
            reviewStatus: 1
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$publishTime' } },
            count: { $sum: 1 },
            totalViews: { $sum: '$viewCount' },
            totalShares: { $sum: '$shareCount' }
          }
        },
        { $sort: { _id: 1 } }
      ])

      // 获取职位分类统计
      const categoryStats = await Job.aggregate([
        { $match: { status: 1, reviewStatus: 1 } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgViews: { $avg: '$viewCount' }
          }
        },
        { $sort: { count: -1 } }
      ])

      // 获取工作类型统计
      const typeStats = await Job.aggregate([
        { $match: { status: 1, reviewStatus: 1 } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])

      statistics = {
        publishTrend: publishTrend.map(item => ({
          date: item._id,
          count: item.count,
          totalViews: item.totalViews,
          totalShares: item.totalShares
        })),
        categories: categoryStats.map(item => ({
          category: item._id,
          count: item.count,
          avgViews: Math.round(item.avgViews || 0)
        })),
        types: typeStats.map(item => ({
          type: item._id,
          count: item.count
        }))
      }

      // 缓存统计数据
      await cacheService.set(cacheKey, statistics, 30 * 60) // 30分钟
    }

    logger.logBusiness('获取职位统计', req.user?._id, { days, groupBy })

    res.json(successResponse(statistics, '获取成功'))

  } catch (error) {
    logger.error('获取职位统计失败:', error.message)
    throw new BusinessError('获取职位统计失败')
  }
}

/**
 * 获取地区统计
 */
const getRegionStatistics = async (req, res) => {
  try {
    const cacheKey = 'statistics:regions'
    let regionStats = await cacheService.get(cacheKey)
    
    if (!regionStats) {
      // 获取省份统计
      const provinceStats = await Job.aggregate([
        { $match: { status: 1, reviewStatus: 1 } },
        {
          $group: {
            _id: '$province',
            count: { $sum: 1 },
            avgViews: { $avg: '$viewCount' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])

      // 获取城市统计
      const cityStats = await Job.aggregate([
        { $match: { status: 1, reviewStatus: 1 } },
        {
          $group: {
            _id: { province: '$province', city: '$city' },
            count: { $sum: 1 },
            avgViews: { $avg: '$viewCount' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ])

      regionStats = {
        provinces: provinceStats.map(item => ({
          province: item._id,
          count: item.count,
          avgViews: Math.round(item.avgViews || 0)
        })),
        cities: cityStats.map(item => ({
          province: item._id.province,
          city: item._id.city,
          count: item.count,
          avgViews: Math.round(item.avgViews || 0)
        }))
      }

      // 缓存地区统计
      await cacheService.set(cacheKey, regionStats, 60 * 60) // 1小时
    }

    logger.logBusiness('获取地区统计', req.user?._id)

    res.json(successResponse(regionStats, '获取成功'))

  } catch (error) {
    logger.error('获取地区统计失败:', error.message)
    throw new BusinessError('获取地区统计失败')
  }
}

/**
 * 获取职位分类统计
 */
const getCategoryStatistics = async (req, res) => {
  try {
    const cacheKey = 'statistics:categories'
    let categoryStats = await cacheService.get(cacheKey)
    
    if (!categoryStats) {
      // 获取分类统计
      const stats = await Job.aggregate([
        { $match: { status: 1, reviewStatus: 1 } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalViews: { $sum: '$viewCount' },
            totalShares: { $sum: '$shareCount' },
            avgViews: { $avg: '$viewCount' },
            avgShares: { $avg: '$shareCount' }
          }
        },
        { $sort: { count: -1 } }
      ])

      // 获取每个分类的最新职位
      const latestJobs = await Job.aggregate([
        { $match: { status: 1, reviewStatus: 1 } },
        { $sort: { publishTime: -1 } },
        {
          $group: {
            _id: '$category',
            latestJob: { $first: '$$ROOT' }
          }
        }
      ])

      const latestJobMap = {}
      latestJobs.forEach(item => {
        latestJobMap[item._id] = {
          title: item.latestJob.title,
          company: item.latestJob.company,
          publishTime: item.latestJob.publishTime
        }
      })

      categoryStats = stats.map(item => ({
        category: item._id,
        count: item.count,
        totalViews: item.totalViews,
        totalShares: item.totalShares,
        avgViews: Math.round(item.avgViews || 0),
        avgShares: Math.round(item.avgShares || 0),
        latestJob: latestJobMap[item._id] || null
      }))

      // 缓存分类统计
      await cacheService.set(cacheKey, categoryStats, 60 * 60) // 1小时
    }

    logger.logBusiness('获取分类统计', req.user?._id)

    res.json(successResponse(categoryStats, '获取成功'))

  } catch (error) {
    logger.error('获取分类统计失败:', error.message)
    throw new BusinessError('获取分类统计失败')
  }
}

/**
 * 获取趋势统计
 */
const getTrendStatistics = async (req, res) => {
  const { days = 30, metrics = 'jobs' } = req.query

  try {
    const cacheKey = `statistics:trends:${days}:${metrics}`
    let trendStats = await cacheService.get(cacheKey)
    
    if (!trendStats) {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      let aggregationPipeline = []
      let collection

      switch (metrics) {
        case 'users':
          collection = User
          aggregationPipeline = [
            { $match: { createTime: { $gte: startDate }, status: 1 } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createTime' } },
                count: { $sum: 1 }
              }
            }
          ]
          break

        case 'shares':
          collection = Share
          aggregationPipeline = [
            { $match: { shareTime: { $gte: startDate }, status: 1 } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$shareTime' } },
                count: { $sum: 1 },
                totalClicks: { $sum: '$clickCount' },
                totalViews: { $sum: '$viewCount' }
              }
            }
          ]
          break

        case 'views':
          collection = Job
          aggregationPipeline = [
            { $match: { publishTime: { $gte: startDate }, status: 1, reviewStatus: 1 } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishTime' } },
                totalViews: { $sum: '$viewCount' },
                avgViews: { $avg: '$viewCount' },
                count: { $sum: 1 }
              }
            }
          ]
          break

        default: // jobs
          collection = Job
          aggregationPipeline = [
            { $match: { publishTime: { $gte: startDate }, status: 1, reviewStatus: 1 } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishTime' } },
                count: { $sum: 1 },
                totalViews: { $sum: '$viewCount' },
                totalShares: { $sum: '$shareCount' }
              }
            }
          ]
      }

      aggregationPipeline.push({ $sort: { _id: 1 } })

      const results = await collection.aggregate(aggregationPipeline)

      // 填充缺失的日期
      const dateRange = []
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        dateRange.push(date.toISOString().split('T')[0])
      }

      const resultMap = {}
      results.forEach(item => {
        resultMap[item._id] = item
      })

      trendStats = dateRange.map(date => {
        const data = resultMap[date] || { _id: date, count: 0 }
        return {
          date: data._id,
          count: data.count || 0,
          totalViews: data.totalViews || 0,
          totalShares: data.totalShares || 0,
          totalClicks: data.totalClicks || 0,
          avgViews: Math.round(data.avgViews || 0)
        }
      })

      // 缓存趋势统计
      await cacheService.set(cacheKey, trendStats, 30 * 60) // 30分钟
    }

    logger.logBusiness('获取趋势统计', req.user?._id, { days, metrics })

    res.json(successResponse(trendStats, '获取成功'))

  } catch (error) {
    logger.error('获取趋势统计失败:', error.message)
    throw new BusinessError('获取趋势统计失败')
  }
}

module.exports = {
  getOverview,
  getJobStatistics,
  getRegionStatistics,
  getCategoryStatistics,
  getTrendStatistics
}
