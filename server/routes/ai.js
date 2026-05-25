import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"
import { safeParseJSON, toISODate } from "../utils/json.js"
import { decrypt } from "../utils/crypto.js"

function getBuiltInAIConfig() {
  const apiKey = process.env.DEFAULT_AI_API_KEY || ""
  const baseUrl = process.env.DEFAULT_AI_BASE_URL || ""
  const model = process.env.DEFAULT_AI_MODEL || ""
  if (!apiKey || !baseUrl || !model) return null
  return { apiKey, baseUrl, model }
}

const ALLOWED_AI_HOSTS = [
  "api.openai.com",
  "api.deepseek.com",
  "open.bigmodel.cn",
  "api.siliconflow.cn",
  "ark.cn-beijing.volces.com",
  "dashscope.aliyuncs.com",
  "localhost",
  "127.0.0.1",
]

function isAllowedAIUrl(urlStr) {
  try {
    const parsed = new URL(urlStr)
    const hostname = parsed.hostname
    return ALLOWED_AI_HOSTS.some((allowed) => {
      if (allowed === hostname) return true
      if (hostname.endsWith("." + allowed)) return true
      return false
    })
  } catch {
    return false
  }
}

function isPrivateIP(hostname) {
  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    hostname.startsWith("169.254.") ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname.startsWith("fc") ||
    hostname.startsWith("fd")
  )
}

function checkAndConsumeAIUsage(userId) {
  const usage = db.prepare("SELECT * FROM ai_usage WHERE user_id = ?").get(userId)
  if (!usage) {
    db.prepare("INSERT INTO ai_usage (user_id, remaining_count, total_used) VALUES (?, 10, 0)").run(userId)
    return { ok: true }
  }
  if (usage.remaining_count <= 0) {
    return { ok: false, error: "AI 次数已用完，请邀请好友获取更多次数" }
  }
  db.prepare("UPDATE ai_usage SET remaining_count = remaining_count - 1, total_used = total_used + 1, updated_at = datetime('now') WHERE user_id = ?").run(userId)
  return { ok: true }
}

function getUserAIConfig(userId) {
  const configRow = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?").get(userId, "ai_config")
  if (!configRow) return null
  const decrypted = decrypt(configRow.value)
  const rawValue = decrypted || configRow.value
  const parsed = safeParseJSON(rawValue)
  if (!parsed) return null
  if (!parsed.apiKey || !parsed.baseUrl || !parsed.model) return null
  return parsed
}

function resolveAIConfig(userId) {
  const userConfig = getUserAIConfig(userId)
  if (userConfig) return { config: userConfig, isBuiltIn: false }
  const builtInConfig = getBuiltInAIConfig()
  if (builtInConfig) return { config: builtInConfig, isBuiltIn: true }
  return null
}

const router = Router()

