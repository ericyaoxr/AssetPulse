import { Router } from "express"
import db from "../db.js"
import { authMiddleware } from "../middleware/auth.js"
import { safeParseJSON } from "../utils/json.js"

const router = Router()
router.use(authMiddleware)

router.get("/export", (req, res) => {
  const users = db.prepare("SELECT id, username, created_at FROM users WHERE id = ?").all(req.userId)
  const assets = db.prepare("SELECT * FROM assets WHERE user_id = ?").all(req.userId)
  const trash = db.prepare("SELECT * FROM trash WHERE user_id = ?").all(req.userId)
  const categories = db.prepare("SELECT name, user_id FROM categories WHERE user_id = ?").all(req.userId)
  const locations = db.prepare("SELECT name, user_id FROM locations WHERE user_id = ?").all(req.userId)

  res.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    users,
    assets: assets.map((a) => ({
      ...a,
      ai_valuation: a.ai_valuation ? safeParseJSON(a.ai_valuation) : null,
    })),
    trash: trash.map((t) => ({
      ...t,
      asset_data: safeParseJSON(t.asset_data),
    })),
    categories,
    locations,
  })
})

router.post("/import", (req, res) => {
  const data = req.body
  if (!data || !data.assets) return res.status(400).json({ error: "无效的备份数据" })

  const userId = req.userId
  const now = new Date().toISOString()

  db.prepare("DELETE FROM assets WHERE user_id = ?").run(userId)
  db.prepare("DELETE FROM trash WHERE user_id = ?").run(userId)
  db.prepare("DELETE FROM categories WHERE user_id = ?").run(userId)
  db.prepare("DELETE FROM locations WHERE user_id = ?").run(userId)

  const insertAsset = db.prepare(`
    INSERT INTO assets (id, user_id, name, status, category, location, image_url,
      purchase_date, purchase_price, end_date, recycle_amount, target_daily_cost,
      effective_days, daily_cost, rating, note, ai_valuation, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertTrash = db.prepare(`
    INSERT OR REPLACE INTO trash (asset_id, user_id, asset_data, deleted_at)
    VALUES (?, ?, ?, ?)
  `)

  const insertCat = db.prepare("INSERT OR IGNORE INTO categories (user_id, name) VALUES (?, ?)")
  const insertLoc = db.prepare("INSERT OR IGNORE INTO locations (user_id, name) VALUES (?, ?)")

  const doImport = db.transaction(() => {
    for (const a of (data.assets || [])) {
      insertAsset.run(
        a.id, userId, a.name, a.status || "active", a.category || "", a.location || "",
        a.imageUrl || a.image_url || null, a.purchaseDate || a.purchase_date,
        a.purchasePrice || a.purchase_price || 0, a.endDate || a.end_date || null,
        a.recycleAmount || a.recycle_amount || null,
        a.targetDailyCost || a.target_daily_cost || null,
        a.effectiveDays || a.effective_days || 0, a.dailyCost || a.daily_cost || 0,
        a.rating || null, a.note || "",
        (a.aiValuation || a.ai_valuation) ? JSON.stringify(a.aiValuation || a.ai_valuation) : null,
        a.createdAt || a.created_at || now, a.updatedAt || a.updated_at || now
      )
    }

    for (const t of (data.trash || [])) {
      const assetData = t.asset || t.asset_data
      insertTrash.run(
        t.assetId || t.asset_id || assetData?.id,
        userId,
        JSON.stringify(assetData),
        t.deletedAt || t.deleted_at || now
      )
    }

    for (const c of (data.categories || [])) {
      insertCat.run(userId, c.name)
    }

    for (const l of (data.locations || [])) {
      insertLoc.run(userId, l.name)
    }
  })

  doImport()
  res.json({ ok: true, imported: { assets: (data.assets || []).length, trash: (data.trash || []).length } })
})

export default router
