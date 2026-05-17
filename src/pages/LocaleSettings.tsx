import { useState } from "react"
import { Globe, RefreshCw } from "lucide-react"
import { useLocaleStore, CURRENCIES, LANGUAGES, formatCurrency } from "@/store/useLocaleStore"

export default function LocaleSettings() {
  const { 
    currency, 
    language, 
    setCurrency, 
    setLanguage, 
    updateExchangeRate 
  } = useLocaleStore()
  
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [tempRate, setTempRate] = useState("")
  
  const previewAmount = 1000

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">语言和货币</h1>
        <p className="mt-1 text-sm text-content-tertiary">
          配置应用的显示语言和货币格式
        </p>
      </div>

      {/* 语言设置 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-content-primary">语言设置</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <button
              key={code}
              onClick={() => setLanguage(code as "zh" | "en")}
              className={`p-4 rounded-lg border-2 transition-all ${
                language === code
                  ? "border-accent bg-accent/10"
                  : "border-edge hover:border-accent/30"
              }`}
            >
              <div className="font-medium text-content-primary">{name}</div>
              <div className="text-sm text-content-muted mt-1">
                {code === "zh" ? "zh-CN" : "en-US"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 货币设置 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-content-primary mb-4">货币设置</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.keys(CURRENCIES).map((code) => {
            const config = CURRENCIES[code as keyof typeof CURRENCIES]
            return (
              <button
                key={code}
                onClick={() => setCurrency(code as "CNY" | "USD" | "EUR" | "GBP" | "JPY" | "HKD" | "TWD")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currency === code
                    ? "border-accent bg-accent/10"
                    : "border-edge hover:border-accent/30"
                }`}
              >
                <div className="text-2xl mb-1">{config.symbol}</div>
                <div className="font-medium text-content-primary">{code}</div>
              </button>
            )
          })}
        </div>

        {/* 货币预览 */}
        <div className="p-4 rounded-lg bg-white/5 mb-6">
          <div className="text-sm text-content-muted mb-2">格式化预览</div>
          <div className="text-2xl font-bold text-content-primary">
            {formatCurrency(previewAmount)}
          </div>
          <div className="text-sm text-content-muted mt-1">
            预览金额：{previewAmount} {currency}
          </div>
        </div>

        {/* 汇率管理 */}
        <div>
          <h4 className="text-sm font-medium text-content-secondary mb-3 flex items-center gap-2">
            汇率管理
          </h4>
          <div className="space-y-2">
            {Object.entries(CURRENCIES).map(([code, config]) => (
              <div key={code} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <div className="font-medium text-content-primary">{code}</div>
                  <div className="text-sm text-content-muted">1 CNY = {config.exchangeRate} {code}</div>
                </div>
                {editingRate === code ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={tempRate}
                      onChange={(e) => setTempRate(e.target.value)}
                      className="w-24 px-2 py-1 rounded border border-edge bg-surface text-sm"
                    />
                    <button
                      onClick={() => {
                        updateExchangeRate(code as "CNY" | "USD" | "EUR" | "GBP" | "JPY" | "HKD" | "TWD", parseFloat(tempRate))
                        setEditingRate(null)
                        setTempRate("")
                      }}
                      className="px-2 py-1 text-sm bg-accent text-white rounded"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingRate(null)}
                      className="px-2 py-1 text-sm text-content-muted"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingRate(code)
                      setTempRate(config.exchangeRate.toString())
                    }}
                    className="flex items-center gap-1 text-sm text-accent"
                  >
                    <RefreshCw className="h-4 w-4" />
                    编辑
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
