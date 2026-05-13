import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"

const router = Router()
router.use(authMiddleware)

router.get("/", (req, res) => {
  const items = db.prepare("SELECT name FROM locations WHERE user_id = ? ORDER BY name").all(req.userId)
  res.json(items.map((i) => i.name))
})

router.post("/", (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: "位置名不能为空" })
  try {
    db.prepare("INSERT INTO locations (user_id, name) VALUES (?, ?)").run(req.userId, name)
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "位置已存在" })
    throw e
  }
  res.json({ ok: true })
})

router.delete("/:name", (req, res) => {
  db.prepare("DELETE FROM locations WHERE user_id = ? AND name = ?").run(req.userId, req.params.name)
  res.json({ ok: true })
})

router.put("/", (req, res) => {
  const { names } = req.body
  if (!Array.isArray(names)) return res.status(400).json({ error: "需要提供名称数组" })
  db.prepare("DELETE FROM locations WHERE user_id = ?").run(req.userId)
  const insert = db.prepare("INSERT INTO locations (user_id, name) VALUES (?, ?)")
  const insertMany = db.transaction((items) => {
    for (const name of items) insert.run(req.userId, name)
  })
  insertMany(names)
  res.json({ ok: true })
})

export default router
