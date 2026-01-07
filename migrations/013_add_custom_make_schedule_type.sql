-- schedules 테이블의 schedule_type에 custom_make 추가
-- 실행일: 2025-01-27
-- 설명: 맞춤제작 일정을 캘린더에 표시하기 위해 schedule_type 확장

-- 기존 CHECK 제약조건 삭제
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_schedule_type_check;

-- 새로운 CHECK 제약조건 추가 (custom_make 포함)
ALTER TABLE schedules 
ADD CONSTRAINT schedules_schedule_type_check 
CHECK (schedule_type IN ('visit', 'consult', 'assessment', 'delivery', 'pickup', 'exhibition', 'education', 'custom_make'));

-- 코멘트 업데이트
COMMENT ON COLUMN schedules.schedule_type IS '일정 유형: visit(방문), consult(상담), assessment(평가), delivery(배송), pickup(픽업), exhibition(견학), education(교육), custom_make(맞춤제작)';
