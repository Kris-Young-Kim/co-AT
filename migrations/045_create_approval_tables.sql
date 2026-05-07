-- migrations/041_create_approval_tables.sql

-- ============================================================
-- approval_signatures — 직원별 서명 이미지 (1인 1개)
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_signatures (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   text        UNIQUE NOT NULL,
  image_url       text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- approval_documents — 결재 문서 본체
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL CHECK (type IN ('expenditure', 'leave', 'business_report')),
  title       text        NOT NULL,
  content     jsonb       NOT NULL DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_by  text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- approval_steps — 결재 단계 (문서당 2개 행: step=1 팀장, step=2 센터장)
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_steps (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     uuid        NOT NULL REFERENCES approval_documents(id) ON DELETE CASCADE,
  step            int         NOT NULL CHECK (step IN (1, 2)),
  approver_role   text        NOT NULL CHECK (approver_role IN ('manager', 'admin')),
  acted_by        text,
  status          text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  signature_url   text,
  comment         text,
  acted_at        timestamptz,
  UNIQUE (document_id, step)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS approval_documents_created_by_idx ON approval_documents(created_by);
CREATE INDEX IF NOT EXISTS approval_documents_status_idx     ON approval_documents(status);
CREATE INDEX IF NOT EXISTS approval_steps_document_id_idx    ON approval_steps(document_id);

-- ============================================================
-- RLS (service_role bypasses RLS for all writes)
-- ============================================================
ALTER TABLE approval_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_approval_signatures"
  ON approval_signatures FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_approval_documents"
  ON approval_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_approval_steps"
  ON approval_steps FOR ALL TO service_role USING (true) WITH CHECK (true);
