-- schedules 테이블에 'confirmed' (확정) 상태 추가
-- 실행일: 2025-01-XX
-- 설명: 일정 상태에 'confirmed' (확정) 옵션 추가

-- 기존 CHECK 제약 조건 찾아서 제거
-- PostgreSQL에서 인라인 CHECK 제약 조건은 자동으로 이름이 생성되므로
-- 모든 status 관련 CHECK 제약 조건을 찾아서 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    -- schedules 테이블의 모든 CHECK 제약 조건 중 status 관련 찾기
    FOR r IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'schedules'::regclass
          AND contype = 'c'
          AND (
            conname LIKE '%status%'
            OR EXISTS (
              SELECT 1
              FROM pg_attribute a
              WHERE a.attrelid = conrelid
                AND a.attnum = ANY(conkey)
                AND a.attname = 'status'
            )
          )
    LOOP
        EXECUTE format('ALTER TABLE schedules DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $$;

-- 새로운 CHECK 제약 조건 추가 (confirmed 포함)
ALTER TABLE schedules ADD CONSTRAINT schedules_status_check 
  CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'));

-- 컬럼 코멘트 업데이트
COMMENT ON COLUMN schedules.status IS '일정 상태: scheduled(예정), confirmed(확정), completed(완료), cancelled(취소)';
