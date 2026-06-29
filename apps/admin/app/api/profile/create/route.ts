import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * 현재 로그인한 사용자의 프로필을 자동으로 생성하는 API
 * 테스트 및 개발용으로만 사용하세요
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

    // Clerk에서 사용자 정보 가져오기
    const user = await currentUser()

    if (!user) {
      return NextResponse.json(
        { error: "사용자 정보를 가져올 수 없습니다" },
        { status: 400 }
      )
    }

    // Clerk 메타데이터에서 role 확인
    const clerkRole = (user.publicMetadata?.role as string) ||
                      (user.privateMetadata?.role as string) ||
                      null

    // 프로필 생성에 서비스 역할을 사용하여 RLS 우회
    const supabase = createAdminClient()

    // 이미 프로필이 있는지 확인
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id, role, clerk_user_id")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        {
          error: "프로필 확인 중 오류가 발생했습니다",
          details: checkError.message,
          code: checkError.code,
        },
        { status: 500 }
      )
    }

    if (existingProfile) {

      // 역할이 "user"인 경우 "manager"로 업데이트 안내
      if (existingProfile.role === "user") {
        return NextResponse.json({
          success: false,
          message: "프로필이 이미 존재하지만 역할이 'user'입니다. 관리자 권한이 필요하면 역할을 업데이트하세요",
          profile: existingProfile,
          clerkUserId: userId,
          needsRoleUpdate: true,
        })
      }

      return NextResponse.json({
        success: true,
        message: "프로필이 이미 존재합니다",
        profile: existingProfile,
        clerkUserId: userId,
      })
    }

    // 프로필 생성
    const fullName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || null

    const email = user.emailAddresses?.[0]?.emailAddress || null

    // Clerk 메타데이터의 role에 따라 프로필 role 설정
    const profileRole =
      clerkRole === "admin"
        ? "admin"
        : clerkRole === "staff"
          ? "staff"
          : clerkRole === "manager"
            ? "manager"
            : "user"

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: userId,
        email,
        full_name: fullName,
        role: profileRole,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        {
          error: "프로필 생성에 실패했습니다",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "프로필이 생성되었습니다",
      profile: newProfile,
      clerkUserId: userId,
    })
  } catch (error) {
    console.error("[Profile Create] 예외 발생:", error)
    return NextResponse.json(
      {
        error: "예상치 못한 오류가 발생했습니다",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * 현재 사용자의 Clerk ID와 프로필 상태 확인
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      )
    }

    const user = await currentUser()
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    // PGRST116은 "결과 없음"을 의미하는 정상적인 코드입니다
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({
        clerkUserId: userId,
        clerkUser: {
          id: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
          firstName: user?.firstName,
          lastName: user?.lastName,
        },
        profile: null,
        profileExists: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      clerkUserId: userId,
      clerkUser: {
        id: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      profile: profile || null,
      profileExists: !!profile,
      error: null,
    })
  } catch (error) {
    console.error("프로필 조회 중 오류:", error)
    return NextResponse.json(
      { error: "예상치 못한 오류가 발생했습니다", details: String(error) },
      { status: 500 }
    )
  }
}
