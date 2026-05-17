import { loadAIConfig } from "./aiValuation"
import type { Asset } from "@/types"

export async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const config = await loadAIConfig()
  if (!config) {
    throw new Error("请先配置 AI 设置")
  }

  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content || ""
}

export function generateAssetStoryPrompt(asset: Asset): string {
  return `请为以下资产生成一段温馨有趣的"物品故事"，适合分享到朋友圈。
资产信息：
- 名称：${asset.name}
- 购买日期：${asset.purchaseDate}
- 价格：${asset.purchasePrice}元
- 使用天数：${asset.effectiveDays}天
- 分类：${asset.category}
- 日均成本：${asset.dailyCost.toFixed(2)}元
${asset.note ? `- 备注：${asset.note}` : ""}

请生成一个标题（不超过20字）和故事内容（100-200字），用JSON格式返回：
{
  "title": "故事标题",
  "content": "故事内容"
}`
}

export function generateHealthCheckPrompt(assets: Asset[]): string {
  const activeAssets = assets.filter(a => a.status === "active")
  const totalValue = activeAssets.reduce((sum, a) => sum + a.purchasePrice, 0)
  
  return `请作为我的资产管理顾问，帮我分析以下资产并生成体检报告。

我的资产概况：
- 总资产数量：${activeAssets.length}件
- 总价值：${totalValue}元
- 资产列表：
${activeAssets.map(a => `- ${a.name}（${a.category}，¥${a.purchasePrice}，${a.effectiveDays}天，日均¥${a.dailyCost.toFixed(2)}）`).join("\n")}

请用JSON格式返回分析结果：
{
  "overallScore": 0-100的综合评分,
  "summary": "200字以内的总体评价",
  "recommendations": [
    {
      "type": "buy|sell|keep|maintain",
      "assetId": "资产ID（如果有的话）",
      "assetName": "资产名称（如果有的话）",
      "priority": "low|medium|high",
      "title": "简短建议标题",
      "description": "建议详情",
      "reason": "给出这个建议的原因"
    }
  ],
  "futureExpensePrediction": {
    "next30Days": 未来30天预计支出,
    "next90Days": 未来90天预计支出,
    "next1Year": 未来1年预计支出,
    "breakdown": [
      {"category": "类别名称", "amount": 金额}
    ]
  }
}`
}

export function generateRecommendationsPrompt(assets: Asset[]): string {
  const activeAssets = assets.filter(a => a.status === "active")
  
  return `基于我的资产，推荐我"下一个可能买的东西"和"替代旧物品的更划算选择"。

我的资产：
${activeAssets.map(a => `- ${a.name}（${a.category}，¥${a.purchasePrice}）`).join("\n")}

请用JSON格式返回推荐结果：
{
  "nextBuys": [
    {
      "name": "物品名称",
      "category": "分类",
      "priceRange": {"min": 最低价格, "max": 最高价格},
      "reason": "推荐理由",
      "similarityScore": 0-1的相似度分数
    }
  ],
  "betterOptions": [
    {
      "name": "物品名称",
      "category": "分类",
      "priceRange": {"min": 最低价格, "max": 最高价格},
      "reason": "为什么比现有物品更好",
      "relatedAssetId": "被替代的资产ID",
      "similarityScore": 0-1的相似度分数
    }
  ]
}

请各推荐3-5个物品。`
}
