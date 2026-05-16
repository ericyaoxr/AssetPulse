import type { Asset } from "@/types"
import { formatCurrency } from "@/utils/format"
import { useTheme } from "@/contexts/ThemeContext"

interface ReportShareTemplateProps {
  assets: Asset[]
  year: number
}

export function ReportShareTemplate({ assets, year }: ReportShareTemplateProps) {
  const { theme } = useTheme()

  const isLight = theme === "apple"
  const bg = isLight ? "#f2f2f7" : "#0D1B1E"
  const cardBg = isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)"
  const textPrimary = isLight ? "#1d1d1f" : "#ffffff"
  const textSecondary = isLight ? "#86868b" : "rgba(255,255,255,0.6)"
  const accent = isLight ? "#007AFF" : "#10B981"

  const activeAssets = assets.filter((a) => a.status === "active")
  const totalValue = assets.reduce((s, a) => s + a.purchasePrice, 0)
  const totalDailyCost = activeAssets.reduce((s, a) => s + a.dailyCost, 0)
  const avgDailyCost = activeAssets.length > 0 ? totalDailyCost / activeAssets.length : 0

  const categoryMap = new Map<string, number>()
  assets.forEach((a) => {
    const cat = a.category || "其他"
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + a.purchasePrice)
  })
  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const maxCatValue = topCategories.length > 0 ? topCategories[0][1] : 1

  const topAssets = [...assets].sort((a, b) => b.dailyCost - a.dailyCost).slice(0, 3)

  const totalAiValue = assets.reduce((s, a) => s + (a.aiValuation?.estimatedValue || 0), 0)

  const funFacts: string[] = []
  if (totalDailyCost > 0) {
    funFacts.push(`每天在物品上花费 ${formatCurrency(totalDailyCost)}`)
  }
  if (totalValue > 0) {
    funFacts.push(`累计投入 ${formatCurrency(totalValue)}`)
  }
  if (totalAiValue > 0) {
    funFacts.push(`当前估值 ${formatCurrency(totalAiValue)}`)
  }

  return (
    <div
      style={{
        width: 375,
        padding: 24,
        background: bg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          background: cardBg,
          borderRadius: 20,
          padding: 24,
          border: isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}15, transparent)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            left: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${isLight ? "#AF52DE15" : "#3B82F615"}, transparent)`,
          }}
        />

        <div style={{ textAlign: "center", marginBottom: 20, position: "relative" }}>
          <div style={{ fontSize: 13, color: accent, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
            ASSETPULSE 年度报告
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
            {year}
          </div>
          <div style={{ fontSize: 13, color: textSecondary, marginTop: 8 }}>
            这一年，我与我的物品
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {[
            { label: "持有物品", value: `${assets.length}件`, emoji: "📦" },
            { label: "总投入", value: totalValue >= 10000 ? `${(totalValue / 10000).toFixed(1)}万` : formatCurrency(totalValue), emoji: "💰" },
            { label: "日均花费", value: avgDailyCost >= 1 ? `${avgDailyCost.toFixed(0)}元` : `${(avgDailyCost * 100).toFixed(0)}分`, emoji: "📊" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: "10px 8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>{item.emoji}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>{item.value}</div>
              <div style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {topCategories.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 10 }}>
              🏷️ 消费分布
            </div>
            {topCategories.map(([cat, value], i) => {
              const colors = [accent, isLight ? "#AF52DE" : "#3B82F6", isLight ? "#FF9500" : "#F59E0B", isLight ? "#FF3B30" : "#EF4444", isLight ? "#34C759" : "#8B5CF6"]
              const color = colors[i % colors.length]
              const pct = (value / maxCatValue) * 100
              return (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: textPrimary }}>{cat}</span>
                    <span style={{ fontSize: 11, color: textSecondary }}>{formatCurrency(value)}</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        background: color,
                        width: `${pct}%`,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {topAssets.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 10 }}>
              🔥 日均成本 TOP {topAssets.length}
            </div>
            {topAssets.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: i < topAssets.length - 1 ? (isLight ? "1px solid rgba(0,0,0,0.04)" : "1px solid rgba(255,255,255,0.04)") : "none",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: i === 0 ? "#FF9500" : i === 1 ? "#C0C0C0" : "#CD7F32",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: 11, color: textSecondary }}>{a.category}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: accent, flexShrink: 0 }}>
                  {formatCurrency(a.dailyCost)}/天
                </div>
              </div>
            ))}
          </div>
        )}

        {totalAiValue > 0 && (
          <div
            style={{
              background: isLight
                ? "linear-gradient(135deg, rgba(0,122,255,0.08), rgba(175,82,222,0.08))"
                : "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))",
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12, color: textSecondary, marginBottom: 4 }}>🤖 AI 估值总计</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: accent }}>
              {formatCurrency(totalAiValue)}
            </div>
          </div>
        )}

        {funFacts.length > 0 && (
          <div
            style={{
              background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 8 }}>
              ✨ 我的数据
            </div>
            {funFacts.map((fact, i) => (
              <div key={i} style={{ fontSize: 12, color: textSecondary, marginBottom: i < funFacts.length - 1 ? 4 : 0 }}>
                • {fact}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            borderTop: isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: accent, letterSpacing: 0.5 }}>
              AssetPulse
            </div>
            <div style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>
              让每一分钱都看得见
            </div>
          </div>
          <div style={{ fontSize: 10, color: textSecondary }}>
            {year} 年度报告
          </div>
        </div>
      </div>
    </div>
  )
}
