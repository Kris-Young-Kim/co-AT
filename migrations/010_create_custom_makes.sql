-- 맞춤제작 관리 시스템 테이블 생성
-- 실행일: 2025-01-XX
-- 설명: 맞춤제작 프로젝트 관리 테이블 (3D프린터, CNC 등 활용)
-- 주의: equipment 테이블을 먼저 생성해야 custom_makes 테이블의 외래 키가 정상 작동합니다.

-- 1. equipment 테이블 생성 (장비 관리) - 먼저 생성 필요
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 장비 기본 정보
  name TEXT NOT NULL, -- 장비명 (예: "3D프린터 #1", "CNC 밀링 #2")
  type TEXT NOT NULL CHECK (type IN ('3d_printer', 'cnc', 'laser_cutter', '3d_scanner', 'other')),
  manufacturer TEXT, -- 제조사
  model TEXT, -- 모델명
  serial_number TEXT, -- 시리얼 번호
  
  -- 장비 상태
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'broken', 'reserved')),
  
  -- 장비 사양
  specifications JSONB, -- 장비 사양 (최대 크기, 재료 지원 등)
  
  -- 위치 및 관리
  location TEXT, -- 장비 위치
  manager_id UUID REFERENCES profiles(id), -- 관리 담당자
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. custom_makes 테이블 생성 (맞춤제작 프로젝트 관리)
CREATE TABLE IF NOT EXISTS custom_makes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 관련 정보
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES profiles(id),
  
  -- 제작 품목 정보
  item_name TEXT NOT NULL, -- 제작 품목명
  item_description TEXT, -- 제작 품목 상세 설명
  specifications TEXT, -- 제작 사양 (치수, 재료 등)
  measurements JSONB, -- 신체 치수 측정 데이터
  design_files TEXT[], -- 설계 파일 URL 배열 (STL, CAD 등)
  reference_images TEXT[], -- 참고 이미지 URL 배열
  
  -- 제작 진행도
  progress_status TEXT DEFAULT 'design' CHECK (progress_status IN ('design', 'manufacturing', 'inspection', 'delivery', 'completed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- 장비 정보
  equipment_id UUID REFERENCES equipment(id), -- 사용 장비 (3D프린터, CNC 등)
  equipment_type TEXT, -- 장비 타입 ('3d_printer', 'cnc', 'laser_cutter', 'other')
  
  -- 일정 정보
  design_start_date DATE, -- 설계 시작일
  manufacturing_start_date DATE, -- 제작 시작일
  expected_completion_date DATE, -- 예상 완료일
  actual_completion_date DATE, -- 실제 완료일
  delivery_date DATE, -- 납품일
  
  -- 비용 정보
  cost_total NUMERIC, -- 총 제작 비용
  cost_materials NUMERIC, -- 재료비
  cost_labor NUMERIC, -- 인건비
  cost_equipment NUMERIC, -- 장비 사용료
  cost_other NUMERIC, -- 기타 비용
  
  -- 제작 결과
  manufacturing_notes TEXT, -- 제작 과정 메모
  inspection_notes TEXT, -- 검수 메모
  delivery_notes TEXT, -- 납품 메모
  result_images TEXT[], -- 완성품 사진 URL 배열
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. custom_make_progress 테이블 생성 (진행도 이력)
CREATE TABLE IF NOT EXISTS custom_make_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 관련 정보
  custom_make_id UUID NOT NULL REFERENCES custom_makes(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id), -- 작업자
  
  -- 진행도 정보
  progress_status TEXT NOT NULL CHECK (progress_status IN ('design', 'manufacturing', 'inspection', 'delivery', 'completed', 'cancelled')),
  progress_percentage INTEGER NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- 진행 내용
  notes TEXT, -- 진행 메모
  images TEXT[], -- 진행 단계별 사진
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);

CREATE INDEX IF NOT EXISTS idx_custom_makes_application_id ON custom_makes(application_id);
CREATE INDEX IF NOT EXISTS idx_custom_makes_client_id ON custom_makes(client_id);
CREATE INDEX IF NOT EXISTS idx_custom_makes_progress_status ON custom_makes(progress_status);
CREATE INDEX IF NOT EXISTS idx_custom_makes_equipment_id ON custom_makes(equipment_id);
CREATE INDEX IF NOT EXISTS idx_custom_makes_expected_completion_date ON custom_makes(expected_completion_date);

CREATE INDEX IF NOT EXISTS idx_custom_make_progress_custom_make_id ON custom_make_progress(custom_make_id);
CREATE INDEX IF NOT EXISTS idx_custom_make_progress_created_at ON custom_make_progress(created_at);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE equipment IS '제작 장비 관리 테이블 (3D프린터, CNC 등)';
COMMENT ON COLUMN equipment.type IS '장비 타입: 3d_printer(3D프린터), cnc(CNC), laser_cutter(레이저 커터), 3d_scanner(3D 스캐너), other(기타)';
COMMENT ON COLUMN equipment.status IS '장비 상태: available(사용가능), in_use(사용중), maintenance(점검중), broken(고장), reserved(예약됨)';

COMMENT ON TABLE custom_makes IS '맞춤제작 프로젝트 관리 테이블';
COMMENT ON COLUMN custom_makes.progress_status IS '진행 상태: design(설계), manufacturing(제작), inspection(검수), delivery(납품), completed(완료), cancelled(취소)';
COMMENT ON COLUMN custom_makes.equipment_type IS '장비 타입: 3d_printer(3D프린터), cnc(CNC), laser_cutter(레이저 커터), other(기타)';

COMMENT ON TABLE custom_make_progress IS '맞춤제작 진행도 이력 테이블';
