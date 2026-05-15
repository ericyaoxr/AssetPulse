import { Palette, Check } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

export default function ThemeSettings() {
  const { theme, setTheme, allThemes } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-content-primary">
          <Palette className="h-6 w-6 text-accent" />
          外观设置
        </h1>
        <p className="mt-1 text-sm text-content-tertiary">选择你喜欢的主题风格，即时预览生效</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {allThemes.map((t) => {
          const isActive = theme === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 p-0 text-left transition-all ${
                isActive
                  ? "border-accent shadow-lg"
                  : "border-edge hover:border-content-faint"
              }`}
            >
              {isActive && (
                <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className="relative flex h-40 items-start gap-3 p-4 sm:h-44"
                style={{ backgroundColor: t.preview.bg }}
              >
                <div
                  className="flex h-full w-12 flex-shrink-0 flex-col items-center gap-2 rounded-xl px-2 py-3"
                  style={{ backgroundColor: t.preview.card }}
                >
                  <div
                    className="h-2 w-full rounded-full"
                    style={{ backgroundColor: t.preview.accent, opacity: 0.8 }}
                  />
                  <div
                    className="h-2 w-full rounded-full"
                    style={{ backgroundColor: t.preview.text, opacity: 0.2 }}
                  />
                  <div
                    className="h-2 w-full rounded-full"
                    style={{ backgroundColor: t.preview.text, opacity: 0.2 }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2.5 pt-1">
                  <div
                    className="h-3 w-16 rounded-full"
                    style={{ backgroundColor: t.preview.text, opacity: 0.6 }}
                  />
                  <div
                    className="flex flex-col gap-2 rounded-xl p-3"
                    style={{ backgroundColor: t.preview.card }}
                  >
                    <div
                      className="h-2.5 w-3/4 rounded-full"
                      style={{ backgroundColor: t.preview.text, opacity: 0.7 }}
                    />
                    <div
                      className="h-2 w-1/2 rounded-full"
                      style={{ backgroundColor: t.preview.text, opacity: 0.3 }}
                    />
                    <div
                      className="mt-1 h-5 w-16 rounded-md"
                      style={{ backgroundColor: t.preview.accent, opacity: 0.9 }}
                    />
                  </div>
                  <div
                    className="flex flex-col gap-2 rounded-xl p-3"
                    style={{ backgroundColor: t.preview.card }}
                  >
                    <div
                      className="h-2.5 w-2/3 rounded-full"
                      style={{ backgroundColor: t.preview.text, opacity: 0.7 }}
                    />
                    <div
                      className="h-2 w-1/3 rounded-full"
                      style={{ backgroundColor: t.preview.text, opacity: 0.3 }}
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-4" style={{ backgroundColor: t.preview.bg }}>
                <p
                  className="text-sm font-semibold"
                  style={{ color: t.preview.text }}
                >
                  {t.name}
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: t.preview.text, opacity: 0.5 }}
                >
                  {t.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-5">
        <p className="text-sm text-content-secondary">
          💡 提示：更多主题皮肤持续开发中，你也可以通过编辑 <code className="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-accent">themeRegistry</code> 和 CSS 变量来自定义主题。
        </p>
      </div>
    </div>
  )
}
