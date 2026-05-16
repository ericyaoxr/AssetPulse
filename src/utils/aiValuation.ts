import type { AIProviderConfig, AIValuationResult, Asset } from "@/types"
import { api, getToken } from "@/utils/api"

const AI_SETTINGS_KEY = "ai_config"

export function buildValuationPrompt(asset: Asset): string {
  const purchaseDate = new Date(asset.purchaseDate)
  const now = new Date()
  const usageDays = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

  const noteSection = asset.note ? `\n备注说明：${asset.note}` : ""
  const locationSection = asset.location ? `\n所在地区：${asset.location}` : ""

  return `请估算以下物品的当前二手市场价值：

物品名称：${asset.name}
类别：${asset.category}
购买价格：${asset.purchasePrice} 元
购买日期：${asset.purchaseDate}
已使用天数：${usageDays} 天
当前状态：${asset.status === "active" ? "使用中" : asset.status === "recycled" ? "已回收" : "已报废"}${noteSection}${locationSection}

请综合以上信息（特别是备注说明中的使用状况、成色、配件等描述）来估算该物品的当前二手市场价值。

请以JSON格式回复，包含以下字段：
- estimatedValue：估算的当前二手市场价值（数值，单位：元）
- confidenceLow：置信区间下限（数值，单位：元）
- confidenceHigh：置信区间上限（数值，单位：元）
- depreciationRate：折旧率（0到1之间的小数，表示相对购买价格的贬值比例）
- reasoning：简要估值理由（中文，需结合物品状况说明）
- marketTrend：市场趋势（上涨/稳定/下跌）

请仅回复JSON，不要包含其他内容。`
}

export async function estimateAssetValue(_config: AIProviderConfig, asset: Asset): Promise<AIValuationResult> {
  const token = getToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const response = await fetch("/api/ai/valuate", {
    method: "POST",
    headers,
    body: JSON.stringify({ asset }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "请求失败" }))
    throw new Error(data.error || `AI 估值请求失败 (${response.status})`)
  }

  return await response.json()
}

export async function saveAIConfig(config: AIProviderConfig): Promise<void> {
  await api.settings.set(AI_SETTINGS_KEY, JSON.stringify(config))
}

export async function loadAIConfig(): Promise<AIProviderConfig | null> {
  try {
    const res = await api.settings.get(AI_SETTINGS_KEY)
    if (!res || !res.value) return null
    return JSON.parse(res.value) as AIProviderConfig
  } catch {
    return null
  }
}
