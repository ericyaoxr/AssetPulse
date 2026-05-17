import { useState, useMemo } from "react"
import { ShoppingBag, Check, Copy, Sparkles, ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import type { Asset } from "@/types"
import { useThemeVars } from "@/hooks/useThemeVar"

interface ResalePanelProps {
  asset: Asset
}

const PLATFORMS = [
  {
    name: "闲鱼",
    url: "https://2.taobao.com",
    icon: "🐟",
    description: "国内最大的二手交易平台，流量大"
  },
  {
    name: "转转",
    url: "https://www.zhuanzhuan.com",
    icon: "🔄",
    description: "专注二手手机，有验机服务"
  },
  {
    name: "小红书",
    url: "https://www.xiaohongshu.com",
    icon: "📕",
    description: "适合卖时尚、家居类商品"
  },
  {
    name: "多抓鱼",
    url: "https://www.duozhuayu.com",
    icon: "🐟",
    description: "专注书籍、服饰类"
  },
  {
    name: "爱回收",
    url: "https://www.aihuishou.com",
    icon: "♻️",
    description: "专业数码产品回收"
  }
]

export function ResalePanel({ asset }: ResalePanelProps) {
  const [copied, setCopied] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [customPrice, setCustomPrice] = useState<string>("")
  
  const themeVars = useThemeVars({
    "--card-bg": "rgba(255, 255, 255, 0.03)"
  })

  const suggestedPrice = useMemo(() => {
    if (asset.aiValuation?.estimatedValue) {
      return asset.aiValuation.estimatedValue
    }
    const ageInDays = asset.effectiveDays || 0
    const depreciationRate = 0.0005 // 每天折旧约0.05%
    const depreciatedValue = asset.purchasePrice * Math.exp(-depreciationRate * ageInDays)
    return Math.max(depreciatedValue, asset.purchasePrice * 0.1)
  }, [asset])

  const recommendedPlatforms = useMemo(() => {
    const category = asset.category?.toLowerCase() || ""
    if (category.includes("手机") || category.includes("数码") || category.includes("电子")) {
      return [PLATFORMS[0], PLATFORMS[1], PLATFORMS[4]]
    } else if (category.includes("书籍") || category.includes("服装") || category.includes("服饰")) {
      return [PLATFORMS[0], PLATFORMS[3]]
    } else if (category.includes("时尚") || category.includes("家居")) {
      return [PLATFORMS[0], PLATFORMS[2]]
    }
    return PLATFORMS.slice(0, 3)
  }, [asset.category])

  const generateDescription = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
    }, 1500)
  }

  const sellDescription = useMemo(() => {
    const condition = asset.status === "active" ? "使用中，状态良好" : "已闲置"
    const priceText = suggestedPrice ? `售价：¥${suggestedPrice.toFixed(0)}` : "价格面议"
    const locationText = asset.location ? `所在城市：${asset.location}` : ""
    const noteText = asset.note ? asset.note : "无"
    
    return `【${asset.name}】
${condition}
${priceText}
${locationText}

物品描述：
${noteText}

购入日期：${asset.purchaseDate}
购入价格：¥${asset.purchasePrice.toFixed(0)}

有兴趣的朋友欢迎联系！
`
  }, [asset, suggestedPrice])

  const copyDescription = () => {
    navigator.clipboard.writeText(sellDescription)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const priceTrend = asset.aiValuation?.marketTrend || "stable"

  return (
    <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4 space-y-4" style={themeVars}>
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-content-primary">二手出售助手</h3>
      </div>

      {/* 建议售价 */}
      <div className="rounded-lg border border-edge p-3 bg-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-content-secondary">建议售价</span>
          <div className="flex items-center gap-1 text-sm">
            {priceTrend === "上涨" ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : priceTrend === "下跌" ? (
              <TrendingDown className="h-4 w-4 text-red-400" />
            ) : (
              <div className="h-4 w-4 text-content-muted">—</div>
            )}
            <span className={priceTrend === "上涨" ? "text-emerald-400" : priceTrend === "下跌" ? "text-red-400" : "text-content-muted"}>
              {priceTrend === "上涨" ? "市场看涨" : priceTrend === "下跌" ? "市场看跌" : "市场稳定"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-accent">
            ¥{suggestedPrice.toFixed(0)}
          </div>
          <div className="text-sm text-content-muted">
            <div>原价：¥{asset.purchasePrice.toFixed(0)}</div>
            <div>折旧：{((1 - suggestedPrice / asset.purchasePrice) * 100).toFixed(0)}%</div>
          </div>
        </div>
        <div className="mt-3">
          <input
            type="number"
            placeholder="自定义售价"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
      </div>

      {/* 推荐平台 */}
      <div>
        <h4 className="text-sm font-medium text-content-secondary mb-2">推荐平台</h4>
        <div className="space-y-2">
          {recommendedPlatforms.map((platform) => (
            <button
              key={platform.name}
              onClick={() => setSelectedPlatform(platform.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                selectedPlatform === platform.name
                  ? "border-accent bg-accent/10"
                  : "border-edge hover:bg-white/5"
              }`}
            >
              <span className="text-2xl">{platform.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium text-content-primary">{platform.name}</div>
                <div className="text-xs text-content-muted">{platform.description}</div>
              </div>
              <ExternalLink className="h-4 w-4 text-content-muted" />
            </button>
          ))}
        </div>
      </div>

      {/* 一键生成文案 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-content-secondary">出售文案</h4>
          <button
            onClick={generateDescription}
            disabled={generating}
            className="flex items-center gap-1 text-xs text-accent hover:text-emerald-300 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3" />
            {generating ? "生成中..." : "重新生成"}
          </button>
        </div>
        <div className="rounded-lg border border-edge bg-white/5 p-3">
          <pre className="text-sm text-content-secondary whitespace-pre-wrap font-sans">
            {sellDescription}
          </pre>
        </div>
        <button
          onClick={copyDescription}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "已复制" : "复制文案"}
        </button>
      </div>
    </div>
  )
}
