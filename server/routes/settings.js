import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"

const router = Router()
router.use(authMiddleware)

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings WHERE user_id = ?").all(req.userId)
  const result = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  res.json(result)
})

router.get("/:key", (req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?").get(req.userId, req.params.key)
  if (!row) return res.json(null)
  res.json({ key: req.params.key, value: row.value })
})

router.put("/:key", (req, res) => {
  const { value } = req.body
  if (value === undefined) return res.status(400).json({ error: "缺少 value" })
  db.prepare("INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)").run(
    req.userId, req.params.key, typeof value === "string" ? value : JSON.stringify(value)
  )
  res.json({ ok: true })
})

router.delete("/:key", (req, res) => {
  db.prepare("DELETE FROM settings WHERE user_id = ? AND key = ?").run(req.userId, req.params.key)
  res.json({ ok: true })
})

export default router
