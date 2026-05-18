import { useState } from "react"
import { Bell, Plus, Trash2, Clock, AlertCircle } from "lucide-react"
import { useReminderStore, requestNotificationPermission } from "@/store/useReminderStore"
import type { ReminderType } from "@/types"

const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  warranty: "保修到期",
  maintenance: "维护提醒",
  price_alert: "价格波动",
  lifespan: "使用寿命",
}

const REMINDER_TYPE_ICONS: Record<ReminderType, string> = {
  warranty: "🔧",
  maintenance: "🛠️",
  price_alert: "📈",
  lifespan: "⏰",
}

export default function RemindersPage() {
  const {
    reminders,
    settings,
    updateSettings,
    addRule,
    updateRule,
    deleteRule,
    dismissReminder,
    deleteReminder,
  } = useReminderStore()

  const [showAddRule, setShowAddRule] = useState(false)

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const hasPermission = await requestNotificationPermission()
      if (hasPermission) {
        updateSettings({
          notificationsEnabled: true,
          browserNotificationsEnabled: true,
        })
      }
    } else {
      updateSettings({ notificationsEnabled: false })
    }
  }

  const handleBrowserNotifications = async () => {
    if (!settings.browserNotificationsEnabled) {
      const hasPermission = await requestNotificationPermission()
      if (hasPermission) {
        updateSettings({ browserNotificationsEnabled: true })
      }
    } else {
      updateSettings({ browserNotificationsEnabled: false })
    }
  }

  const handleAddRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const type = formData.get("type") as ReminderType
    const daysBefore = parseInt(formData.get("daysBefore") as string) || 7
    const priority = formData.get("priority") as "low" | "medium" | "high"

    addRule({
      type,
      enabled: true,
      daysBefore,
      priority,
      autoCreate: false,
    })
    setShowAddRule(false)
  }

  const rules = settings.rules ?? []
  const pendingReminders = reminders.filter((r) => r.status === "pending")
  const triggeredReminders = reminders.filter((r) => r.status === "triggered")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">提醒设置</h1>
        <p className="mt-1 text-sm text-content-tertiary">管理资产提醒和通知</p>
      </div>

      {/* 通知设置 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
        <h3 className="text-sm font-medium text-content-secondary mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          通知设置
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="font-medium text-content-primary">启用通知</p>
              <p className="text-xs text-content-muted">接收资产相关的提醒通知</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.notificationsEnabled ? "bg-accent" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="font-medium text-content-primary">浏览器通知</p>
              <p className="text-xs text-content-muted">即使网页未打开也能收到提醒</p>
            </div>
            <button
              onClick={handleBrowserNotifications}
              disabled={!settings.notificationsEnabled}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.browserNotificationsEnabled && settings.notificationsEnabled
                  ? "bg-accent"
                  : "bg-white/10"
              } disabled:opacity-50`}
            >
              <div
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.browserNotificationsEnabled && settings.notificationsEnabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 提醒规则 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-content-secondary flex items-center gap-2">
            <Clock className="h-4 w-4" />
            提醒规则
          </h3>
          <button
            onClick={() => setShowAddRule(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            添加规则
          </button>
        </div>

        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{REMINDER_TYPE_ICONS[rule.type]}</span>
                <div>
                  <p className="font-medium text-content-primary">
                    {REMINDER_TYPE_LABELS[rule.type]}
                  </p>
                  <p className="text-xs text-content-muted">
                    提前 {rule.daysBefore} 天提醒 ·{" "}
                    <span
                      className={
                        rule.priority === "high"
                          ? "text-red-400"
                          : rule.priority === "medium"
                          ? "text-yellow-400"
                          : "text-content-muted"
                      }
                    >
                      {rule.priority === "high"
                        ? "高"
                        : rule.priority === "medium"
                        ? "中"
                        : "低"}
                      优先级
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateRule(rule.id, { enabled: !rule.enabled })
                  }
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    rule.enabled ? "bg-accent" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      rule.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 待处理提醒 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-content-secondary flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            待处理提醒
          </h3>
          <span className="text-xs text-content-muted">
            {pendingReminders.length} 条待处理
          </span>
        </div>

        {pendingReminders.length === 0 ? (
          <p className="text-center text-content-muted py-8 text-sm">
            暂无待处理的提醒
          </p>
        ) : (
          <div className="space-y-2">
            {pendingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between p-3 rounded-lg bg-white/5"
              >
                <div className="flex-1">
                  <p className="font-medium text-content-primary">
                    {reminder.title}
                  </p>
                  <p className="text-xs text-content-muted mt-1">
                    {reminder.message}
                  </p>
                  <p className="text-xs text-accent mt-1">
                    {new Date(reminder.dueDate).toLocaleDateString()} 到期
                  </p>
                </div>
                <button
                  onClick={() => dismissReminder(reminder.id)}
                  className="text-xs text-content-muted hover:text-content-secondary"
                >
                  忽略
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 已触发的提醒 */}
      {triggeredReminders.length > 0 && (
        <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
          <h3 className="text-sm font-medium text-content-secondary mb-4">
            已触发提醒 ({triggeredReminders.length})
          </h3>
          <div className="space-y-2">
            {triggeredReminders.slice(0, 5).map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div>
                  <p className="text-sm text-content-secondary">
                    {reminder.title}
                  </p>
                  <p className="text-xs text-content-muted mt-0.5">
                    {new Date(reminder.triggeredAt!).toLocaleDateString()} 触发
                  </p>
                </div>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="text-xs text-content-muted hover:text-red-400"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 添加规则模态框 */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-edge bg-ink p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-content-primary mb-4">
              添加提醒规则
            </h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-sm text-content-secondary mb-1">
                  提醒类型
                </label>
                <select
                  name="type"
                  className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
                >
                  <option value="warranty">保修到期</option>
                  <option value="maintenance">维护提醒</option>
                  <option value="price_alert">价格波动</option>
                  <option value="lifespan">使用寿命</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-content-secondary mb-1">
                  提前提醒天数
                </label>
                <input
                  type="number"
                  name="daysBefore"
                  defaultValue={7}
                  min={1}
                  max={365}
                  className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
                />
              </div>
              <div>
                <label className="block text-sm text-content-secondary mb-1">
                  优先级
                </label>
                <select
                  name="priority"
                  className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
