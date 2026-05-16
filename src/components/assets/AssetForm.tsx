import { useState, useMemo, useRef, useCallback } from "react"
import { Calculator, Star, Camera, X, Sparkles, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import type { Asset, AssetFormData, AssetStatus, AIValuationResult } from "@/types"
import { DEFAULT_CATEGORIES } from "@/types"
import { formatCurrency, formatDays } from "@/utils/format"
import { computeAssetFromForm } from "@/utils/calculations"
import { imageFileToBase64 } from "@/utils/storage"
import { useAssetStore } from "@/store/useAssetStore"
import { api } from "@/utils/api"
import { estimateAssetValue, loadAIConfig } from "@/utils/aiValuation"

interface AssetFormProps {
  initialData?: Asset
  onSubmit: (form: AssetFormData) => void
  onCancel: () => void
  submitting?: boolean
}

const CATEGORY_ALIASES: Record<string, string> = {
  "数码": "数码电子",
  "电子产品": "数码电子",
  "电子": "数码电子",
  "数码产品": "数码电子",
  "黄金": "硬通货",
  "贵金属": "硬通货",
  "珠宝": "硬通货",
  "奢侈品": "硬通货",
  "收藏品": "硬通货",
  "家具": "生活家居",
  "家居": "生活家居",
  "家电": "生活家居",
  "家用电器": "生活家居",
  "生活": "生活家居",
  "厨房": "生活家居",
  "服装": "服饰鞋包",
  "鞋": "服饰鞋包",
  "包": "服饰鞋包",
  "箱包": "服饰鞋包",
  "穿搭": "服饰鞋包",
  "运动": "运动健身",
  "健身": "运动健身",
  "户外": "运动健身",
  "游戏": "游戏娱乐",
  "娱乐": "游戏娱乐",
  "玩具": "游戏娱乐",
  "乐器": "游戏娱乐",
  "教育": "学习教育",
  "学习": "学习教育",
  "书籍": "学习教育",
  "图书": "学习教育",
  "课程": "学习教育",
}

function matchCategory(aiCategory: string): string {
  if (!aiCategory) return ""
  if (DEFAULT_CATEGORIES.includes(aiCategory as typeof DEFAULT_CATEGORIES[number])) {
    return aiCategory
  }
  if (CATEGORY_ALIASES[aiCategory]) {
    return CATEGORY_ALIASES[aiCategory]
  }
  for (const [alias, target] of Object.entries(CATEGORY_ALIASES)) {
    if (aiCategory.includes(alias) || alias.includes(aiCategory)) {
      return target
    }
  }
  for (const cat of DEFAULT_CATEGORIES) {
    if (aiCategory.includes(cat) || cat.includes(aiCategory)) {
      return cat
    }
  }
  return ""
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

function DatePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? new Date(value + "T00:00:00").getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value + "T00:00:00").getMonth() : new Date().getMonth())

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const today = todayStr()

  const handleSelect = useCallback((day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    onChange(dateStr)
    setOpen(false)
  }, [viewYear, viewMonth, onChange])

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }, [viewMonth])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }, [viewMonth])

  const goToToday = useCallback(() => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    onChange(todayStr())
    setOpen(false)
  }, [onChange])

  const displayValue = value ? value.replace(/-/g, "/") : ""

  return (
    <div className="relative">
      <label className="block text-sm text-content-secondary mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm text-left outline-none focus:border-accent/30"
      >
        {displayValue || <span className="text-content-faint">选择日期</span>}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] rounded-xl border border-edge bg-ink p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-white/10 text-content-secondary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setViewYear((y) => y - 1)} className="px-1.5 py-0.5 rounded text-sm text-content-tertiary hover:bg-white/10 hover:text-content-primary">
                ‹
              </button>
              <span className="text-sm font-medium text-content-primary min-w-[100px] text-center">
                {viewYear}年{viewMonth + 1}月
              </span>
              <button type="button" onClick={() => setViewYear((y) => y + 1)} className="px-1.5 py-0.5 rounded text-sm text-content-tertiary hover:bg-white/10 hover:text-content-primary">
                ›
              </button>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-white/10 text-content-secondary">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-content-faint py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const isSelected = value === dateStr
              const isToday = today === dateStr
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`h-8 rounded text-xs font-medium transition-colors
                    ${isSelected ? "bg-accent text-white" : isToday ? "bg-white/10 text-accent" : "text-content-secondary hover:bg-white/10"}
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-edge flex justify-between">
            <button type="button" onClick={goToToday} className="text-xs text-accent hover:text-emerald-300">
              今天
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-content-tertiary hover:text-content-secondary">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
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
  const [valuing, setValuing] = useState(false)
  const [aiValuation, setAiValuation] = useState<AIValuationResult | null>(initialData?.aiValuation ?? null)
  const [showImagePreview, setShowImagePreview] = useState(false)
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
      rating, note, aiValuation,
    })
  }, [name, status, category, location, imageUrl, purchaseDate, purchasePrice, endDate, recycleAmount, targetDailyCost, rating, note, aiValuation])

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

      if (result.name) {
        setName(result.brand ? `${result.brand} ${result.name}` : result.name)
      }
      if (result.category) {
        const matched = matchCategory(result.category)
        if (matched) {
          setCategory(matched)
        }
      }
      if (result.purchaseDate) {
        const dateStr = result.purchaseDate.trim()
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split("-")
          setPurchaseDate(`${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`)
        }
      } else if (!purchaseDate) {
        setPurchaseDate(todayStr())
      }
      if (result.estimatedPrice > 0) {
        setPurchasePrice(result.estimatedPrice.toString())
      }
      if (result.description) {
        setNote(result.description)
      }

      setImageUrl(null)
      setRecognizing(false)

      setValuing(true)
      try {
        const config = await loadAIConfig()
        if (config && config.apiKey && config.baseUrl && config.model) {
          const price = result.estimatedPrice > 0 ? result.estimatedPrice : parseFloat(purchasePrice) || 0
          const pDate = result.purchaseDate || purchaseDate || todayStr()
          const tempAsset = {
            id: "",
            userId: "",
            name: result.brand ? `${result.brand} ${result.name}` : result.name,
            status: "active" as AssetStatus,
            category: matchCategory(result.category) || category,
            location,
            imageUrl,
            purchaseDate: pDate,
            purchasePrice: price,
            endDate: null,
            recycleAmount: null,
            targetDailyCost: null,
            effectiveDays: 0,
            dailyCost: 0,
            rating: null,
            note: result.description || note,
            aiValuation: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          const valuation = await estimateAssetValue(config, tempAsset)
          setAiValuation(valuation)
        }
      } catch {
        // valuation failure is non-critical, silently ignore
      } finally {
        setValuing(false)
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
      rating, note, aiValuation,
    })
  }

  const targetVal = parseFloat(targetDailyCost)
  const targetProgress = preview && targetVal > 0 && preview.dailyCost > 0
    ? Math.min(100, (targetVal / preview.dailyCost) * 100) : 0
  const targetMet = preview && targetVal > 0 && preview.dailyCost <= targetVal

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-content-secondary mb-1">资产名称</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30" />
      </div>

      <div>
        <label className="block text-sm text-content-secondary mb-1">状态</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30">
          <option value="active" className="bg-ink">使用中</option>
          <option value="recycled" className="bg-ink">已回收</option>
          <option value="scrapped" className="bg-ink">已报废</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-content-secondary mb-1">分类</label>
          {!showNewCategory ? (
            <select value={category} onChange={(e) => {
              if (e.target.value === "__add__") { setShowNewCategory(true); setCategory("") }
              else setCategory(e.target.value)
            }} className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30">
              <option value="" className="bg-ink">选择分类</option>
              {categories.map((c) => <option key={c} value={c} className="bg-ink">{c}</option>)}
              <option value="__add__" className="bg-ink">添加分类</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="新分类"
                className="flex-1 min-w-0 rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30" />
              <button type="button" onClick={handleCategoryAdd}
                className="rounded-lg bg-accent px-3 py-2 text-xs text-white hover:bg-accent-hover">确定</button>
              <button type="button" onClick={() => { setShowNewCategory(false); setNewCategory("") }}
                className="rounded-lg border border-edge px-3 py-2 text-xs text-content-secondary hover:bg-surface">取消</button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-content-secondary mb-1">位置</label>
          {!showNewLocation ? (
            <select value={location} onChange={(e) => {
              if (e.target.value === "__add__") { setShowNewLocation(true); setLocation("") }
              else setLocation(e.target.value)
            }} className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30">
              <option value="" className="bg-ink">选择位置</option>
              {locations.map((l) => <option key={l} value={l} className="bg-ink">{l}</option>)}
              <option value="__add__" className="bg-ink">添加位置</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="新位置"
                className="flex-1 min-w-0 rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30" />
              <button type="button" onClick={handleLocationAdd}
                className="rounded-lg bg-accent px-3 py-2 text-xs text-white hover:bg-accent-hover">确定</button>
              <button type="button" onClick={() => { setShowNewLocation(false); setNewLocation("") }}
                className="rounded-lg border border-edge px-3 py-2 text-xs text-content-secondary hover:bg-surface">取消</button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm text-content-secondary mb-1">图片</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        <div className="flex items-start gap-3">
          {imageUrl ? (
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt=""
                className="h-20 w-20 rounded-lg object-cover border border-edge cursor-pointer hover:opacity-80"
                onClick={() => setShowImagePreview(true)}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setImageUrl(null)
                }}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-white/20 hover:border-accent/30 hover:bg-surface">
              <Camera className="h-6 w-6 text-content-muted" />
            </button>
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={imageUrl ? handleRecognize : () => fileInputRef.current?.click()}
              disabled={recognizing || valuing}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-medium text-white transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recognizing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  识别中...
                </>
              ) : valuing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  估算残值...
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
                className="text-xs text-content-muted hover:text-content-secondary transition-colors"
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
        <DatePicker value={purchaseDate} onChange={setPurchaseDate} label="购入日期" />
        <div>
          <label className="block text-sm text-content-secondary mb-1">购入价格</label>
          <input type="number" step="0.01" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30" />
        </div>
      </div>

      {status !== "active" && (
        <div className="grid grid-cols-2 gap-4">
          <DatePicker value={endDate} onChange={setEndDate} label="结束日期" />
          {status === "recycled" && (
            <div>
              <label className="block text-sm text-content-secondary mb-1">回收金额</label>
              <input type="number" step="0.01" min="0" value={recycleAmount} onChange={(e) => setRecycleAmount(e.target.value)} required
                className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30" />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm text-content-secondary mb-1">目标日均成本</label>
        <input type="number" step="0.01" min="0" value={targetDailyCost} onChange={(e) => setTargetDailyCost(e.target.value)} placeholder="可选"
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30" />
      </div>

      {(status === "recycled" || status === "scrapped") && (
        <div>
          <label className="block text-sm text-content-secondary mb-1">评分</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} className="p-0.5">
                <Star className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-content-faint"}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-content-secondary mb-1">备注</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="可选"
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30 resize-none" />
      </div>

      {preview && (
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <div className="flex items-center gap-2 mb-3 text-sm text-content-secondary">
            <Calculator className="h-4 w-4" />
            实时计算预览
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-content-muted">有效天数</p>
              <p className="text-lg font-semibold text-content-primary">{formatDays(preview.effectiveDays)}</p>
            </div>
            <div>
              <p className="text-xs text-content-muted">日均成本</p>
              <p className="text-lg font-semibold text-accent">{formatCurrency(preview.dailyCost)}</p>
            </div>
          </div>
          {aiValuation && (
            <div className="mt-3 pt-3 border-t border-edge grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-content-muted">AI 估算残值</p>
                <p className="text-lg font-semibold text-cyan-400">{formatCurrency(aiValuation.estimatedValue)}</p>
              </div>
              <div>
                <p className="text-xs text-content-muted">折旧率</p>
                <p className="text-lg font-semibold text-amber-400">{(aiValuation.depreciationRate * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}
          {targetVal > 0 && preview.dailyCost > 0 && (
            <div className="mt-3 pt-3 border-t border-edge">
              <div className="flex items-center justify-between text-xs text-content-muted mb-1">
                <span>目标进度</span>
                {targetMet ? (
                  <span className="text-accent font-medium">已回本</span>
                ) : (
                  <span>{targetProgress.toFixed(1)}%</span>
                )}
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${targetProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? "保存中..." : "提交"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}
          className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface disabled:opacity-50">
          取消
        </button>
      </div>
    </form>

    {showImagePreview && imageUrl && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm modal-overlay-enter"
        onClick={() => setShowImagePreview(false)}
      >
        <img
          src={imageUrl}
          alt=""
          className="max-w-[90vw] max-h-[90vh] object-contain cursor-pointer modal-content-enter"
          onClick={() => setShowImagePreview(false)}
        />
      </div>
    )}
    </>
  )
}
