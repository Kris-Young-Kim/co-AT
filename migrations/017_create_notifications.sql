-- 실시간 알림 시스템 테이블 생성
-- 실행일: 2025-01-27
-- 설명: 실시간 알림 시스템을 위한 테이블 (Supabase Realtime 활용)

-- 1. notifications 테이블 (알림 메시지)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 수신자 정보
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- null이면 브로드캐스트 (비로그인 사용자용)
  clerk_user_id TEXT, -- Clerk 사용자 ID (빠른 조회용)
  
  -- 알림 내용
  type TEXT NOT NULL CHECK (type IN (
    'info',           -- 정보
    'success',        -- 성공
    'warning',        -- 경고
    'error',          -- 오류
    'rental_expiry',  -- 대여 만료
    'application',    -- 신청 관련
    'schedule',       -- 일정 관련
    'system',         -- 시스템 알림
    'broadcast'       -- 브로드캐스트 (공지사항 등)
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT, -- 클릭 시 이동할 URL
  
  -- 알림 상태
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  read_at TIMESTAMPTZ, -- 읽은 시간
  
  -- 만료 및 우선순위
  expires_at TIMESTAMPTZ, -- 만료 시간 (null이면 만료 없음)
  priority INTEGER DEFAULT 0, -- 우선순위 (높을수록 중요)
  
  -- 메타데이터
  metadata JSONB, -- 추가 데이터 (알림 타입별 커스텀 정보)
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. notification_preferences 테이블 (사용자별 알림 설정)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clerk_user_id TEXT, -- Clerk 사용자 ID (빠른 조회용)
  
  -- 채널별 설정
  channel TEXT NOT NULL CHECK (channel IN ('web', 'email', 'webhook')),
  enabled BOOLEAN DEFAULT true,
  
  -- 타입별 설정 (선택사항)
  type_filter TEXT[], -- 특정 타입만 받기 (null이면 모든 타입)
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 사용자별 채널은 유일해야 함
  UNIQUE(user_id, channel)
);

-- 3. notification_logs 테이블 (알림 발송 로그)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- 발송 정보
  channel TEXT NOT NULL CHECK (channel IN ('web', 'email', 'webhook')),
  recipient TEXT, -- 수신자 (이메일 주소, Webhook URL 등)
  
  -- 발송 결과
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT, -- 실패 시 에러 메시지
  response_code INTEGER, -- HTTP 응답 코드
  retry_count INTEGER DEFAULT 0, -- 재시도 횟수
  
  -- 메타데이터
  metadata JSONB, -- 발송 시 추가 정보
  
  -- 타임스탬프
  sent_at TIMESTAMPTZ, -- 발송 시도 시간
  delivered_at TIMESTAMPTZ, -- 전달 확인 시간 (있는 경우)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_clerk_user_id ON notifications(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- 복합 인덱스 (사용자별 미읽음 알림 조회)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, status, created_at DESC) WHERE status = 'unread';
CREATE INDEX IF NOT EXISTS idx_notifications_broadcast ON notifications(user_id, type, created_at DESC) WHERE user_id IS NULL;

-- notification_preferences 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_clerk_user_id ON notification_preferences(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_channel ON notification_preferences(channel);

-- notification_logs 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- Realtime 활성화 (Supabase Realtime으로 알림 구독 가능)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE notifications IS '실시간 알림 메시지 테이블 (Supabase Realtime 활용)';
COMMENT ON COLUMN notifications.user_id IS '수신자 ID (null이면 브로드캐스트 알림)';
COMMENT ON COLUMN notifications.type IS '알림 타입: info, success, warning, error, rental_expiry, application, schedule, system, broadcast';
COMMENT ON COLUMN notifications.status IS '알림 상태: unread(읽지 않음), read(읽음), archived(보관됨)';
COMMENT ON COLUMN notifications.expires_at IS '만료 시간 (null이면 만료 없음)';

COMMENT ON TABLE notification_preferences IS '사용자별 알림 설정 테이블';
COMMENT ON COLUMN notification_preferences.channel IS '알림 채널: web(웹 인앱), email(이메일), webhook(웹훅)';

COMMENT ON TABLE notification_logs IS '알림 발송 로그 테이블';
COMMENT ON COLUMN notification_logs.status IS '발송 상태: pending(대기), sent(발송됨), failed(실패), delivered(전달됨)';
