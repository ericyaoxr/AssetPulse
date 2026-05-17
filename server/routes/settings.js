import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"
import { encrypt, decrypt } from "../utils/crypto.js"

const SENSITIVE_KEYS = new Set(["ai_config"])

function encryptIfNeeded(key, value) {
  try {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value)
    if (SENSITIVE_KEYS.has(key)) {
      const encrypted = encrypt(stringValue)
      return encrypted
    }
    return stringValue
  } catch (e) {
    console.error("encryptIfNeeded error:", e)
    return typeof value === "string" ? value : JSON.stringify(value)
  }
}

function decryptIfNeeded(key, value) {
  try {
    if (SENSITIVE_KEYS.has(key) && typeof value === "string") {
      const decrypted = decrypt(value)
      if (decrypted !== null) {
        return decrypted
      }
      // 如果解密失败，可能是值没有加密过，直接返回原值
      return value
    }
    return value
  } catch (e) {
    console.error("decryptIfNeeded error:", e)
    return value
  }
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
  try {
    const { value } = req.body
    if (value === undefined) return res.status(400).json({ error: "缺少 value" })
    const storedValue = encryptIfNeeded(req.params.key, value)
    db.prepare("INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)").run(
      req.userId, req.params.key, storedValue
    )
    res.json({ ok: true })
  } catch (e) {
    console.error("Settings save error:", e)
    res.status(500).json({ error: e.message || "保存失败" })
  }
})

router.delete("/:key", (req, res) => {
  db.prepare("DELETE FROM settings WHERE user_id = ? AND key = ?").run(req.userId, req.params.key)
  res.json({ ok: true })
})

export default router
