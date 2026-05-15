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
