import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, History, RefreshCw, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { formatCurrency, formatDate } from "@/utils/format"
import { differenceInDays, eachDayOfInterval, format as formatFns, isBefore } from "date-fns"

export default function TimeMachine() {
  const { assets } = useAssetStore()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sliderValue, setSliderValue] = useState(100)

  const allAssets = useMemo(() => {
    return [...assets].sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())
  }, [assets])

  const startDate = useMemo(() => {
    if (allAssets.length === 0) return new Date()
    return new Date(allAssets[0].purchaseDate)
  }, [allAssets])

  const [endDate] = useState(new Date())

  const dateRange = useMemo(() => {
    if (allAssets.length === 0) return []
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [startDate, endDate, allAssets])

  const assetsAtDate = useMemo(() => {
    return allAssets.filter((asset) => {
      const purchaseDate = new Date(asset.purchaseDate)
      const endDate = asset.endDate ? new Date(asset.endDate) : null
      
      const isPurchased = !isBefore(selectedDate, purchaseDate)
      const isNotEnded = !endDate || !isBefore(endDate, selectedDate)
      
      return isPurchased && isNotEnded
    })
  }, [allAssets, selectedDate])

  const totalValueAtDate = assetsAtDate.reduce((sum, a) => sum + a.purchasePrice, 0)
  const totalValueNow = assets.filter(a => a.status === "active").reduce((sum, a) => sum + a.purchasePrice, 0)

  const handleSliderChange = (value: number) => {
    setSliderValue(value)
    const index = Math.floor((value / 100) * (dateRange.length - 1))
    if (dateRange[index]) {
      setSelectedDate(dateRange[index])
    }
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    const index = dateRange.findIndex(d => formatFns(d, "yyyy-MM-dd") === formatFns(date, "yyyy-MM-dd"))
    if (index !== -1) {
      setSliderValue((index / (dateRange.length - 1)) * 100)
    }
  }

  const canGoBack = dateRange.length > 0 && selectedDate > dateRange[0]
  const canGoForward = dateRange.length > 0 && selectedDate < dateRange[dateRange.length - 1]

  const goBack = () => {
    const currentIndex = dateRange.findIndex(d => formatFns(d, "yyyy-MM-dd") === formatFns(selectedDate, "yyyy-MM-dd"))
    if (currentIndex > 0) {
      handleDateChange(dateRange[currentIndex - 1])
    }
  }

  const goForward = () => {
    const currentIndex = dateRange.findIndex(d => formatFns(d, "yyyy-MM-dd") === formatFns(selectedDate, "yyyy-MM-dd"))
    if (currentIndex < dateRange.length - 1) {
      handleDateChange(dateRange[currentIndex + 1])
    }
  }

  const calculateWhatIf = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId)
    if (!asset) return { saved: 0, days: 0 }
    
    const purchaseDate = new Date(asset.purchaseDate)
    const daysWithout = differenceInDays(endDate, purchaseDate)
    
    return {
      saved: asset.purchasePrice,
      daysWithout: Math.max(0, daysWithout),
    }
  }

  const displayAssets = assetsAtDate.sort((a, b) => 
    new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-content-primary">
          <Clock className="h-6 w-6 text-accent" />
          时光机
        </h2>
        <p className="mt-1 text-sm text-content-muted">
          回到过去，看看那时你拥有的资产
        </p>
      </div>

      {/* 时间控制 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            时间控制
          </h3>
          <button
            onClick={() => { setSelectedDate(new Date()); setSliderValue(100) }}
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <RefreshCw className="h-4 w-4" />
            回到现在
          </button>
        </div>

        <div className="space-y-4">
          {/* 日期选择 */}
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className="p-2 rounded-lg border border-edge hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <input
              type="date"
              value={formatFns(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => handleDateChange(new Date(e.target.value))}
              min={allAssets.length > 0 ? formatFns(startDate, "yyyy-MM-dd") : undefined}
              max={formatFns(endDate, "yyyy-MM-dd")}
              className="flex-1 rounded-lg border border-edge bg-surface px-4 py-3 text-lg text-content-primary outline-none focus:border-accent/30"
            />
            <button
              onClick={goForward}
              disabled={!canGoForward}
              className="p-2 rounded-lg border border-edge hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* 时间滑块 */}
          {dateRange.length > 1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-content-muted">
                <span>{allAssets.length > 0 ? formatDate(startDate.toISOString()) : "-"}</span>
                <span>现在</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliderValue}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          )}
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <p className="text-sm text-content-muted">资产数量</p>
          <p className="text-3xl font-bold text-content-primary mt-1">{assetsAtDate.length}</p>
        </div>
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <p className="text-sm text-content-muted">总资产价值</p>
          <p className="text-3xl font-bold text-accent mt-1">{formatCurrency(totalValueAtDate)}</p>
        </div>
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <p className="text-sm text-content-muted">与现在相比</p>
          <p className={`text-3xl font-bold mt-1 ${
            totalValueAtDate < totalValueNow ? "text-green-400" : 
            totalValueAtDate > totalValueNow ? "text-red-400" : "text-content-primary"
          }`}>
            {totalValueAtDate === totalValueNow ? "相同" :
             totalValueAtDate < totalValueNow ? "+" : ""}{((totalValueAtDate / totalValueNow - 1) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 资产列表 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-accent" />
          {formatFns(selectedDate, "yyyy年MM月dd日")} 拥有的资产
        </h3>

        {displayAssets.length === 0 ? (
          <div className="text-center py-12 text-content-muted">
            这一天你还没有添加任何资产
          </div>
        ) : (
          <div className="space-y-3">
            {displayAssets.map((asset) => {
              const whatIf = calculateWhatIf(asset.id)
              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-edge hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          asset.status === "active" ? "bg-green-400" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-content-primary cursor-pointer hover:text-accent" onClick={() => navigate(`/assets/${asset.id}`)}>
                        {asset.name}
                      </h4>
                      {asset.model && (
                        <p className="text-xs text-content-muted">{asset.model}</p>
                      )}
                      <p className="text-sm text-content-muted">{asset.category} · {formatDate(asset.purchaseDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-content-primary">{formatCurrency(asset.purchasePrice)}</p>
                    {asset.status !== "active" && (
                      <p className="text-xs text-content-muted">如果没买，可省 {formatCurrency(whatIf.saved)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
