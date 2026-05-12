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
        <h1 className="text-2xl font-bold text-white">盈亏复盘</h1>
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <TrendingUp className="h-12 w-12 mb-3" />
          <p className="text-lg">暂无已回收资产</p>
          <p className="mt-1 text-sm">回收资产后将在此处查看盈亏</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">盈亏复盘</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
          <p className="text-xs text-white/50">已回收数量</p>
          <p className="mt-1 text-2xl font-bold text-white">{summary.count}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
          <p className="text-xs text-white/50">总盈亏</p>
          <p className={`mt-1 text-2xl font-bold ${summary.totalPL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {summary.totalPL >= 0 ? "+" : ""}{formatCurrency(summary.totalPL)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
          <p className="text-xs text-white/50">平均日均成本</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(summary.avgDailyCost)}</p>
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
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-all hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-medium">{asset.name}</h3>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                      {asset.category}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isProfit ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {isProfit ? "盈利" : "亏损"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                    <span>{formatCurrency(asset.purchasePrice)}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span>{formatCurrency(recycle)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/50">
                    <span>实际成本: {formatCurrency(actualCost)}</span>
                    <span>日均: {formatCurrency(asset.dailyCost)}</span>
                    <span>{formatDays(asset.effectiveDays)}</span>
                  </div>

                  {asset.rating != null && (
                    <div className="flex items-center gap-0.5 mt-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < asset.rating! ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
                        />
                      ))}
                    </div>
                  )}

                  {asset.note && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-white/40">
                      <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{asset.note}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {isProfit ? (
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
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
