import { useMemo } from "react"
import { TrendingUp, TrendingDown, Star, FileText, ArrowRight } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { formatCurrency, formatDays } from "@/utils/format"

export default function Review() {
  const assets = useAssetStore((s) => s.assets)

  const recycled = useMemo(
    () => assets.filter((a) => a.status === "recycled"),
    [assets]
  )

  const summary = useMemo(() => {
    if (recycled.length === 0) return { count: 0, totalPL: 0, avgDailyCost: 0 }
    let totalPL = 0
    let totalDailyCost = 0
    recycled.forEach((a) => {
      const recycle = a.recycleAmount || 0
      totalPL += recycle - a.purchasePrice
      totalDailyCost += a.dailyCost
    })
    return {
      count: recycled.length,
      totalPL,
      avgDailyCost: totalDailyCost / recycled.length,
    }
  }, [recycled])

  if (recycled.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-content-primary">盈亏复盘</h1>
        <div className="flex flex-col items-center justify-center py-20 text-content-faint">
          <TrendingUp className="h-12 w-12 mb-3" />
          <p className="text-lg">暂无已回收资产</p>
          <p className="mt-1 text-sm">回收资产后将在此处查看盈亏</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-content-primary">盈亏复盘</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <p className="text-xs text-content-tertiary">已回收数量</p>
          <p className="mt-1 text-2xl font-bold text-content-primary">{summary.count}</p>
        </div>
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <p className="text-xs text-content-tertiary">总盈亏</p>
          <p className={`mt-1 text-2xl font-bold ${summary.totalPL >= 0 ? "text-accent" : "text-red-400"}`}>
            {summary.totalPL >= 0 ? "+" : ""}{formatCurrency(summary.totalPL)}
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <p className="text-xs text-content-tertiary">平均日均成本</p>
          <p className="mt-1 text-2xl font-bold text-content-primary">{formatCurrency(summary.avgDailyCost)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {recycled.map((asset) => {
          const recycle = asset.recycleAmount || 0
          const actualCost = asset.purchasePrice - recycle
          const isProfit = recycle >= asset.purchasePrice

          return (
            <div
              key={asset.id}
              className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4 transition-all hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-content-primary font-medium">{asset.name}</h3>
                    {asset.model && (
                      <span className="text-xs text-content-muted ml-2">{asset.model}</span>
                    )}
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-content-tertiary">
                      {asset.category}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isProfit ? "bg-accent-light text-accent" : "bg-red-500/20 text-red-400"
                    }`}>
                      {isProfit ? "盈利" : "亏损"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-content-secondary">
                    <span>{formatCurrency(asset.purchasePrice)}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span>{formatCurrency(recycle)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-content-tertiary">
                    <span>实际成本: {formatCurrency(actualCost)}</span>
                    <span>日均: {formatCurrency(asset.dailyCost)}</span>
                    <span>{formatDays(asset.effectiveDays)}</span>
                  </div>

                  {asset.rating != null && (
                    <div className="flex items-center gap-0.5 mt-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < asset.rating! ? "fill-amber-400 text-amber-400" : "text-content-faint"}`}
                        />
                      ))}
                    </div>
                  )}

                  {asset.note && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-content-muted">
                      <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{asset.note}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {isProfit ? (
                    <TrendingUp className="h-5 w-5 text-accent" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
