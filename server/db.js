import Database from "better-sqlite3"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.NETLIFY ? "/tmp/assetpulse-data" : (process.env.DATA_DIR || path.join(__dirname, "..", "data"))

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

try {
  fs.accessSync(DATA_DIR, fs.constants.W_OK)
} catch {
  try {
    fs.chmodSync(DATA_DIR, 0o777)
  } catch {}
}

const DB_PATH = path.join(DATA_DIR, "assetpulse.db")

if (fs.existsSync(DB_PATH)) {
  try {
    fs.accessSync(DB_PATH, fs.constants.W_OK)
  } catch {
    try {
      fs.chmodSync(DB_PATH, 0o666)
    } catch {}
  }
  for (const ext of ["wal", "shm"]) {
    const extPath = `${DB_PATH}-${ext}`
    if (fs.existsSync(extPath)) {
      try {
        fs.accessSync(extPath, fs.constants.W_OK)
      } catch {
        try { fs.chmodSync(extPath, 0o666) } catch {}
      }
    }
  }
}

const db = new Database(DB_PATH)

db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    invited_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inviter_id TEXT NOT NULL,
    invitee_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(inviter_id, invitee_id),
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_usage (
    user_id TEXT PRIMARY KEY,
    remaining_count INTEGER NOT NULL DEFAULT 10,
    total_used INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    category TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    purchase_date TEXT NOT NULL,
    purchase_price REAL NOT NULL DEFAULT 0,
    end_date TEXT,
    recycle_amount REAL,
    target_daily_cost REAL,
    effective_days INTEGER NOT NULL DEFAULT 0,
    daily_cost REAL NOT NULL DEFAULT 0,
    rating INTEGER,
    note TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    ai_valuation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trash (
    asset_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    asset_data TEXT NOT NULL,
    deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
  CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_trash_user_id ON trash(user_id);
  CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
  CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);
`)

// 为已有用户补 invite_code（如果不存在）
function addInviteCodeIfNeeded() {
  const cols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name)
  if (!cols.includes("invite_code")) {
    try {
      db.exec("ALTER TABLE users ADD COLUMN invite_code TEXT UNIQUE")
      // 为已存在用户生成邀请码
      const users = db.prepare("SELECT id FROM users WHERE invite_code IS NULL").all()
      users.forEach(u => {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase()
        db.prepare("UPDATE users SET invite_code = ? WHERE id = ?").run(code, u.id)
      })
    } catch (e) {
      console.error("Warning: Failed to add invite_code column:", e.message)
    }
  }
  if (!cols.includes("invited_by")) {
    try {
      db.exec("ALTER TABLE users ADD COLUMN invited_by TEXT REFERENCES users(id)")
    } catch (e) {
      console.error("Warning: Failed to add invited_by column:", e.message)
    }
  }
}

addInviteCodeIfNeeded()

const columns = db.prepare("PRAGMA table_info(assets)").all().map(c => c.name)
if (!columns.includes("tags")) {
  try {
    db.exec("ALTER TABLE assets ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'")
  } catch (e) {
    console.error("Warning: Failed to add tags column:", e.message)
  }
}

export default db
