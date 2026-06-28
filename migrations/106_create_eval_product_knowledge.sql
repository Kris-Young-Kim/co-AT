-- 106: 품목별 지식베이스 (E-3)
-- 보조기기 제품별 임상 정보, 주의사항, 제조사 연락처 관리

CREATE TABLE IF NOT EXISTS eval_product_knowledge (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name  TEXT NOT NULL UNIQUE,
  category      TEXT,
  manufacturer  TEXT,
  manufacturer_contact TEXT,
  as_info       TEXT,          -- A/S 정보
  cautions      TEXT,          -- 주의사항
  application_notes TEXT,      -- 적용 사례 및 노하우
  contraindications TEXT,      -- 금기 사항
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_eval_product_knowledge_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_eval_product_knowledge_updated_at
  BEFORE UPDATE ON eval_product_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_eval_product_knowledge_updated_at();

-- RLS
ALTER TABLE eval_product_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read product knowledge"
  ON eval_product_knowledge FOR SELECT
  USING (true);

CREATE POLICY "staff write product knowledge"
  ON eval_product_knowledge FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE eval_product_knowledge IS '보조기기 품목별 지식베이스 — 주의사항, 적용 사례, 제조사 정보';
