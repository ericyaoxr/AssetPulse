import type { AIProviderConfig, AIValuationResult, Asset } from "@/types"
import { useAuthStore } from "@/store/useAuthStore"

const AI_CONFIG_PREFIX = "assetpulse_ai_config_"

function getConfigKey(): string {
  const userId = useAuthStore.getState().currentUser?.id
  return userId ? `${AI_CONFIG_PREFIX}${userId}` : AI_CONFIG_PREFIX + "default"
}

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

export async function estimateAssetValue(config: AIProviderConfig, asset: Asset): Promise<AIValuationResult> {
  const url = `${config.baseUrl}/chat/completions`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "你是一个专业的二手资产估值师。根据物品信息估算其当前二手市场价值。请以JSON格式回复。",
        },
        {
          role: "user",
          content: buildValuationPrompt(asset),
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`AI API request failed (${response.status}): ${errorText || response.statusText}`)
  }

  const data = await response.json()

  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("AI API returned empty response content")
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(content)
  } catch {
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        parsed = JSON.parse(codeBlockMatch[1].trim())
      } catch {
        throw new Error("Failed to parse AI response as JSON, even after extracting from code block")
      }
    } else {
      throw new Error("Failed to parse AI response as JSON")
    }
  }

  const result: AIValuationResult = {
    estimatedValue: Number(parsed.estimatedValue) || 0,
    confidenceLow: Number(parsed.confidenceLow) || 0,
    confidenceHigh: Number(parsed.confidenceHigh) || 0,
    depreciationRate: Number(parsed.depreciationRate) || 0,
    reasoning: String(parsed.reasoning || ""),
    marketTrend: String(parsed.marketTrend || "稳定"),
    estimatedAt: new Date().toISOString(),
  }

  return result
}

export function saveAIConfig(config: AIProviderConfig): void {
  localStorage.setItem(getConfigKey(), JSON.stringify(config))
}

export function loadAIConfig(): AIProviderConfig | null {
  const raw = localStorage.getItem(getConfigKey())
  if (!raw) return null
  try {
    return JSON.parse(raw) as AIProviderConfig
  } catch {
    return null
  }
}
