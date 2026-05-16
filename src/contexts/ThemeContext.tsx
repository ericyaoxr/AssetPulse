import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { themeRegistry } from "@/config/themes"
import type { ThemeDefinition } from "@/config/themes"

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
    } catch {
      // localStorage unavailable
    }
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "apple"
    }
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
    } catch {
      // localStorage unavailable
    }
  }, [])

  const currentDefinition = useMemo(() => themeRegistry.find((t) => t.id === theme) || themeRegistry[0], [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentDefinition, allThemes: themeRegistry }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
