export function safeParseJSON(str) {
  try { return JSON.parse(str) } catch { return null }
}
