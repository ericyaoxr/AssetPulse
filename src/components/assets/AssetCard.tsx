import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  Coins,
  Star,
  MapPin,
  FileText,
  RotateCcw,
  Bot,
} from "lucide-react"
import React from "react"
import type { Asset } from "@/types"
import { formatCurrency, formatDays, formatDate } from "@/utils/format"
import StatusBadge from "@/components/assets/StatusBadge"

const borderColorMap: Record<Asset["status"], string> = {
  active: "border-l-emerald-500",
  recycled: "border-l-blue-500",
  scrapped: "border-l-amber-500",
}

interface AssetCardProps {
  asset: Asset
}

function AssetCard({ asset }: AssetCardProps) {
  const navigate = useNavigate()

  const paybackProgress = useMemo(() => {
    if (asset.targetDailyCost == null || asset.status !== "active") return null
    if (asset.targetDailyCost <= 0) return 0
    return Math.min(100, (asset.targetDailyCost / Math.max(0.01, asset.dailyCost)) * 100)
  }, [asset.targetDailyCost, asset.status, asset.dailyCost])

  const isPaybackComplete = paybackProgress != null && asset.dailyCost <= asset.targetDailyCost!

  return (
    <div
      onClick={() => navigate(`/assets/${asset.id}`)}
      className={`cursor-pointer rounded-xl border border-edge border-l-4 ${borderColorMap[asset.status]} bg-surface backdrop-blur-md p-4 transition-all hover:bg-white/10 hover:border-white/20`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {asset.imageUrl && (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="h-12 w-12 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={asset.status} />
              <span className="text-xs text-content-faint">{asset.category}</span>
              {asset.location && (
                <>
                  <span className="text-content-faint">·</span>
                  <span className="flex items-center gap-0.5 text-xs text-content-faint">
                    <MapPin className="h-3 w-3" />
                    {asset.location}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-content-primary font-medium text-sm leading-snug line-clamp-2">
              {asset.name}
            </h3>
            <div className="flex items-center gap-4 text-xs text-content-tertiary mt-1.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(asset.purchaseDate)}
              </span>
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {formatCurrency(asset.purchasePrice)}
              </span>
            </div>
            {asset.recycleAmount != null && asset.recycleAmount > 0 && (
              <div className="flex items-center gap-1 text-xs text-blue-400/70 mt-1.5">
                <RotateCcw className="h-3 w-3" />
                回收 {formatCurrency(asset.recycleAmount)}
                {asset.endDate && (
                  <span className="text-content-faint ml-1">
                    ({formatDate(asset.endDate)})
                  </span>
                )}
              </div>
            )}
            {asset.tags && asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {asset.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-xs text-content-faint">
                    {tag}
                  </span>
                ))}
                {asset.tags.length > 3 && (
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-xs text-content-faint">
                    +{asset.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            {asset.note && (
              <p className="flex items-start gap-1 text-xs text-content-muted mt-1.5 line-clamp-1">
                <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                <span className="truncate">{asset.note}</span>
              </p>
            )}
            {paybackProgress != null && (
              isPaybackComplete ? (
                <p className="text-xs text-accent mt-2">已回本</p>
              ) : (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-content-faint mb-1">
                    <span>回本进度</span>
                    <span>{paybackProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-accent transition-all"
                      style={{ width: `${paybackProgress}%` }}
                    />
                  </div>
                </div>
              )
            )}
            {asset.aiValuation && (
              <div className="flex items-center gap-1 text-xs text-purple-400/70 mt-1.5">
                <Bot className="h-3 w-3" />
                <span>
                  AI估值 {formatCurrency(asset.aiValuation.estimatedValue)}
                </span>
                <span className="text-content-faint">
                  ({(asset.aiValuation.depreciationRate * 100).toFixed(0)}%折旧)
                </span>
              </div>
            )}
            {asset.rating != null && asset.status !== "active" && (
              <div className="flex items-center gap-0.5 mt-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < asset.rating! ? "fill-amber-400 text-amber-400" : "text-content-faint"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 self-center">
          <p
            className="text-2xl font-bold text-accent"
            style={{ fontFamily: "'Space Grotesk', monospace" }}
          >
            {formatCurrency(asset.dailyCost)}
          </p>
          <p className="text-xs text-content-muted mt-0.5">
            {formatDays(asset.effectiveDays)}
          </p>
          {asset.targetDailyCost != null && asset.status === "active" && (
            <p className="text-xs text-content-faint mt-1">
              目标 {formatCurrency(asset.targetDailyCost)}/天
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(AssetCard)
