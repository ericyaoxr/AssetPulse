export type AssetStatus = "active" | "recycled" | "scrapped"

export interface User {
  id: string
  username: string
  passwordHash: string
  createdAt: string
}

export interface UserProfile {
  id: string
  username: string
  createdAt: string
}

export const DEFAULT_CATEGORIES = [
  "数码电子",
  "硬通货",
  "非标品",
  "生活家居",
  "服饰鞋包",
  "运动健身",
  "游戏娱乐",
  "学习教育",
  "其他",
] as const

export type CategoryName = (typeof DEFAULT_CATEGORIES)[number]

export interface Asset {
  id: string
  userId: string
  name: string
  status: AssetStatus
  category: string
  location: string
  imageUrl: string | null
  purchaseDate: string
  purchasePrice: number
  endDate: string | null
  recycleAmount: number | null
  targetDailyCost: number | null
  effectiveDays: number
  dailyCost: number
  rating: number | null
  note: string
  aiValuation: AIValuationResult | null
  createdAt: string
  updatedAt: string
}

export interface DeletedAsset {
  asset: Asset
  deletedAt: string
  userId: string
}

export interface AssetFormData {
  name: string
  status: AssetStatus
  category: string
  location: string
  imageUrl: string | null
  purchaseDate: string
  purchasePrice: number
  endDate: string
  recycleAmount: number
  targetDailyCost: number
  rating: number
  note: string
  aiValuation: AIValuationResult | null
}

export type SortField = "dailyCost" | "purchaseDate" | "purchasePrice" | "name"
export type SortOrder = "asc" | "desc"

export interface AIProviderConfig {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
}

export const PRESET_PROVIDERS: { label: string; provider: string; baseUrl: string; model: string }[] = [
  { label: "DeepSeek", provider: "deepseek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { label: "OpenAI", provider: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { label: "阿里云百炼", provider: "dashscope", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
  { label: "硅基流动", provider: "siliconflow", baseUrl: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3" },
  { label: "智谱AI", provider: "zhipu", baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
  { label: "Ollama (本地)", provider: "ollama", baseUrl: "http://localhost:11434/v1", model: "qwen2.5:7b" },
  { label: "自定义", provider: "custom", baseUrl: "", model: "" },
]

export interface AIValuationResult {
  estimatedValue: number
  confidenceLow: number
  confidenceHigh: number
  depreciationRate: number
  reasoning: string
  marketTrend: string
  estimatedAt: string
}

export type AchievementId = 
  | "long_term_holder"
  | "cost_saver"
  | "collector"
  | "declutter_master"
  | "first_asset"
  | "daily_cost_zero"
  | "high_value"
  | "full_rating"

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlockedAt: string | null
}

export interface AchievementProgress {
  current: number
  target: number
  percentage: number
}
