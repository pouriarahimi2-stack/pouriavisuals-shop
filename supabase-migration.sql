-- ═══════════════════════════════════════════════════
-- اجرا در Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- ۱. جدول لاگ‌های امنیتی
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action     TEXT NOT NULL,
  user_id    TEXT,
  details    JSONB DEFAULT '{}',
  ip_address TEXT,
  severity   TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ۲. جدول دیدگاه‌های محصول
CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating      INT  DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ۳. ستون‌های گمشده جدول customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS email         TEXT,
  ADD COLUMN IF NOT EXISTS username      TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ۴. ستون homepage_layout_config برای site_info
ALTER TABLE site_info
  ADD COLUMN IF NOT EXISTS homepage_layout_config JSONB,
  ADD COLUMN IF NOT EXISTS gemini_api_key         TEXT,
  ADD COLUMN IF NOT EXISTS allow_google_index     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS maintenance_mode       TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS header_announcement    TEXT;

-- ۵. جدول بنرها
CREATE TABLE IF NOT EXISTS banners (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  link_url   TEXT DEFAULT '/products',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ۶. جدول پیام‌ها (اگر messages وجود ندارد)
CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  subject     TEXT,
  message     TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  admin_reply TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ایندکس‌های مهم
CREATE INDEX IF NOT EXISTS idx_customers_phone    ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_banners_active     ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);
