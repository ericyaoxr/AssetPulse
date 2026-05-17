import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { ToastProvider } from "@/contexts/ToastContext"
import { Activity } from "lucide-react"
import AppLayout from "@/components/layout/AppLayout"
import { AchievementNotification } from "@/components/achievements/AchievementNotification"

const Dashboard = lazy(() => import("@/pages/Dashboard"))
const AssetList = lazy(() => import("@/pages/AssetList"))
const AssetNew = lazy(() => import("@/pages/AssetNew"))
const AssetDetailPage = lazy(() => import("@/pages/AssetDetailPage"))
const AssetEdit = lazy(() => import("@/pages/AssetEdit"))
const Trash = lazy(() => import("@/pages/Trash"))
const Review = lazy(() => import("@/pages/Review"))
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage"))
const RemindersPage = lazy(() => import("@/pages/RemindersPage"))
const SharePage = lazy(() => import("@/pages/SharePage"))
const ShareGroupDetail = lazy(() => import("@/pages/ShareGroupDetail"))
const AISettings = lazy(() => import("@/pages/AISettings"))
const DataBackup = lazy(() => import("@/pages/DataBackup"))
const AccountSettings = lazy(() => import("@/pages/AccountSettings"))
const ThemeSettings = lazy(() => import("@/pages/ThemeSettings"))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Activity className="h-10 w-10 text-accent animate-pulse" />
        <div className="text-center">
          <p className="font-mono text-lg font-bold tracking-tight text-content-primary">
            Asset<span className="text-accent">Pulse</span>
          </p>
          <p className="mt-1 text-sm text-content-muted">正在加载...</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AchievementNotification />
        <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<AssetList />} />
              <Route path="/assets/new" element={<AssetNew />} />
              <Route path="/assets/:id" element={<AssetDetailPage />} />
              <Route path="/assets/:id/edit" element={<AssetEdit />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/review" element={<Review />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/share" element={<SharePage />} />
              <Route path="/share/:groupId" element={<ShareGroupDetail />} />
              <Route path="/settings/account" element={<AccountSettings />} />
              <Route path="/settings/appearance" element={<ThemeSettings />} />
              <Route path="/settings/ai" element={<AISettings />} />
              <Route path="/settings/backup" element={<DataBackup />} />
            </Route>
          </Routes>
        </Suspense>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  )
}
