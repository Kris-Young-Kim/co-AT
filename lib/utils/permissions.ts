"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type UserRole = "user" | "staff" | "manager" | "admin"

/** Clerk 메타데이터에서 유효한 role인지 확인 */
function isValidRole(r: unknown): r is UserRole {
  return r === "user" || r === "staff" || r === "manager" || r === "admin"
}

/**
 * 현재 사용자의 역할 조회
 * 1) Supabase profiles 테이블
 * 2) 없으면 Clerk privateMetadata.role 또는 publicMetadata.role
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

    // 1. Supabase 프로필 확인
    const supabase = createAdminClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, clerk_user_id, email, full_name")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("[권한 확인] 프로필 조회 실패:", { error: error.message, userId })
      return null
    }

    if (profile && isValidRole(profile.role)) {
      const role = (profile.role as UserRole) || "user"
      console.log("[권한 확인] Supabase 프로필 역할:", { userId, role })
      return role
    }

    // 2. 프로필 없거나 role이 user인 경우 Clerk 메타데이터 확인 (admin/staff/manager 우선)
    const clerkUser = await currentUser()
    const clerkRole =
      (clerkUser?.privateMetadata?.role as string) ||
      (clerkUser?.publicMetadata?.role as string) ||
      null

    if (clerkRole && isValidRole(clerkRole)) {
      console.log("[권한 확인] Clerk 메타데이터 역할:", { userId, clerkRole })
      return clerkRole as UserRole
    }

    if (profile) {
      return (profile.role as UserRole) || "user"
    }

    console.log("[권한 확인] 프로필 없음, Clerk role 없음 - userId:", userId)
    return null
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
 * RLS를 우회하기 위해 서비스 역할 사용
 */
export async function getCurrentUserProfileId(): Promise<string | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      console.log("[프로필 ID 조회] 사용자 ID 없음")
      return null
    }

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    // PGRST116은 "결과 없음"을 의미하는 정상적인 코드입니다
    if (error && error.code !== 'PGRST116') {
      console.error("[프로필 ID 조회] 프로필 조회 실패:", {
        error: error.message,
        code: error.code,
        userId,
      })
      return null
    }

    if (!profile) {
      console.log("[프로필 ID 조회] 프로필 없음 - userId:", userId)
      return null
    }

    return (profile as { id: string }).id
  } catch (error) {
    console.error("[프로필 ID 조회] 예외 발생:", error)
    return null
  }
}

