import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  X,
  Package,
  Camera,
  Sparkles,
  BarChart3,
  TrendingUp,
  ArrowRight,
} from "lucide-react"

const STEPS = [
  {
    icon: Package,
    title: "录入资产",
    desc: "手动添加或拍照识别，快速录入你的物品",
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: TrendingUp,
    title: "追踪成本",
    desc: "自动计算每件资产的日均使用成本",
    color: "bg-green-500/10 text-green-400",
  },
  {
    icon: Sparkles,
    title: "AI 顾问",
    desc: "智能分析资产状况，生成体检报告和推荐",
    color: "bg-purple-500/10 text-purple-400",
  },
  {
    icon: BarChart3,
    title: "洞察全貌",
    desc: "可视化报表，多维度了解你的资产",
    color: "bg-orange-500/10 text-orange-400",
  },
]

export default function OnboardingModal() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const shown = localStorage.getItem("assetpulse_onboarding_shown")
    if (!shown) {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    localStorage.setItem("assetpulse_onboarding_shown", "true")
  }

  const handleStart = () => {
    handleClose()
    navigate("/assets/new")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-edge bg-surface shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-hover"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pt-8">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-light mb-3">
              <Camera className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-content-primary">
              欢迎来到 AssetPulse
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              3 分钟上手，开始追踪你的资产
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="rounded-lg border border-edge bg-surface/50 p-3"
              >
                <div className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${step.color} mb-2`}>
                  <step.icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-medium text-content-primary">{step.title}</p>
                <p className="text-[10px] text-content-muted mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button
              onClick={handleStart}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              开始添加资产
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleClose}
              className="w-full rounded-lg px-4 py-2 text-sm text-content-muted hover:text-content-secondary transition-colors"
            >
              稍后再说
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
