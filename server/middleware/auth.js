import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "assetpulse_secret_key_2024"
const JWT_EXPIRES = "7d"

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未登录" })
  }
  const token = header.slice(7)
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: "登录已过期" })
  }
  req.userId = decoded.userId
  req.username = decoded.username
  next()
}
