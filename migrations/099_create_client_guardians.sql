-- G Phase: 보호자 다중 연락처 (기존 컬럼 유지 + 신규 테이블 병행)

CREATE TABLE IF NOT EXISTS client_guardians (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  relationship     TEXT NOT NULL CONSTRAINT client_guardians_relationship_check
                     CHECK (relationship IN (
                       '부모', '배우자', '자녀', '형제자매',
                       '법정후견인', '요양보호사', '사회복지사', '활동지원사', '기타'
                     )),
  phone            TEXT,
  email            TEXT,
  is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_guardians_client ON client_guardians(client_id);
CREATE INDEX IF NOT EXISTS idx_client_guardians_primary ON client_guardians(client_id, is_primary) WHERE is_primary = TRUE;

ALTER TABLE client_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read guardians"   ON client_guardians FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff can insert guardians" ON client_guardians FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff can update guardians" ON client_guardians FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff can delete guardians" ON client_guardians FOR DELETE TO authenticated USING (true);

CREATE TRIGGER client_guardians_updated_at
  BEFORE UPDATE ON client_guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
