-- schedules 테이블에 'confirmed' (확정) 상태 추가 (간단 버전)
-- 실행일: 2025-01-XX
-- 설명: 일정 상태에 'confirmed' (확정) 옵션 추가

-- 방법 1: 제약 조건 이름을 모를 경우, 모든 status 관련 CHECK 제약 조건 찾기
-- 먼저 다음 쿼리로 제약 조건 이름 확인:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'schedules'::regclass AND contype = 'c';

-- 방법 2: 제약 조건 이름이 'schedules_status_check'인 경우
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_status_check;

-- 방법 3: 제약 조건 이름이 자동 생성된 경우 (예: schedules_status_check1, schedules_status_check 등)
-- 다음 쿼리로 모든 status 관련 CHECK 제약 조건 삭제:
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'schedules'::regclass
          AND contype = 'c'
          AND conname LIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE schedules DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $$;

-- 새로운 CHECK 제약 조건 추가 (confirmed 포함)
ALTER TABLE schedules ADD CONSTRAINT schedules_status_check 
  CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'));

-- 컬럼 코멘트 업데이트
COMMENT ON COLUMN schedules.status IS '일정 상태: scheduled(예정), confirmed(확정), completed(완료), cancelled(취소)';
