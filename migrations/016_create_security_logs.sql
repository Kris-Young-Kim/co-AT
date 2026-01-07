-- 보안 로그 테이블 생성
-- 실행일: 2025-01-27
-- 설명: 보안 모니터링 및 위협 탐지를 위한 로그 테이블

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 이벤트 정보
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_attempt',      -- 로그인 시도
    'login_success',     -- 로그인 성공
    'login_failure',     -- 로그인 실패
    'sql_injection',     -- SQL Injection 시도
    'xss_attack',        -- XSS 공격 시도
    'unauthorized_access', -- 무단 접근 시도
    'rate_limit_exceeded', -- Rate Limit 초과
    'suspicious_activity', -- 의심스러운 활동
    'security_alert'      -- 보안 경고
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- 사용자 정보
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- 로그인한 사용자 (있는 경우)
  clerk_user_id TEXT, -- Clerk 사용자 ID
  ip_address TEXT, -- IP 주소
  user_agent TEXT, -- User Agent
  
  -- 요청 정보
  request_path TEXT, -- 요청 경로
  request_method TEXT, -- HTTP 메서드
  request_body TEXT, -- 요청 본문 (민감 정보 제외)
  request_headers JSONB, -- 요청 헤더 (일부만 저장)
  
  -- 탐지 정보
  detected_pattern TEXT, -- 탐지된 패턴 (SQL Injection, XSS 등)
  threat_description TEXT, -- 위협 설명
  blocked BOOLEAN DEFAULT false, -- 차단 여부
  
  -- 메타데이터
  metadata JSONB, -- 추가 메타데이터
  location TEXT, -- 지리적 위치 (IP 기반, 선택사항)
  
  -- 알림 정보
  notified BOOLEAN DEFAULT false, -- 알림 발송 여부
  notification_sent_at TIMESTAMPTZ, -- 알림 발송 일시
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_clerk_user_id ON security_logs(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_blocked ON security_logs(blocked);

-- 복합 인덱스 (심각한 보안 이벤트 조회)
CREATE INDEX IF NOT EXISTS idx_security_logs_critical ON security_logs(severity, created_at DESC) WHERE severity IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_security_logs_notified ON security_logs(notified, created_at DESC) WHERE notified = false;

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE security_logs IS '보안 모니터링 및 위협 탐지 로그 테이블';
COMMENT ON COLUMN security_logs.event_type IS '이벤트 타입: login_attempt(로그인 시도), sql_injection(SQL Injection), xss_attack(XSS 공격) 등';
COMMENT ON COLUMN security_logs.severity IS '심각도: low(낮음), medium(보통), high(높음), critical(치명적)';
COMMENT ON COLUMN security_logs.blocked IS '차단 여부: true일 경우 요청이 차단됨';
COMMENT ON COLUMN security_logs.notified IS '알림 발송 여부: 크리티컬 이벤트는 자동 알림 발송';

-- 보안 로그 보관 정책 (90일 후 자동 삭제 또는 아카이빙)
-- 이는 애플리케이션 레벨에서 관리하거나 스케줄러로 자동 삭제
