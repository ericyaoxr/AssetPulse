import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"
import { safeParseJSON } from "../utils/json.js"
import { decrypt } from "../utils/crypto.js"

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

const router = Router()

router.post("/recognize", authMiddleware, async (req, res) => {
  const { image } = req.body
  if (!image) {
    return res.status(400).json({ error: "请提供图片数据" })
  }

  const configRow = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?").get(req.userId, "ai_config")
  if (!configRow) {
    const anyConfig = db.prepare("SELECT key, user_id FROM settings WHERE key = ?").all("ai_config")
    console.error("AI config not found for user:", req.userId, "all ai_config rows:", JSON.stringify(anyConfig))
    return res.status(400).json({ error: "请先配置 AI 设置" })
  }

  let config
  const decrypted = decrypt(configRow.value)
  const rawValue = decrypted || configRow.value
  const parsed = safeParseJSON(rawValue)
  if (!parsed) {
    console.error("AI config parse failed, decrypted:", decrypted ? "yes" : "no", "rawValue prefix:", rawValue.substring(0, 50))
    return res.status(400).json({ error: "AI 配置格式错误" })
  }
  config = parsed

  if (!config.apiKey || !config.baseUrl || !config.model) {
    return res.status(400).json({ error: "AI 配置不完整，请检查 API Key、Base URL 和模型" })
  }

  if (!isAllowedAIUrl(config.baseUrl)) {
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
  - category：物品分类（从以下选项中选择最匹配的：数码电子、硬通货、非标品、生活家居、服饰鞋包、运动健身、游戏娱乐、学习教育、其他）
  - estimatedPrice：估算的购买价格（数值，单位：元，如果是订单截图则读取每个物品的订单金额，否则根据物品型号和市场价格估算）
  - brand：品牌（如无法确定则为空字符串）
  - description：物品简要描述（包括外观特征、型号等，50字以内）
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
    const timeout = setTimeout(() => controller.abort(), 30000)

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
        category: String(item.category || "其他"),
        estimatedPrice: Number(item.estimatedPrice) || 0,
        brand: String(item.brand || ""),
        description: String(item.description || ""),
        purchaseDate: String(item.purchaseDate || ""),
      })).filter((item) => item.name)
    } else {
      const singleItem = {
        name: String(parsed.name || ""),
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

  const configRow = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?").get(req.userId, "ai_config")
  if (!configRow) {
    const anyConfig = db.prepare("SELECT key, user_id FROM settings WHERE key = ?").all("ai_config")
    console.error("AI config not found for user:", req.userId, "all ai_config rows:", JSON.stringify(anyConfig))
    return res.status(400).json({ error: "请先配置 AI 设置" })
  }

  let config
  const decrypted = decrypt(configRow.value)
  const rawValue = decrypted || configRow.value
  const parsed = safeParseJSON(rawValue)
  if (!parsed) {
    console.error("AI config parse failed, decrypted:", decrypted ? "yes" : "no", "rawValue prefix:", rawValue.substring(0, 50))
    return res.status(400).json({ error: "AI 配置格式错误" })
  }
  config = parsed

  if (!config.apiKey || !config.baseUrl || !config.model) {
    return res.status(400).json({ error: "AI 配置不完整" })
  }

  if (!isAllowedAIUrl(config.baseUrl)) {
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
    const timeout = setTimeout(() => controller.abort(), 30000)

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

export default router
