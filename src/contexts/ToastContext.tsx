import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

interface Toast {
  id: string
  type: "success" | "error" | "info"
  message: string
}

interface ToastContextType {
  toast: (type: Toast["type"], message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const colorMap = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-blue-400",
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 3000)
  }, [removeToast])

  const success = useCallback((message: string) => toast("success", message), [toast])
  const error = useCallback((message: string) => toast("error", message), [toast])
  const info = useCallback((message: string) => toast("info", message), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = iconMap[t.type]
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-edge bg-surface px-4 py-3 shadow-xl backdrop-blur-xl modal-content-enter min-w-[280px] max-w-[400px]"
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${colorMap[t.type]}`} />
              <p className="flex-1 text-sm text-content-primary">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-content-faint hover:text-content-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
