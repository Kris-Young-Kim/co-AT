import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * 현재 로그인한 사용자의 프로필을 수동으로 생성하는 API
 * 테스트/개발용으로만 사용하세요
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

    const supabase = await createClient()

    // 이미 프로필이 있는지 확인
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("clerk_user_id", userId)
      .single()

    if (existingProfile) {
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

    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: userId,
        email,
        full_name: fullName,
        role: "manager", // 테스트용으로 manager로 설정
      })
      .select()
      .single()

    if (error) {
      console.error("프로필 생성 실패:", error)
      return NextResponse.json(
        { error: "프로필 생성에 실패했습니다", details: error.message },
        { status: 500 }
      )
    }

    console.log("프로필 생성 성공:", newProfile)

    return NextResponse.json({
      success: true,
      message: "프로필이 생성되었습니다",
      profile: newProfile,
      clerkUserId: userId,
    })
  } catch (error) {
    console.error("프로필 생성 중 오류:", error)
    return NextResponse.json(
      { error: "예상치 못한 오류가 발생했습니다", details: String(error) },
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
      .single()

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
      error: error?.message || null,
    })
  } catch (error) {
    console.error("프로필 조회 중 오류:", error)
    return NextResponse.json(
      { error: "예상치 못한 오류가 발생했습니다", details: String(error) },
      { status: 500 }
    )
  }
}

