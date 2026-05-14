import { Router } from "express"
import db from "../db.js"
import { generateToken, authMiddleware } from "../middleware/auth.js"
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
let bcrypt
try {
  bcrypt = require('bcryptjs')
} catch (e) {
  console.error("Failed to load bcryptjs:", e)
  bcrypt = {
    hashSync: (p) => `fallback_${btoa(p)}`,
    compareSync: (p, h) => h === `fallback_${btoa(p)}`
  }
}

console.log("bcrypt loaded:", !!bcrypt)

const router = Router()

router.post("/register", (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" })
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "密码至少4位" })
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username)
  if (existing) {
    return res.status(409).json({ error: "用户名已存在" })
  }

  const id = "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const passwordHash = bcrypt.hashSync(password, 10)

  db.prepare("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)").run(id, username, passwordHash)

  const token = generateToken({ userId: id, username })
  res.json({
    token,
    user: { id, username, createdAt: new Date().toISOString() },
  })
})

router.post("/login", (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" })
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username)
  if (!user) {
    return res.status(401).json({ error: "用户名或密码错误" })
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "用户名或密码错误" })
  }

  const token = generateToken({ userId: user.id, username: user.username })
  res.json({
    token,
    user: { id: user.id, username: user.username, createdAt: user.created_at },
  })
})

router.get("/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT id, username, created_at FROM users WHERE id = ?").get(req.userId)
  if (!user) return res.status(404).json({ error: "用户不存在" })
  res.json({ id: user.id, username: user.username, createdAt: user.created_at })
})

router.put("/password", authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "请输入旧密码和新密码" })
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: "新密码至少4位" })
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId)
  if (!user) return res.status(404).json({ error: "用户不存在" })

  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(401).json({ error: "旧密码错误" })
  }

  const newHash = bcrypt.hashSync(newPassword, 10)
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, req.userId)
  res.json({ ok: true })
})

export default router
