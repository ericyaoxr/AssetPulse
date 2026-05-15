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

export default function AssetCard({ asset }: AssetCardProps) {
  const navigate = useNavigate()

  const paybackProgress =
    asset.targetDailyCost != null && asset.status === "active"
      ? asset.targetDailyCost > 0
        ? Math.min(100, (asset.targetDailyCost / Math.max(0.01, asset.dailyCost)) * 100)
        : 0
      : null

  const isPaybackComplete = paybackProgress != null && asset.dailyCost <= asset.targetDailyCost!

  return (
    <div
      onClick={() => navigate(`/assets/${asset.id}`)}
      className={`cursor-pointer rounded-xl border border-white/10 border-l-4 ${borderColorMap[asset.status]} bg-white/5 backdrop-blur-md p-4 transition-all hover:bg-white/10 hover:border-white/20`}
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
              <span className="text-xs text-white/30">{asset.category}</span>
              {asset.location && (
                <>
                  <span className="text-white/15">·</span>
                  <span className="flex items-center gap-0.5 text-xs text-white/30">
                    <MapPin className="h-3 w-3" />
                    {asset.location}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-white font-medium text-sm leading-snug line-clamp-2">
              {asset.name}
            </h3>
            <div className="flex items-center gap-4 text-xs text-white/50 mt-1.5">
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
                  <span className="text-white/30 ml-1">
                    ({formatDate(asset.endDate)})
                  </span>
                )}
              </div>
            )}
            {asset.note && (
              <p className="flex items-start gap-1 text-xs text-white/35 mt-1.5 line-clamp-1">
                <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                <span className="truncate">{asset.note}</span>
              </p>
            )}
            {paybackProgress != null && (
              isPaybackComplete ? (
                <p className="text-xs text-emerald-400 mt-2">已回本</p>
              ) : (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-white/30 mb-1">
                    <span>回本进度</span>
                    <span>{paybackProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500 transition-all"
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
                <span className="text-white/25">
                  ({(asset.aiValuation.depreciationRate * 100).toFixed(0)}%折旧)
                </span>
              </div>
            )}
            {asset.rating != null && asset.status !== "active" && (
              <div className="flex items-center gap-0.5 mt-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < asset.rating! ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 self-center">
          <p
            className="text-2xl font-bold text-emerald-400"
            style={{ fontFamily: "'Space Grotesk', monospace" }}
          >
            {formatCurrency(asset.dailyCost)}
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            {formatDays(asset.effectiveDays)}
          </p>
          {asset.targetDailyCost != null && asset.status === "active" && (
            <p className="text-xs text-white/25 mt-1">
              目标 {formatCurrency(asset.targetDailyCost)}/天
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
