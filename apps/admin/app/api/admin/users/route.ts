import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { hasManagerPermission } from "@co-at/auth"

/**
 * 모든 ?�용??목록 조회 (admin, manager�??�근 가??
 */
export async function GET() {
  try {
    const hasPermission = await hasManagerPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "관리자 ?�는 매니?� 권한???�요?�니?? },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, clerk_user_id, email, full_name, role, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Admin Users] ?�용??목록 조회 ?�패:", error)
      return NextResponse.json(
        { 
          error: "?�용??목록 조회 ?�패", 
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
    console.error("[Admin Users] ?�외 발생:", error)
    return NextResponse.json(
      { 
        error: "?�상�?못한 ?�류가 발생?�습?�다", 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

