import { useState } from "react"
import { User, Lock, Eye, EyeOff, Check, Loader2, AlertTriangle, Calendar } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"

export default function AccountSettings() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const changePassword = useAuthStore((s) => s.changePassword)
  const logout = useAuthStore((s) => s.logout)

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const handleChangePassword = async () => {
    setMessage(null)
    if (!oldPassword) {
      setMessage({ ok: false, text: "请输入旧密码" })
      return
    }
    if (newPassword.length < 4) {
      setMessage({ ok: false, text: "新密码至少4位" })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ ok: false, text: "两次输入的新密码不一致" })
      return
    }
    if (oldPassword === newPassword) {
      setMessage({ ok: false, text: "新密码不能与旧密码相同" })
      return
    }

    setSaving(true)
    try {
      await changePassword(oldPassword, newPassword)
      setMessage({ ok: true, text: "密码修改成功" })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "修改失败" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <User className="h-6 w-6 text-emerald-400" />
          账户管理
        </h1>
        <p className="mt-1 text-sm text-white/50">管理账户信息和安全设置</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">账户信息</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
              {currentUser?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{currentUser?.username}</p>
              <p className="text-xs text-white/40">当前登录账户</p>
            </div>
          </div>

          {currentUser?.createdAt && (
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Calendar className="h-4 w-4" />
              注册时间：{new Date(currentUser.createdAt).toLocaleDateString("zh-CN")}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Lock className="h-5 w-5" />
          修改密码
        </h2>

        <div>
          <label className="block text-sm text-white/70 mb-1">旧密码</label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => { setOldPassword(e.target.value); setMessage(null) }}
              placeholder="输入当前密码"
              autoComplete="current-password"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-white text-sm outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1">新密码</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setMessage(null) }}
              placeholder="输入新密码（至少4位）"
              autoComplete="new-password"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-white text-sm outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1">确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setMessage(null) }}
            placeholder="再次输入新密码"
            autoComplete="new-password"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50"
          />
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              message.ok
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {message.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          修改密码
        </button>
      </div>

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-md p-6">
        <h2 className="text-lg font-semibold text-red-400">危险操作</h2>
        <p className="mt-1 text-sm text-white/50">退出登录后需要重新输入账号密码</p>
        <button
          onClick={logout}
          className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
