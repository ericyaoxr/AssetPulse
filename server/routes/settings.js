import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"
import { encrypt, decrypt } from "../utils/crypto.js"

const SENSITIVE_KEYS = new Set(["ai_config"])

function encryptIfNeeded(key, value) {
  if (SENSITIVE_KEYS.has(key) && typeof value === "string") {
    return encrypt(value)
  }
  return typeof value === "string" ? value : JSON.stringify(value)
}

function decryptIfNeeded(key, value) {
  if (SENSITIVE_KEYS.has(key) && typeof value === "string") {
    const decrypted = decrypt(value)
    return decrypted !== null ? decrypted : value
  }
  return value
}

const router = Router()
router.use(authMiddleware)

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings WHERE user_id = ?").all(req.userId)
  const result = {}
  for (const row of rows) {
    result[row.key] = decryptIfNeeded(row.key, row.value)
  }
  res.json(result)
})

router.get("/:key", (req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?").get(req.userId, req.params.key)
  if (!row) return res.json(null)
  res.json({ key: req.params.key, value: decryptIfNeeded(req.params.key, row.value) })
})

router.put("/:key", (req, res) => {
  const { value } = req.body
  if (value === undefined) return res.status(400).json({ error: "缺少 value" })
  db.prepare("INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)").run(
    req.userId, req.params.key, encryptIfNeeded(req.params.key, value)
  )
  res.json({ ok: true })
})

router.delete("/:key", (req, res) => {
  db.prepare("DELETE FROM settings WHERE user_id = ? AND key = ?").run(req.userId, req.params.key)
  res.json({ ok: true })
})

export default router
