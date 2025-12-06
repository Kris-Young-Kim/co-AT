-- schedules 테이블 생성
-- 실행일: 2025-01-XX
-- 설명: 일정 관리 테이블 (방문, 상담, 평가, 배송, 픽업 등)

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  staff_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- 일정 정보
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('visit', 'consult', 'assessment', 'delivery', 'pickup')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  address TEXT, -- 방문 주소
  
  -- 일정 메모 및 상태
  notes TEXT, -- 일정 메모
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_schedules_application_id ON schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_schedules_staff_id ON schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedules_client_id ON schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_date ON schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_schedule_type ON schedules(schedule_type);

-- 복합 인덱스 (일정 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_schedules_date_status ON schedules(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_schedules_staff_date ON schedules(staff_id, scheduled_date);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE schedules IS '일정 관리 테이블 (방문, 상담, 평가, 배송, 픽업 등)';
COMMENT ON COLUMN schedules.schedule_type IS '일정 유형: visit(방문), consult(상담), assessment(평가), delivery(배송), pickup(픽업)';
COMMENT ON COLUMN schedules.status IS '일정 상태: scheduled(예정), completed(완료), cancelled(취소)';

