import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSlowQueryLogs } from "@/lib/utils/query-logger"
import { hasAdminOrStaffPermission } from "@co-at/auth"

/**
 * 데이터베이스 모니터링 정보 조회
 * - 느린 쿼리 로그
 * - 연결 풀 상태 (Supabase가 직접 제공하지 않으므로 기본 정보만)
 */
export async function GET() {
  try {
    console.log("[DB Monitor] 모니터링 정보 조회 시작")

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      )
    }

    // 느린 쿼리 로그 조회
    const slowQueries = getSlowQueryLogs(50)

    // 데이터베이스 연결 테스트 (간접 확인 - 연결 풀 상태 확인)
    const supabase = await createClient()
    const connectionTestStart = Date.now()

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    const connectionLatency = Date.now() - connectionTestStart

    // 연결 풀 상태 추정 (실제 Supabase의 연결 풀 정보는 직접 제공하지 않음)
    const poolStatus = {
      connected: !error,
      latency: connectionLatency,
      status: error ? "error" : connectionLatency > 1000 ? "slow" : "healthy",
      error: error?.message,
    }

    const response = {
      slowQueries: {
        count: slowQueries.length,
        threshold: "1000ms",
        logs: slowQueries,
      },
      connectionPool: poolStatus,
      timestamp: new Date().toISOString(),
    }

    console.log("[DB Monitor] 모니터링 정보 조회 성공:", {
      slowQueriesCount: slowQueries.length,
      connectionStatus: poolStatus.status,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("[DB Monitor] 모니터링 정보 조회 실패:", error)
    return NextResponse.json(
      { error: "모니터링 정보 조회에 실패했습니다", details: String(error) },
      { status: 500 }
    )
  }
}
