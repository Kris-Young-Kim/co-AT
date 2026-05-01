import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { hasManagerPermission } from "@/lib/utils/permissions"

/**
 * 모든 사용자 목록 조회 (admin, manager만 접근 가능)
 */
export async function GET() {
  try {
    const hasPermission = await hasManagerPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "관리자 또는 매니저 권한이 필요합니다" },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, clerk_user_id, email, full_name, role, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Admin Users] 사용자 목록 조회 실패:", error)
      return NextResponse.json(
        { 
          error: "사용자 목록 조회 실패", 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      users: profiles || [] 
    })
  } catch (error) {
    console.error("[Admin Users] 예외 발생:", error)
    return NextResponse.json(
      { 
        error: "예상치 못한 오류가 발생했습니다", 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

