import { useState, useRef, useCallback } from "react"
import { Star, Camera, X, Sparkles, Loader2, ChevronLeft, ChevronRight, CheckSquare, Square } from "lucide-react"
import type { Asset, AssetFormData, AssetStatus } from "@/types"
import { DEFAULT_CATEGORIES } from "@/types"
import { formatCurrency } from "@/utils/format"
import { imageFileToBase64 } from "@/utils/storage"
import { useAssetStore } from "@/store/useAssetStore"
import { useAuthStore } from "@/store/useAuthStore"
import { api } from "@/utils/api"
import type { ImageRecognitionItem } from "@/utils/api"
import { TagInput } from "@/components/assets/TagInput"

interface AssetFormProps {
  initialData?: Asset
  onSubmit: (form: AssetFormData) => void
  onCancel: () => void
  submitting?: boolean
  onBatchSubmit?: (forms: AssetFormData[]) => void
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

export const AssetForm = ({ initialData, onSubmit, onCancel, submitting, onBatchSubmit }: AssetFormProps) => {
  const [name, setName] = useState(initialData?.name ?? "")
  const [status, setStatus] = useState<AssetStatus>(initialData?.status ?? "active")
  const [category, setCategory] = useState(initialData?.category ?? "")
  const [location, setLocation] = useState(initialData?.location ?? "")
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl ?? null)
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchaseDate ?? todayStr())
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
  const aiValuation = initialData?.aiValuation ?? null
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [recognizedItems, setRecognizedItems] = useState<ImageRecognitionItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [showItemSelector, setShowItemSelector] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { categories, locations, addCategory, addLocation } = useAssetStore()
  const refreshUser = useAuthStore((s) => s.refreshUser)

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
      refreshUser()

      if (!result.items || result.items.length === 0) {
        setRecognizeError("无法识别图片中的物品，请手动填写")
        return
      }

      setRecognizedItems(result.items)
      setSelectedItems(new Set(result.items.map((_, index) => index)))
      setShowItemSelector(true)
      setRecognizing(false)
    } catch (e) {
      setRecognizeError(e instanceof Error ? e.message : "识别失败，请稍后重试")
    } finally {
      setRecognizing(false)
    }
  }

  const toggleItemSelection = (index: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  const handleConfirmItems = async () => {
    const selected = recognizedItems.filter((_, index) => selectedItems.has(index))
    if (selected.length === 0) {
      setShowItemSelector(false)
      setRecognizedItems([])
      setSelectedItems(new Set())
      return
    }

    if (selected.length === 1) {
      const item = selected[0]
      setName(item.brand ? `${item.brand} ${item.name}` : item.name)
      if (item.category) {
        const matched = matchCategory(item.category)
        if (matched) {
          setCategory(matched)
        }
      }
      if (item.purchaseDate) {
        const dateStr = item.purchaseDate.trim()
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split("-")
          setPurchaseDate(`${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`)
        }
      } else if (!purchaseDate) {
        setPurchaseDate(todayStr())
      }
      if (item.estimatedPrice > 0) {
        setPurchasePrice(item.estimatedPrice.toString())
      }
      if (item.description) {
        setNote(item.description)
      }

      setShowItemSelector(false)
      setRecognizedItems([])
      setSelectedItems(new Set())
    } else {
      if (onBatchSubmit) {
        const forms: AssetFormData[] = selected.map((item) => {
            let pDate = ""
            if (item.purchaseDate) {
              const dateStr = item.purchaseDate.trim()
              if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
                const parts = dateStr.split("-")
                pDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`
              }
            }
            if (!pDate) {
              pDate = todayStr()
            }
            const matchedCategory = matchCategory(item.category)
            return {
              name: item.brand ? `${item.brand} ${item.name}` : item.name,
              status: "active" as AssetStatus,
              category: matchedCategory || "",
              location: "",
              imageUrl: imageUrl,
              tags: [],
              purchaseDate: pDate,
              purchasePrice: item.estimatedPrice > 0 ? item.estimatedPrice : 0,
              endDate: "",
              recycleAmount: 0,
              targetDailyCost: 0,
              rating: 0,
              note: item.description || "",
              aiValuation: null,
            }
          })
        setShowItemSelector(false)
        setRecognizedItems([])
        setSelectedItems(new Set())
        onBatchSubmit(forms)
      } else {
        const item = selected[0]
        setName(item.brand ? `${item.brand} ${item.name}` : item.name)
        if (item.category) {
          const matched = matchCategory(item.category)
          if (matched) {
            setCategory(matched)
          }
        }
        if (item.purchaseDate) {
          const dateStr = item.purchaseDate.trim()
          if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
            const parts = dateStr.split("-")
            setPurchaseDate(`${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`)
          }
        } else if (!purchaseDate) {
          setPurchaseDate(todayStr())
        }
        if (item.estimatedPrice > 0) {
          setPurchasePrice(item.estimatedPrice.toString())
        }
        if (item.description) {
          setNote(item.description)
        }
        setShowItemSelector(false)
        setRecognizedItems([])
        setSelectedItems(new Set())
      }
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
      name, status, category, location, imageUrl, tags,
      purchaseDate, purchasePrice: parseFloat(purchasePrice),
      endDate, recycleAmount: parseFloat(recycleAmount) || 0,
      targetDailyCost: parseFloat(targetDailyCost) || 0,
      rating, note, aiValuation,
    })
  }

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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatus("active")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              status === "active"
                ? "border-accent bg-accent/20 text-accent"
                : "border-edge bg-surface text-content-secondary hover:border-white/20"
            }`}
          >
            使用中
          </button>
          <button
            type="button"
            onClick={() => setStatus(status === "active" ? "recycled" : status)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              status === "recycled"
                ? "border-green-500/50 bg-green-500/20 text-green-400"
                : "border-edge bg-surface text-content-secondary hover:border-white/20"
            }`}
          >
            已回收
          </button>
          <button
            type="button"
            onClick={() => setStatus(status === "active" ? "scrapped" : status)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              status === "scrapped"
                ? "border-red-500/50 bg-red-500/20 text-red-400"
                : "border-edge bg-surface text-content-secondary hover:border-white/20"
            }`}
          >
            已报废
          </button>
        </div>
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
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
        >
          <span className="text-xs">{showAdvanced ? "▼" : "▶"}</span>
          高级选项
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-content-secondary mb-1">目标日均成本</label>
            <input type="number" step="0.01" min="0" value={targetDailyCost} onChange={(e) => setTargetDailyCost(e.target.value)} placeholder="设置回本目标"
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
            <label className="block text-sm text-content-secondary mb-1">标签</label>
            <TagInput value={tags} onChange={setTags} placeholder="添加标签" />
          </div>

          <div>
            <label className="block text-sm text-content-secondary mb-1">备注</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="备注信息"
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30 resize-none" />
          </div>
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

    {showItemSelector && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm modal-overlay-enter">
        <div className="bg-ink rounded-2xl border border-edge p-6 max-w-lg w-full mx-4 modal-content-enter max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-content-primary">识别到 {recognizedItems.length} 个物品</h3>
            <button
              onClick={() => {
                setShowItemSelector(false)
                setRecognizedItems([])
                setSelectedItems(new Set())
              }}
              className="p-1 rounded hover:bg-white/10 text-content-tertiary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-content-tertiary mb-4">请选择要添加的资产</p>

          <div className="space-y-3 mb-6">
            {recognizedItems.map((item, index) => (
              <div
                key={index}
                onClick={() => toggleItemSelection(index)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedItems.has(index)
                    ? "border-accent bg-accent/10"
                    : "border-edge bg-surface hover:border-white/20"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleItemSelection(index)
                  }}
                  className="mt-0.5 text-accent"
                >
                  {selectedItems.has(index) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-content-primary">
                    {item.brand ? `${item.brand} ${item.name}` : item.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-content-tertiary">
                    <span>{matchCategory(item.category) || item.category}</span>
                    <span>•</span>
                    <span>{formatCurrency(item.estimatedPrice)}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-content-muted mt-1">{item.description}</p>
                  )}
                  {item.purchaseDate && (
                    <p className="text-xs text-content-muted mt-1">购入日期：{item.purchaseDate}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowItemSelector(false)
                setRecognizedItems([])
                setSelectedItems(new Set())
              }}
              className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface"
            >
              取消
            </button>
            <button
              onClick={handleConfirmItems}
              disabled={selectedItems.size === 0}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedItems.size === 0
                ? "请选择物品"
                : selectedItems.size === 1
                ? "添加 1 个资产"
                : `添加 ${selectedItems.size} 个资产`}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
