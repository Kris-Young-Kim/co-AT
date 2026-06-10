-- Migration: 080_create_banners
-- App: web + admin
-- Created: 2026-06-10
-- Purpose: 웹 배너 팝업 관리 테이블

CREATE TABLE IF NOT EXISTS banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content     TEXT,
  image_url   TEXT,
  link_url    TEXT,
  link_label  TEXT DEFAULT '자세히 보기',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  start_at    TIMESTAMPTZ,
  end_at      TIMESTAMPTZ,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Public can read active banners within date range
CREATE POLICY "banners_public_select" ON banners
  FOR SELECT USING (
    is_active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at   IS NULL OR end_at   >= now())
  );

-- Staff/admin can do everything
CREATE POLICY "banners_staff_all" ON banners
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_banners_is_active ON banners (is_active);
CREATE INDEX idx_banners_start_at  ON banners (start_at);
CREATE INDEX idx_banners_end_at    ON banners (end_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS banners_updated_at ON banners;
CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
