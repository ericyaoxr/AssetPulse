import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"

const router = Router()

router.post("/recognize", authMiddleware, async (req, res) => {
  const { image } = req.body
  if (!image) {
    return res.status(400).json({ error: "请提供图片数据" })
  }

  const configRow = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?").get(req.userId, "ai_config")
  if (!configRow) {
    return res.status(400).json({ error: "请先配置 AI 设置" })
  }

  let config
  try {
    config = JSON.parse(configRow.value)
  } catch {
    return res.status(400).json({ error: "AI 配置格式错误" })
  }

  if (!config.apiKey || !config.baseUrl || !config.model) {
    return res.status(400).json({ error: "AI 配置不完整，请检查 API Key、Base URL 和模型" })
  }

  const url = `${config.baseUrl}/chat/completions`

  const prompt = `你是一个专业的物品识别助手。用户会上传一张物品的照片（通常是购物订单截图或物品实物图），请识别该物品并提取以下信息。

请以JSON格式回复，包含以下字段：
- name：物品名称（简洁准确，如"iPhone 15 Pro"、"戴森V12吸尘器"、"宜家马尔姆抽屉柜"）
- category：物品分类（从以下选项中选择最匹配的：数码电子、硬通货、非标品、生活家居、服饰鞋包、运动健身、游戏娱乐、学习教育、其他）
- estimatedPrice：估算的购买价格（数值，单位：元，如果是订单截图则读取订单金额，否则根据物品型号和市场价格估算）
- brand：品牌（如无法确定则为空字符串）
- description：物品简要描述（包括外观特征、型号等，50字以内）
- purchaseDate：购入日期（格式：YYYY-MM-DD，从订单截图中识别下单日期/支付日期；如无法确定则为空字符串）

如果图片中无法识别出明确的物品，请返回：
{"name":"","category":"其他","estimatedPrice":0,"brand":"","description":"无法识别图片中的物品","purchaseDate":""}

请仅回复JSON，不要包含其他内容。`

  try {
    const isUrl = typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://"))

    let imageContent
    if (isUrl) {
      imageContent = { type: "image_url", image_url: { url: image } }
    } else {
      const base64Data = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`
      imageContent = { type: "image_url", image_url: { url: base64Data } }
    }

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
        max_tokens: 500,
      }),
    })

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

    res.json({
      name: String(parsed.name || ""),
      category: String(parsed.category || "其他"),
      estimatedPrice: Number(parsed.estimatedPrice) || 0,
      brand: String(parsed.brand || ""),
      description: String(parsed.description || ""),
      purchaseDate: String(parsed.purchaseDate || ""),
    })
  } catch (e) {
    console.error("Image recognition error:", e)
    res.status(500).json({ error: "图片识别失败，请稍后重试" })
  }
})

export default router
