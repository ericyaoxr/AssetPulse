import { useMemo } from "react"
import { useAssetStore } from "@/store/useAssetStore"

export function useAnalytics() {
  const { assets } = useAssetStore()

  // 计算总投资金额
  const totalInvestment = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)
  }, [assets])

  // 计算总现值（使用AI估值或按折旧计算）
  const totalCurrentValue = useMemo(() => {
    return assets.reduce((sum, asset) => {
      if (asset.aiValuation?.estimatedValue) {
        return sum + asset.aiValuation.estimatedValue
      }
      // 如果没有AI估值，使用折旧后的估算值
      const dailyCost = asset.dailyCost
      const ageInDays = asset.effectiveDays
      const estimatedValue = asset.purchasePrice - (dailyCost * ageInDays)
      return sum + Math.max(estimatedValue, asset.purchasePrice * 0.1)
    }, 0)
  }, [assets])

  // 计算资产折旧率
  const totalDepreciation = useMemo(() => {
    return totalInvestment - totalCurrentValue
  }, [totalInvestment, totalCurrentValue])

  // 按分类统计
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {}
    assets.forEach((asset) => {
      if (!stats[asset.category]) {
        stats[asset.category] = { count: 0, value: 0 }
      }
      stats[asset.category].count++
      stats[asset.category].value += asset.purchasePrice
    })
    return stats
  }, [assets])

  // 按状态统计
  const statusStats = useMemo(() => {
    const stats: Record<string, number> = { active: 0, recycled: 0, scrapped: 0 }
    assets.forEach((asset) => {
      stats[asset.status]++
    })
    return stats
  }, [assets])

  // 按标签统计
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {}
    assets.forEach((asset) => {
      (asset.tags || []).forEach((tag) => {
        stats[tag] = (stats[tag] || 0) + 1
      })
    })
    return stats
  }, [assets])

  // 获取最贵的资产
  const topExpensiveAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => b.purchasePrice - a.purchasePrice)
      .slice(0, 10)
  }, [assets])

  // 获取日折旧最高的资产
  const topDepreciationAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => b.dailyCost - a.dailyCost)
      .slice(0, 10)
  }, [assets])

  // 计算投资回报率
  const roi = useMemo(() => {
    if (totalInvestment === 0) return 0
    return ((totalCurrentValue - totalInvestment) / totalInvestment) * 100
  }, [totalInvestment, totalCurrentValue])

  // 平均资产价值
  const averageAssetValue = useMemo(() => {
    return assets.length === 0 ? 0 : totalInvestment / assets.length
  }, [totalInvestment, assets.length])

  // 按月份统计新增资产（用于图表）
  const monthlyAssetStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {}
    
    assets.forEach((asset) => {
      const date = new Date(asset.purchaseDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!stats[monthKey]) {
        stats[monthKey] = { count: 0, value: 0 }
      }
      stats[monthKey].count++
      stats[monthKey].value += asset.purchasePrice
    })

    // 转换为数组并按时间排序
    const sortedStats = Object.entries(stats)
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return sortedStats
  }, [assets])

  // 获取资产使用时间分布
  const ageDistribution = useMemo(() => {
    const ranges = [
      { label: "0-30天", min: 0, max: 30, count: 0 },
      { label: "31-90天", min: 31, max: 90, count: 0 },
      { label: "91-180天", min: 91, max: 180, count: 0 },
      { label: "181-365天", min: 181, max: 365, count: 0 },
      { label: "1-2年", min: 366, max: 730, count: 0 },
      { label: "2年以上", min: 731, max: Infinity, count: 0 },
    ]

    assets.forEach((asset) => {
      const days = asset.effectiveDays
      const range = ranges.find((r) => days >= r.min && days <= r.max)
      if (range) {
        range.count++
      }
    })

    return ranges
  }, [assets])

  return {
    totalInvestment,
    totalCurrentValue,
    totalDepreciation,
    categoryStats,
    statusStats,
    tagStats,
    topExpensiveAssets,
    topDepreciationAssets,
    roi,
    averageAssetValue,
    monthlyAssetStats,
    ageDistribution,
    totalAssets: assets.length,
  }
}
