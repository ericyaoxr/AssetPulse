import { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { Asset } from "@/types"
import { formatCurrency } from "@/utils/format"

interface TrendChartProps {
  assets: Asset[]
}

interface ChartData {
  month: string
  amount: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-[#0D1B1E]/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-sm text-white/70">{label}</p>
      <p className="text-sm font-semibold text-white">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export default function TrendChart({ assets }: TrendChartProps) {
  const data = useMemo(() => {
    const monthMap = new Map<string, number>()
    assets.forEach((asset) => {
      const key = format(new Date(asset.purchaseDate), "yyyy-MM")
      monthMap.set(key, (monthMap.get(key) || 0) + asset.purchasePrice)
    })
    const sorted: ChartData[] = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, amount]) => ({
        month: format(new Date(key + "-01"), "M月", { locale: zhCN }),
        amount: Number(amount.toFixed(2)),
      }))
    return sorted
  }, [assets])

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <h3 className="mb-4 text-base font-semibold text-white">消费趋势</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-white/30">
          暂无数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `¥${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#emeraldGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
