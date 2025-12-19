import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
      console.error("[Profile GET] 프로필 조회 오류:", error)
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

