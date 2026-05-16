import { useMemo } from "react"
import { Package, Activity, Wallet, TrendingUp, Diamond } from "lucide-react"
import type { Asset } from "@/types"
import { formatCurrency } from "@/utils/format"
import { useThemeVars } from "@/hooks/useThemeVar"

interface StatsCardsProps {
  assets: Asset[]
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradientFrom,
  gradientTo,
  iconBg,
}: {
  icon: React.ElementType
  label: string
  value: string
  gradientFrom: string
  gradientTo: string
  iconBg: string
}) {
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
  const { totalAssets, activeAssets, totalInvestment, avgDailyCost, netValue } = useMemo(() => {
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
    return { totalAssets, activeAssets, totalInvestment, avgDailyCost, netValue }
  }, [assets])

  const vars = useThemeVars({
    "--stat-gradient-emerald-from": "#10B981",
    "--stat-gradient-emerald-to": "#34D399",
    "--stat-gradient-blue-from": "#3B82F6",
    "--stat-gradient-blue-to": "#60A5FA",
    "--stat-gradient-amber-from": "#F59E0B",
    "--stat-gradient-amber-to": "#FBBF24",
    "--stat-gradient-purple-from": "#8B5CF6",
    "--stat-gradient-purple-to": "#A78BFA",
    "--stat-gradient-teal-from": "#14B8A6",
    "--stat-gradient-teal-to": "#22D3EE",
  })

  const cards = [
    {
      icon: Package,
      label: "资产总数",
      value: totalAssets.toString(),
      gradientFrom: vars["--stat-gradient-emerald-from"],
      gradientTo: vars["--stat-gradient-emerald-to"],
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    {
      icon: Activity,
      label: "使用中",
      value: activeAssets.toString(),
      gradientFrom: vars["--stat-gradient-blue-from"],
      gradientTo: vars["--stat-gradient-blue-to"],
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      icon: Wallet,
      label: "总投入",
      value: formatCurrency(totalInvestment),
      gradientFrom: vars["--stat-gradient-amber-from"],
      gradientTo: vars["--stat-gradient-amber-to"],
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
    {
      icon: TrendingUp,
      label: "平均日均成本",
      value: formatCurrency(avgDailyCost),
      gradientFrom: vars["--stat-gradient-purple-from"],
      gradientTo: vars["--stat-gradient-purple-to"],
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      icon: Diamond,
      label: "资产净值",
      value: formatCurrency(netValue),
      gradientFrom: vars["--stat-gradient-teal-from"],
      gradientTo: vars["--stat-gradient-teal-to"],
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
