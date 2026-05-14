import { useState, useMemo, useRef } from "react"
import { Calculator, Star, Camera, X, Sparkles, Loader2 } from "lucide-react"
import type { Asset, AssetFormData, AssetStatus } from "@/types"
import { formatCurrency, formatDays } from "@/utils/format"
import { computeAssetFromForm } from "@/utils/calculations"
import { imageFileToBase64 } from "@/utils/storage"
import { useAssetStore } from "@/store/useAssetStore"
import { api } from "@/utils/api"

interface AssetFormProps {
  initialData?: Asset
  onSubmit: (form: AssetFormData) => void
  onCancel: () => void
  submitting?: boolean
}

export const AssetForm = ({ initialData, onSubmit, onCancel, submitting }: AssetFormProps) => {
  const [name, setName] = useState(initialData?.name ?? "")
  const [status, setStatus] = useState<AssetStatus>(initialData?.status ?? "active")
  const [category, setCategory] = useState(initialData?.category ?? "")
  const [location, setLocation] = useState(initialData?.location ?? "")
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl ?? null)
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchaseDate ?? "")
  const [purchasePrice, setPurchasePrice] = useState(initialData?.purchasePrice?.toString() ?? "")
  const [endDate, setEndDate] = useState(initialData?.endDate ?? "")
  const [recycleAmount, setRecycleAmount] = useState(initialData?.recycleAmount?.toString() ?? "")
  const [targetDailyCost, setTargetDailyCost] = useState(initialData?.targetDailyCost?.toString() ?? "")
  const [rating, setRating] = useState(initialData?.rating ?? 0)
  const [note, setNote] = useState(initialData?.note ?? "")
  const [newCategory, setNewCategory] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewLocation, setShowNewLocation] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [recognizeError, setRecognizeError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { categories, locations, addCategory, addLocation } = useAssetStore()

  const preview = useMemo(() => {
    const price = parseFloat(purchasePrice)
    if (!name || !purchaseDate || isNaN(price)) return null
    return computeAssetFromForm({
      name, status, category, location, imageUrl,
      purchaseDate, purchasePrice: price, endDate,
      recycleAmount: parseFloat(recycleAmount) || 0,
      targetDailyCost: parseFloat(targetDailyCost) || 0,
      rating, note,
    })
  }, [name, status, category, location, imageUrl, purchaseDate, purchasePrice, endDate, recycleAmount, targetDailyCost, rating, note])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await imageFileToBase64(file)
    setImageUrl(base64)
  }

  const handleRecognize = async () => {
    if (!imageUrl) {
      setRecognizeError("请先上传或拍摄物品图片")
      return
    }

    setRecognizing(true)
    setRecognizeError(null)

    try {
      const result = await api.ai.recognize(imageUrl)

      if (!result.name) {
        setRecognizeError("无法识别图片中的物品，请手动填写")
        return
      }

      if (result.name && !name) {
        setName(result.brand ? `${result.brand} ${result.name}` : result.name)
      }
      if (result.category && !category) {
        const validCategories = ["数码电子", "硬通货", "非标品", "生活家居", "服饰鞋包", "运动健身", "游戏娱乐", "学习教育", "其他"]
        if (validCategories.includes(result.category)) {
          setCategory(result.category)
        }
      }
      if (result.estimatedPrice > 0 && !purchasePrice) {
        setPurchasePrice(result.estimatedPrice.toString())
      }
      if (result.description && !note) {
        setNote(result.description)
      }
    } catch (e) {
      setRecognizeError(e instanceof Error ? e.message : "识别失败，请稍后重试")
    } finally {
      setRecognizing(false)
    }
  }

  const handleCategoryAdd = () => {
    if (!newCategory.trim()) return
    addCategory(newCategory.trim())
    setCategory(newCategory.trim())
    setNewCategory("")
    setShowNewCategory(false)
  }

  const handleLocationAdd = () => {
    if (!newLocation.trim()) return
    addLocation(newLocation.trim())
    setLocation(newLocation.trim())
    setNewLocation("")
    setShowNewLocation(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name, status, category, location, imageUrl,
      purchaseDate, purchasePrice: parseFloat(purchasePrice),
      endDate, recycleAmount: parseFloat(recycleAmount) || 0,
      targetDailyCost: parseFloat(targetDailyCost) || 0,
      rating, note,
    })
  }

  const targetVal = parseFloat(targetDailyCost)
  const targetProgress = preview && targetVal > 0 && preview.dailyCost > 0
    ? Math.min(100, (targetVal / preview.dailyCost) * 100) : 0
  const targetMet = preview && targetVal > 0 && preview.dailyCost <= targetVal

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-white/70 mb-1">资产名称</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
      </div>

      <div>
        <label className="block text-sm text-white/70 mb-1">状态</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50">
          <option value="active" className="bg-[#0D1B1E]">使用中</option>
          <option value="recycled" className="bg-[#0D1B1E]">已回收</option>
          <option value="scrapped" className="bg-[#0D1B1E]">已报废</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/70 mb-1">分类</label>
          {!showNewCategory ? (
            <select value={category} onChange={(e) => {
              if (e.target.value === "__add__") { setShowNewCategory(true); setCategory("") }
              else setCategory(e.target.value)
            }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50">
              <option value="" className="bg-[#0D1B1E]">选择分类</option>
              {categories.map((c) => <option key={c} value={c} className="bg-[#0D1B1E]">{c}</option>)}
              <option value="__add__" className="bg-[#0D1B1E]">添加分类</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="新分类"
                className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
              <button type="button" onClick={handleCategoryAdd}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white hover:bg-emerald-500">确定</button>
              <button type="button" onClick={() => { setShowNewCategory(false); setNewCategory("") }}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5">取消</button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">位置</label>
          {!showNewLocation ? (
            <select value={location} onChange={(e) => {
              if (e.target.value === "__add__") { setShowNewLocation(true); setLocation("") }
              else setLocation(e.target.value)
            }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50">
              <option value="" className="bg-[#0D1B1E]">选择位置</option>
              {locations.map((l) => <option key={l} value={l} className="bg-[#0D1B1E]">{l}</option>)}
              <option value="__add__" className="bg-[#0D1B1E]">添加位置</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="新位置"
                className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
              <button type="button" onClick={handleLocationAdd}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white hover:bg-emerald-500">确定</button>
              <button type="button" onClick={() => { setShowNewLocation(false); setNewLocation("") }}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5">取消</button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm text-white/70 mb-1">图片</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        <div className="flex items-start gap-3">
          {imageUrl ? (
            <div className="relative inline-block">
              <img src={imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover border border-white/10" />
              <button type="button" onClick={() => setImageUrl(null)}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-400">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-white/20 hover:border-emerald-500/50 hover:bg-white/5">
              <Camera className="h-6 w-6 text-white/40" />
            </button>
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={imageUrl ? handleRecognize : () => fileInputRef.current?.click()}
              disabled={recognizing}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-medium text-white transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recognizing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  识别中...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {imageUrl ? "AI 智能识别" : "拍照识别"}
                </>
              )}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                更换图片
              </button>
            )}
          </div>
        </div>
        {recognizeError && (
          <p className="mt-1.5 text-xs text-red-400">{recognizeError}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/70 mb-1">购入日期</label>
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">购入价格</label>
          <input type="number" step="0.01" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
        </div>
      </div>

      {status !== "active" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">结束日期</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
          </div>
          {status === "recycled" && (
            <div>
              <label className="block text-sm text-white/70 mb-1">回收金额</label>
              <input type="number" step="0.01" min="0" value={recycleAmount} onChange={(e) => setRecycleAmount(e.target.value)} required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm text-white/70 mb-1">目标日均成本</label>
        <input type="number" step="0.01" min="0" value={targetDailyCost} onChange={(e) => setTargetDailyCost(e.target.value)} placeholder="可选"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
      </div>

      {(status === "recycled" || status === "scrapped") && (
        <div>
          <label className="block text-sm text-white/70 mb-1">评分</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} className="p-0.5">
                <Star className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/30"}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-white/70 mb-1">备注</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="可选"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 resize-none" />
      </div>

      {preview && (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
          <div className="flex items-center gap-2 mb-3 text-sm text-white/70">
            <Calculator className="h-4 w-4" />
            实时计算预览
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40">有效天数</p>
              <p className="text-lg font-semibold text-white">{formatDays(preview.effectiveDays)}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">日均成本</p>
              <p className="text-lg font-semibold text-emerald-400">{formatCurrency(preview.dailyCost)}</p>
            </div>
          </div>
          {targetVal > 0 && preview.dailyCost > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                <span>目标进度</span>
                {targetMet ? (
                  <span className="text-emerald-400 font-medium">已回本</span>
                ) : (
                  <span>{targetProgress.toFixed(1)}%</span>
                )}
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${targetProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? "保存中..." : "提交"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}
          className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50">
          取消
        </button>
      </div>
    </form>
  )
}
