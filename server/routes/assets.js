import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"
import { safeParseJSON } from "../utils/json.js"

const router = Router()
router.use(authMiddleware)

router.get("/", (req, res) => {
  const assets = db.prepare("SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC").all(req.userId)
  res.json(assets.map(formatAsset))
})

router.post("/", (req, res) => {
  const a = req.body
  if (!a || !a.name) {
    return res.status(400).json({ error: "资产名称不能为空" })
  }
  if (typeof a.name !== "string" || a.name.length > 200) {
    return res.status(400).json({ error: "资产名称不合法" })
  }
  if (a.purchasePrice !== undefined && (typeof a.purchasePrice !== "number" || a.purchasePrice < 0)) {
    return res.status(400).json({ error: "购买价格不合法" })
  }
  if (a.status && !["active", "recycled", "scrapped"].includes(a.status)) {
    return res.status(400).json({ error: "资产状态不合法" })
  }
  const id = a.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 9))
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO assets (id, user_id, name, status, category, location, image_url,
      purchase_date, purchase_price, end_date, recycle_amount, target_daily_cost,
      effective_days, daily_cost, rating, note, ai_valuation, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.userId, a.name, a.status || "active", a.category || "", a.location || "",
    a.imageUrl || null, a.purchaseDate, a.purchasePrice || 0, a.endDate || null,
    a.recycleAmount || null, a.targetDailyCost || null, a.effectiveDays || 0,
    a.dailyCost || 0, a.rating || null, a.note || "", a.aiValuation ? JSON.stringify(a.aiValuation) : null,
    a.createdAt || now, now
  )

  const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(id)
  res.json(formatAsset(asset))
})

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM assets WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: "资产不存在" })

  const a = req.body
  if (a.name !== undefined && (typeof a.name !== "string" || a.name.length > 200)) {
    return res.status(400).json({ error: "资产名称不合法" })
  }
  if (a.purchasePrice !== undefined && (typeof a.purchasePrice !== "number" || a.purchasePrice < 0)) {
    return res.status(400).json({ error: "购买价格不合法" })
  }
  if (a.status && !["active", "recycled", "scrapped"].includes(a.status)) {
    return res.status(400).json({ error: "资产状态不合法" })
  }
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE assets SET name=?, status=?, category=?, location=?, image_url=?,
      purchase_date=?, purchase_price=?, end_date=?, recycle_amount=?, target_daily_cost=?,
      effective_days=?, daily_cost=?, rating=?, note=?, ai_valuation=?, updated_at=?
    WHERE id=? AND user_id=?
  `).run(
    a.name ?? existing.name, a.status ?? existing.status, a.category ?? existing.category,
    a.location ?? existing.location, a.imageUrl !== undefined ? a.imageUrl : existing.image_url,
    a.purchaseDate ?? existing.purchase_date, a.purchasePrice ?? existing.purchase_price,
    a.endDate !== undefined ? a.endDate : existing.end_date,
    a.recycleAmount !== undefined ? a.recycleAmount : existing.recycle_amount,
    a.targetDailyCost !== undefined ? a.targetDailyCost : existing.target_daily_cost,
    a.effectiveDays ?? existing.effective_days, a.dailyCost ?? existing.daily_cost,
    a.rating !== undefined ? a.rating : existing.rating, a.note ?? existing.note,
    a.aiValuation !== undefined ? (a.aiValuation ? JSON.stringify(a.aiValuation) : null) : existing.ai_valuation,
    now, req.params.id, req.userId
  )

  const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(req.params.id)
  res.json(formatAsset(asset))
})

router.delete("/:id", (req, res) => {
  const asset = db.prepare("SELECT * FROM assets WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
  if (!asset) return res.status(404).json({ error: "资产不存在" })

  const now = new Date().toISOString()
  db.prepare("INSERT OR REPLACE INTO trash (asset_id, user_id, asset_data, deleted_at) VALUES (?, ?, ?, ?)").run(
    asset.id, req.userId, JSON.stringify(formatAsset(asset)), now
  )
  db.prepare("DELETE FROM assets WHERE id = ? AND user_id = ?").run(req.params.id, req.userId)

  res.json({ ok: true })
})

function formatAsset(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    status: row.status,
    category: row.category,
    location: row.location,
    imageUrl: row.image_url,
    purchaseDate: row.purchase_date,
    purchasePrice: row.purchase_price,
    endDate: row.end_date,
    recycleAmount: row.recycle_amount,
    targetDailyCost: row.target_daily_cost,
    effectiveDays: row.effective_days,
    dailyCost: row.daily_cost,
    rating: row.rating,
    note: row.note,
    aiValuation: row.ai_valuation ? safeParseJSON(row.ai_valuation) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default router
