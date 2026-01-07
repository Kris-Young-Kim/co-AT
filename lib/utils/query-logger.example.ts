/**
 * 쿼리 로거 사용 예시
 * 
 * 이 파일은 예시입니다. 실제 사용 시에는 actions 파일에서 다음과 같이 사용하세요:
 */

import { measureQuery } from "./query-logger"
import { createClient } from "@/lib/supabase/server"

// 예시 1: measureQuery를 사용한 쿼리 측정
export async function exampleWithQueryLogger() {
  const supabase = await createClient()

  // 쿼리 실행 시간 측정
  const result = await measureQuery(
    () => supabase.from("clients").select("*").limit(10),
    {
      query: "SELECT * FROM clients LIMIT 10",
      table: "clients",
      metadata: { limit: 10 },
    }
  )

  return result
}

// 예시 2: 복잡한 쿼리 측정
export async function exampleComplexQuery() {
  const supabase = await createClient()

  const result = await measureQuery(
    async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, clients(*), inventory(*)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    },
    {
      query: "SELECT applications with clients and inventory WHERE status = 'pending'",
      table: "applications",
      metadata: { status: "pending", limit: 50 },
    }
  )

  return result
}
