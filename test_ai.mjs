const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
const API_KEY = "sk-3a7d852245a44b5b910814a3238f6530"
const MODEL = "qwen3.6-flash"

async function testHealthCheck() {
  const prompt = `请作为我的资产管理顾问，帮我分析以下资产并生成体检报告。

我的资产概况：
- 总资产数量：1件
- 总价值：8999元
- 资产列表：
- iPhone 15 Pro（数码电子，¥8999，365天，日均¥24.65）

请用JSON格式返回分析结果：
{
  "overallScore": 0-100的综合评分,
  "summary": "200字以内的总体评价",
  "recommendations": [
    {
      "type": "buy|sell|keep|maintain",
      "assetName": "资产名称",
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
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
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
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("API Error:", response.status, errorText)
      return
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    console.log("=== RAW CONTENT ===")
    console.log(content)
    console.log("")

    console.log("=== TRY PARSE ===")
    try {
      JSON.parse(content)
      console.log("Direct parse OK")
    } catch {
      const m = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (m) {
        try {
          JSON.parse(m[1].trim())
          console.log("Code block parse OK")
        } catch (e2) {
          console.log("Code block parse FAILED:", e2.message)
          console.log("Extracted:", m[1].trim().substring(0, 200))
        }
      } else {
        console.log("No code block found")
        console.log("Content starts with:", content.substring(0, 300))
      }
    }
  } catch (e) {
    console.error("Fetch error:", e.message)
  }
}

testHealthCheck()
