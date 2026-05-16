import type { Asset, Achievement, AchievementId, AchievementProgress } from "@/types"

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementId, Omit<Achievement, "unlockedAt">> = {
  first_asset: {
    id: "first_asset",
    name: "第一步",
    description: "添加你的第一个资产",
    icon: "🎯",
    rarity: "common",
  },
  long_term_holder: {
    id: "long_term_holder",
    name: "长期主义者",
    description: "拥有一个使用超过 365 天的资产",
    icon: "🌳",
    rarity: "rare",
  },
  cost_saver: {
    id: "cost_saver",
    name: "回本达人",
    description: "拥有一个日均成本 < 1 元的资产",
    icon: "💰",
    rarity: "rare",
  },
  collector: {
    id: "collector",
    name: "收藏家",
    description: "同一分类下有超过 10 个资产",
    icon: "🏆",
    rarity: "epic",
  },
  declutter_master: {
    id: "declutter_master",
    name: "断舍离大师",
    description: "回收或报废超过 20 个资产",
    icon: "✨",
    rarity: "epic",
  },
  daily_cost_zero: {
    id: "daily_cost_zero",
    name: "白嫖之王",
    description: "拥有一个日均成本为 0 的资产（已完全回本）",
    icon: "🆓",
    rarity: "legendary",
  },
  high_value: {
    id: "high_value",
    name: "大玩家",
    description: "拥有一个价格超过 10000 元的资产",
    icon: "💎",
    rarity: "epic",
  },
  full_rating: {
    id: "full_rating",
    name: "完美体验",
    description: "给一个资产打了 5 星好评",
    icon: "⭐",
    rarity: "common",
  },
}

export const RARITY_COLORS: Record<Achievement["rarity"], string> = {
  common: "text-gray-400 border-gray-600 bg-gray-800/50",
  rare: "text-blue-400 border-blue-600 bg-blue-900/30",
  epic: "text-purple-400 border-purple-600 bg-purple-900/30",
  legendary: "text-yellow-400 border-yellow-600 bg-yellow-900/30",
}

export const RARITY_GLOW: Record<Achievement["rarity"], string> = {
  common: "",
  rare: "shadow-blue-500/20",
  epic: "shadow-purple-500/20",
  legendary: "shadow-yellow-500/30",
}

export function getAchievementProgress(
  achievementId: AchievementId,
  assets: Asset[]
): AchievementProgress {
  switch (achievementId) {
    case "first_asset":
      return { current: assets.length > 0 ? 1 : 0, target: 1, percentage: assets.length > 0 ? 100 : 0 }
    case "long_term_holder": {
      const longTermCount = assets.filter((a) => a.effectiveDays >= 365).length
      return { current: longTermCount, target: 1, percentage: Math.min(100, (longTermCount / 1) * 100) }
    }
    case "cost_saver": {
      const lowCostCount = assets.filter((a) => a.dailyCost < 1).length
      return { current: lowCostCount, target: 1, percentage: Math.min(100, (lowCostCount / 1) * 100) }
    }
    case "collector": {
      const categoryCounts = new Map<string, number>()
      assets.forEach((a) => {
        const c = a.category || "其他"
        categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1)
      })
      const maxCategoryCount = Math.max(...Array.from(categoryCounts.values()), 0)
      return { current: maxCategoryCount, target: 10, percentage: Math.min(100, (maxCategoryCount / 10) * 100) }
    }
    case "declutter_master": {
      const declutteredCount = assets.filter((a) => a.status === "recycled" || a.status === "scrapped").length
      return { current: declutteredCount, target: 20, percentage: Math.min(100, (declutteredCount / 20) * 100) }
    }
    case "daily_cost_zero": {
      const zeroCostCount = assets.filter((a) => a.dailyCost <= 0).length
      return { current: zeroCostCount, target: 1, percentage: Math.min(100, (zeroCostCount / 1) * 100) }
    }
    case "high_value": {
      const highValueCount = assets.filter((a) => a.purchasePrice >= 10000).length
      return { current: highValueCount, target: 1, percentage: Math.min(100, (highValueCount / 1) * 100) }
    }
    case "full_rating": {
      const fullRatingCount = assets.filter((a) => a.rating === 5).length
      return { current: fullRatingCount, target: 1, percentage: Math.min(100, (fullRatingCount / 1) * 100) }
    }
    default:
      return { current: 0, target: 1, percentage: 0 }
  }
}

export function checkAchievements(assets: Asset[], unlockedAchievements: Set<string>): AchievementId[] {
  const newlyUnlocked: AchievementId[] = []
  const ids = Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementId[]

  for (const id of ids) {
    if (unlockedAchievements.has(id)) continue
    const progress = getAchievementProgress(id, assets)
    if (progress.percentage >= 100) {
      newlyUnlocked.push(id)
    }
  }
  return newlyUnlocked
}

export function getAchievements(assets: Asset[], unlockedIds: Set<string>): Achievement[] {
  return (Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementId[]).map((id) => ({
    ...ACHIEVEMENT_DEFINITIONS[id],
    unlockedAt: unlockedIds.has(id) ? new Date().toISOString() : null,
  }))
}
