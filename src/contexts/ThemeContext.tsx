import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export interface ThemeDefinition {
  id: string
  name: string
  description: string
  preview: {
    bg: string
    accent: string
    text: string
    card: string
  }
}

export const themeRegistry: ThemeDefinition[] = [
  {
    id: "dark",
    name: "深色",
    description: "经典深色主题，沉稳护眼",
    preview: {
      bg: "#0D1B1E",
      accent: "#10B981",
      text: "#ffffff",
      card: "rgba(255,255,255,0.05)",
    },
  },
  {
    id: "apple",
    name: "苹果风格",
    description: "毛玻璃质感，Apple HIG 设计语言",
    preview: {
      bg: "#f2f2f7",
      accent: "#007AFF",
      text: "#1d1d1f",
      card: "rgba(255,255,255,0.65)",
    },
  },
]

export type ThemeId = string

interface ThemeContextType {
  theme: ThemeId
  setTheme: (id: ThemeId) => void
  currentDefinition: ThemeDefinition
  allThemes: ThemeDefinition[]
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  currentDefinition: themeRegistry[0],
  allThemes: themeRegistry,
})

const STORAGE_KEY = "assetpulse_theme"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && themeRegistry.some((t) => t.id === saved)) return saved
    } catch {}
    return "dark"
  })

  const applyTheme = useCallback((id: ThemeId) => {
    if (id === "dark") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", id)
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  const setTheme = useCallback((id: ThemeId) => {
    if (!themeRegistry.some((t) => t.id === id)) return
    setThemeState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {}
  }, [])

  const currentDefinition = themeRegistry.find((t) => t.id === theme) || themeRegistry[0]

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentDefinition, allThemes: themeRegistry }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
