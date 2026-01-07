"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface Notification {
  id: string
  user_id: string | null
  clerk_user_id: string | null
  type: "info" | "success" | "warning" | "error" | "rental_expiry" | "application" | "schedule" | "system" | "broadcast"
  title: string
  body: string
  link: string | null
  status: "unread" | "read" | "archived"
  read_at: string | null
  expires_at: string | null
  priority: number
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface CreateNotificationParams {
  userId?: string
  clerkUserId?: string
  type: Notification["type"]
  title: string
  body: string
  link?: string
  expiresAt?: string
  priority?: number
  metadata?: Record<string, unknown>
}

/**
 * 알림 생성
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    console.log("[Notification Actions] 알림 생성 시작:", params)

    const supabase = createAdminClient()

    // 알림 생성
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId || null,
        clerk_user_id: params.clerkUserId || null,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link || null,
        expires_at: params.expiresAt || null,
        priority: params.priority || 0,
        metadata: params.metadata || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[Notification Actions] 알림 생성 실패:", error)
      return { success: false, error: "알림 생성에 실패했습니다" }
    }

    console.log("[Notification Actions] 알림 생성 성공:", notification.id)

    // Realtime으로 알림 발송 (Supabase가 자동으로 처리)
    // 클라이언트에서 구독 중이면 자동으로 수신됨

    return {
      success: true,
      notificationId: notification.id,
    }
  } catch (error) {
    console.error("[Notification Actions] 알림 생성 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "알림 생성 중 오류가 발생했습니다",
    }
  }
}

/**
 * 알림 목록 조회
 */
export async function getNotifications(params?: {
  limit?: number
  offset?: number
  status?: "unread" | "read" | "archived"
  type?: Notification["type"]
}): Promise<{
  success: boolean
  notifications?: Notification[]
  total?: number
  unreadCount?: number
  error?: string
}> {
  try {
    console.log("[Notification Actions] 알림 목록 조회 시작:", params)

    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    const supabase = await createClient()

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (!profile) {
      return { success: false, error: "프로필을 찾을 수 없습니다" }
    }

    // 알림 조회 (사용자별 + 브로드캐스트)
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .or(`user_id.eq.${profile.id},user_id.is.null`) // 사용자 알림 또는 브로드캐스트
      .order("created_at", { ascending: false })

    if (params?.status) {
      query = query.eq("status", params.status)
    }

    if (params?.type) {
      query = query.eq("type", params.type)
    }

    // 만료되지 않은 알림만
    query = query.or("expires_at.is.null,expires_at.gt.now()")

    const limit = params?.limit || 50
    const offset = params?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error, count } = await query

    if (error) {
      console.error("[Notification Actions] 알림 목록 조회 실패:", error)
      return { success: false, error: "알림 목록 조회에 실패했습니다" }
    }

    // 미읽음 알림 수 조회
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .or(`user_id.eq.${profile.id},user_id.is.null`)
      .eq("status", "unread")
      .or("expires_at.is.null,expires_at.gt.now()")

    console.log("[Notification Actions] 알림 목록 조회 성공:", {
      count: notifications?.length,
      total: count,
      unreadCount,
    })

    return {
      success: true,
      notifications: (notifications || []) as Notification[],
      total: count || 0,
      unreadCount: unreadCount || 0,
    }
  } catch (error) {
    console.error("[Notification Actions] 알림 목록 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "알림 목록 조회 중 오류가 발생했습니다",
    }
  }
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Notification Actions] 알림 읽음 처리:", notificationId)

    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    const supabase = await createClient()

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (!profile) {
      return { success: false, error: "프로필을 찾을 수 없습니다" }
    }

    // 알림 읽음 처리
    const { error } = await supabase
      .from("notifications")
      .update({
        status: "read",
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .or(`user_id.eq.${profile.id},user_id.is.null`) // 본인 알림 또는 브로드캐스트만

    if (error) {
      console.error("[Notification Actions] 알림 읽음 처리 실패:", error)
      return { success: false, error: "알림 읽음 처리에 실패했습니다" }
    }

    console.log("[Notification Actions] 알림 읽음 처리 성공:", notificationId)
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("[Notification Actions] 알림 읽음 처리 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "알림 읽음 처리 중 오류가 발생했습니다",
    }
  }
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Notification Actions] 모든 알림 읽음 처리")

    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    const supabase = await createClient()

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (!profile) {
      return { success: false, error: "프로필을 찾을 수 없습니다" }
    }

    // 모든 미읽음 알림 읽음 처리
    const { error } = await supabase
      .from("notifications")
      .update({
        status: "read",
        read_at: new Date().toISOString(),
      })
      .or(`user_id.eq.${profile.id},user_id.is.null`)
      .eq("status", "unread")

    if (error) {
      console.error("[Notification Actions] 모든 알림 읽음 처리 실패:", error)
      return { success: false, error: "모든 알림 읽음 처리에 실패했습니다" }
    }

    console.log("[Notification Actions] 모든 알림 읽음 처리 성공")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("[Notification Actions] 모든 알림 읽음 처리 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "모든 알림 읽음 처리 중 오류가 발생했습니다",
    }
  }
}

/**
 * 알림 삭제 (보관)
 */
export async function archiveNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Notification Actions] 알림 보관:", notificationId)

    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    const supabase = await createClient()

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (!profile) {
      return { success: false, error: "프로필을 찾을 수 없습니다" }
    }

    // 알림 보관
    const { error } = await supabase
      .from("notifications")
      .update({
        status: "archived",
      })
      .eq("id", notificationId)
      .or(`user_id.eq.${profile.id},user_id.is.null`)

    if (error) {
      console.error("[Notification Actions] 알림 보관 실패:", error)
      return { success: false, error: "알림 보관에 실패했습니다" }
    }

    console.log("[Notification Actions] 알림 보관 성공:", notificationId)
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("[Notification Actions] 알림 보관 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "알림 보관 중 오류가 발생했습니다",
    }
  }
}
