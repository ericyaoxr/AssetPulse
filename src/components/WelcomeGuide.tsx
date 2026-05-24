import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Sparkles,
  Camera,
  TrendingUp,
  BarChart3,
  Zap,
  ArrowRight,
  Package,
  Loader2,
  X,
} from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { useToast } from "@/contexts/ToastContext"

const SAMPLE_ASSETS = [
  { name: "iPhone 16 Pro", category: "数码电子", purchasePrice: 8999, purchaseDate: "2025-03-15", status: "active" },
  { name: "MacBook Air M3", category: "数码电子", purchasePrice: 9499, purchaseDate: "2024-11-20", status: "active" },
  { name: "戴森V12吸尘器", category: "生活家居", purchasePrice: 3990, purchaseDate: "2025-01-08", status: "active" },
  { name: "Nike Air Max", category: "服饰鞋包", purchasePrice: 1299, purchaseDate: "2025-04-02", status: "active" },
  { name: "Switch OLED", category: "游戏娱乐", purchasePrice: 2349, purchaseDate: "2024-12-25", status: "active" },
  { name: "Kindle Paperwhite", category: "学习教育", purchasePrice: 999, purchaseDate: "2025-02-14", status: "active" },
]

const FEATURES = [
  { icon: Camera, title: "AI 拍照识别", desc: "拍照自动识别物品，一键录入资产" },
  { icon: TrendingUp, title: "日均成本追踪", desc: "计算每件资产每天花多少钱" },
  { icon: Sparkles, title: "AI 资产顾问", desc: "智能分析资产状况，提供专业建议" },
  { icon: BarChart3, title: "可视化报表", desc: "多维度图表，洞察资产全貌" },
]

export default function WelcomeGuide() {
  const navigate = useNavigate()
  const { addAsset } = useAssetStore()
  const { success } = useToast()
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("assetpulse_welcome_dismissed") === "true"
  })

  if (dismissed) return null

  const handleLoadSamples = async () => {
    setLoading(true)
    try {
      for (const item of SAMPLE_ASSETS) {
        await addAsset({
          name: item.name,
          model: "",
          category: item.category,
          purchasePrice: item.purchasePrice,
          purchaseDate: item.purchaseDate,
          status: item.status as "active",
          location: "",
          imageUrl: null,
          tags: [],
          endDate: "",
          recycleAmount: 0,
          targetDailyCost: 0,
          rating: 0,
          note: "",
          aiValuation: null,
        })
      }
      success("已添加 6 件示例资产，开始探索吧！")
    } catch (e) {
      console.error("Failed to load sample assets:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("assetpulse_welcome_dismissed", "true")
  }

  return (
    <div className="space-y-6">
      <div className="relative rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 via-surface to-accent/5 backdrop-blur-md p-6 sm:p-8">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-lg p-1 text-content-muted hover:text-content-secondary hover:bg-surface-hover"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-content-primary">欢迎使用 AssetPulse</h2>
            <p className="text-sm text-content-tertiary">你的个人资产管理助手</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-edge bg-surface/50 p-3 text-center"
            >
              <f.icon className="h-5 w-5 mx-auto mb-1.5 text-accent" />
              <p className="text-xs font-medium text-content-primary">{f.title}</p>
              <p className="text-[10px] text-content-muted mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/assets/new")}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            添加第一件资产
          </button>
          <button
            onClick={handleLoadSamples}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {loading ? "导入中..." : "加载示例数据体验"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => navigate("/assets/new")}
          className="group rounded-xl border border-edge bg-surface backdrop-blur-md p-5 text-left hover:bg-surface-hover hover:border-accent/20 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Plus className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-content-primary">手动添加</span>
          </div>
          <p className="text-xs text-content-muted">逐个录入你的资产信息</p>
          <ArrowRight className="h-4 w-4 mt-2 text-content-faint group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => navigate("/assets/new")}
          className="group rounded-xl border border-edge bg-surface backdrop-blur-md p-5 text-left hover:bg-surface-hover hover:border-accent/20 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <Camera className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-content-primary">拍照识别</span>
          </div>
          <p className="text-xs text-content-muted">拍照自动识别物品信息</p>
          <ArrowRight className="h-4 w-4 mt-2 text-content-faint group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => navigate("/settings/backup")}
          className="group rounded-xl border border-edge bg-surface backdrop-blur-md p-5 text-left hover:bg-surface-hover hover:border-accent/20 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <span className="text-sm font-medium text-content-primary">导入数据</span>
          </div>
          <p className="text-xs text-content-muted">从备份文件恢复资产</p>
          <ArrowRight className="h-4 w-4 mt-2 text-content-faint group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    </div>
  )
}
