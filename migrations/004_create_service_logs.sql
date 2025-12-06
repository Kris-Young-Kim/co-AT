-- service_logs 테이블 생성
-- 실행일: 2025-01-XX
-- 설명: 실제 서비스 제공 시 상세 기록 저장 (수리, 제작, 대여, 교육 등)
-- 참고: 상담 기록지(첨부 19), 서비스 진행 기록지(첨부 20), 평가지(첨부 21) 양식 반영

CREATE TABLE IF NOT EXISTS service_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id),
  inventory_id UUID REFERENCES inventory(id),
  
  -- 서비스 기본 정보
  service_date DATE DEFAULT CURRENT_DATE,
  service_type TEXT, -- 'repair' | 'custom_make' | 'rental' | 'education' | 'maintenance' | 'inspection' | 'cleaning' | 'reuse' | 'other'
  service_area TEXT, -- 서비스 영역 (상담 기록지, 평가지 참고)
  
  -- 지원 구분 (서비스 진행 기록지 참고)
  funding_source TEXT, -- 'public' | 'private' | 'center' | 'other'
  funding_detail TEXT, -- 상세 재원 정보 (보조기기교부사업, 보장구 등)
  
  -- 작업 내용
  work_type TEXT, -- 'consult_assessment' | 'trial' | 'info' | 'rental' | 'education' | 'modify_make' | 'funding' | 'maintenance' | 'close' | 'aftercare' | 'case_meeting'
  item_name TEXT, -- 품목명
  work_description TEXT, -- 작업 내용 설명
  work_result TEXT, -- 작업 결과
  
  -- 비용 정보 (수리/제작 시)
  cost_total NUMERIC, -- 총 비용
  cost_materials NUMERIC, -- 재료비
  cost_labor NUMERIC, -- 인건비
  cost_other NUMERIC, -- 기타 비용
  
  -- 이미지 (작업 전/후 사진)
  images_before TEXT[], -- 작업 전 사진 URL 배열
  images_after TEXT[], -- 작업 후 사진 URL 배열
  
  -- 비고 및 메모
  remarks TEXT, -- 비고
  notes TEXT, -- 추가 메모
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_service_logs_application_id ON service_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_staff_id ON service_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_inventory_id ON service_logs(inventory_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_service_date ON service_logs(service_date);
CREATE INDEX IF NOT EXISTS idx_service_logs_service_type ON service_logs(service_type);

-- updated_at 자동 업데이트 트리거 함수 (이미 존재할 수 있으므로 IF NOT EXISTS 사용 불가)
-- 필요시 별도로 생성

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE service_logs IS '서비스 제공 상세 기록 (수리, 제작, 대여, 교육 등)';
COMMENT ON COLUMN service_logs.service_type IS '서비스 유형: repair(수리), custom_make(맞춤제작), rental(대여), education(교육), maintenance(유지관리), inspection(점검), cleaning(소독), reuse(재사용), other(기타)';
COMMENT ON COLUMN service_logs.funding_source IS '지원 구분: public(공적급여), private(민간급여), center(센터지원), other(기타)';
COMMENT ON COLUMN service_logs.work_type IS '작업 유형: consult_assessment(상담·평가), trial(시험적용), info(정보제공), rental(대여), education(교육훈련), modify_make(개조제작), funding(재원확보), maintenance(유지관리), close(종결), aftercare(사후관리), case_meeting(사례회의)';

