import type { Achievement } from "@/types"
import { RARITY_COLORS, RARITY_GLOW, getAchievementProgress } from "@/utils/achievements"
import type { Asset } from "@/types"

interface AchievementCardProps {
  achievement: Achievement
  assets: Asset[]
}

export function AchievementCard({ achievement, assets }: AchievementCardProps) {
  const isUnlocked = achievement.unlockedAt !== null
  const progress = getAchievementProgress(achievement.id, assets)

  return (
    <div className={`relative rounded-xl border-2 p-4 transition-all duration-300 ${
      isUnlocked 
        ? `${RARITY_COLORS[achievement.rarity]} shadow-lg ${RARITY_GLOW[achievement.rarity]}`
        : "border-white/10 bg-white/5 opacity-60"
    }`}>
      <div className="flex items-start gap-4">
        <div className={`text-4xl ${isUnlocked ? "" : "grayscale brightness-50"}`}>
          {achievement.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold ${isUnlocked ? "text-white" : "text-gray-400"}`}>
              {achievement.name}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
              achievement.rarity === "common" ? "bg-gray-700 text-gray-300" :
              achievement.rarity === "rare" ? "bg-blue-700 text-blue-200" :
              achievement.rarity === "epic" ? "bg-purple-700 text-purple-200" :
              "bg-yellow-700 text-yellow-200"
            }`}>
              {achievement.rarity}
            </span>
          </div>
          <p className="text-sm text-content-tertiary mt-1">{achievement.description}</p>
          
          {!isUnlocked && progress.target > 1 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-content-tertiary mb-1">
                <span>{progress.current} / {progress.target}</span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {isUnlocked && (
          <div className="text-accent">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
