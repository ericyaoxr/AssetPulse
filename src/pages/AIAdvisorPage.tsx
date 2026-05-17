import { useState } from "react"
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2, RefreshCw, DollarSign } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { useAIStore } from "@/store/useAIStore"
import { callAI, generateHealthCheckPrompt, generateRecommendationsPrompt } from "@/utils/aiHelper"
import { useToast } from "@/contexts/ToastContext"
import { formatCurrency } from "@/utils/format"
import type { HealthRecommendation, ExpensePrediction, AIRecommendationItem } from "@/types"

export default function AIAdvisorPage() {
  const { assets } = useAssetStore()
  const { healthChecks, recommendations, addHealthCheck, setRecommendations } = useAIStore()
  const { info, success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [currentCheck, setCurrentCheck] = useState<{
    id: string
    createdAt: string
    overallScore: number
    summary: string
    recommendations: HealthRecommendation[]
    futureExpensePrediction: ExpensePrediction
  } | null>(null)

  const activeAssets = assets.filter(a => a.status === "active")
  const latestCheck = healthChecks[0]

  const generateHealthCheck = async () => {
    if (activeAssets.length === 0) {
      info("请先添加一些资产")
      return
    }

    setLoading(true)
    setCurrentCheck(null)
    try {
      const prompt = generateHealthCheckPrompt(assets)
      const response = await callAI([{ role: "user", content: prompt }])
      
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("AI 返回格式错误")
      
      const result = JSON.parse(jsonMatch[0]) as {
        overallScore: number
        summary: string
        recommendations: HealthRecommendation[]
        futureExpensePrediction: ExpensePrediction
      }
      
      const check = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        overallScore: result.overallScore,
        summary: result.summary,
        recommendations: result.recommendations || [],
        futureExpensePrediction: result.futureExpensePrediction,
      }
      
      addHealthCheck(check)
      setCurrentCheck(check)
      success("资产体检报告已生成")
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
    try {
      const prompt = generateRecommendationsPrompt(assets)
      const response = await callAI([{ role: "user", content: prompt }])
      
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("AI 返回格式错误")
      
      const result = JSON.parse(jsonMatch[0]) as {
        nextBuys?: Omit<AIRecommendationItem, "id" | "type">[]
        betterOptions?: Omit<AIRecommendationItem, "id" | "type">[]
      }
      
      const nextBuys: AIRecommendationItem[] = (result.nextBuys || []).map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        type: "next_buy" as const,
      }))
      
      const betterOptions: AIRecommendationItem[] = (result.betterOptions || []).map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        type: "better_option" as const,
      }))
      
      setRecommendations({ nextBuys, betterOptions })
      success("推荐已生成")
    } catch (err) {
      error(err instanceof Error ? err.message : "生成推荐失败")
    } finally {
      setLoadingRecommendations(false)
    }
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

  const displayCheck = currentCheck || latestCheck

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
          <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4">资产体检报告</h2>
            
            {displayCheck ? (
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
            ) : (
              <div className="text-center py-10 text-content-muted">
                点击"生成体检报告"开始分析您的资产
              </div>
            )}
          </div>

          {(recommendations.nextBuys.length > 0 || recommendations.betterOptions.length > 0) && (
            <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-4">AI 推荐</h2>
              
              {recommendations.nextBuys.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-content-primary mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    下一个可能买的
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendations.nextBuys.map((item) => (
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

              {recommendations.betterOptions.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-content-primary mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    更划算的选择
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendations.betterOptions.map((item) => {
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
        </div>

        <div className="space-y-6">
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

          {healthChecks.length > 1 && (
            <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-4">历史报告</h2>
              <div className="space-y-2">
                {healthChecks.slice(1, 6).map((check) => (
                  <button
                    key={check.id}
                    onClick={() => setCurrentCheck(check)}
                    className="w-full text-left rounded-lg border border-edge p-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-content-primary">
                        {new Date(check.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      <span className={`text-sm font-medium ${getScoreColor(check.overallScore)}`}>
                        {check.overallScore}分
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
