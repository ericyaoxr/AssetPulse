import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Sparkles } from "lucide-react"
import type { Asset } from "@/types"
import { formatCurrency } from "@/utils/format"
import { useThemeVars } from "@/hooks/useThemeVar"

interface AIValuationOverviewProps {
  assets: Asset[]
}

interface ChartData {
  name: string
  purchasePrice: number
  estimatedValue: number
  diff: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  tooltipBg,
  tooltipBorder,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartData }>
  tooltipBg: string
  tooltipBorder: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 shadow-xl"
      style={{
        backgroundColor: tooltipBg,
        border: `1px solid ${tooltipBorder}`,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <p className="text-sm font-medium text-content-primary mb-1">{d.name}</p>
      <p className="text-xs text-content-secondary">购入价：{formatCurrency(d.purchasePrice)}</p>
      <p className="text-xs text-content-secondary">AI 估值：{formatCurrency(d.estimatedValue)}</p>
      <p className={`text-xs font-semibold ${d.diff >= 0 ? "text-accent" : "text-red-400"}`}>
        {d.diff >= 0 ? "↑ 升值" : "↓ 贬值"} {formatCurrency(Math.abs(d.diff))}
      </p>
    </div>
  )
}

export default function AIValuationOverview({ assets }: AIValuationOverviewProps) {
  const vars = useThemeVars({
    "--chart-text": "rgba(255,255,255,0.4)",
    "--chart-text-label": "rgba(255,255,255,0.6)",
    "--chart-bar-high": "#F59E0B",
    "--chart-bar-mid": "#10B981",
    "--chart-bar-low": "#3B82F6",
    "--chart-tooltip-bg": "rgba(13,27,30,0.95)",
    "--chart-tooltip-border": "rgba(255,255,255,0.1)",
    "--accent": "#10B981",
  })

  const { data, totalPurchase, totalEstimated, totalDiff } = useMemo(() => {
    const withValuation = assets.filter(
      (a) => a.status === "active" && a.aiValuation?.estimatedValue
    )
    const sorted = [...withValuation]
      .sort(
        (a, b) =>
          Math.abs(b.aiValuation!.estimatedValue - b.purchasePrice) -
          Math.abs(a.aiValuation!.estimatedValue - a.purchasePrice)
      )
      .slice(0, 6)

    let tp = 0
    let te = 0
    withValuation.forEach((a) => {
      tp += a.purchasePrice
      te += a.aiValuation!.estimatedValue
    })

    const data: ChartData[] = sorted.map((a) => {
      const diff = a.aiValuation!.estimatedValue - a.purchasePrice
      let color = vars["--chart-bar-low"]
      if (diff > 0) color = vars["--chart-bar-mid"]
      else if (diff < 0) color = vars["--chart-bar-high"]
      return {
        name: a.name.length > 6 ? a.name.slice(0, 6) + "…" : a.name,
        purchasePrice: Number(a.purchasePrice.toFixed(2)),
        estimatedValue: Number(a.aiValuation!.estimatedValue.toFixed(2)),
        diff: Number(diff.toFixed(2)),
        color,
      }
    })

    return { data, totalPurchase: tp, totalEstimated: te, totalDiff: te - tp }
  }, [assets, vars])

  const diffPercent =
    totalPurchase > 0 ? ((totalDiff / totalPurchase) * 100).toFixed(1) : "0"

  return (
    <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: vars["--accent"] }} />
        <h3 className="text-base font-semibold text-content-primary">AI 估值总计</h3>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-sm text-content-faint">
          <Sparkles className="mb-2 h-8 w-8 opacity-30" />
          <p>暂无 AI 估值数据</p>
          <p className="mt-1 text-xs text-content-muted">在资产详情中点击 AI 估值即可生成</p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-surface-secondary p-3 text-center">
              <p className="text-xs text-content-muted">总购入</p>
              <p className="font-['Space_Grotesk'] text-sm font-bold text-content-primary">
                {formatCurrency(totalPurchase)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-secondary p-3 text-center">
              <p className="text-xs text-content-muted">AI 总估值</p>
              <p className="font-['Space_Grotesk'] text-sm font-bold text-content-primary">
                {formatCurrency(totalEstimated)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-secondary p-3 text-center">
              <p className="text-xs text-content-muted">总变动</p>
              <p
                className={`font-['Space_Grotesk'] text-sm font-bold ${totalDiff >= 0 ? "text-accent" : "text-red-400"}`}
              >
                {totalDiff >= 0 ? "+" : ""}
                {diffPercent}%
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data}
              margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: vars["--chart-text"], fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: vars["--chart-text"], fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    tooltipBg={vars["--chart-tooltip-bg"]}
                    tooltipBorder={vars["--chart-tooltip-border"]}
                  />
                }
                cursor={false}
              />
              <Bar dataKey="estimatedValue" radius={[6, 6, 0, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
