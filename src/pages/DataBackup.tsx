import { useState, useRef, useCallback } from "react"
import {
  DatabaseBackup,
  Download,
  Upload,
  Shield,
  AlertTriangle,
  Check,
  Loader2,
  HardDrive,
  Clock,
  Info,
} from "lucide-react"
import {
  exportFullBackup,
  importFullBackup,
  downloadBackupFile,
  getLastBackupTime,
  shouldRemindBackup,
  requestPersistentStorage,
  type BackupData,
} from "@/utils/database"
import { useAssetStore } from "@/store/useAssetStore"
import { useAuthStore } from "@/store/useAuthStore"
import { resetInitPromise } from "@/store/useAssetStore"

function formatBackupTime(iso: string | null): string {
  if (!iso) return "从未备份"
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return "刚刚"
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffH < 24) return `${diffH} 小时前`
  if (diffD < 30) return `${diffD} 天前`
  return d.toLocaleDateString("zh-CN")
}

export default function DataBackup() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<BackupData | null>(null)
  const [persistent, setPersistent] = useState<boolean | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const assets = useAssetStore((s) => s.assets)
  const trash = useAssetStore((s) => s.trash)
  const categories = useAssetStore((s) => s.categories)
  const locations = useAssetStore((s) => s.locations)
  const resetStore = useAssetStore((s) => s.resetStore)
  const assetInit = useAssetStore((s) => s.initialize)
  const currentUser = useAuthStore((s) => s.currentUser)
  const lastBackup = getLastBackupTime()
  const needRemind = shouldRemindBackup()

  const handleExport = useCallback(async () => {
    setExporting(true)
    setMessage(null)
    try {
      const data = await exportFullBackup()
      downloadBackupFile(data)
      setMessage({ ok: true, text: `备份成功，共 ${data.assets.length} 项资产` })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "导出失败" })
    } finally {
      setExporting(false)
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ""

    setImporting(true)
    setMessage(null)
    try {
      const text = await file.text()
      const data: BackupData = JSON.parse(text)

      if (!data.version || !data.assets || !data.users) {
        setMessage({ ok: false, text: "无效的备份文件格式" })
        setImporting(false)
        return
      }

      setConfirmRestore(data)
    } catch {
      setMessage({ ok: false, text: "无法读取备份文件，请确认文件格式正确" })
    } finally {
      setImporting(false)
    }
  }, [])

  const handleConfirmRestore = useCallback(async () => {
    if (!confirmRestore || !currentUser) return
    setImporting(true)
    setMessage(null)
    try {
      await importFullBackup(confirmRestore)
      resetInitPromise()
      resetStore()
      await assetInit(currentUser.id)
      setMessage({ ok: true, text: "数据恢复成功" })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "恢复失败" })
    } finally {
      setImporting(false)
      setConfirmRestore(null)
    }
  }, [confirmRestore, currentUser, resetStore, assetInit])

  const handleRequestPersistent = useCallback(async () => {
    const result = await requestPersistentStorage()
    setPersistent(result)
    if (result) {
      setMessage({ ok: true, text: "已申请持久化存储，浏览器将尽量保留数据" })
    } else {
      setMessage({ ok: false, text: "浏览器拒绝了持久化存储请求" })
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <DatabaseBackup className="h-6 w-6 text-emerald-400" />
          数据备份与恢复
        </h1>
        <p className="mt-1 text-sm text-white/50">所有数据仅存储在本地浏览器中，定期备份可防止数据丢失</p>
      </div>

      {needRemind && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">备份提醒</p>
            <p className="mt-0.5 text-sm text-amber-400/70">
              {lastBackup
                ? `上次备份是在 ${formatBackupTime(lastBackup)}，建议定期导出备份文件`
                : "您尚未进行过备份，建议立即导出备份文件以保障数据安全"}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="h-5 w-5 text-white/40" />
            <span className="text-sm text-white/50">资产数量</span>
          </div>
          <p className="text-3xl font-bold text-white">{assets.length}</p>
          <p className="mt-1 text-xs text-white/30">
            回收站 {trash.length} 项 · 分类 {categories.length} · 位置 {locations.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-white/40" />
            <span className="text-sm text-white/50">上次备份</span>
          </div>
          <p className="text-lg font-semibold text-white">{formatBackupTime(lastBackup)}</p>
          <p className="mt-1 text-xs text-white/30">
            {needRemind ? "建议尽快备份" : "数据已备份"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">数据操作</h2>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            导出备份文件
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            从备份文件恢复
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              message.ok
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {message.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">存储安全</h2>

        <div className="flex items-start gap-3 rounded-lg bg-white/5 p-4">
          <Info className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
          <div className="text-sm text-white/60">
            <p>数据存储在浏览器的 IndexedDB 中，清除浏览器数据或更换浏览器会导致数据丢失。</p>
            <p className="mt-1">建议定期导出备份文件，保存到安全的位置（如网盘、U盘等）。</p>
          </div>
        </div>

        <button
          onClick={handleRequestPersistent}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Shield className="h-4 w-4" />
          {persistent === true
            ? "已获得持久化存储权限"
            : persistent === false
              ? "持久化存储被拒绝"
              : "申请持久化存储权限"}
        </button>

        {persistent === false && (
          <p className="text-xs text-white/40">
            浏览器拒绝了持久化请求。你可以在浏览器设置中将本站标记为"允许持久存储"来手动开启。
          </p>
        )}
      </div>

      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1B1E] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">确认恢复数据</h3>
            <p className="mt-2 text-sm text-white/60">
              恢复备份将<strong className="text-amber-400">覆盖当前所有数据</strong>，此操作不可撤销。
            </p>
            <div className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-white/70 space-y-1">
              <p>备份时间：{new Date(confirmRestore.exportedAt).toLocaleString("zh-CN")}</p>
              <p>用户数量：{confirmRestore.users.length}</p>
              <p>资产数量：{confirmRestore.assets.length}</p>
              <p>回收站：{confirmRestore.trash.length} 项</p>
              <p>分类：{confirmRestore.categories.length} · 位置：{confirmRestore.locations.length}</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmRestore(null)}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={importing}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {importing ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "确认恢复"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
