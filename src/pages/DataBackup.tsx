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
import { api } from "@/utils/api"
import { useAssetStore } from "@/store/useAssetStore"
import { useAuthStore } from "@/store/useAuthStore"
import { resetInitPromise } from "@/store/useAssetStore"

export default function DataBackup() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<Record<string, unknown> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const assets = useAssetStore((s) => s.assets)
  const trash = useAssetStore((s) => s.trash)
  const categories = useAssetStore((s) => s.categories)
  const locations = useAssetStore((s) => s.locations)
  const resetStore = useAssetStore((s) => s.resetStore)
  const assetInit = useAssetStore((s) => s.initialize)
  const currentUser = useAuthStore((s) => s.currentUser)

  const handleExport = useCallback(async () => {
    setExporting(true)
    setMessage(null)
    try {
      const data = await api.backup.export()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `AssetPulse_备份_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ ok: true, text: `备份成功，共 ${(data as { assets: unknown[] }).assets?.length ?? 0} 项资产` })
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
      const data = JSON.parse(text)
      if (!data.assets) {
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
      await api.backup.import(confirmRestore)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <DatabaseBackup className="h-6 w-6 text-emerald-400" />
          数据备份与恢复
        </h1>
        <p className="mt-1 text-sm text-white/50">数据存储在服务器 SQLite 数据库中，定期备份可防止数据丢失</p>
      </div>

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
            <Shield className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-white/50">存储方式</span>
          </div>
          <p className="text-lg font-semibold text-white">服务端 SQLite</p>
          <p className="mt-1 text-xs text-white/30">数据安全存储在服务器</p>
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
        <h2 className="text-lg font-semibold text-white">存储说明</h2>

        <div className="flex items-start gap-3 rounded-lg bg-white/5 p-4">
          <Info className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
          <div className="text-sm text-white/60">
            <p>数据存储在服务器的 SQLite 数据库中，通过登录账号访问。</p>
            <p className="mt-1">建议定期导出备份文件，保存到安全的位置（如网盘、U盘等）。</p>
          </div>
        </div>
      </div>

      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1B1E] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">确认恢复数据</h3>
            <p className="mt-2 text-sm text-white/60">
              恢复备份将<strong className="text-amber-400">覆盖当前所有数据</strong>，此操作不可撤销。
            </p>
            <div className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-white/70 space-y-1">
              <p>备份时间：{String(confirmRestore.exportedAt || "未知")}</p>
              <p>资产数量：{Array.isArray(confirmRestore.assets) ? confirmRestore.assets.length : 0}</p>
              <p>回收站：{Array.isArray(confirmRestore.trash) ? confirmRestore.trash.length : 0} 项</p>
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
