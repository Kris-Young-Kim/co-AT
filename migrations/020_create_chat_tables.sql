-- migrations/020_create_chat_tables.sql

-- 채널 (공개/비공개)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'channel',
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 채널 멤버
CREATE TABLE IF NOT EXISTS chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, clerk_user_id)
);

-- 메시지
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  mentions TEXT[] DEFAULT '{}',
  reply_to_id UUID REFERENCES chat_messages(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 읽음 표시
CREATE TABLE IF NOT EXISTS chat_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, clerk_user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(clerk_user_id);

-- 전문 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_fts
  ON chat_messages USING gin(to_tsvector('simple', coalesce(content, '')));

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

CREATE TRIGGER trg_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

-- RLS 활성화
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reads ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "staff_full_access_rooms" ON chat_rooms
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "staff_full_access_members" ON chat_room_members
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "staff_full_access_messages" ON chat_messages
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "staff_full_access_reads" ON chat_message_reads
  FOR ALL USING (auth.role() = 'authenticated');

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_message_reads;

-- 기본 전체 채팅방 생성
INSERT INTO chat_rooms (name, description, type, is_private, created_by)
VALUES ('전체', '전체 직원 채팅방', 'channel', false, 'system')
ON CONFLICT DO NOTHING;
