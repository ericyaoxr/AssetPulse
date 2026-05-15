import { useEffect, useRef } from "react"
import { Outlet } from "react-router-dom"
import { Activity } from "lucide-react"
import Sidebar from "@/components/layout/Sidebar"
import MobileNav from "@/components/layout/MobileNav"
import { useAssetStore } from "@/store/useAssetStore"
import { useAuthStore } from "@/store/useAuthStore"
import AuthPage from "@/pages/AuthPage"

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

  if (!authInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-accent animate-pulse" />
          <div className="text-center">
            <p className="font-mono text-xl font-bold tracking-tight text-content-primary">
              Asset<span className="text-accent">Pulse</span>
            </p>
            <p className="mt-1 text-sm text-content-muted">正在加载...</p>
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
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-accent animate-pulse" />
          <div className="text-center">
            <p className="font-mono text-xl font-bold tracking-tight text-content-primary">
              Asset<span className="text-accent">Pulse</span>
            </p>
            <p className="mt-1 text-sm text-content-muted">正在加载数据...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-content-primary">
      <Sidebar />

      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
