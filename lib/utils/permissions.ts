"use server"

import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type UserRole = "user" | "staff" | "manager" | "admin"

/**
 * 현재 사용자의 역할 조회
 * RLS를 우회하기 위해 서비스 역할 사용
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      console.log("[권한 확인] 사용자 ID 없음")
      return null
    }

    console.log("[권한 확인] 사용자 ID:", userId)

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, clerk_user_id, email, full_name")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    // PGRST116은 "결과 없음"을 의미하는 정상적인 코드입니다
    if (error && error.code !== 'PGRST116') {
      console.error("[권한 확인] 프로필 조회 실패:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
      })
      return null
    }

    if (!profile) {
      console.log("[권한 확인] 프로필 없음 - userId:", userId)
      return null
    }

    const role = (profile.role as UserRole) || "user"
    console.log("[권한 확인] 사용자 역할:", {
      userId,
      role,
      email: profile.email,
      fullName: profile.full_name,
    })
    return role
  } catch (error) {
    console.error("[권한 확인] 예외 발생:", error)
    return null
  }
}

/**
 * 관리자 또는 직원 권한 확인 (manager, staff, 또는 admin)
 */
export async function hasAdminOrStaffPermission(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "manager" || role === "staff" || role === "admin"
}

/**
 * 관리자 권한 확인 (manager 또는 admin)
 */
export async function hasManagerPermission(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "manager" || role === "admin"
}

/**
 * Admin 권한 확인 (admin만)
 */
export async function hasAdminPermission(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "admin"
}

/**
 * 현재 사용자의 프로필 ID 조회
 */
export async function getCurrentUserProfileId(): Promise<string | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (error || !profile) {
      return null
    }

    return (profile as { id: string }).id
  } catch (error) {
    console.error("Error getting user profile ID:", error)
    return null
  }
}

