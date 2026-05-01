import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { hasManagerPermission } from "@/lib/utils/permissions"

/**
 * 특정 사용자의 역할 변경 (admin, manager만 접근 가능)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasPermission = await hasManagerPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "관리자 또는 매니저 권한이 필요합니다" },
        { status: 403 }
      )
    }

    const { id } = await params
    const { role } = await req.json()

    if (!role || !["user", "staff", "manager", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "유효한 역할을 지정해주세요 (user, staff, manager, admin)" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 프로필 업데이트
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Admin Users] 역할 업데이트 실패:", error)
      return NextResponse.json(
        { 
          error: "역할 업데이트에 실패했습니다", 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    console.log("[Admin Users] 역할 업데이트 성공:", updatedProfile)

    return NextResponse.json({
      success: true,
      message: `역할이 "${role}"로 변경되었습니다`,
      profile: updatedProfile,
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

