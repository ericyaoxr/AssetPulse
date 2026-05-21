import { formatCurrency as formatCurrencyWithStore } from "@/store/useLocaleStore"

export function formatCurrency(value: number): string {
  return formatCurrencyWithStore(value)
}

export function formatDays(days: number): string {
  if (days === 0) return "0天"
  if (days < 30) return `${days}天`
  if (days < 365) {
    const months = Math.floor(days / 30)
    const remainDays = days % 30
    return remainDays > 0 ? `${months}个月${remainDays}天` : `${months}个月`
  }
  const years = Math.floor(days / 365)
  const remainDays = days % 365
  const months = Math.floor(remainDays / 30)
  return months > 0 ? `${years}年${months}个月` : `${years}年`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "使用中",
    recycled: "已回收",
    scrapped: "已报废",
  }
  return map[status] || status
}
