import { useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Package, Activity,
  Trash2, TrendingUp, ChevronDown, LogOut,
  Settings, Sparkles, DatabaseBackup, User, Palette, Trophy, Users, Bell, ShieldAlert, BarChart3, Globe, Code, Wand2, Clock, Zap
} from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { useAuthStore } from "@/store/useAuthStore"
import type { ExportFormat } from "@/utils/storage"

type NavItem = { to: string; label: string; icon: React.ElementType; badge?: boolean }
type NavGroup = { title: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    title: "核心",
    items: [
      { to: "/", label: "仪表盘", icon: LayoutDashboard },
      { to: "/assets", label: "资产列表", icon: Package },
      { to: "/trash", label: "回收站", icon: Trash2, badge: true },
    ],
  },
  {
    title: "洞察",
    items: [
      { to: "/analytics", label: "数据分析", icon: BarChart3 },
      { to: "/review", label: "盈亏复盘", icon: TrendingUp },
    ],
  },
  {
    title: "AI",
    items: [
      { to: "/ai-advisor", label: "AI 顾问", icon: Wand2 },
      { to: "/universe", label: "资产宇宙", icon: Globe },
      { to: "/time-machine", label: "时光机", icon: Clock },
    ],
  },
  {
    title: "更多",
    items: [
      { to: "/share", label: "小组共享", icon: Users },
      { to: "/achievements", label: "成就系统", icon: Trophy },
    ],
  },
]

const settingsItems = [
  { to: "/settings/account", label: "账户管理", icon: User },
  { to: "/settings/appearance", label: "外观设置", icon: Palette },
  { to: "/settings/locale", label: "语言和货币", icon: Globe },
  { to: "/settings/ai", label: "AI 估值", icon: Sparkles },
  { to: "/settings/reminders", label: "提醒设置", icon: Bell },
  { to: "/settings/insurance", label: "保险保修", icon: ShieldAlert },
  { to: "/settings/api", label: "API 平台", icon: Code },
  { to: "/settings/backup", label: "数据备份", icon: DatabaseBackup },
]

const exportFormats: { value: ExportFormat; label: string; icon: React.ElementType }[] = [
  { value: "xlsx", label: "Excel (.xlsx)", icon: DatabaseBackup },
  { value: "csv", label: "CSV (.csv)", icon: DatabaseBackup },
  { value: "json", label: "JSON (.json)", icon: DatabaseBackup },
]

export default function Sidebar() {
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportData = useAssetStore((s) => s.exportData)
  const importData = useAssetStore((s) => s.importData)
  const trashCount = useAssetStore((s) => s.trash.length)
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const isSettingsActive = location.pathname.startsWith("/settings")

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImportError(null)
      importData(file).catch((err) => {
        setImportError(err instanceof Error ? err.message : "导入失败")
        setTimeout(() => setImportError(null), 3000)
      })
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleExport(format: ExportFormat) {
    exportData(format)
    setShowExportMenu(false)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-edge-subtle bg-ink md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-edge-subtle px-6">
        <Activity className="h-7 w-7 text-accent" />
        <span className="font-mono text-xl font-bold tracking-tight text-content-primary">
          Asset<span className="text-accent">Pulse</span>
        </span>
      </div>

      <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-content-faint">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.to
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent-light text-accent"
                        : "text-content-tertiary hover:bg-surface-hover hover:text-content-primary"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                    {item.badge && trashCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-medium text-amber-400">
                        {trashCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        <div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isSettingsActive
                ? "bg-accent-light text-accent"
                : "text-content-tertiary hover:bg-surface-hover hover:text-content-primary"
            }`}
          >
            <Settings className="h-[18px] w-[18px]" />
            系统设置
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showSettings ? "rotate-180" : ""}`} />
          </button>
          {showSettings && (
            <div className="mt-1 ml-4 space-y-0.5 border-l border-edge pl-3">
              {settingsItems.map((item) => {
                const isActive = location.pathname === item.to
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-accent-light text-accent"
                        : "text-content-muted hover:bg-surface-hover hover:text-content-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-edge-subtle px-3 py-4">
        {currentUser && (
          <>
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-content-primary">{currentUser.username}</p>
                <p className="text-xs text-content-muted">已登录</p>
              </div>
              <button
                onClick={logout}
                title="退出登录"
                className="text-content-muted transition-colors hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <Link to="/settings/account" className="mb-4 flex items-center gap-2 rounded-lg bg-surface px-3 py-2 hover:bg-surface-hover transition-colors">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-content-primary">AI 剩余</p>
              </div>
              <span className="font-mono text-sm font-bold text-content-secondary">
                {currentUser.aiUsage?.remaining ?? 0}
              </span>
            </Link>
          </>
        )}

        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
          数据管理
        </p>
        <div className="space-y-1">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content-primary"
            >
              <DatabaseBackup className="h-[18px] w-[18px]" />
              导出数据
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>
            {showExportMenu && (
              <div className="mt-1 rounded-lg border border-edge bg-ink py-1 shadow-xl">
                {exportFormats.map((fmt) => {
                  const Icon = fmt.icon
                  return (
                    <button
                      key={fmt.value}
                      onClick={() => handleExport(fmt.value)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
                    >
                      <Icon className="h-4 w-4" />
                      {fmt.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content-primary"
          >
            <DatabaseBackup className="h-[18px] w-[18px]" />
            导入数据
          </button>

          {importError && (
            <p className="px-3 py-1 text-xs text-red-400">{importError}</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xlsx,.xls,.csv"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
    </aside>
  )
}