router.post("/recognize", authMiddleware, async (req, res) => {
  const { image } = req.body
  if (!image) {
    return res.status(400).json({ error: "请提供图片数据" })
  }

  const resolved = resolveAIConfig(req.userId)
  if (!resolved) {
    return res.status(400).json({ error: "请先配置 AI 设置" })
  }

  if (resolved.isBuiltIn) {
    const check = checkAndConsumeAIUsage(req.userId)
    if (!check.ok) {
      return res.status(402).json({ error: check.error })
    }
  }

  const config = resolved.config
  if (!resolved.isBuiltIn && !isAllowedAIUrl(config.baseUrl)) {
    return res.status(400).json({ error: "不支持的 AI 服务地址，仅允许已知的 AI 服务商" })
  }

  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`

  const isUrl = typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://"))
  if (isUrl) {
    try {
      const imgParsed = new URL(image)
      if (isPrivateIP(imgParsed.hostname)) {
        return res.status(400).json({ error: "不允许访问内网图片地址" })
      }
    } catch {
      return res.status(400).json({ error: "图片 URL 格式无效" })
    }
  }

  const prompt = `你是一个专业的物品识别助手。用户会上传一张物品的照片（通常是购物订单截图或物品实物图），请识别图片中的所有物品。

如果图片中包含多个物品（如购物订单包含多个商品），请将所有物品都识别出来。

请以JSON格式回复，包含以下字段：
- items：物品数组，每个物品包含：
  - name：物品名称（简洁准确，如"iPhone 15 Pro"、"戴森V12吸尘器"、"宜家马尔姆抽屉柜"）
  - model：物品型号（具体型号信息，如"iPhone 15 Pro Max 256G"、"V12 Detect Slim"、"A2784"等，如无法确定则为空字符串）
  - category：物品分类（从以下选项中选择最匹配的：数码电子、硬通货、非标品、生活家居、服饰鞋包、运动健身、游戏娱乐、学习教育、其他）
  - estimatedPrice：估算的购买价格（数值，单位：元，如果是订单截图则读取每个物品的订单金额，否则根据物品型号和市场价格估算）
  - brand：品牌（如无法确定则为空字符串）
  - description：物品简要描述（包括外观特征等，50字以内）
  - purchaseDate：购入日期（格式：YYYY-MM-DD，从订单截图中识别下单日期/支付日期；如无法确定则为空字符串）

如果图片中无法识别出明确的物品，请返回：
{"items":[]}

请仅回复JSON，不要包含其他内容。`

  try {
    let imageContent
    if (isUrl) {
      imageContent = { type: "image_url", image_url: { url: image } }
    } else {
      const base64Data = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`
      imageContent = { type: "image_url", image_url: { url: base64Data } }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

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
            content: "你是一个专业的物品识别助手，擅长从照片中识别物品并提取关键信息。请以JSON格式回复。",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              imageContent,
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      return res.status(502).json({ error: `AI API 请求失败 (${response.status}): ${errorText || response.statusText}` })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return res.status(502).json({ error: "AI API 返回内容为空" })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim())
        } catch {
          return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
        }
      } else {
        return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
      }
    }

    let items = []
    if (parsed.items && Array.isArray(parsed.items)) {
      items = parsed.items.map((item) => ({
        name: String(item.name || ""),
        model: String(item.model || ""),
        category: String(item.category || "其他"),
        estimatedPrice: Number(item.estimatedPrice) || 0,
        brand: String(item.brand || ""),
        description: String(item.description || ""),
        purchaseDate: String(item.purchaseDate || ""),
      })).filter((item) => item.name)
    } else {
      const singleItem = {
        name: String(parsed.name || ""),
        model: String(parsed.model || ""),
        category: String(parsed.category || "其他"),
        estimatedPrice: Number(parsed.estimatedPrice) || 0,
        brand: String(parsed.brand || ""),
        description: String(parsed.description || ""),
        purchaseDate: String(parsed.purchaseDate || ""),
      }
      if (singleItem.name) {
        items = [singleItem]
      }
    }

    res.json({ items })
  } catch (e) {
    if (e.name === "AbortError") {
      return res.status(504).json({ error: "AI API 请求超时，请稍后重试" })
    }
    console.error("Image recognition error:", e.message)
    res.status(500).json({ error: "图片识别失败，请稍后重试" })
  }
})

