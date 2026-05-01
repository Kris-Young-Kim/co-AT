import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

/**
 * 보안 이벤트 조회 API
 * GET /api/security/events?severity=high&limit=50&type=sql_injection
 */
export async function GET(request: Request) {
  try {
    console.log("[Security Events API] 보안 이벤트 조회")

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const severity = searchParams.get("severity") as "low" | "medium" | "high" | "critical" | null
    const eventType = searchParams.get("type") as string | null
    const ipAddress = searchParams.get("ip") as string | null
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const blocked = searchParams.get("blocked") === "true" ? true : searchParams.get("blocked") === "false" ? false : null

    const supabase = await createClient()

    // 보안 로그 조회
    let query = supabase
      .from("security_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq("severity", severity)
    }

    if (eventType) {
      query = query.eq("event_type", eventType)
    }

    if (ipAddress) {
      query = query.eq("ip_address", ipAddress)
    }

    if (blocked !== null) {
      query = query.eq("blocked", blocked)
    }

    const { data: events, error } = await query

    if (error) {
      console.error("[Security Events API] 보안 로그 조회 실패:", error)
      return NextResponse.json(
        { error: "보안 로그 조회에 실패했습니다", details: error.message },
        { status: 500 }
      )
    }

    // 통계 정보 계산
    const stats = {
      total: events?.length || 0,
      bySeverity: {
        critical: events?.filter((e: any) => e.severity === "critical").length || 0,
        high: events?.filter((e: any) => e.severity === "high").length || 0,
        medium: events?.filter((e: any) => e.severity === "medium").length || 0,
        low: events?.filter((e: any) => e.severity === "low").length || 0,
      },
      byType: {
        login_attempt: events?.filter((e: any) => e.event_type === "login_attempt").length || 0,
        login_success: events?.filter((e: any) => e.event_type === "login_success").length || 0,
        login_failure: events?.filter((e: any) => e.event_type === "login_failure").length || 0,
        sql_injection: events?.filter((e: any) => e.event_type === "sql_injection").length || 0,
        xss_attack: events?.filter((e: any) => e.event_type === "xss_attack").length || 0,
        rate_limit_exceeded: events?.filter((e: any) => e.event_type === "rate_limit_exceeded").length || 0,
      },
      blocked: events?.filter((e: any) => e.blocked).length || 0,
      notified: events?.filter((e: any) => e.notified).length || 0,
    }

    console.log("[Security Events API] 보안 이벤트 조회 성공:", stats)

    return NextResponse.json({
      events: events || [],
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Security Events API] 보안 이벤트 조회 실패:", error)
    return NextResponse.json(
      { error: "보안 이벤트 조회에 실패했습니다", details: String(error) },
      { status: 500 }
    )
  }
}
