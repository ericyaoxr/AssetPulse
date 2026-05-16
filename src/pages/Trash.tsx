import { useState, useMemo } from "react"
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { formatCurrency, formatDate } from "@/utils/format"

export default function Trash() {
  const trash = useAssetStore((s) => s.trash)
  const restoreAsset = useAssetStore((s) => s.restoreAsset)
  const permanentDelete = useAssetStore((s) => s.permanentDelete)
  const clearTrash = useAssetStore((s) => s.clearTrash)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const itemsWithDays = useMemo(
    () =>
      trash.map((t) => {
        const deletedDate = new Date(t.deletedAt)
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24))
        return { ...t, daysRemaining: Math.max(0, 30 - elapsed) }
      }),
    [trash]
  )

  if (trash.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-content-primary">回收站</h1>
        <div className="flex flex-col items-center justify-center py-20 text-content-faint">
          <Trash2 className="h-12 w-12 mb-3" />
          <p className="text-lg">回收站为空</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">回收站</h1>
          <p className="mt-1 text-sm text-content-tertiary">{trash.length} 件已删除资产</p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          清空回收站
        </button>
      </div>

      <div className="space-y-3">
        {itemsWithDays.map((item) => (
          <div
            key={item.asset.id}
            className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4 transition-all hover:bg-white/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-content-primary font-medium">{item.asset.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-content-tertiary">
                  <span className="rounded-full bg-white/10 px-2 py-0.5">{item.asset.category}</span>
                  <span>删除于 {formatDate(item.deletedAt)}</span>
                  <span className={item.daysRemaining <= 7 ? "text-amber-400" : ""}>
                    剩余 {item.daysRemaining} 天
                  </span>
                </div>
                <p className="mt-1 text-xs text-content-muted">
                  {formatCurrency(item.asset.purchasePrice)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => restoreAsset(item.asset.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-light"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  恢复
                </button>
                <button
                  onClick={() => setConfirmId(item.asset.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  永久删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay-enter">
          <div className="w-80 rounded-xl border border-edge bg-ink p-6 shadow-2xl modal-content-enter">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-content-primary">清空回收站</h3>
            </div>
            <p className="mt-2 text-sm text-content-secondary">确定要永久删除所有资产吗？此操作不可撤销。</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { clearTrash(); setShowConfirm(false) }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                清空
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay-enter">
          <div className="w-80 rounded-xl border border-edge bg-ink p-6 shadow-2xl modal-content-enter">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-content-primary">永久删除</h3>
            </div>
            <p className="mt-2 text-sm text-content-secondary">确定要永久删除此资产吗？此操作不可撤销。</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { permanentDelete(confirmId); setConfirmId(null) }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                删除
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
