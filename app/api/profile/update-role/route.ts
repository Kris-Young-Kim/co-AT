import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

/**
 * 현재 사용자의 프로필 역할을 업데이트하는 API
 * 테스트/개발용으로만 사용하세요
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { role } = body

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
      .eq("clerk_user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("[Profile Update] 역할 업데이트 실패:", error)
      return NextResponse.json(
        { 
          error: "역할 업데이트에 실패했습니다", 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    console.log("[Profile Update] 역할 업데이트 성공:", updatedProfile)

    return NextResponse.json({
      success: true,
      message: `역할이 "${role}"로 업데이트되었습니다`,
      profile: updatedProfile,
    })
  } catch (error) {
    console.error("[Profile Update] 예외 발생:", error)
    return NextResponse.json(
      { 
        error: "예상치 못한 오류가 발생했습니다", 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

