-- profiles 테이블의 role CHECK 제약조건에 'admin' 추가
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 기존 제약조건 삭제
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 새로운 제약조건 추가 (admin 포함)
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['user'::text, 'staff'::text, 'manager'::text, 'admin'::text]));

