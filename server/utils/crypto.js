import crypto from "crypto"

const FALLBACK_SECRET = "assetpulse_fallback_secret_do_not_use_in_production"
const ENCRYPTION_KEY = process.env.JWT_SECRET || FALLBACK_SECRET
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error("JWT_SECRET environment variable not set")
  }
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()
}

export function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = getKey()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    const authTag = cipher.getAuthTag().toString("hex")
    return `${iv.toString("hex")}:${authTag}:${encrypted}`
  } catch (e) {
    console.error("Encryption error:", e)
    return text
  }
}

export function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(":")
    if (parts.length !== 3) return null
    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const key = getKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch (e) {
    console.error("Decryption error:", e)
    return null
  }
}
