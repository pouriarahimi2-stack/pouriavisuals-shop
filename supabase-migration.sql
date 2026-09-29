-- اجرا در Supabase SQL Editor
-- رفع مشکل ستون‌های گمشده در جدول customers

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS email       TEXT,
  ADD COLUMN IF NOT EXISTS username    TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ایندکس برای جستجو سریع‌تر
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- اطمینان از اینکه orders هم ستون‌های لازم رو داره
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_ref TEXT,
  ADD COLUMN IF NOT EXISTS paid_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount     NUMERIC DEFAULT 0;

-- banners table
CREATE TABLE IF NOT EXISTS banners (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  link_url    TEXT DEFAULT '/products',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
