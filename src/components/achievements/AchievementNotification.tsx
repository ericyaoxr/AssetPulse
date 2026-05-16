import { useEffect } from "react"
import { X } from "lucide-react"
import { useAchievementStore } from "@/store/useAchievementStore"

export function AchievementNotification() {
  const notification = useAchievementStore((s) => s.notification)
  const clearNotification = useAchievementStore((s) => s.clearNotification)

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => clearNotification(), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, clearNotification])

  if (!notification) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-500">
      <div className="rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 px-6 py-4 shadow-2xl shadow-yellow-900/30 border border-yellow-400/30">
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-bounce">{notification.icon}</div>
          <div className="flex-1">
            <div className="text-yellow-100 text-xs font-bold uppercase tracking-wider">成就解锁！</div>
            <div className="text-white text-lg font-bold">{notification.name}</div>
          </div>
          <button
            onClick={clearNotification}
            className="text-yellow-200 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
