import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AssetHealthCheck, AIStory, AIRecommendationItem, TimeMachineSnapshot } from "@/types"

interface AIStore {
  healthChecks: AssetHealthCheck[]
  stories: AIStory[]
  recommendations: { nextBuys: AIRecommendationItem[]; betterOptions: AIRecommendationItem[] }
  timeMachineSnapshots: TimeMachineSnapshot[]
  setHealthChecks: (checks: AssetHealthCheck[]) => void
  addHealthCheck: (check: AssetHealthCheck) => void
  addStory: (story: AIStory) => void
  setRecommendations: (recommendations: { nextBuys: AIRecommendationItem[]; betterOptions: AIRecommendationItem[] }) => void
  addTimeMachineSnapshot: (snapshot: TimeMachineSnapshot) => void
  clearAll: () => void
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      healthChecks: [],
      stories: [],
      recommendations: { nextBuys: [], betterOptions: [] },
      timeMachineSnapshots: [],

      setHealthChecks: (checks) => set({ healthChecks: checks }),
      addHealthCheck: (check) => set({ healthChecks: [check, ...get().healthChecks] }),
      addStory: (story) => set({ stories: [story, ...get().stories] }),
      setRecommendations: (recommendations) => set({ recommendations }),
      addTimeMachineSnapshot: (snapshot) => set({ timeMachineSnapshots: [snapshot, ...get().timeMachineSnapshots] }),
      clearAll: () => set({ healthChecks: [], stories: [], recommendations: { nextBuys: [], betterOptions: [] }, timeMachineSnapshots: [] }),
    }),
    {
      name: "assetpulse-ai-store",
    }
  )
)
