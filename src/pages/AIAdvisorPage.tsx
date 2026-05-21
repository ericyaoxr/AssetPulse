import { useState, useEffect, useCallback } from "react"
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2, RefreshCw, DollarSign, Trash2, FileText, ChevronRight } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { useAIStore } from "@/store/useAIStore"
import { api, type AIReportSummary } from "@/utils/api"
import { useToast } from "@/contexts/ToastContext"
import { useAuthStore } from "@/store/useAuthStore"
import { formatCurrency } from "@/utils/format"
import type { HealthRecommendation, ExpensePrediction, HealthCheckResult, RecommendationsResult } from "@/types"

interface HealthCheckDisplay {
  id: string
  createdAt: string
  overallScore: number
  summary: string
  recommendations: HealthRecommendation[]
  futureExpensePrediction: ExpensePrediction
}

interface RecommendationsDisplay {
  nextBuys: { id: string; name: string; category: string; priceRange: { min: number; max: number }; reason: string; similarityScore: number }[]
  betterOptions: { id: string; name: string; category: string; priceRange: { min: number; max: number }; reason: string; relatedAssetId?: string; similarityScore: number }[]
}

export default function AIAdvisorPage() {
  const { assets } = useAssetStore()
  const { addHealthCheck, setRecommendations } = useAIStore()
  const { refreshUser } = useAuthStore()
  const { info, success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [currentCheck, setCurrentCheck] = useState<HealthCheckDisplay | null>(null)
  const [currentRecommendations, setCurrentRecommendations] = useState<RecommendationsDisplay | null>(null)
  const [reports, setReports] = useState<AIReportSummary[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const activeAssets = assets.filter(a => a.status === "active")

  const loadReports = useCallback(async () => {
    setLoadingReports(true)
    try {
      const list = await api.ai.reports()
      setReports(list)
      if (list.length > 0 && !currentCheck && !currentRecommendations) {
        setSelectedReportId(list[0].id)
      }
    } catch (e) {
      console.error("Failed to load reports:", e)
    } finally {
      setLoadingReports(false)
    }
  }, [currentCheck, currentRecommendations])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  useEffect(() => {
    if (!selectedReportId) return
    if (currentCheck?.id === selectedReportId) return
    if (currentRecommendations) return

    const loadDetail = async () => {
      setLoadingDetail(true)
      try {
        const detail = await api.ai.reportDetail(selectedReportId!)
        if (!detail) {
          setCurrentCheck(null)
          setCurrentRecommendations(null)
          return
        }
        if (detail.type === "health_check") {
          const d = detail.data as unknown as HealthCheckResult
          setCurrentCheck({
            id: detail.id,
            createdAt: detail.createdAt,
            overallScore: d.overallScore,
            summary: d.summary,
            recommendations: d.recommendations,
            futureExpensePrediction: d.futureExpensePrediction,
          })
          setCurrentRecommendations(null)
        } else if (detail.type === "recommendations") {
          const d = detail.data as unknown as RecommendationsResult
          setCurrentRecommendations({
            nextBuys: d.nextBuys,
            betterOptions: d.betterOptions,
          })
          setCurrentCheck(null)
        }
      } catch (e) {
        console.error("Failed to load report detail:", e)
      } finally {
        setLoadingDetail(false)
      }
    }
    loadDetail()
  }, [selectedReportId, currentCheck, currentRecommendations])

  const generateHealthCheck = async () => {
    if (activeAssets.length === 0) {
      info("请先添加一些资产")
      return
    }

    setLoading(true)
    setCurrentCheck(null)
    setCurrentRecommendations(null)
    try {
      const result = await api.ai.healthCheck(assets)

      const check: HealthCheckDisplay = {
        id: result.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        overallScore: result.overallScore,
        summary: result.summary,
        recommendations: result.recommendations,
        futureExpensePrediction: result.futureExpensePrediction,
      }

      addHealthCheck(check)
      setCurrentCheck(check)
      await refreshUser()
      await loadReports()
      success("资产体检报告已生成并保存")
    } catch (err) {
      error(err instanceof Error ? err.message : "生成报告失败")
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = async () => {
    if (activeAssets.length === 0) {
      info("请先添加一些资产")
      return
    }

    setLoadingRecommendations(true)
    setCurrentCheck(null)
    setCurrentRecommendations(null)
    try {
      const result = await api.ai.recommendations(assets)

      setRecommendations(result)
      setCurrentRecommendations({
        nextBuys: result.nextBuys,
        betterOptions: result.betterOptions,
      })
      await refreshUser()
      await loadReports()
      success("推荐已生成并保存")
    } catch (err) {
      error(err instanceof Error ? err.message : "生成推荐失败")
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      await api.ai.deleteReport(reportId)
      setReports(prev => prev.filter(r => r.id !== reportId))
      if (selectedReportId === reportId) {
        setSelectedReportId(null)
        setCurrentCheck(null)
        setCurrentRecommendations(null)
      }
      success("报告已删除")
    } catch (e) {
      error(e instanceof Error ? e.message : "删除失败")
    }
  }

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId)
    setCurrentCheck(null)
    setCurrentRecommendations(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "buy": return <TrendingUp className="h-5 w-5 text-green-400" />
      case "sell": return <AlertTriangle className="h-5 w-5 text-red-400" />
      case "keep": return <CheckCircle className="h-5 w-5 text-blue-400" />
      default: return <AlertTriangle className="h-5 w-5 text-yellow-400" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-500/20 text-red-400",
      medium: "bg-yellow-500/20 text-yellow-400",
      low: "bg-blue-500/20 text-blue-400",
    }
    const labels = { high: "高", medium: "中", low: "低" }
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${colors[priority as keyof typeof colors]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    )
  }

  const displayCheck = currentCheck
  const displayRecommendations = currentRecommendations

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-content-primary">
            <Sparkles className="h-6 w-6 text-accent" />
            AI 资产管理顾问
          </h1>
          <p className="mt-1 text-sm text-content-tertiary">智能分析您的资产，提供专业建议</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateRecommendations}
            disabled={loadingRecommendations}
            className="flex items-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content-secondary hover:bg-surface disabled:opacity-50"
          >
            {loadingRecommendations ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            生成推荐
          </button>
          <button
            onClick={generateHealthCheck}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            生成体检报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loadingDetail && (
            <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="mt-3 text-sm text-content-muted">加载报告中...</p>
            </div>
          )}

          {!loadingDetail && displayCheck && (
            <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-4">资产体检报告</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(displayCheck.overallScore)}`}>
                      {displayCheck.overallScore}
                    </div>
                    <div className="text-sm text-content-muted mt-1">综合评分</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-content-primary">{displayCheck.summary}</p>
                    <p className="text-xs text-content-muted mt-2">
                      生成于 {new Date(displayCheck.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>

                {displayCheck.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-content-primary mb-3">建议</h3>
                    <div className="space-y-3">
                      {displayCheck.recommendations.map((rec) => (
                        <div key={rec.id} className="rounded-lg border border-edge p-4 bg-white/5">
                          <div className="flex items-start gap-3">
                            {getRecommendationIcon(rec.type)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-content-primary">{rec.title}</span>
                                {getPriorityBadge(rec.priority)}
                                {rec.assetName && (
                                  <span className="text-xs text-content-muted">· {rec.assetName}</span>
                                )}
                              </div>
                              <p className="text-sm text-content-secondary">{rec.description}</p>
                              <p className="text-xs text-content-muted mt-1">{rec.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loadingDetail && displayRecommendations && (
            <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-4">AI 推荐</h2>

              {displayRecommendations.nextBuys.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-content-primary mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    下一个可能买的
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayRecommendations.nextBuys.map((item) => (
                      <div key={item.id} className="rounded-lg border border-edge p-4 bg-white/5">
                        <div className="font-medium text-content-primary">{item.name}</div>
                        <div className="text-sm text-content-muted">{item.category}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <DollarSign className="h-4 w-4 text-accent" />
                          <span className="text-sm text-content-primary">
                            {formatCurrency(item.priceRange.min)} - {formatCurrency(item.priceRange.max)}
                          </span>
                        </div>
                        <p className="text-xs text-content-muted mt-2">{item.reason}</p>
                        <div className="mt-2 text-xs text-content-tertiary">
                          相似度: {(item.similarityScore * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayRecommendations.betterOptions.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-content-primary mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    更划算的选择
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayRecommendations.betterOptions.map((item) => {
                      const relatedAsset = assets.find(a => a.id === item.relatedAssetId)
                      return (
                        <div key={item.id} className="rounded-lg border border-edge p-4 bg-white/5">
                          <div className="font-medium text-content-primary">{item.name}</div>
                          <div className="text-sm text-content-muted">{item.category}</div>
                          {relatedAsset && (
                            <div className="text-xs text-content-tertiary mt-1">
                              替代: {relatedAsset.name}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <DollarSign className="h-4 w-4 text-accent" />
                            <span className="text-sm text-content-primary">
                              {formatCurrency(item.priceRange.min)} - {formatCurrency(item.priceRange.max)}
                            </span>
                          </div>
                          <p className="text-xs text-content-muted mt-2">{item.reason}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loadingDetail && !displayCheck && !displayRecommendations && (
            <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-4">资产体检报告</h2>
              <div className="text-center py-10 text-content-muted">
                点击"生成体检报告"开始分析您的资产
              </div>
            </div>
          )}

          {displayCheck?.futureExpensePrediction && (
            <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                未来支出预测
              </h2>

              <div className="space-y-4">
                <div className="rounded-lg border border-edge p-4 bg-white/5">
                  <div className="text-sm text-content-muted">未来 30 天</div>
                  <div className="text-2xl font-bold text-content-primary mt-1">
                    {formatCurrency(displayCheck.futureExpensePrediction.next30Days)}
                  </div>
                </div>

                <div className="rounded-lg border border-edge p-4 bg-white/5">
                  <div className="text-sm text-content-muted">未来 90 天</div>
                  <div className="text-2xl font-bold text-content-primary mt-1">
                    {formatCurrency(displayCheck.futureExpensePrediction.next90Days)}
                  </div>
                </div>

                <div className="rounded-lg border border-edge p-4 bg-white/5">
                  <div className="text-sm text-content-muted">未来 1 年</div>
                  <div className="text-2xl font-bold text-content-primary mt-1">
                    {formatCurrency(displayCheck.futureExpensePrediction.next1Year)}
                  </div>
                </div>

                {displayCheck.futureExpensePrediction.breakdown?.length > 0 && (
                  <div className="pt-2">
                    <div className="text-sm text-content-muted mb-2">分类明细</div>
                    <div className="space-y-2">
                      {displayCheck.futureExpensePrediction.breakdown.map((item) => (
                        <div key={item.category} className="flex justify-between text-sm">
                          <span className="text-content-secondary">{item.category}</span>
                          <span className="text-content-primary">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              历史报告
            </h2>

            {loadingReports ? (
              <div className="py-6 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-accent" />
              </div>
            ) : reports.length === 0 ? (
              <p className="py-6 text-center text-sm text-content-faint">暂无历史报告</p>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`group rounded-lg border p-3 transition-colors cursor-pointer ${
                      selectedReportId === report.id
                        ? "border-accent/40 bg-accent/5"
                        : "border-edge hover:bg-white/5"
                    }`}
                    onClick={() => handleSelectReport(report.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {report.type === "health_check" ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400">
                            <RefreshCw className="h-3 w-3" />体检
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400">
                            <TrendingUp className="h-3 w-3" />推荐
                          </span>
                        )}
                        <span className="text-sm text-content-primary truncate">
                          {new Date(report.createdAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id) }}
                          className="shrink-0 rounded p-1 text-content-faint hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-content-faint shrink-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
