import { useMemo } from "react"
import {
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format, parseISO, addMonths, startOfMonth } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { Asset } from "@/types"
import { formatCurrency } from "@/utils/format"

interface TrendChartProps {
  assets: Asset[]
}

interface ChartData {
  month: string
  label: string
  purchaseAmount: number
  dailyCostSum: number
}

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
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
      <p className="text-sm text-content-secondary mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.dataKey === "purchaseAmount" ? "购入" : "日均成本"}：{formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function TrendChart({ assets }: TrendChartProps) {
  const data = useMemo(() => {
    if (assets.length === 0) return []

    const allMonths = new Set<string>()
    assets.forEach((a) => {
      if (a.purchaseDate) {
        allMonths.add(a.purchaseDate.slice(0, 7))
      }
    })

    if (allMonths.size === 0) return []

    const sortedMonths = Array.from(allMonths).sort()
    const firstMonth = startOfMonth(parseISO(sortedMonths[0] + "-01"))
    const lastMonth = startOfMonth(parseISO(sortedMonths[sortedMonths.length - 1] + "-01"))

    const monthPurchaseMap = new Map<string, number>()
    assets.forEach((a) => {
      if (!a.purchaseDate) return
      const key = a.purchaseDate.slice(0, 7)
      monthPurchaseMap.set(key, (monthPurchaseMap.get(key) || 0) + a.purchasePrice)
    })

    const monthDailyCostMap = new Map<string, number>()
    assets.forEach((a) => {
      if (a.status !== "active" || !a.purchaseDate) return
      const purchaseMonth = a.purchaseDate.slice(0, 7)
      let current = startOfMonth(parseISO(purchaseMonth + "-01"))
      while (current <= lastMonth) {
        const key = format(current, "yyyy-MM")
        monthDailyCostMap.set(key, (monthDailyCostMap.get(key) || 0) + a.dailyCost)
        current = addMonths(current, 1)
      }
    })

    const result: ChartData[] = []
    let current = firstMonth
    while (current <= lastMonth) {
      const key = format(current, "yyyy-MM")
      result.push({
        month: key,
        label: format(current, "yy/M", { locale: zhCN }),
        purchaseAmount: Number((monthPurchaseMap.get(key) || 0).toFixed(2)),
        dailyCostSum: Number((monthDailyCostMap.get(key) || 0).toFixed(2)),
      })
      current = addMonths(current, 1)
    }

    return result
  }, [assets])

  const chartTextColor = getCSSVar("--chart-text") || "rgba(255,255,255,0.4)"
  const chartTextLabelColor = getCSSVar("--chart-text-label") || "rgba(255,255,255,0.6)"
  const chartGridColor = getCSSVar("--chart-grid") || "rgba(255,255,255,0.06)"
  const purchaseColor = getCSSVar("--chart-purchase") || "#F59E0B"
  const dailyCostColor = getCSSVar("--chart-daily-cost") || "#10B981"

  return (
    <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-5">
      <h3 className="mb-4 text-base font-semibold text-content-primary">消费趋势</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-content-faint">
          暂无数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={purchaseColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={purchaseColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: chartTextColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: chartTextColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `¥${v}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: chartTextColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `¥${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => (
                <span style={{ color: chartTextLabelColor, fontSize: 12 }}>
                  {value === "purchaseAmount" ? "月度购入" : "月度日均成本"}
                </span>
              )}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="purchaseAmount"
              stroke={purchaseColor}
              strokeWidth={2}
              fill="url(#purchaseGradient)"
              name="purchaseAmount"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="dailyCostSum"
              stroke={dailyCostColor}
              strokeWidth={2}
              dot={{ r: 3, fill: dailyCostColor }}
              activeDot={{ r: 5 }}
              name="dailyCostSum"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
