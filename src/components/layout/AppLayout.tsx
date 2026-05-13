import { useEffect, useRef, useState } from "react"
import { Outlet, Link } from "react-router-dom"
import { Activity, AlertTriangle, X } from "lucide-react"
import Sidebar from "@/components/layout/Sidebar"
import MobileNav from "@/components/layout/MobileNav"
import { useAssetStore } from "@/store/useAssetStore"
import { useAuthStore } from "@/store/useAuthStore"
import AuthPage from "@/pages/AuthPage"
import { shouldRemindBackup } from "@/utils/database"

export default function AppLayout() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const authInitialized = useAuthStore((s) => s.initialized)
  const authInit = useAuthStore((s) => s.initialize)
  const assetInit = useAssetStore((s) => s.initialize)
  const loading = useAssetStore((s) => s.loading)
  const initialized = useAssetStore((s) => s.initialized)
  const resetStore = useAssetStore((s) => s.resetStore)
  const prevUserIdRef = useRef<string | null>(null)
  const initStartedRef = useRef(false)
  const [showBackupReminder, setShowBackupReminder] = useState(false)

  useEffect(() => {
    if (!authInitialized) authInit()
  }, [authInitialized, authInit])

  useEffect(() => {
    if (!authInitialized || !currentUser) return
    if (prevUserIdRef.current === currentUser.id) return
    prevUserIdRef.current = currentUser.id
    initStartedRef.current = false
    resetStore()
  }, [authInitialized, currentUser, resetStore])

  useEffect(() => {
    if (!authInitialized || !currentUser) return
    if (prevUserIdRef.current !== currentUser.id) return
    if (initStartedRef.current || initialized) return
    initStartedRef.current = true
    assetInit(currentUser.id)
  }, [authInitialized, currentUser, initialized, assetInit])

  useEffect(() => {
    if (authInitialized && !currentUser) {
      prevUserIdRef.current = null
      initStartedRef.current = false
      resetStore()
    }
  }, [authInitialized, currentUser, resetStore])

  useEffect(() => {
    if (initialized && currentUser && shouldRemindBackup()) {
      const dismissed = localStorage.getItem("assetpulse_backup_dismissed")
      if (!dismissed || Date.now() - Number(dismissed) > 86400000) {
        setShowBackupReminder(true)
      }
    }
  }, [initialized, currentUser])

  if (!authInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D1B1E]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-emerald-500 animate-pulse" />
          <div className="text-center">
            <p className="font-mono text-xl font-bold tracking-tight text-white">
              Asset<span className="text-emerald-500">Pulse</span>
            </p>
            <p className="mt-1 text-sm text-white/40">正在加载...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <AuthPage />
  }

  if (loading && !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D1B1E]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-emerald-500 animate-pulse" />
          <div className="text-center">
            <p className="font-mono text-xl font-bold tracking-tight text-white">
              Asset<span className="text-emerald-500">Pulse</span>
            </p>
            <p className="mt-1 text-sm text-white/40">正在加载数据...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1B1E] font-sans text-white">
      <Sidebar />

      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {showBackupReminder && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <p className="flex-1 text-sm text-amber-300">
                数据仅存储在本地浏览器中，建议定期备份。
                <Link to="/settings/backup" className="ml-1 underline underline-offset-2 hover:text-amber-200">
                  前往备份
                </Link>
              </p>
              <button
                onClick={() => {
                  setShowBackupReminder(false)
                  localStorage.setItem("assetpulse_backup_dismissed", String(Date.now()))
                }}
                className="text-amber-400/50 hover:text-amber-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
