import { Router } from "express"
import db from "../db.js"
import { generateToken, authMiddleware } from "../middleware/auth.js"
import { createRequire } from 'module'
import crypto from "crypto"

const require = createRequire(import.meta.url)
let bcrypt
try {
  bcrypt = require('bcryptjs')
} catch (e) {
  console.error("FATAL: bcryptjs is required but failed to load:", e.message)
  process.exit(1)
}

const router = Router()

function validatePassword(password) {
  if (!password || password.length < 8) {
    return "密码至少8位"
  }
  if (!/[A-Z]/.test(password)) {
    return "密码需包含至少一个大写字母"
  }
  if (!/[0-9]/.test(password)) {
    return "密码需包含至少一个数字"
  }
  return null
}

router.post("/register", (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" })
  }
  if (username.length < 2 || username.length > 32) {
    return res.status(400).json({ error: "用户名长度需在2-32位之间" })
  }
  const pwdError = validatePassword(password)
  if (pwdError) {
    return res.status(400).json({ error: pwdError })
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username)
  if (existing) {
    return res.status(409).json({ error: "用户名已存在" })
  }

  const id = "u_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16)
  const passwordHash = bcrypt.hashSync(password, 12)

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
  const pwdError = validatePassword(newPassword)
  if (pwdError) {
    return res.status(400).json({ error: pwdError })
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId)
  if (!user) return res.status(404).json({ error: "用户不存在" })

  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(401).json({ error: "旧密码错误" })
  }

  const newHash = bcrypt.hashSync(newPassword, 12)
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, req.userId)
  res.json({ ok: true })
})

export default router
