import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Globe, Filter, Maximize2, Minimize2, RefreshCw, Info } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { DEFAULT_CATEGORIES } from "@/types"
import { formatCurrency } from "@/utils/format"

interface Planet {
  id: string
  x: number
  y: number
  size: number
  color: string
  name: string
  price: number
  category: string
  status: string
}

const CATEGORY_COLORS: Record<string, string> = {
  "数码电子": "#3B82F6",
  "硬通货": "#F59E0B",
  "非标品": "#EC4899",
  "生活家居": "#10B981",
  "服饰鞋包": "#8B5CF6",
  "运动健身": "#EF4444",
  "游戏娱乐": "#06B6D4",
  "学习教育": "#6366F1",
  "其他": "#6B7280",
}

export default function AssetUniverse() {
  const { assets } = useAssetStore()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [planets, setPlanets] = useState<Planet[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showOnlyActive, setShowOnlyActive] = useState(true)
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number>()

  const generatePlanets = useCallback(() => {
    const activeAssets = showOnlyActive 
      ? assets.filter(a => a.status === "active")
      : assets
    
    const filtered = selectedCategory 
      ? activeAssets.filter(a => a.category === selectedCategory)
      : activeAssets

    const newPlanets: Planet[] = filtered.map((asset) => {
      const maxPrice = Math.max(...assets.map(a => a.purchasePrice), 1)
      const size = Math.max(20, Math.min(80, (asset.purchasePrice / maxPrice) * 60 + 20))
      
      const index = filtered.indexOf(asset)
      const angle = (index / Math.max(filtered.length, 1)) * Math.PI * 4
      const radius = 100 + (index % 5) * 80
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      return {
        id: asset.id,
        x,
        y,
        size,
        color: CATEGORY_COLORS[asset.category] || CATEGORY_COLORS["其他"],
        name: asset.name,
        price: asset.purchasePrice,
        category: asset.category,
        status: asset.status,
      }
    })

    setPlanets(newPlanets)
  }, [assets, selectedCategory, showOnlyActive])

  useEffect(() => {
    generatePlanets()
  }, [generatePlanets])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || planets.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener("resize", resize)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      
      const centerX = canvas.offsetWidth / 2 + offset.x
      const centerY = canvas.offsetHeight / 2 + offset.y

      // 绘制背景网格
      ctx.strokeStyle = "rgba(255,255,255,0.03)"
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.offsetWidth; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.offsetHeight)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.offsetHeight; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.offsetWidth, i)
        ctx.stroke()
      }

      // 绘制轨道
      planets.forEach((planet) => {
        const r = Math.sqrt(planet.x * planet.x + planet.y * planet.y)
        ctx.beginPath()
        ctx.arc(centerX, centerY, r * scale, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(255,255,255,0.05)"
        ctx.stroke()
      })

      // 绘制行星
      planets.forEach((planet) => {
        const x = centerX + planet.x * scale
        const y = centerY + planet.y * scale
        const r = planet.size * scale / 2

        // 光晕
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 2)
        gradient.addColorStop(0, planet.color + "40")
        gradient.addColorStop(1, "transparent")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, r * 2, 0, Math.PI * 2)
        ctx.fill()

        // 行星本体
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = planet.color
        ctx.fill()

        // 高光
        const highlightGradient = ctx.createRadialGradient(
          x - r * 0.3, y - r * 0.3, 0,
          x, y, r
        )
        highlightGradient.addColorStop(0, "rgba(255,255,255,0.4)")
        highlightGradient.addColorStop(1, "transparent")
        ctx.fillStyle = highlightGradient
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()

        // 悬停效果
        if (hoveredPlanet?.id === planet.id) {
          ctx.strokeStyle = "#fff"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(x, y, r + 5, 0, Math.PI * 2)
          ctx.stroke()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [planets, hoveredPlanet, scale, offset])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (isDragging) {
      setOffset({
        x: offset.x + (mouseX - dragStart.x),
        y: offset.y + (mouseY - dragStart.y),
      })
      setDragStart({ x: mouseX, y: mouseY })
      return
    }

    const centerX = canvas.offsetWidth / 2 + offset.x
    const centerY = canvas.offsetHeight / 2 + offset.y

    let found = null
    for (const planet of planets) {
      const x = centerX + planet.x * scale
      const y = centerY + planet.y * scale
      const r = planet.size * scale / 2
      
      const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2)
      if (dist <= r) {
        found = planet
        break
      }
    }
    setHoveredPlanet(found)
    canvas.style.cursor = found ? "pointer" : "default"
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    if (hoveredPlanet && !isDragging) {
      navigate(`/assets/${hoveredPlanet.id}`)
    }
  }

  const activeAssets = showOnlyActive ? assets.filter(a => a.status === "active") : assets
  const totalValue = activeAssets.reduce((sum, a) => sum + a.purchasePrice, 0)

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b border-edge flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-content-primary">
            <Globe className="h-5 w-5 text-accent" />
            资产宇宙
          </h2>
          <div className="text-sm text-content-muted">
            {planets.length} 个天体 · 总价值 {formatCurrency(totalValue)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.2))}
              className="p-2 rounded-lg border border-edge hover:bg-surface"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <span className="text-sm text-content-muted w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(Math.min(2, scale + 0.2))}
              className="p-2 rounded-lg border border-edge hover:bg-surface"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
              className="p-2 rounded-lg border border-edge hover:bg-surface"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-content-muted">
              <Filter className="h-4 w-4 inline mr-1" />
            </span>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
            >
              <option value="">全部分类</option>
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-content-muted cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
                className="rounded border-edge bg-surface"
              />
              仅显示使用中
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
        />

        {/* 悬停信息 */}
        {hoveredPlanet && (
          <div className="absolute bottom-4 left-4 rounded-xl border border-edge bg-surface/95 backdrop-blur-md p-4 shadow-xl">
            <h3 className="font-bold text-content-primary">{hoveredPlanet.name}</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-content-muted">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: hoveredPlanet.color }}></span>
                {hoveredPlanet.category}
              </p>
              <p className="text-content-primary font-medium">{formatCurrency(hoveredPlanet.price)}</p>
            </div>
            <p className="mt-2 text-xs text-content-faint">点击查看详情</p>
          </div>
        )}

        {/* 图例 */}
        <div className="absolute top-4 right-4 rounded-xl border border-edge bg-surface/95 backdrop-blur-md p-3">
          <div className="text-xs font-medium text-content-secondary mb-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            分类图例
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {DEFAULT_CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-2 text-xs text-content-muted">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                {cat}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
