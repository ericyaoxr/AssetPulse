import { useState } from "react"
import { Globe, Code, Database, Key, Copy, AlertCircle, CheckCircle } from "lucide-react"

export default function ApiPlatform() {
  const [apiKey] = useState("sk_xxxxxxxxxxxxxxxxxxxxxxxx")
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">API 开放平台</h1>
        <p className="mt-1 text-sm text-content-tertiary">
          通过 API 访问和管理您的资产数据
        </p>
      </div>

      {/* API Key 管理 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-accent" />
          API Key
        </h3>
        
        <div className="p-4 rounded-lg bg-white/5 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm text-content-muted mb-1">您的 API Key</p>
              <p className="font-mono text-content-primary">
                {showKey ? apiKey : "sk_xxxxxxxxxxxxxxxxxxxxxxxx"}
              </p>
            </div>
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-1.5 text-sm text-content-muted hover:text-content-primary"
            >
              {showKey ? "隐藏" : "显示"}
            </button>
            <button
              onClick={handleCopyKey}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-white text-sm"
            >
              <Copy className="h-4 w-4" />
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-edge text-content-primary hover:bg-white/5 text-sm">
            重新生成
          </button>
          <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm">
            撤销 Key
          </button>
        </div>
      </div>

      {/* API 文档 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <Code className="h-5 w-5 text-accent" />
          API 端点
        </h3>

        <div className="space-y-4">
          {/* 获取资产列表 */}
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono">GET</span>
              <code className="text-content-primary font-mono text-sm">/api/v1/assets</code>
            </div>
            <p className="text-sm text-content-muted">获取资产列表</p>
          </div>

          {/* 添加资产 */}
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">POST</span>
              <code className="text-content-primary font-mono text-sm">/api/v1/assets</code>
            </div>
            <p className="text-sm text-content-muted">创建新资产</p>
          </div>

          {/* 获取单个资产 */}
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono">GET</span>
              <code className="text-content-primary font-mono text-sm">/api/v1/assets/:id</code>
            </div>
            <p className="text-sm text-content-muted">获取单个资产详情</p>
          </div>

          {/* 导出资产 */}
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono">GET</span>
              <code className="text-content-primary font-mono text-sm">/api/v1/export</code>
            </div>
            <p className="text-sm text-content-muted">导出资产数据</p>
          </div>
        </div>
      </div>

      {/* Webhook 设置 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-accent" />
          Webhook 通知
        </h3>

        <div className="p-4 rounded-lg bg-white/5 mb-4">
          <label className="block text-sm text-content-secondary mb-2">Webhook URL</label>
          <input
            type="text"
            placeholder="https://your-site.com/webhook"
            className="w-full px-3 py-2 rounded-lg border border-edge bg-surface text-content-primary"
          />
        </div>

        <div className="text-sm text-content-muted">
          <p className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4" />
            支持的事件：
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>asset.created - 资产创建</li>
            <li>asset.updated - 资产更新</li>
            <li>asset.deleted - 资产删除</li>
          </ul>
        </div>

        <button className="mt-4 px-4 py-2 rounded-lg bg-accent text-white text-sm">
          保存设置
        </button>
      </div>

      {/* 数据同步 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-accent" />
          数据同步
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg border border-edge">
            <h4 className="font-medium text-content-primary mb-2">手动同步</h4>
            <p className="text-sm text-content-muted mb-3">
              立即执行一次完整的数据同步
            </p>
            <button className="px-4 py-2 rounded-lg bg-accent text-white text-sm">
              立即同步
            </button>
          </div>

          <div className="p-4 rounded-lg border border-edge">
            <h4 className="font-medium text-content-primary mb-2">自动同步</h4>
            <p className="text-sm text-content-muted mb-3">
              定期自动备份到云端
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-content-muted">每</span>
              <select className="px-3 py-1 rounded border border-edge bg-surface text-sm">
                <option>1小时</option>
                <option>6小时</option>
                <option>24小时</option>
              </select>
              <span className="text-sm text-content-muted">同步一次</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">最后同步：5分钟前</span>
          </div>
        </div>
      </div>
    </div>
  )
}
