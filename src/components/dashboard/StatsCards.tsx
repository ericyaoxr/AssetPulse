import { Package, Activity, Wallet, TrendingUp, Diamond } from "lucide-react"
import type { Asset } from "@/types"
import { formatCurrency } from "@/utils/format"

interface StatsCardsProps {
  assets: Asset[]
}

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradientFromVar,
  gradientToVar,
  iconBg,
}: {
  icon: React.ElementType
  label: string
  value: string
  gradientFromVar: string
  gradientToVar: string
  iconBg: string
}) {
  const gradientFrom = getCSSVar(gradientFromVar) || "#10B981"
  const gradientTo = getCSSVar(gradientToVar) || "#34D399"

  return (
    <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-3 sm:p-4 transition-all hover:bg-surface-hover hover:border-white/20">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
        </div>
        <p className="text-[11px] sm:text-xs text-content-tertiary truncate">{label}</p>
      </div>
      <p
        className="font-['Space_Grotesk'] text-base sm:text-lg font-bold text-content-primary leading-tight"
        style={{
          backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function StatsCards({ assets }: StatsCardsProps) {
  const totalAssets = assets.length
  const activeAssets = assets.filter((a) => a.status === "active").length
  const totalInvestment = assets.reduce((sum, a) => sum + a.purchasePrice, 0)
  const avgDailyCost =
    assets.length > 0
      ? assets.reduce((sum, a) => sum + a.dailyCost, 0) / assets.length
      : 0
  const netValue = assets.reduce((sum, a) => {
    if (a.status === "active") return sum + a.purchasePrice
    if (a.recycleAmount != null) return sum + a.recycleAmount
    return sum
  }, 0)

  const cards = [
    {
      icon: Package,
      label: "资产总数",
      value: totalAssets.toString(),
      gradientFromVar: "--stat-gradient-emerald-from",
      gradientToVar: "--stat-gradient-emerald-to",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    {
      icon: Activity,
      label: "使用中",
      value: activeAssets.toString(),
      gradientFromVar: "--stat-gradient-blue-from",
      gradientToVar: "--stat-gradient-blue-to",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      icon: Wallet,
      label: "总投入",
      value: formatCurrency(totalInvestment),
      gradientFromVar: "--stat-gradient-amber-from",
      gradientToVar: "--stat-gradient-amber-to",
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
    {
      icon: TrendingUp,
      label: "平均日均成本",
      value: formatCurrency(avgDailyCost),
      gradientFromVar: "--stat-gradient-purple-from",
      gradientToVar: "--stat-gradient-purple-to",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      icon: Diamond,
      label: "资产净值",
      value: formatCurrency(netValue),
      gradientFromVar: "--stat-gradient-teal-from",
      gradientToVar: "--stat-gradient-teal-to",
      iconBg: "bg-gradient-to-br from-teal-500 to-cyan-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
