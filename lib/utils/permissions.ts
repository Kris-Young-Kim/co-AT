"use server"

import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export type UserRole = "user" | "staff" | "manager"

/**
 * 현재 사용자의 역할 조회
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      console.log("[권한 확인] 사용자 ID 없음")
      return null
    }

    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_user_id", userId)
      .single()

    if (error || !profile) {
      console.log("[권한 확인] 프로필 조회 실패:", error?.message || "프로필 없음")
      return null
    }

    const role = (profile.role as UserRole) || "user"
    console.log("[권한 확인] 사용자 역할:", role, "userId:", userId)
    return role
  } catch (error) {
    console.error("[권한 확인] 오류:", error)
    return null
  }
}

/**
 * 관리자 또는 직원 권한 확인 (manager 또는 staff)
 */
export async function hasAdminOrStaffPermission(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "manager" || role === "staff"
}

/**
 * 관리자 권한 확인 (manager만)
 */
export async function hasManagerPermission(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "manager"
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

    return profile.id
  } catch (error) {
    console.error("Error getting user profile ID:", error)
    return null
  }
}

