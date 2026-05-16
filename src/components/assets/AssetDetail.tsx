import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Pencil, Trash2, ChevronDown, Calendar, Coins, Clock, TrendingDown, X,
  Tag, MapPin, Target, Star, FileText, Sparkles, Loader2, RefreshCw, AlertCircle,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { differenceInDays, format, eachMonthOfInterval } from "date-fns"
import type { Asset, AssetStatus } from "@/types"
import { formatCurrency, formatDays, formatDate } from "@/utils/format"
import { useAssetStore } from "@/store/useAssetStore"
import { estimateAssetValue, loadAIConfig } from "@/utils/aiValuation"
import StatusBadge from "@/components/assets/StatusBadge"
import { useThemeVars } from "@/hooks/useThemeVar"

interface AssetDetailProps {
  asset: Asset
}

const statusLabels: Record<AssetStatus, string> = {
  active: "使用中", recycled: "已回收", scrapped: "已报废",
}

const AssetDetail = ({ asset }: AssetDetailProps) => {
  const navigate = useNavigate()
  const { deleteAsset, updateStatus, updateAssetAIValuation } = useAssetStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [newStatus, setNewStatus] = useState<AssetStatus | null>(null)
  const [statusEndDate, setStatusEndDate] = useState("")
  const [statusRecycleAmount, setStatusRecycleAmount] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const aiResult = asset.aiValuation

  const handleAIValuation = async () => {
    const config = await loadAIConfig()
    if (!config || !config.baseUrl || !config.model) {
      setAiError("请先在 AI 估值设置中配置 AI 服务")
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await estimateAssetValue(config, asset)
      await updateAssetAIValuation(asset.id, result)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "估值失败")
    } finally {
      setAiLoading(false)
    }
  }

  const chartData = useMemo(() => {
    const purchaseDate = new Date(asset.purchaseDate)
    const now = new Date()
    if (differenceInDays(now, purchaseDate) <= 0) return []
    const months = eachMonthOfInterval({ start: purchaseDate, end: now })
    const recycle = asset.recycleAmount && asset.recycleAmount > 0 ? asset.recycleAmount : 0
    return months.map((month) => {
      const daysSoFar = Math.max(1, differenceInDays(month, purchaseDate))
      return { date: format(month, "yyyy-MM"), cost: Math.round(((asset.purchasePrice - recycle) / daysSoFar) * 100) / 100 }
    })
  }, [asset])

  const chartVars = useThemeVars({
    "--chart-grid": "rgba(255,255,255,0.06)",
    "--chart-text": "rgba(255,255,255,0.4)",
    "--chart-daily-cost": "#10B981",
    "--chart-tooltip-bg": "rgba(13,27,30,0.95)",
    "--chart-tooltip-border": "rgba(255,255,255,0.1)",
    "--text-primary": "#ffffff",
  })

  const progress = asset.targetDailyCost && asset.targetDailyCost > 0
    ? Math.min(100, (asset.targetDailyCost / Math.max(0.01, asset.dailyCost)) * 100)
    : 0

  const progressColor = progress >= 100 ? "bg-accent" : progress < 50 ? "bg-amber-500" : "bg-blue-500"

  const actualSpend = asset.purchasePrice - (asset.recycleAmount || 0)

  const handleDelete = async () => {
    await deleteAsset(asset.id)
    navigate("/")
  }

  const handleStatusChange = async () => {
    if (!newStatus) return
    await updateStatus(asset.id, newStatus, newStatus !== "active" ? statusEndDate : null, newStatus === "recycled" ? parseFloat(statusRecycleAmount) || 0 : null)
    setNewStatus(null)
    setStatusEndDate("")
    setStatusRecycleAmount("")
    setShowStatusDropdown(false)
  }

  return (
    <div className="space-y-6">
      {asset.imageUrl && (
        <img
          src={asset.imageUrl}
          alt={asset.name}
          className="w-full max-h-64 object-cover rounded-xl cursor-pointer hover:opacity-90"
          onClick={() => setShowImagePreview(true)}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-content-primary">{asset.name}</h2>
          <div className="mt-2"><StatusBadge status={asset.status} /></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/assets/${asset.id}/edit`)} className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-surface">
            <Pencil className="h-4 w-4" />编辑
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />删除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoItem icon={<Tag className="h-4 w-4" />} label="分类" value={asset.category || "-"} />
        <InfoItem icon={<MapPin className="h-4 w-4" />} label="位置" value={asset.location || "-"} />
        <InfoItem icon={<Calendar className="h-4 w-4" />} label="购入日期" value={formatDate(asset.purchaseDate)} />
        <InfoItem icon={<Coins className="h-4 w-4" />} label="购入价格" value={formatCurrency(asset.purchasePrice)} />
        <InfoItem icon={<Calendar className="h-4 w-4" />} label="结束日期" value={formatDate(asset.endDate)} />
        <InfoItem icon={<Coins className="h-4 w-4" />} label="回收金额" value={asset.recycleAmount != null ? formatCurrency(asset.recycleAmount) : "-"} />
        <InfoItem icon={<Clock className="h-4 w-4" />} label="有效天数" value={formatDays(asset.effectiveDays)} />
        <InfoItem icon={<TrendingDown className="h-4 w-4" />} label="日均成本" value={formatCurrency(asset.dailyCost)} highlight />
        <InfoItem icon={<Target className="h-4 w-4" />} label="目标日均" value={asset.targetDailyCost != null ? formatCurrency(asset.targetDailyCost) : "-"} />
      </div>

      {asset.targetDailyCost != null && asset.targetDailyCost > 0 && (
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <h3 className="mb-3 text-sm font-medium text-content-secondary">回本进度</h3>
          {asset.dailyCost <= asset.targetDailyCost ? (
            <p className="text-lg font-bold text-accent">🎉 已回本！</p>
          ) : (
            <div>
              <div className="mb-1 flex justify-between text-xs text-content-tertiary">
                <span>{Math.round(progress)}%</span>
                <span>{formatCurrency(asset.dailyCost)} / {formatCurrency(asset.targetDailyCost)}</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div className={`h-3 rounded-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {asset.rating != null && asset.status !== "active" && (
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <h3 className="mb-2 text-sm font-medium text-content-secondary">评分</h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-5 w-5 ${i <= asset.rating! ? "fill-accent text-accent" : "text-content-faint"}`} />
            ))}
          </div>
        </div>
      )}

      {asset.note && (
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-content-muted">
            <FileText className="h-4 w-4" />备注
          </div>
          <p className="text-sm text-content-secondary">{asset.note}</p>
        </div>
      )}

      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-content-secondary">
            <Sparkles className="h-4 w-4 text-accent" />AI 残值估算
          </h3>
          <button
            onClick={handleAIValuation}
            disabled={aiLoading}
            className="flex items-center gap-1.5 rounded-lg bg-accent/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {aiLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />估算中...</>
            ) : aiResult ? (
              <><RefreshCw className="h-3.5 w-3.5" />重新估算</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" />开始估算</>
            )}
          </button>
        </div>

        {aiError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-edge-subtle bg-surface p-3">
                <p className="text-xs text-content-muted">估算二手价</p>
                <p className="mt-1 text-lg font-bold text-accent">{formatCurrency(aiResult.estimatedValue)}</p>
              </div>
              <div className="rounded-lg border border-edge-subtle bg-surface p-3">
                <p className="text-xs text-content-muted">置信区间</p>
                <p className="mt-1 text-sm font-medium text-content-primary">
                  {formatCurrency(aiResult.confidenceLow)} ~ {formatCurrency(aiResult.confidenceHigh)}
                </p>
              </div>
              <div className="rounded-lg border border-edge-subtle bg-surface p-3">
                <p className="text-xs text-content-muted">折旧率</p>
                <p className="mt-1 text-sm font-medium text-content-primary">{(aiResult.depreciationRate * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-edge-subtle bg-surface p-3">
                <p className="text-xs text-content-muted">市场趋势</p>
                <p className={`mt-1 text-sm font-medium ${
                  aiResult.marketTrend === "上涨" ? "text-accent" :
                  aiResult.marketTrend === "下跌" ? "text-red-400" : "text-content-primary"
                }`}>
                  {aiResult.marketTrend}
                </p>
              </div>
            </div>
            {aiResult.reasoning && (
              <div className="rounded-lg border border-edge-subtle bg-surface p-3">
                <p className="text-xs text-content-muted mb-1">估值理由</p>
                <p className="text-sm text-content-secondary leading-relaxed">{aiResult.reasoning}</p>
              </div>
            )}
            <p className="text-right text-xs text-content-faint">
              估算时间：{formatDate(aiResult.estimatedAt)}
            </p>
          </div>
        )}

        {!aiResult && !aiLoading && !aiError && (
          <p className="text-xs text-content-faint">点击「开始估算」通过 AI 估算该资产的二手市场价值</p>
        )}
      </div>

      {asset.status === "recycled" && (
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <h3 className="mb-3 text-sm font-medium text-content-secondary">盈亏复盘</h3>
          <div className="space-y-2 text-sm">
            <p className="text-content-secondary">
              {formatCurrency(asset.purchasePrice)} - {formatCurrency(asset.recycleAmount || 0)} = <span className="font-medium text-content-primary">{formatCurrency(actualSpend)}</span> 实际花费
            </p>
            <p className="text-content-secondary">
              实际日均成本：<span className="font-medium text-content-primary">{formatCurrency(asset.dailyCost)}</span>
            </p>
            <p className={(asset.recycleAmount || 0) >= asset.purchasePrice ? "font-medium text-accent" : "font-medium text-red-400"}>
              {(asset.recycleAmount || 0) >= asset.purchasePrice ? "✅ 盈利" : "❌ 亏损"}
            </p>
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <h3 className="mb-4 text-sm font-medium text-content-secondary">日均成本趋势</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartVars["--chart-grid"]} />
              <XAxis dataKey="date" tick={{ fill: chartVars["--chart-text"], fontSize: 11 }} />
              <YAxis tick={{ fill: chartVars["--chart-text"], fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: chartVars["--chart-tooltip-bg"], border: `1px solid ${chartVars["--chart-tooltip-border"]}`, borderRadius: "8px", color: chartVars["--text-primary"], fontSize: 12 }} />
              <Line type="monotone" dataKey="cost" stroke={chartVars["--chart-daily-cost"]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="relative">
        <button onClick={() => setShowStatusDropdown(!showStatusDropdown)} className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-surface">
          更改状态<ChevronDown className="h-4 w-4" />
        </button>
        {showStatusDropdown && !newStatus && (
          <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border border-edge bg-ink py-1 shadow-xl">
            {(["active", "recycled", "scrapped"] as AssetStatus[]).filter((s) => s !== asset.status).map((s) => (
              <button key={s} onClick={() => setNewStatus(s)} className="block w-full px-3 py-2 text-left text-sm text-content-secondary hover:bg-surface">{statusLabels[s]}</button>
            ))}
          </div>
        )}
        {newStatus && (
          <div className="mt-3 rounded-xl border border-edge bg-surface backdrop-blur-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-content-secondary">变更状态为：{statusLabels[newStatus]}</p>
              <button onClick={() => setNewStatus(null)}><X className="h-4 w-4 text-content-muted" /></button>
            </div>
            {newStatus !== "active" && (
              <div>
                <label className="block text-xs text-content-tertiary mb-1">结束日期</label>
                <input type="date" value={statusEndDate} onChange={(e) => setStatusEndDate(e.target.value)} required className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30" />
              </div>
            )}
            {newStatus === "recycled" && (
              <div>
                <label className="block text-xs text-content-tertiary mb-1">回收金额</label>
                <input type="number" step="0.01" min="0" value={statusRecycleAmount} onChange={(e) => setStatusRecycleAmount(e.target.value)} required className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30" />
              </div>
            )}
            <button onClick={handleStatusChange} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover">确认变更</button>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay-enter">
          <div className="w-80 rounded-xl border border-edge bg-ink p-6 shadow-2xl modal-content-enter">
            <h3 className="text-lg font-semibold text-content-primary">确认删除</h3>
            <p className="mt-2 text-sm text-content-secondary">确定要删除「{asset.name}」吗？此操作不可撤销。</p>
            <div className="mt-4 flex gap-3">
              <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500">删除</button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface">取消</button>
            </div>
          </div>
        </div>
      )}

      {showImagePreview && asset.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm modal-overlay-enter"
          onClick={() => setShowImagePreview(false)}
        >
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-pointer modal-content-enter"
            onClick={() => setShowImagePreview(false)}
          />
        </div>
      )}
    </div>
  )
}

const InfoItem = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) => (
  <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-3">
    <div className="mb-1 flex items-center gap-1.5 text-xs text-content-muted">{icon}{label}</div>
    <p className={`text-sm font-medium ${highlight ? "text-accent" : "text-content-primary"}`}>{value}</p>
  </div>
)

export { AssetDetail }
