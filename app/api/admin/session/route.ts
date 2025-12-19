import { auth } from "@clerk/nextjs/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * 관리자 세션 쿠키 설정
 * POST: 관리자 로그인 후 세션 쿠키 설정
 * GET: 관리자 세션 쿠키 확인
 * DELETE: 관리자 세션 쿠키 삭제 (로그아웃)
 */
export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      )
    }

    // 권한 확인
    console.log("[Admin Session] 권한 확인 시작 - userId:", userId)
    const hasPermission = await hasAdminOrStaffPermission()
    console.log("[Admin Session] 권한 확인 결과:", hasPermission)
    
    if (!hasPermission) {
      // 더 자세한 정보를 위해 역할 확인
      const { getCurrentUserRole } = await import("@/lib/utils/permissions")
      const role = await getCurrentUserRole()
      console.log("[Admin Session] 현재 사용자 역할:", role)
      
      return NextResponse.json(
        { 
          error: "관리자 권한이 없습니다",
          details: `현재 역할: ${role || "없음"}. 관리자 권한을 얻으려면 역할이 "manager", "staff", 또는 "admin"이어야 합니다.`,
          userId,
        },
        { status: 403 }
      )
    }

    // 관리자 세션 쿠키 설정
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24시간
      path: '/',
    })

    return NextResponse.json({ 
      success: true,
      message: "관리자 세션이 설정되었습니다"
    })
  } catch (error) {
    console.error("관리자 세션 설정 실패:", error)
    return NextResponse.json(
      { error: "세션 설정에 실패했습니다" },
      { status: 500 }
    )
  }
}

/**
 * 관리자 세션 쿠키 확인
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')?.value
    
    if (!adminSession) {
      return NextResponse.json({
        hasAdminSession: false,
        message: "관리자 세션이 없습니다"
      })
    }

    // 세션이 있으면 권한도 확인
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        hasAdminSession: false,
        message: "로그인이 필요합니다"
      })
    }

    const hasPermission = await hasAdminOrStaffPermission()
    
    return NextResponse.json({
      hasAdminSession: true,
      hasPermission,
      message: hasPermission ? "관리자 세션이 유효합니다" : "권한이 없습니다"
    })
  } catch (error) {
    console.error("관리자 세션 확인 실패:", error)
    return NextResponse.json(
      { error: "세션 확인에 실패했습니다" },
      { status: 500 }
    )
  }
}

/**
 * 관리자 세션 쿠키 삭제 (로그아웃)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')

    return NextResponse.json({
      success: true,
      message: "관리자 세션이 삭제되었습니다"
    })
  } catch (error) {
    console.error("관리자 세션 삭제 실패:", error)
    return NextResponse.json(
      { error: "세션 삭제에 실패했습니다" },
      { status: 500 }
    )
  }
}

