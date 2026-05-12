import { useNavigate } from "react-router-dom"
import { Calendar, Coins, Star } from "lucide-react"
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
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {asset.imageUrl && (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="h-12 w-12 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="truncate text-white font-medium text-sm">
                {asset.name}
              </h3>
              <StatusBadge status={asset.status} />
            </div>
            <p className="text-xs text-white/40 mb-2">{asset.category}</p>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(asset.purchaseDate)}
              </span>
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {formatCurrency(asset.purchasePrice)}
              </span>
            </div>
            {paybackProgress != null && (
              isPaybackComplete ? (
                <p className="text-xs text-emerald-400 mt-2">已回本</p>
              ) : (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500"
                      style={{ width: `${paybackProgress}%` }}
                    />
                  </div>
                </div>
              )
            )}
            {asset.rating != null && asset.status !== "active" && (
              <div className="flex items-center gap-0.5 mt-2">
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
        <div className="text-right ml-4 shrink-0">
          <p
            className="text-2xl font-bold text-emerald-400"
            style={{ fontFamily: "'Space Grotesk', monospace" }}
          >
            {formatCurrency(asset.dailyCost)}
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            {formatDays(asset.effectiveDays)}
          </p>
        </div>
      </div>
    </div>
  )
}
