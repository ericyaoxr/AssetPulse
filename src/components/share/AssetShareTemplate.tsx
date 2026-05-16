import type { Asset } from "@/types"
import { formatCurrency, formatDays } from "@/utils/format"
import { useTheme } from "@/contexts/ThemeContext"

interface AssetShareTemplateProps {
  asset: Asset
}

export function AssetShareTemplate({ asset }: AssetShareTemplateProps) {
  const { theme } = useTheme()

  const isLight = theme === "apple"
  const bg = isLight ? "#f2f2f7" : "#0D1B1E"
  const cardBg = isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)"
  const textPrimary = isLight ? "#1d1d1f" : "#ffffff"
  const textSecondary = isLight ? "#86868b" : "rgba(255,255,255,0.6)"
  const accent = isLight ? "#007AFF" : "#10B981"

  const costPerDay = asset.dailyCost
  const costLabel = costPerDay < 1 ? `${Math.round(costPerDay * 100)}分` : `${costPerDay.toFixed(2)}元`

  const statusEmoji = asset.status === "active" ? "🟢" : asset.status === "recycled" ? "🔵" : "🟡"
  const statusText = asset.status === "active" ? "使用中" : asset.status === "recycled" ? "已回收" : "已报废"

  return (
    <div
      style={{
        width: 375,
        padding: 24,
        background: bg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        borderRadius: 0,
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
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}22, transparent)`,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 14 }}>{statusEmoji}</span>
          <span style={{ fontSize: 12, color: textSecondary }}>{statusText}</span>
          {asset.category && (
            <span
              style={{
                fontSize: 11,
                color: accent,
                background: `${accent}18`,
                padding: "2px 8px",
                borderRadius: 10,
                marginLeft: 4,
              }}
            >
              {asset.category}
            </span>
          )}
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: textPrimary,
            margin: 0,
            lineHeight: 1.3,
            marginBottom: 20,
          }}
        >
          {asset.name}
        </h2>

        <div
          style={{
            background: isLight ? "rgba(0,122,255,0.06)" : "rgba(16,185,129,0.08)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: textSecondary, marginBottom: 4 }}>日均成本</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: accent, lineHeight: 1 }}>
              {costLabel}
            </span>
            <span style={{ fontSize: 13, color: textSecondary }}>/天</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11, color: textSecondary, marginBottom: 4 }}>购入价格</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary }}>
              {formatCurrency(asset.purchasePrice)}
            </div>
          </div>
          <div
            style={{
              background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11, color: textSecondary, marginBottom: 4 }}>已使用</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary }}>
              {formatDays(asset.effectiveDays)}
            </div>
          </div>
        </div>

        {asset.aiValuation && (
          <div
            style={{
              background: isLight
                ? "linear-gradient(135deg, rgba(0,122,255,0.08), rgba(175,82,222,0.08))"
                : "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))",
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: textSecondary }}>🤖 AI 估算残值</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: accent }}>
                {formatCurrency(asset.aiValuation.estimatedValue)}
              </span>
            </div>
            <div style={{ marginTop: 6 }}>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${accent}, ${isLight ? "#AF52DE" : "#3B82F6"})`,
                    width: `${Math.max(5, (1 - asset.aiValuation.depreciationRate) * 100)}%`,
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: textSecondary }}>
                  折旧率 {(asset.aiValuation.depreciationRate * 100).toFixed(0)}%
                </span>
                <span style={{ fontSize: 10, color: textSecondary }}>
                  {asset.aiValuation.marketTrend === "上涨"
                    ? "📈"
                    : asset.aiValuation.marketTrend === "下跌"
                    ? "📉"
                    : "➡️"}{" "}
                  {asset.aiValuation.marketTrend}
                </span>
              </div>
            </div>
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
          <div
            style={{
              fontSize: 10,
              color: textSecondary,
              textAlign: "right",
            }}
          >
            购入于 {asset.purchaseDate}
          </div>
        </div>
      </div>
    </div>
  )
}
