-- schedules 테이블의 schedule_type에 exhibition과 education 추가
-- 실행일: 2025-12-19
-- 설명: 공개 캘린더에서 견학 및 교육 일정을 표시하기 위해 schedule_type 확장

-- 기존 CHECK 제약조건 삭제
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_schedule_type_check;

-- 새로운 CHECK 제약조건 추가 (exhibition, education 포함)
ALTER TABLE schedules 
ADD CONSTRAINT schedules_schedule_type_check 
CHECK (schedule_type IN ('visit', 'consult', 'assessment', 'delivery', 'pickup', 'exhibition', 'education'));

-- 코멘트 업데이트
COMMENT ON COLUMN schedules.schedule_type IS '일정 유형: visit(방문), consult(상담), assessment(평가), delivery(배송), pickup(픽업), exhibition(견학), education(교육)';

