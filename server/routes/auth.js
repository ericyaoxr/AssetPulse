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

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

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
  const { username, password, inviteCode } = req.body
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

  // 检查邀请码
  let inviterId = null
  if (inviteCode) {
    const inviter = db.prepare("SELECT id FROM users WHERE invite_code = ?").get(inviteCode.trim().toUpperCase())
    if (inviter) {
      inviterId = inviter.id
    }
  }

  const id = "u_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16)
  const passwordHash = bcrypt.hashSync(password, 12)
  const inviteCodeForNewUser = generateInviteCode()

  db.prepare("INSERT INTO users (id, username, password_hash, invite_code, invited_by) VALUES (?, ?, ?, ?, ?)").run(id, username, passwordHash, inviteCodeForNewUser, inviterId)
  
  // 初始化 AI 使用次数
  db.prepare("INSERT OR IGNORE INTO ai_usage (user_id, remaining_count, total_used) VALUES (?, 10, 0)").run(id)
  
  // 如果有邀请人，记录并给双方奖励
  if (inviterId) {
    db.prepare("INSERT INTO invites (inviter_id, invitee_id) VALUES (?, ?)").run(inviterId, id)
    // 给邀请人 +10 次
    db.prepare("UPDATE ai_usage SET remaining_count = remaining_count + 10 WHERE user_id = ?").run(inviterId)
    // 给被邀请人 +10 次（额外奖励）
    db.prepare("UPDATE ai_usage SET remaining_count = remaining_count + 10 WHERE user_id = ?").run(id)
  }

  const token = generateToken({ userId: id, username })
  res.json({
    token,
    user: { id, username, createdAt: new Date().toISOString(), inviteCode: inviteCodeForNewUser },
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
    user: { id: user.id, username: user.username, createdAt: user.created_at, inviteCode: user.invite_code },
  })
})

router.get("/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT id, username, created_at, invite_code FROM users WHERE id = ?").get(req.userId)
  if (!user) return res.status(404).json({ error: "用户不存在" })
  
  const usage = db.prepare("SELECT * FROM ai_usage WHERE user_id = ?").get(req.userId) || { remaining_count: 10, total_used: 0 }
  const inviteCount = db.prepare("SELECT COUNT(*) as count FROM invites WHERE inviter_id = ?").get(req.userId)?.count || 0

  res.json({
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
    inviteCode: user.invite_code,
    aiUsage: { remaining: usage.remaining_count, totalUsed: usage.total_used },
    inviteCount,
  })
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

// 获取邀请记录
router.get("/invites", authMiddleware, (req, res) => {
  const invites = db.prepare(`
    SELECT i.created_at, u.username as invitee_username
    FROM invites i
    JOIN users u ON i.invitee_id = u.id
    WHERE i.inviter_id = ?
    ORDER BY i.created_at DESC
  `).all(req.userId)
  
  res.json(invites)
})

export default router
