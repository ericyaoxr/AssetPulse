import { useEffect } from "react"
import { Trophy } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { useAchievementStore } from "@/store/useAchievementStore"
import { AchievementCard } from "@/components/achievements/AchievementCard"

export default function AchievementsPage() {
  const assets = useAssetStore((s) => s.assets)
  const { achievements, initialize, checkAndUnlock } = useAchievementStore()

  useEffect(() => {
    initialize(assets)
    checkAndUnlock(assets)
  }, [assets, initialize, checkAndUnlock])

  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length
  const totalCount = achievements.length

  const sortedAchievements = [...achievements].sort((a, b) => {
    const aUnlocked = a.unlockedAt !== null ? 0 : 1
    const bUnlocked = b.unlockedAt !== null ? 0 : 1
    if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  })

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-400" />
          成就系统
        </h1>
        <p className="text-content-tertiary mt-1">
          已解锁 {unlockedCount} / {totalCount} 个成就
        </p>
      </div>

      <div className="grid gap-4">
        {sortedAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            assets={assets}
          />
        ))}
      </div>
    </div>
  )
}
