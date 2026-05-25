import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"
import { safeParseJSON, toISODate } from "../utils/json.js"

const router = Router()
router.use(authMiddleware)

router.get("/", (req, res) => {
  const items = db.prepare("SELECT * FROM trash WHERE user_id = ? ORDER BY deleted_at DESC").all(req.userId)
  res.json(items.map(formatTrash))
})

router.post("/restore/:id", (req, res) => {
  const item = db.prepare("SELECT * FROM trash WHERE asset_id = ? AND user_id = ?").get(req.params.id, req.userId)
  if (!item) return res.status(404).json({ error: "回收站中无此资产" })

  const asset = safeParseJSON(item.asset_data)
  if (!asset) return res.status(500).json({ error: "资产数据损坏" })
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO assets (id, user_id, name, status, category, location, image_url,
      purchase_date, purchase_price, end_date, recycle_amount, target_daily_cost,
      effective_days, daily_cost, rating, note, ai_valuation, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    asset.id, req.userId, asset.name, asset.status, asset.category, asset.location,
    asset.imageUrl, asset.purchaseDate, asset.purchasePrice, asset.endDate,
    asset.recycleAmount, asset.targetDailyCost, asset.effectiveDays,
    asset.dailyCost, asset.rating, asset.note,
    asset.aiValuation ? JSON.stringify(asset.aiValuation) : null,
    asset.createdAt, now
  )

  db.prepare("DELETE FROM trash WHERE asset_id = ? AND user_id = ?").run(req.params.id, req.userId)
  res.json({ ok: true })
})

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM trash WHERE asset_id = ? AND user_id = ?").run(req.params.id, req.userId)
  res.json({ ok: true })
})

router.delete("/", (req, res) => {
  db.prepare("DELETE FROM trash WHERE user_id = ?").run(req.userId)
  res.json({ ok: true })
})

function formatTrash(row) {
  return {
    asset: safeParseJSON(row.asset_data) || {},
    deletedAt: toISODate(row.deleted_at),
    userId: row.user_id,
  }
}

export default router
