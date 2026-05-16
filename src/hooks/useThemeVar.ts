import { useMemo, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"

const themeVarCache: Record<string, Record<string, string>> = {}

function resolveVar(name: string, themeId: string): string {
  if (!themeVarCache[themeId]) {
    themeVarCache[themeId] = {}
  }
  if (themeVarCache[themeId][name]) {
    return themeVarCache[themeId][name]
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  themeVarCache[themeId][name] = value
  return value
}

export function useThemeVar(name: string, fallback: string): string {
  const { theme } = useTheme()
  return useMemo(() => resolveVar(name, theme) || fallback, [theme, name, fallback])
}

export function useThemeVars(vars: Record<string, string>): Record<string, string> {
  const { theme } = useTheme()
  const stableVars = useRef(vars)
  const key = JSON.stringify(vars)
  if (key !== JSON.stringify(stableVars.current)) {
    stableVars.current = vars
  }
  return useMemo(() => {
    const result: Record<string, string> = {}
    for (const [name, fallback] of Object.entries(stableVars.current)) {
      result[name] = resolveVar(name, theme) || fallback
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, key])
}

export function clearThemeVarCache(): void {
  for (const key of Object.keys(themeVarCache)) {
    delete themeVarCache[key]
  }
}