router.post("/valuate", authMiddleware, async (req, res) => {
  const { asset } = req.body
  if (!asset || !asset.name) {
    return res.status(400).json({ error: "请提供资产信息" })
  }

  const resolved = resolveAIConfig(req.userId)
  if (!resolved) {
    return res.status(400).json({ error: "请先配置 AI 设置" })
  }

  if (resolved.isBuiltIn) {
    const check = checkAndConsumeAIUsage(req.userId)
    if (!check.ok) {
      return res.status(402).json({ error: check.error })
    }
  }

  const config = resolved.config
  if (!resolved.isBuiltIn && !isAllowedAIUrl(config.baseUrl)) {
    return res.status(400).json({ error: "不支持的 AI 服务地址" })
  }

  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`

  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : null
  const now = new Date()
  const usageDays = purchaseDate && !isNaN(purchaseDate.getTime())
    ? Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const noteSection = asset.note ? `\n备注说明：${asset.note}` : ""
  const locationSection = asset.location ? `\n所在地区：${asset.location}` : ""

  const prompt = `请估算以下物品的当前二手市场价值：

物品名称：${asset.name}
类别：${asset.category}
购买价格：${asset.purchasePrice} 元
购买日期：${asset.purchaseDate}
已使用天数：${usageDays} 天
当前状态：${asset.status === "active" ? "使用中" : asset.status === "recycled" ? "已回收" : "已报废"}${noteSection}${locationSection}

请以JSON格式回复，包含以下字段：
- estimatedValue：估算的当前二手市场价值（数值，单位：元）
- confidenceLow：置信区间下限（数值，单位：元）
- confidenceHigh：置信区间上限（数值，单位：元）
- depreciationRate：折旧率（0到1之间的小数）
- reasoning：简要估值理由（中文）
- marketTrend：市场趋势（上涨/稳定/下跌）

请仅回复JSON，不要包含其他内容。`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

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
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      return res.status(502).json({ error: `AI API 请求失败 (${response.status})` })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return res.status(502).json({ error: "AI API 返回内容为空" })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim())
        } catch {
          return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
        }
      } else {
        return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
      }
    }

    res.json({
      estimatedValue: Number(parsed.estimatedValue) || 0,
      confidenceLow: Number(parsed.confidenceLow) || 0,
      confidenceHigh: Number(parsed.confidenceHigh) || 0,
      depreciationRate: Number(parsed.depreciationRate) || 0,
      reasoning: String(parsed.reasoning || ""),
      marketTrend: String(parsed.marketTrend || "稳定"),
      estimatedAt: new Date().toISOString(),
    })
  } catch (e) {
    if (e.name === "AbortError") {
      return res.status(504).json({ error: "AI API 请求超时，请稍后重试" })
    }
    console.error("AI valuation error:", e.message)
    res.status(500).json({ error: "AI 估值失败，请稍后重试" })
  }
})

function saveReport(userId, type, data) {
  const id = crypto.randomUUID()
  db.prepare("INSERT INTO ai_reports (id, user_id, type, data) VALUES (?, ?, ?, ?)").run(
    id, userId, type, JSON.stringify(data)
  )
  return id
}

router.get("/reports", authMiddleware, (req, res) => {
  const rows = db.prepare(
    "SELECT id, type, created_at FROM ai_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
  ).all(req.userId)
  res.json(rows.map(r => ({
    id: r.id,
    type: r.type,
    createdAt: toISODate(r.created_at),
  })))
})

router.get("/reports/:id", authMiddleware, (req, res) => {
  const row = db.prepare(
    "SELECT * FROM ai_reports WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.userId)
  if (!row) return res.status(404).json({ error: "报告不存在" })
  res.json({
    id: row.id,
    type: row.type,
    createdAt: toISODate(row.created_at),
    data: JSON.parse(row.data),
  })
})

router.delete("/reports/:id", authMiddleware, (req, res) => {
  const row = db.prepare(
    "SELECT id FROM ai_reports WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.userId)
  if (!row) return res.status(404).json({ error: "报告不存在" })
  db.prepare("DELETE FROM ai_reports WHERE id = ?").run(req.params.id)
  res.json({ ok: true })
})

router.post("/health-check", authMiddleware, async (req, res) => {
  const { assets } = req.body
  if (!assets || !Array.isArray(assets)) {
    return res.status(400).json({ error: "请提供资产信息" })
  }

  const resolved = resolveAIConfig(req.userId)
  console.log("[health-check] resolved:", resolved ? `isBuiltIn=${resolved.isBuiltIn}, model=${resolved.config.model}` : "null")
  if (!resolved) {
    return res.status(400).json({ error: "请先配置 AI 设置" })
  }

  if (resolved.isBuiltIn) {
    const check = checkAndConsumeAIUsage(req.userId)
    if (!check.ok) {
      return res.status(402).json({ error: check.error })
    }
  }

  const config = resolved.config
  if (!resolved.isBuiltIn && !isAllowedAIUrl(config.baseUrl)) {
    return res.status(400).json({ error: "不支持的 AI 服务地址" })
  }

  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`
  const activeAssets = assets.filter(a => a.status === "active")
  const totalValue = activeAssets.reduce((sum, a) => sum + a.purchasePrice, 0)

  const prompt = `请作为我的资产管理顾问，帮我分析以下资产并生成体检报告。

我的资产概况：
- 总资产数量：${activeAssets.length}件
- 总价值：${totalValue}元
- 资产列表：
${activeAssets.map(a => `- ${a.name}（${a.category}，¥${a.purchasePrice}，${a.effectiveDays}天，日均¥${(a.dailyCost || 0).toFixed(2)}）`).join("\n")}

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

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

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
            content: "你是一个专业的资产管理顾问，擅长分析个人资产状况并给出建议。请以JSON格式回复。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      return res.status(502).json({ error: `AI API 请求失败 (${response.status})` })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return res.status(502).json({ error: "AI API 返回内容为空" })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim())
        } catch {
          return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
        }
      } else {
        return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
      }
    }

    const result = {
      overallScore: Number(parsed.overallScore) || 50,
      summary: String(parsed.summary || ""),
      recommendations: (parsed.recommendations || []).map((r) => ({
        id: crypto.randomUUID(),
        type: String(r.type || "keep"),
        assetId: String(r.assetId || ""),
        assetName: String(r.assetName || ""),
        priority: String(r.priority || "medium"),
        title: String(r.title || ""),
        description: String(r.description || ""),
        reason: String(r.reason || ""),
      })),
      futureExpensePrediction: {
        next30Days: Number(parsed.futureExpensePrediction?.next30Days || 0),
        next90Days: Number(parsed.futureExpensePrediction?.next90Days || 0),
        next1Year: Number(parsed.futureExpensePrediction?.next1Year || 0),
        breakdown: (parsed.futureExpensePrediction?.breakdown || []).map((b) => ({
          category: String(b.category || ""),
          amount: Number(b.amount || 0),
        })),
      },
    }

    const reportId = saveReport(req.userId, "health_check", result)
    result.id = reportId

    res.json(result)
  } catch (e) {
    if (e.name === "AbortError") {
      return res.status(504).json({ error: "AI API 请求超时，请稍后重试" })
    }
    console.error("Health check error:", e.message)
    res.status(500).json({ error: "生成体检报告失败，请稍后重试" })
  }
})

router.post("/recommendations", authMiddleware, async (req, res) => {
  const { assets } = req.body
  if (!assets || !Array.isArray(assets)) {
    return res.status(400).json({ error: "请提供资产信息" })
  }

  const resolved = resolveAIConfig(req.userId)
  console.log("[recommendations] resolved:", resolved ? `isBuiltIn=${resolved.isBuiltIn}, model=${resolved.config.model}` : "null")
  if (!resolved) {
    return res.status(400).json({ error: "请先配置 AI 设置" })
  }

  if (resolved.isBuiltIn) {
    const check = checkAndConsumeAIUsage(req.userId)
    if (!check.ok) {
      return res.status(402).json({ error: check.error })
    }
  }

  const config = resolved.config
  if (!resolved.isBuiltIn && !isAllowedAIUrl(config.baseUrl)) {
    return res.status(400).json({ error: "不支持的 AI 服务地址" })
  }

  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`
  const activeAssets = assets.filter(a => a.status === "active")

  const prompt = `基于我的资产，推荐我"下一个可能买的东西"和"替代旧物品的更划算选择"。

我的资产：
${activeAssets.map(a => `- ${a.name}（${a.category}，¥${a.purchasePrice}，ID:${a.id}）`).join("\n")}

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

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

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
            content: "你是一个专业的购物顾问，基于用户的现有资产推荐合适的下一个购买物品和更划算的替代选择。请以JSON格式回复。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      return res.status(502).json({ error: `AI API 请求失败 (${response.status})` })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return res.status(502).json({ error: "AI API 返回内容为空" })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim())
        } catch {
          return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
        }
      } else {
        return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
      }
    }

    const result = {
      nextBuys: (parsed.nextBuys || []).map((item) => ({
        id: crypto.randomUUID(),
        name: String(item.name || ""),
        category: String(item.category || ""),
        priceRange: {
          min: Number(item.priceRange?.min || 0),
          max: Number(item.priceRange?.max || 0),
        },
        reason: String(item.reason || ""),
        similarityScore: Number(item.similarityScore || 0.5),
        type: "next_buy",
      })),
      betterOptions: (parsed.betterOptions || []).map((item) => ({
        id: crypto.randomUUID(),
        name: String(item.name || ""),
        category: String(item.category || ""),
        priceRange: {
          min: Number(item.priceRange?.min || 0),
          max: Number(item.priceRange?.max || 0),
        },
        reason: String(item.reason || ""),
        relatedAssetId: String(item.relatedAssetId || ""),
        similarityScore: Number(item.similarityScore || 0.5),
        type: "better_option",
      })),
    }

    saveReport(req.userId, "recommendations", result)

    res.json(result)
  } catch (e) {
    if (e.name === "AbortError") {
      return res.status(504).json({ error: "AI API 请求超时，请稍后重试" })
    }
    console.error("Recommendations error:", e.message)
    res.status(500).json({ error: "生成推荐失败，请稍后重试" })
  }
})

router.post("/used-valuation", authMiddleware, async (req, res) => {
  const resolved = resolveAIConfig(req.userId)
  if (!resolved) return res.status(400).json({ error: "请先配置 AI 设置" })
  if (resolved.isBuiltIn) {
    const check = checkAndConsumeAIUsage(req.userId)
    if (!check.ok) return res.status(402).json({ error: check.error })
  }

  const { assets } = req.body
  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({ error: "请提供资产列表" })
  }

  const assetList = assets.map(a => ({
    id: a.id,
    name: a.name,
    model: a.model || "",
    category: a.category,
    purchasePrice: a.purchasePrice,
    purchaseDate: a.purchaseDate,
  }))

  const prompt = `你是一个专业的二手资产估价师。请根据以下资产信息，为每件资产估算当前的二手市场价值，并给出处理建议。

资产列表：
${JSON.stringify(assetList, null, 2)}

请按以下JSON格式返回结果（不要包含其他内容）：
{
  "items": [
    {
      "assetId": "资产ID",
      "estimatedValue": 估算二手价格（数字，单位：元）,
      "depreciationRate": 折旧率（0-1之间的小数，1表示完全折旧）,
      "suggestion": "处理建议（如：建议出售/建议继续使用/建议以旧换新/建议捐赠等）"
    }
  ]
}

估价参考因素：
1. 资产品类（数码电子折旧快，家具折旧慢）
2. 购入价格和时间
3. 市场二手行情
4. 品牌保值率

注意：estimatedValue 是估算的当前二手市场可售价格，depreciationRate = (购入价 - 二手估价) / 购入价`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

  try {
    const response = await fetch(`${resolved.config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolved.config.apiKey}`,
      },
      body: JSON.stringify({
        model: resolved.config.model,
        messages: [
          { role: "system", content: "你是一个专业的二手资产估价师，擅长根据资产信息评估二手市场价值。请始终返回有效的JSON格式。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(502).json({ error: `AI API 请求失败 (${response.status})` })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return res.status(502).json({ error: "AI API 返回内容为空" })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim())
        } catch {
          return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
        }
      } else {
        return res.status(502).json({ error: "AI 返回内容无法解析为JSON" })
      }
    }

    const now = new Date()
    const items = (parsed.items || []).map((item) => {
      const asset = assets.find(a => a.id === item.assetId)
      const purchaseDate = asset?.purchaseDate ? new Date(asset.purchaseDate) : now
      const ageDays = Math.max(0, Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24)))
      return {
        assetId: String(item.assetId || ""),
        name: asset?.name || "",
        model: asset?.model || "",
        category: asset?.category || "",
        originalPrice: Number(asset?.purchasePrice || 0),
        purchaseDate: asset?.purchaseDate || "",
        ageDays,
        estimatedValue: Number(item.estimatedValue || 0),
        depreciationRate: Number(item.depreciationRate || 0),
        suggestion: String(item.suggestion || ""),
      }
    })

    saveReport(req.userId, "used_valuation", { items })

    res.json({ items })
  } catch (e) {
    if (e.name === "AbortError") {
      return res.status(504).json({ error: "AI API 请求超时，请稍后重试" })
    }
    console.error("Used valuation error:", e.message)
    res.status(500).json({ error: "生成估价失败，请稍后重试" })
  }
})

export default router
