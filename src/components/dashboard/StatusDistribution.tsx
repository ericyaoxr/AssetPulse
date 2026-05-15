import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import type { Asset, AssetStatus } from "@/types"
import { getStatusLabel } from "@/utils/format"
import { useThemeVars } from "@/hooks/useThemeVar"

interface StatusDistributionProps {
  assets: Asset[]
}

const STATUS_BG: Record<AssetStatus, string> = {
  active: "bg-emerald-500",
  recycled: "bg-blue-500",
  scrapped: "bg-amber-500",
}

interface ChartData {
  status: AssetStatus
  count: number
  color: string
}

export default function StatusDistribution({ assets }: StatusDistributionProps) {
  const vars = useThemeVars({
    "--chart-status-active": "#10B981",
    "--chart-status-recycled": "#3B82F6",
    "--chart-status-scrapped": "#F59E0B",
  })

  const { data, total } = useMemo(() => {
    const STATUS_COLORS: Record<AssetStatus, string> = {
      active: vars["--chart-status-active"],
      recycled: vars["--chart-status-recycled"],
      scrapped: vars["--chart-status-scrapped"],
    }

    const countMap = new Map<AssetStatus, number>()
    assets.forEach((a) => {
      countMap.set(a.status, (countMap.get(a.status) || 0) + 1)
    })
    const data: ChartData[] = (
      ["active", "recycled", "scrapped"] as AssetStatus[]
    )
      .filter((status) => (countMap.get(status) || 0) > 0)
      .map((status) => ({
        status,
        count: countMap.get(status) || 0,
        color: STATUS_COLORS[status],
      }))
    return { data, total: assets.length }
  }, [assets, vars])

  return (
    <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-5">
      <h3 className="mb-4 text-base font-semibold text-content-primary">资产状态分布</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-content-faint">
          暂无数据
        </div>
      ) : (
        <>
          <div className="relative mx-auto h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-['Space_Grotesk'] text-3xl font-bold text-content-primary">
                {total}
              </span>
              <span className="text-xs text-content-muted">总资产</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            {(["active", "recycled", "scrapped"] as AssetStatus[]).map(
              (status) => {
                const item = data.find((d) => d.status === status)
                if (!item) return null
                return (
                  <div key={status} className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_BG[status]}`}
                    />
                    <span className="text-sm text-content-secondary">
                      {getStatusLabel(status)}
                    </span>
                    <span className="text-sm font-medium text-content-primary">
                      {item.count}
                    </span>
                  </div>
                )
              }
            )}
          </div>
        </>
      )}
    </div>
  )
}
