-- AssetPulse Supabase 数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 资产表
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  category TEXT NOT NULL DEFAULT '其他',
  location TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  purchase_date TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  end_date TEXT,
  recycle_amount NUMERIC,
  target_daily_cost NUMERIC,
  effective_days INTEGER NOT NULL DEFAULT 0,
  daily_cost NUMERIC NOT NULL DEFAULT 0,
  rating INTEGER,
  note TEXT NOT NULL DEFAULT '',
  ai_valuation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 回收站表
CREATE TABLE IF NOT EXISTS trash (
  asset_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE(user_id, name)
);

-- 位置表
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE(user_id, name)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(user_id, category);
CREATE INDEX IF NOT EXISTS idx_trash_user_id ON trash(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);

-- 关闭 RLS（使用 anon key + 应用层 userId 过滤，无需 Supabase Auth）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE trash ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 允许 anon 角色完整访问（应用层通过 user_id 过滤数据隔离）
CREATE POLICY "Allow anon full access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access to assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access to trash" ON trash FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access to locations" ON locations FOR ALL USING (true) WITH CHECK (true);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
