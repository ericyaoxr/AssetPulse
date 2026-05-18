import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Reminder, ReminderRule, ReminderSettings } from "@/types"

interface ReminderStore {
  reminders: Reminder[]
  settings: ReminderSettings
  checkReminders: () => void
  createReminder: (reminder: Omit<Reminder, "id" | "createdAt" | "triggeredAt">) => Reminder
  dismissReminder: (id: string) => void
  deleteReminder: (id: string) => void
  markAsTriggered: (id: string) => void
  updateSettings: (settings: Partial<ReminderSettings>) => void
  addRule: (rule: Omit<ReminderRule, "id">) => void
  updateRule: (id: string, rule: Partial<ReminderRule>) => void
  deleteRule: (id: string) => void
  autoCreateReminders: () => void
}

const DEFAULT_RULES: ReminderRule[] = [
  {
    id: "warranty_default",
    type: "warranty",
    enabled: true,
    daysBefore: 30,
    priority: "high",
    autoCreate: true,
  },
  {
    id: "maintenance_default",
    type: "maintenance",
    enabled: true,
    daysBefore: 7,
    priority: "medium",
    autoCreate: false,
  },
  {
    id: "lifespan_default",
    type: "lifespan",
    enabled: true,
    daysBefore: 30,
    priority: "medium",
    autoCreate: true,
  },
]

const DEFAULT_SETTINGS: ReminderSettings = {
  notificationsEnabled: true,
  browserNotificationsEnabled: false,
  emailNotificationsEnabled: false,
  rules: DEFAULT_RULES,
}

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: [],
      settings: DEFAULT_SETTINGS,

      createReminder: (reminderData) => {
        const reminder: Reminder = {
          ...reminderData,
          id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          triggeredAt: null,
        }
        set((state) => ({
          reminders: [...state.reminders, reminder],
        }))
        return reminder
      },

      dismissReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, status: "dismissed" as const } : r
          ),
        }))
      },

      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }))
      },

      markAsTriggered: (id) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id
              ? { ...r, status: "triggered" as const, triggeredAt: new Date().toISOString() }
              : r
          ),
        }))
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      addRule: (ruleData) => {
        const rule: ReminderRule = {
          ...ruleData,
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }
        set((state) => ({
          settings: {
            ...state.settings,
            rules: [...state.settings.rules, rule],
          },
        }))
      },

      updateRule: (id, updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            rules: state.settings.rules.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          },
        }))
      },

      deleteRule: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            rules: state.settings.rules.filter((r) => r.id !== id),
          },
        }))
      },

      checkReminders: () => {
        const { reminders, settings } = get()
        const now = new Date()
        const triggered: string[] = []

        reminders.forEach((reminder) => {
          if (reminder.status !== "pending") return

          const dueDate = new Date(reminder.dueDate)
          const timeDiff = dueDate.getTime() - now.getTime()
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

          if (daysDiff <= 0) {
            triggered.push(reminder.id)
            if (settings.browserNotificationsEnabled) {
              showBrowserNotification(reminder.title, reminder.message)
            }
          }
        })

        if (triggered.length > 0) {
          set((state) => ({
            reminders: state.reminders.map((r) =>
              triggered.includes(r.id)
                ? { ...r, status: "triggered" as const, triggeredAt: now.toISOString() }
                : r
            ),
          }))
        }
      },

      autoCreateReminders: () => {
        const { reminders, settings } = get()
        const now = new Date()

        ;(settings.rules || []).forEach((rule) => {
          if (!rule.enabled || !rule.autoCreate) return

          const existingReminders = reminders.filter(
            (r) => r.type === rule.type && r.status !== "dismissed"
          )
          if (existingReminders.length > 0) return

          let dueDate: Date | null = null
          let title = ""
          let message = ""

          switch (rule.type) {
            case "warranty": {
              title = "保修即将到期"
              message = `您的资产保修将在 ${rule.daysBefore} 天后到期，请及时处理`
              const futureDate = new Date(now)
              futureDate.setDate(futureDate.getDate() + rule.daysBefore)
              dueDate = futureDate
              break
            }
            case "lifespan": {
              title = "使用寿命提醒"
              message = `您的资产预计使用寿命即将到达，请考虑更换或维护`
              const lifespanDate = new Date(now)
              lifespanDate.setDate(lifespanDate.getDate() + rule.daysBefore)
              dueDate = lifespanDate
              break
            }
            default:
              break
          }

          if (dueDate) {
            get().createReminder({
              assetId: "",
              type: rule.type,
              title,
              message,
              dueDate: dueDate.toISOString(),
              priority: rule.priority,
              status: "pending",
            })
          }
        })
      },
    }),
    {
      name: "assetpulse-reminder-storage",
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<ReminderStore>) }
        if (!merged.settings.rules) {
          merged.settings = { ...merged.settings, rules: DEFAULT_RULES }
        }
        return merged
      },
    }
  )
)

function showBrowserNotification(title: string, message: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "/vite.svg",
    })
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false
  }
  
  if (Notification.permission === "granted") {
    return true
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }
  
  return false
}
