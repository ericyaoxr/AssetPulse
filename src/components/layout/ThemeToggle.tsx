import { Palette } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

export default function ThemeToggle() {
  const { currentDefinition } = useTheme()

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
      style={{ color: "var(--text-tertiary)" }}
    >
      <Palette className="h-5 w-5" />
      <span className="flex-1">当前：{currentDefinition.name}</span>
    </div>
  )
}
