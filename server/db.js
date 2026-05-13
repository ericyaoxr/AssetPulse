import Database from "better-sqlite3"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data")

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, "assetpulse.db")

const db = new Database(DB_PATH)

db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
`)

export default db
