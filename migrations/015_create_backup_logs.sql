-- 백업 로그 테이블 생성
-- 실행일: 2025-01-27
-- 설명: 재해 복구 계획을 위한 백업 이력 관리 테이블

CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 백업 정보
  backup_type TEXT NOT NULL CHECK (backup_type IN ('daily', 'weekly', 'monthly', 'manual')),
  backup_name TEXT NOT NULL, -- 백업 파일명 또는 식별자
  backup_size_bytes BIGINT, -- 백업 파일 크기 (bytes)
  
  -- 백업 대상
  tables_count INTEGER, -- 백업된 테이블 수
  records_count BIGINT, -- 백업된 레코드 수
  
  -- 백업 상태
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT, -- 실패 시 에러 메시지
  
  -- 저장 위치
  storage_location TEXT, -- Supabase Storage 경로 또는 외부 저장소 URL
  storage_type TEXT CHECK (storage_type IN ('supabase_storage', 'external', 'local')),
  
  -- 메타데이터
  metadata JSONB, -- 추가 메타데이터 (백업 범위, 설정 등)
  
  -- 타임스탬프
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- 백업 보관 만료일 (월간 백업은 더 오래 보관)
  
  -- 복구 테스트 정보
  restore_tested_at TIMESTAMPTZ, -- 마지막 복구 테스트 일시
  restore_test_status TEXT CHECK (restore_test_status IN ('passed', 'failed', 'not_tested')),
  restore_test_notes TEXT -- 복구 테스트 결과 메모
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_backup_logs_type ON backup_logs(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_started_at ON backup_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_expires_at ON backup_logs(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_backup_logs_restore_test_status ON backup_logs(restore_test_status);

-- 복합 인덱스 (백업 타입별 최신 백업 조회)
CREATE INDEX IF NOT EXISTS idx_backup_logs_type_started ON backup_logs(backup_type, started_at DESC);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE backup_logs IS '백업 이력 관리 테이블 (재해 복구 계획용)';
COMMENT ON COLUMN backup_logs.backup_type IS '백업 타입: daily(일일), weekly(주간), monthly(월간), manual(수동)';
COMMENT ON COLUMN backup_logs.status IS '백업 상태: pending(대기), in_progress(진행중), completed(완료), failed(실패)';
COMMENT ON COLUMN backup_logs.storage_type IS '저장소 타입: supabase_storage(Supabase Storage), external(외부 저장소), local(로컬)';
COMMENT ON COLUMN backup_logs.restore_test_status IS '복구 테스트 상태: passed(통과), failed(실패), not_tested(미테스트)';

-- 백업 보관 정책 (월간 백업은 1년, 주간 백업은 3개월, 일일 백업은 1개월)
-- 이는 애플리케이션 레벨에서 관리하거나 스케줄러로 자동 삭제
