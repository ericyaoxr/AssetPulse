import { Package, Activity, Wallet, TrendingUp, Diamond } from "lucide-react"
import type { Asset } from "@/types"
import { formatCurrency } from "@/utils/format"

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
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition-all hover:bg-white/[0.08] hover:border-white/20">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-['Space_Grotesk'] text-lg font-bold text-white break-all leading-tight"
            style={{
              backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {value}
          </p>
          <p className="mt-0.5 text-xs text-white/50">{label}</p>
        </div>
      </div>
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
      gradientFrom: "#10B981",
      gradientTo: "#34D399",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    {
      icon: Activity,
      label: "使用中",
      value: activeAssets.toString(),
      gradientFrom: "#3B82F6",
      gradientTo: "#60A5FA",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      icon: Wallet,
      label: "总投入",
      value: formatCurrency(totalInvestment),
      gradientFrom: "#F59E0B",
      gradientTo: "#FBBF24",
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
    {
      icon: TrendingUp,
      label: "平均日均成本",
      value: formatCurrency(avgDailyCost),
      gradientFrom: "#8B5CF6",
      gradientTo: "#A78BFA",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      icon: Diamond,
      label: "资产净值",
      value: formatCurrency(netValue),
      gradientFrom: "#14B8A6",
      gradientTo: "#22D3EE",
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
