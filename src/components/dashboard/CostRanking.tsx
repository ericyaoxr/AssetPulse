import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { Asset } from "@/types"
import { formatCurrency } from "@/utils/format"

interface CostRankingProps {
  assets: Asset[]
}

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function getBarColor(dailyCost: number, maxCost: number): string {
  const barHigh = getCSSVar("--chart-bar-high") || "#F59E0B"
  const barMid = getCSSVar("--chart-bar-mid") || "#10B981"
  const barLow = getCSSVar("--chart-bar-low") || "#3B82F6"
  if (maxCost === 0) return barLow
  const ratio = dailyCost / maxCost
  if (ratio > 0.7) return barHigh
  if (ratio > 0.3) return barMid
  return barLow
}

interface ChartData {
  name: string
  dailyCost: number
  color: string
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartData }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 shadow-xl"
      style={{
        backgroundColor: getCSSVar("--chart-tooltip-bg"),
        border: `1px solid ${getCSSVar("--chart-tooltip-border")}`,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <p className="text-sm text-content-secondary">{data.name}</p>
      <p className="text-sm font-semibold text-content-primary">
        {formatCurrency(data.dailyCost)}/天
      </p>
    </div>
  )
}

export default function CostRanking({ assets }: CostRankingProps) {
  const data = useMemo(() => {
    const sorted = [...assets]
      .sort((a, b) => b.dailyCost - a.dailyCost)
      .slice(0, 5)
    const maxCost = sorted.length > 0 ? sorted[0].dailyCost : 0
    return sorted.map((a) => ({
      name: a.name.length > 8 ? a.name.slice(0, 8) + "…" : a.name,
      dailyCost: Number(a.dailyCost.toFixed(2)),
      color: getBarColor(a.dailyCost, maxCost),
    }))
  }, [assets])

  const chartTextColor = getCSSVar("--chart-text") || "rgba(255,255,255,0.4)"
  const chartTextLabelColor = getCSSVar("--chart-text-label") || "rgba(255,255,255,0.6)"

  return (
    <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-5">
      <h3 className="mb-4 text-base font-semibold text-content-primary">日均成本排行</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-content-faint">
          暂无数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: chartTextColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `¥${v}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fill: chartTextLabelColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="dailyCost" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
