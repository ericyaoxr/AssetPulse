import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Asset, Achievement, AchievementId } from "@/types"
import { ACHIEVEMENT_DEFINITIONS, getAchievements, checkAchievements } from "@/utils/achievements"

interface AchievementStore {
  unlockedIds: Set<string>
  achievements: Achievement[]
  notification: { id: AchievementId; name: string; icon: string } | null
  initialize: (assets: Asset[]) => void
  unlockAchievement: (id: AchievementId) => void
  clearNotification: () => void
  checkAndUnlock: (assets: Asset[]) => AchievementId[]
}

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      unlockedIds: new Set(),
      achievements: getAchievements([], new Set()),
      notification: null,

      initialize: (assets) => {
        const unlocked = get().unlockedIds
        set({
          achievements: getAchievements(assets, unlocked),
        })
      },

      unlockAchievement: (id) => {
        const unlocked = get().unlockedIds
        if (unlocked.has(id)) return

        const newUnlocked = new Set(unlocked)
        newUnlocked.add(id)

        const def = ACHIEVEMENT_DEFINITIONS[id]

        set({
          unlockedIds: newUnlocked,
          notification: { id, name: def.name, icon: def.icon },
        })
      },

      clearNotification: () => set({ notification: null }),

      checkAndUnlock: (assets) => {
        const unlocked = get().unlockedIds
        const newly = checkAchievements(assets, unlocked)

        if (newly.length > 0) {
          const newUnlocked = new Set(unlocked)
          newly.forEach((id) => newUnlocked.add(id))
          const first = newly[0]
          const def = ACHIEVEMENT_DEFINITIONS[first]
          set({
            unlockedIds: newUnlocked,
            notification: { id: first, name: def.name, icon: def.icon },
            achievements: getAchievements(assets, newUnlocked),
          })
        } else {
          set({ achievements: getAchievements(assets, unlocked) })
        }

        return newly
      },
    }),
    {
      name: "assetpulse-achievements",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const data = JSON.parse(str)
          return {
            ...data,
            state: {
              ...data.state,
              unlockedIds: new Set(data.state.unlockedIds || []),
            },
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify({
            ...value,
            state: {
              ...value.state,
              unlockedIds: Array.from(value.state.unlockedIds),
            },
          }))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
