import { useState } from "react"

interface TagCloudProps {
  tags: Record<string, number>
  selectedTag: string | null
  onTagClick: (tag: string) => void
}

export function TagCloud({ tags, selectedTag, onTagClick }: TagCloudProps) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const tagEntries = Object.entries(tags)

  if (tagEntries.length === 0) return null

  const maxCount = Math.max(...Object.values(tags))
  const minCount = Math.min(...Object.values(tags))

  const getFontSize = (count: number) => {
    if (maxCount === minCount) return 14
    const range = maxCount - minCount
    const scale = (count - minCount) / range
    return 12 + scale * 8 // 12px to 20px
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tagEntries.map(([tag, count]) => {
        const isSelected = selectedTag === tag
        const isHovered = hoveredTag === tag

        return (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            onMouseEnter={() => setHoveredTag(tag)}
            onMouseLeave={() => setHoveredTag(null)}
            className={`relative px-3 py-1 rounded-full text-sm transition-all duration-200 ${
              isSelected
                ? "bg-accent text-white shadow-md"
                : "bg-white/5 border border-edge text-content-secondary hover:bg-white/10"
            }`}
            style={{ fontSize: getFontSize(count) }}
          >
            {tag}
            <span className="ml-1 text-xs opacity-70">({count})</span>
            {isHovered && !isSelected && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-content-tertiary whitespace-nowrap">
                点击筛选
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
