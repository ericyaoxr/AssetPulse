import { useEffect, useMemo } from "react"
import { TrendingUp, Tag } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import StatsCards from "@/components/dashboard/StatsCards"
import CostRanking from "@/components/dashboard/CostRanking"
import TrendChart from "@/components/dashboard/TrendChart"
import AIValuationOverview from "@/components/dashboard/AIValuationOverview"
import WelcomeGuide from "@/components/WelcomeGuide"
import { ShareCard } from "@/components/share/ShareCard"
import { ReportShareTemplate } from "@/components/share/ReportShareTemplate"
import { formatCurrency, formatDays } from "@/utils/format"
import { useThemeVar } from "@/hooks/useThemeVar"

export default function Dashboard() {
  const { assets, recalculateAll } = useAssetStore()
  const activeAssets = assets.filter((a) => a.status === "active")

  useEffect(() => {
    recalculateAll()
  }, [recalculateAll])

  const currentYear = new Date().getFullYear()

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

  const categoryBarFrom = useThemeVar("--chart-bar-low", "#3B82F6")
  const categoryBarTo = useThemeVar("--chart-status-recycled", "#60A5FA")
  const tagIconColor = useThemeVar("--chart-bar-low", "#3B82F6")

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">仪表盘</h1>
            <p className="mt-1 text-sm text-content-tertiary">追踪你的资产日均成本</p>
          </div>
          {assets.length > 0 && (
            <ShareCard title={`${currentYear}年度资产报告`} filename={`assetpulse-report-${currentYear}.png`}>
              <ReportShareTemplate assets={assets} year={currentYear} />
            </ShareCard>
          )}
        </div>
      </div>

      {activeAssets.length === 0 ? (
        <WelcomeGuide />
      ) : (
      <>
      <StatsCards assets={assets} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CostRanking assets={assets} />
        <AIValuationOverview assets={assets} />
      </div>

      <TrendChart assets={assets} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h3 className="text-base font-semibold text-content-primary">盈亏复盘</h3>
          </div>
          {recycledAssets.length === 0 ? (
            <p className="py-8 text-center text-sm text-content-faint">暂无已回收资产</p>
          ) : (
            <div className="space-y-3">
              {recycledAssets.map((a) => {
                const isProfit = a.recycleAmount! >= a.purchasePrice
                const actualCost = a.purchasePrice - a.recycleAmount!
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-edge-subtle bg-surface-secondary p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-content-primary truncate mr-2">{a.name}</span>
                      {a.model && (
                        <span className="text-xs text-content-muted truncate">{a.model}</span>
                      )}
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${isProfit ? "bg-accent-light text-accent" : "bg-red-500/20 text-red-400"}`}>
                        {isProfit ? "盈利" : "亏损"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-content-tertiary">
                      <span>购入：{formatCurrency(a.purchasePrice)}</span>
                      <span>卖出：{formatCurrency(a.recycleAmount!)}</span>
                      <span>实际花费：<span className="text-content-secondary">{formatCurrency(actualCost)}</span></span>
                      <span>日均：<span className="text-content-secondary">{formatCurrency(a.dailyCost)}</span></span>
                    </div>
                    <div className="mt-1 text-xs text-content-faint">{formatDays(a.effectiveDays)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" style={{ color: tagIconColor }} />
            <h3 className="text-base font-semibold text-content-primary">分类概览</h3>
          </div>
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-content-faint">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {categoryData.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-content-secondary">{cat.name}</span>
                    <span className="text-content-muted">
                      {cat.count} 件 · {formatCurrency(cat.totalInvestment)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-hover">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(cat.count / maxCategoryCount) * 100}%`,
                        background: `linear-gradient(to right, ${categoryBarFrom}, ${categoryBarTo})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  )
}
