export function safeParseJSON(str) {
  try { return JSON.parse(str) } catch { return null }
}

export function toISODate(sqliteDate) {
  if (!sqliteDate) return sqliteDate
  if (typeof sqliteDate !== "string") return sqliteDate
  if (sqliteDate.includes("T")) return sqliteDate
  return sqliteDate.replace(" ", "T") + ".000Z"
}
