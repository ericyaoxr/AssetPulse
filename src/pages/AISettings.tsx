import { useState, useEffect } from "react"
import { Sparkles, Eye, EyeOff, Wifi, WifiOff, Check, Loader2 } from "lucide-react"
import type { AIProviderConfig } from "@/types"
import { PRESET_PROVIDERS } from "@/types"
import { loadAIConfig, saveAIConfig } from "@/utils/aiValuation"

export default function AISettings() {
  const [provider, setProvider] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [model, setModel] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAIConfig().then((cfg) => {
      if (cfg) {
        setProvider(cfg.provider)
        setApiKey(cfg.apiKey)
        setBaseUrl(cfg.baseUrl)
        setModel(cfg.model)
      }
      setLoading(false)
    })
  }, [])

  const handleProviderChange = (label: string) => {
    const preset = PRESET_PROVIDERS.find((p) => p.label === label)
    if (preset) {
      setProvider(preset.provider)
      setBaseUrl(preset.baseUrl)
      setModel(preset.model)
    }
    setTestResult(null)
    setSaveMsg(null)
  }

  const handleTest = async () => {
    if (!baseUrl || !model) {
      setTestResult({ ok: false, msg: "请填写 API 地址和模型名称" })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 1,
        }),
      })
      if (res.ok) {
        setTestResult({ ok: true, msg: "连接成功" })
      } else {
        const data = await res.json().catch(() => null)
        setTestResult({ ok: false, msg: data?.error?.message || `HTTP ${res.status}` })
      }
    } catch (e) {
      setTestResult({ ok: false, msg: e instanceof Error ? e.message : "连接失败" })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setSaveMsg({ ok: false, text: "请填写 API Key" })
      return
    }
    if (!baseUrl.trim() || !model.trim()) {
      setSaveMsg({ ok: false, text: "请填写 API 地址和模型名称" })
      return
    }
    setSaveMsg(null)
    try {
      const cfg: AIProviderConfig = { provider, apiKey: apiKey.trim(), baseUrl, model }
      await saveAIConfig(cfg)
      setSaveMsg({ ok: true, text: "保存成功" })
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (e) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : "保存失败" })
    }
  }

  const selectedLabel = PRESET_PROVIDERS.find((p) => p.provider === provider)?.label ?? ""

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-content-primary">
          <Sparkles className="h-6 w-6 text-accent" />
          AI 估值设置
        </h1>
        <p className="mt-1 text-sm text-content-tertiary">配置 AI 模型以估算资产二手市场价值</p>
      </div>

      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6 space-y-5">
        <div>
          <label className="block text-sm text-content-secondary mb-1">AI 服务商</label>
          <select
            value={selectedLabel}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30"
          >
            <option value="" className="bg-ink">选择服务商</option>
            {PRESET_PROVIDERS.map((p) => (
              <option key={p.label} value={p.label} className="bg-ink">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-content-secondary mb-1">API Key</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestResult(null); setSaveMsg(null) }}
              placeholder="sk-..."
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 pr-10 text-content-primary text-sm outline-none focus:border-accent/30"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-content-secondary mb-1">API 地址</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => { setBaseUrl(e.target.value); setTestResult(null); setSaveMsg(null) }}
            placeholder="https://api.example.com/v1"
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30"
          />
        </div>

        <div>
          <label className="block text-sm text-content-secondary mb-1">模型名称</label>
          <input
            type="text"
            value={model}
            onChange={(e) => { setModel(e.target.value); setTestResult(null); setSaveMsg(null) }}
            placeholder="model-name"
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-content-primary text-sm outline-none focus:border-accent/30"
          />
        </div>

        {testResult && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              testResult.ok
                ? "bg-accent-light text-accent"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {testResult.ok ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
            {testResult.msg}
          </div>
        )}

        {saveMsg && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              saveMsg.ok
                ? "bg-accent-light text-accent"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {saveMsg.ok ? <Check className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
            {saveMsg.text}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            测试连接
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            保存配置
          </button>
        </div>
      </div>

      <p className="text-xs text-content-faint">
        API Key 加密存储在服务器数据库中
      </p>
    </div>
  )
}
