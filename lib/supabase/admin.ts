/**
 * Supabase Admin Client (서비스 역할용)
 * RLS를 우회하여 사용하는 서버 사이드 전용 클라이언트
 * 프로필 생성 등 관리 작업에만 사용하세요
 */
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

