import { useState } from "react"
import { 
  TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, 
  Trophy, DollarSign, Clock, ArrowUpRight, 
  ArrowDownRight
} from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, 
  Cell, BarChart, Bar, Legend 
} from "recharts"
import { useAnalytics } from "@/hooks/useAnalytics"
import { formatCurrency, formatDays } from "@/utils/format"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AnalyticsPage() {
  const analytics = useAnalytics()
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '90d' | '365d'>('all')

  // 准备分类数据用于饼图
  const categoryChartData = Object.entries(analytics.categoryStats).map(([name, data]) => ({
    name,
    value: data.value,
    count: data.count
  }))

  // 准备使用时间分布数据用于条形图
  const ageChartData = analytics.ageDistribution.map((range) => ({
    name: range.label,
    count: range.count
  }))

  // 准备月度数据用于折线图
  const monthlyChartData = analytics.monthlyAssetStats

  // 统计卡片
  const statsCards = [
    {
      title: "总资产",
      value: analytics.totalAssets,
      icon: PieChart,
      color: "text-blue-400"
    },
    {
      title: "总投资",
      value: formatCurrency(analytics.totalInvestment),
      icon: DollarSign,
      color: "text-green-400"
    },
    {
      title: "当前估值",
      value: formatCurrency(analytics.totalCurrentValue),
      icon: TrendingUp,
      color: "text-emerald-400"
    },
    {
      title: "总折旧",
      value: formatCurrency(analytics.totalDepreciation),
      icon: TrendingDown,
      color: "text-red-400"
    },
    {
      title: "投资回报率",
      value: `${analytics.roi.toFixed(1)}%`,
      icon: analytics.roi >= 0 ? ArrowUpRight : ArrowDownRight,
      color: analytics.roi >= 0 ? "text-emerald-400" : "text-red-400"
    },
    {
      title: "平均资产价值",
      value: formatCurrency(analytics.averageAssetValue),
      icon: Trophy,
      color: "text-yellow-400"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">数据分析</h1>
          <p className="mt-1 text-sm text-content-tertiary">深入了解你的资产状况</p>
        </div>
        <div className="flex gap-2">
          {(['all', '30d', '90d', '365d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-content-muted hover:bg-white/10'
              }`}
            >
              {range === 'all' ? '全部' :
               range === '30d' ? '30天' :
               range === '90d' ? '90天' : '1年'}
            </button>
          ))}
        </div>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <div 
            key={index} 
            className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-xs text-content-muted mb-1">{stat.title}</p>
            <p className="text-lg font-semibold text-content-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 图表区域 - 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类分布饼图 */}
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
          <h3 className="text-sm font-medium text-content-secondary mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            资产分类分布
          </h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-content-muted text-sm">
              暂无数据
            </div>
          )}
        </div>

        {/* 使用时间分布柱状图 */}
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
          <h3 className="text-sm font-medium text-content-secondary mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            资产使用时间分布
          </h3>
          {ageChartData.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-content-muted text-sm">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* 月度资产趋势图 */}
      {monthlyChartData.length > 0 && (
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
          <h3 className="text-sm font-medium text-content-secondary mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            资产增长趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0088FE" 
                strokeWidth={2}
                dot={{ fill: '#0088FE' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#00C49F" 
                strokeWidth={2}
                dot={{ fill: '#00C49F' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 资产排行表格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最贵资产排行 */}
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
          <h3 className="text-sm font-medium text-content-secondary mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            最贵资产 Top 10
          </h3>
          {analytics.topExpensiveAssets.length > 0 ? (
            <div className="space-y-3">
              {analytics.topExpensiveAssets.map((asset, index) => (
                <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3 ? 'bg-accent/20 text-accent' : 'bg-white/5 text-content-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-content-primary text-sm">{asset.name}</p>
                      {asset.model && (
                        <p className="text-xs text-content-muted">{asset.model}</p>
                      )}
                      <p className="text-xs text-content-muted">{asset.category}</p>
                    </div>
                  </div>
                  <p className="font-medium text-content-primary">{formatCurrency(asset.purchasePrice)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-content-muted text-sm">
              暂无数据
            </div>
          )}
        </div>

        {/* 日折旧最高排行 */}
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
          <h3 className="text-sm font-medium text-content-secondary mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            日折旧最高 Top 10
          </h3>
          {analytics.topDepreciationAssets.length > 0 ? (
            <div className="space-y-3">
              {analytics.topDepreciationAssets.map((asset, index) => (
                <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-content-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-content-primary text-sm">{asset.name}</p>
                      {asset.model && (
                        <p className="text-xs text-content-muted">{asset.model}</p>
                      )}
                      <p className="text-xs text-content-muted">已使用 {formatDays(asset.effectiveDays)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-400">{formatCurrency(asset.dailyCost)}/天</p>
                    <p className="text-xs text-content-muted">已折旧 {formatCurrency(asset.dailyCost * asset.effectiveDays)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-content-muted text-sm">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* 状态统计 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
        <h3 className="text-sm font-medium text-content-secondary mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          资产状态统计
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-2xl font-bold text-emerald-400">{analytics.statusStats.active}</div>
            <div className="text-xs text-content-muted">使用中</div>
          </div>
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-400">{analytics.statusStats.recycled}</div>
            <div className="text-xs text-content-muted">已回收</div>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-2xl font-bold text-red-400">{analytics.statusStats.scrapped}</div>
            <div className="text-xs text-content-muted">已报废</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{Object.keys(analytics.tagStats).length}</div>
            <div className="text-xs text-content-muted">标签数量</div>
          </div>
        </div>
      </div>
    </div>
  )
}
