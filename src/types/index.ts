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
  inviteCode: string
  aiUsage: { remaining: number; totalUsed: number }
  inviteCount: number
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
  tags: string[]
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
  tags: string[]
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

// 小组/家庭共享相关类型
export interface SharedGroup {
  id: string
  name: string
  ownerId: string
  members: SharedMember[]
  createdAt: string
  updatedAt: string
}

export interface SharedMember {
  userId: string
  username: string
  role: "owner" | "editor" | "viewer"
  joinedAt: string
}

export interface SharedAsset {
  id: string
  groupId: string
  assetId: string
  asset?: Asset
  sharedBy: string
  sharedAt: string
  permission: "view" | "edit"
}

// 提醒系统相关类型
export type ReminderType = "warranty" | "maintenance" | "price_alert" | "lifespan"
export type ReminderStatus = "pending" | "triggered" | "dismissed"
export type ReminderPriority = "low" | "medium" | "high"

export interface Reminder {
  id: string
  assetId: string
  type: ReminderType
  title: string
  message: string
  dueDate: string
  priority: ReminderPriority
  status: ReminderStatus
  createdAt: string
  triggeredAt: string | null
}

export interface ReminderRule {
  id: string
  type: ReminderType
  enabled: boolean
  daysBefore: number
  priority: ReminderPriority
  autoCreate: boolean
}

export interface ReminderSettings {
  notificationsEnabled: boolean
  browserNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  rules: ReminderRule[]
}

// 保险和保修系统相关类型
export interface Warranty {
  id: string
  assetId: string
  provider: string
  policyNumber: string
  startDate: string
  endDate: string
  coverage: string
  deductible: number
  cost: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Claim {
  id: string
  warrantyId: string
  assetId: string
  claimNumber: string
  date: string
  amount: number
  description: string
  status: "pending" | "approved" | "rejected" | "completed"
  result: string
  createdAt: string
  updatedAt: string
}

export interface WarrantyFormData {
  provider: string
  policyNumber: string
  startDate: string
  endDate: string
  coverage: string
  deductible: number
  cost: number
  notes: string
}

export interface ClaimFormData {
  claimNumber: string
  date: string
  amount: number
  description: string
  status: "pending" | "approved" | "rejected" | "completed"
  result: string
}

// AI顾问相关类型
export interface AssetHealthCheck {
  id: string
  createdAt: string
  overallScore: number
  summary: string
  recommendations: HealthRecommendation[]
  futureExpensePrediction: ExpensePrediction
}

export interface HealthRecommendation {
  id: string
  type: "buy" | "sell" | "keep" | "maintain"
  assetId?: string
  assetName?: string
  priority: "low" | "medium" | "high"
  title: string
  description: string
  reason: string
}

export interface ExpensePrediction {
  next30Days: number
  next90Days: number
  next1Year: number
  breakdown: { category: string; amount: number }[]
}

export interface AIStory {
  id: string
  assetId: string
  title: string
  content: string
  tags: string[]
  createdAt: string
}

export interface AIRecommendationItem {
  id: string
  type: "next_buy" | "better_option"
  name: string
  category: string
  priceRange: { min: number; max: number }
  reason: string
  relatedAssetId?: string
  similarityScore: number
}

export interface HealthCheckResult {
  overallScore: number
  summary: string
  recommendations: HealthRecommendation[]
  futureExpensePrediction: ExpensePrediction
}

export interface RecommendationsResult {
  nextBuys: AIRecommendationItem[]
  betterOptions: AIRecommendationItem[]
}

// 时光机相关类型
export interface TimeMachineSnapshot {
  date: string
  totalAssets: number
  totalValue: number
  assets: {
    id: string
    name: string
    value: number
  }[]
}
