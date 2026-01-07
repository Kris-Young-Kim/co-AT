-- 감사 로그 테이블 생성
-- 실행일: 2025-01-27
-- 설명: 모든 데이터 변경 이력을 추적하는 감사 로그 테이블

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 이벤트 정보
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view', 'export')),
  table_name TEXT NOT NULL, -- 변경된 테이블명
  record_id UUID, -- 변경된 레코드 ID
  
  -- 사용자 정보
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- 변경한 사용자
  clerk_user_id TEXT, -- Clerk 사용자 ID
  user_role TEXT, -- 사용자 역할 (user, staff, manager)
  ip_address TEXT, -- IP 주소
  user_agent TEXT, -- User Agent
  
  -- 변경 내용
  old_values JSONB, -- 변경 전 값 (update, delete 시)
  new_values JSONB, -- 변경 후 값 (create, update 시)
  changed_fields TEXT[], -- 변경된 필드 목록 (update 시)
  
  -- 컨텍스트 정보
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL, -- 관련 신청서 ID
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- 관련 고객 ID
  request_path TEXT, -- 요청 경로
  request_method TEXT, -- HTTP 메서드
  
  -- 메타데이터
  metadata JSONB, -- 추가 메타데이터
  description TEXT, -- 변경 사항 설명
  
  -- 의심스러운 활동 플래그
  is_suspicious BOOLEAN DEFAULT false, -- 의심스러운 활동 여부
  suspicion_reason TEXT, -- 의심스러운 활동 이유
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clerk_user_id ON audit_logs(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_application_id ON audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON audit_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_is_suspicious ON audit_logs(is_suspicious) WHERE is_suspicious = true;

-- 복합 인덱스 (자주 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_suspicious_created ON audit_logs(is_suspicious, created_at DESC) WHERE is_suspicious = true;

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE audit_logs IS '모든 데이터 변경 이력을 추적하는 감사 로그 테이블';
COMMENT ON COLUMN audit_logs.action_type IS '액션 타입: create(생성), update(수정), delete(삭제), view(조회), export(내보내기)';
COMMENT ON COLUMN audit_logs.table_name IS '변경된 테이블명 (applications, clients, inventory 등)';
COMMENT ON COLUMN audit_logs.old_values IS '변경 전 값 (JSON 형식, update/delete 시)';
COMMENT ON COLUMN audit_logs.new_values IS '변경 후 값 (JSON 형식, create/update 시)';
COMMENT ON COLUMN audit_logs.changed_fields IS '변경된 필드 목록 (update 시)';
COMMENT ON COLUMN audit_logs.is_suspicious IS '의심스러운 활동 여부: true일 경우 추가 조사 필요';
COMMENT ON COLUMN audit_logs.suspicion_reason IS '의심스러운 활동 이유 (예: 대량 삭제, 비정상적인 시간대 수정 등)';

-- 감사 로그 보관 정책 (1년 후 자동 삭제 또는 아카이빙)
-- 이는 애플리케이션 레벨에서 관리하거나 스케줄러로 자동 삭제
