import { useEffect, useMemo } from "react"
import { TrendingUp, Tag } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import StatsCards from "@/components/dashboard/StatsCards"
import CostRanking from "@/components/dashboard/CostRanking"
import TrendChart from "@/components/dashboard/TrendChart"
import StatusDistribution from "@/components/dashboard/StatusDistribution"
import { formatCurrency, formatDays } from "@/utils/format"

export default function Dashboard() {
  const { assets, recalculateAll } = useAssetStore()

  useEffect(() => {
    const interval = setInterval(() => { recalculateAll() }, 60000)
    return () => clearInterval(interval)
  }, [recalculateAll])

  const recycledAssets = useMemo(
    () => assets.filter((a) => a.status === "recycled" && a.recycleAmount != null),
    [assets]
  )

  const categoryData = useMemo(() => {
    const map = new Map<string, { count: number; totalInvestment: number }>()
    assets.forEach((a) => {
      const cat = a.category || "未分类"
      const prev = map.get(cat) ?? { count: 0, totalInvestment: 0 }
      prev.count += 1
      prev.totalInvestment += a.purchasePrice
      map.set(cat, prev)
    })
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
  }, [assets])

  const maxCategoryCount = useMemo(
    () => Math.max(...categoryData.map((c) => c.count), 1),
    [categoryData]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">仪表盘</h1>
        <p className="mt-1 text-sm text-white/50">追踪你的资产日均成本</p>
      </div>

      <StatsCards assets={assets} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CostRanking assets={assets} />
        <StatusDistribution assets={assets} />
      </div>

      <TrendChart assets={assets} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">盈亏复盘</h3>
          </div>
          {recycledAssets.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/30">暂无已回收资产</p>
          ) : (
            <div className="space-y-3">
              {recycledAssets.map((a) => {
                const isProfit = a.recycleAmount! >= a.purchasePrice
                const actualCost = a.purchasePrice - a.recycleAmount!
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-white/5 bg-white/[0.03] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate mr-2">{a.name}</span>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${isProfit ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        {isProfit ? "盈利" : "亏损"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/50">
                      <span>购入：{formatCurrency(a.purchasePrice)}</span>
                      <span>卖出：{formatCurrency(a.recycleAmount!)}</span>
                      <span>实际花费：<span className="text-white/70">{formatCurrency(actualCost)}</span></span>
                      <span>日均：<span className="text-white/70">{formatCurrency(a.dailyCost)}</span></span>
                    </div>
                    <div className="mt-1 text-xs text-white/30">{formatDays(a.effectiveDays)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">分类概览</h3>
          </div>
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/30">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {categoryData.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-white/70">{cat.name}</span>
                    <span className="text-white/40">
                      {cat.count} 件 · {formatCurrency(cat.totalInvestment)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
