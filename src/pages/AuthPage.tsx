import { useState } from "react"
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"

type AuthMode = "login" | "register"

export default function AuthPage() {
  const { login, register } = useAuthStore()
  const [mode, setMode] = useState<AuthMode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError("请输入用户名")
      return
    }
    if (!password || password.length < 4) {
      setError("密码至少4位")
      return
    }

    setLoading(true)
    try {
      if (mode === "register") {
        await register(username.trim(), password)
      } else {
        await login(username.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败")
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login")
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D1B1E] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Activity className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="text-center">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
              Asset<span className="text-emerald-400">Pulse</span>
            </h1>
            <p className="mt-1 text-sm text-white/40">资产日均成本追踪</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
          <h2 className="mb-5 text-lg font-semibold text-white">
            {mode === "login" ? "登录账户" : "创建账户"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null) }}
                placeholder="输入用户名"
                autoComplete="username"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="输入密码"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-white text-sm outline-none focus:border-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "login" ? "登录中..." : "注册中..."}
                </span>
              ) : (
                mode === "login" ? "登录" : "注册"
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-white/40">
            {mode === "login" ? (
              <>还没有账户？<button onClick={switchMode} className="text-emerald-400 hover:text-emerald-300">注册</button></>
            ) : (
              <>已有账户？<button onClick={switchMode} className="text-emerald-400 hover:text-emerald-300">登录</button></>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-white/20">
          数据安全存储在服务器上，登录即可访问
        </p>
      </div>
    </div>
  )
}
