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
  {
    id: "cyber",
    name: "赛博朋克",
    description: "霓虹光影，未来科技感",
    preview: {
      bg: "#0a0a1a",
      accent: "#f72585",
      text: "#e0e0ff",
      card: "rgba(247,37,133,0.08)",
    },
  },
  {
    id: "sunset",
    name: "日落暖阳",
    description: "温暖橘调，柔和舒适",
    preview: {
      bg: "#1a1210",
      accent: "#f97316",
      text: "#fef3c7",
      card: "rgba(249,115,22,0.08)",
    },
  },
  {
    id: "forest",
    name: "森林秘境",
    description: "自然绿意，清新宁静",
    preview: {
      bg: "#0c1a12",
      accent: "#22c55e",
      text: "#d1fae5",
      card: "rgba(34,197,94,0.08)",
    },
  },
  {
    id: "ocean",
    name: "深海蔚蓝",
    description: "深邃海洋，沉稳专业",
    preview: {
      bg: "#0a1628",
      accent: "#3b82f6",
      text: "#dbeafe",
      card: "rgba(59,130,246,0.08)",
    },
  },
]
