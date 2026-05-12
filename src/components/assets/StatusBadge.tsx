import type { AssetStatus } from "@/types"
import { cn } from "@/lib/utils"

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  active: {
    label: "使用中",
    className: "bg-emerald-500/20 text-emerald-400",
  },
  recycled: {
    label: "已回收",
    className: "bg-blue-500/20 text-blue-400",
  },
  scrapped: {
    label: "已报废",
    className: "bg-amber-500/20 text-amber-400",
  },
}

interface StatusBadgeProps {
  status: AssetStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
