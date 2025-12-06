"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission, getCurrentUserProfileId } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export interface Notice {
  id: string
  title: string
  content: string
  category: "notice" | "support" | "event" | null
  is_pinned: boolean
  created_at: string
  created_by: string | null
}

export interface CreateNoticeInput {
  title: string
  content: string
  category?: "notice" | "support" | "event" | null
  is_pinned?: boolean
}

export interface UpdateNoticeInput {
  id: string
  title?: string
  content?: string
  category?: "notice" | "support" | "event" | null
  is_pinned?: boolean
}

/**
 * 최신 공지사항 조회 (고정 공지 + 최신 공지)
 */
export async function getRecentNotices(limit: number = 5): Promise<Notice[]> {
  const supabase = await createClient()

  // 고정 공지사항 조회
  const { data: pinned, error: pinnedError } = await supabase
    .from("notices")
    .select("id, title, content, category, is_pinned, created_at, created_by")
    .eq("is_pinned", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (pinnedError) {
    console.error("고정 공지사항 조회 실패:", pinnedError)
  }

  // 최신 공지사항 조회 (고정 제외)
  const { data: recent, error: recentError } = await supabase
    .from("notices")
    .select("id, title, content, category, is_pinned, created_at, created_by")
    .eq("is_pinned", false)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (recentError) {
    console.error("최신 공지사항 조회 실패:", recentError)
  }

  // 고정 공지 + 최신 공지 합치기
  const allNotices = [...(pinned || []), ...(recent || [])]

  return allNotices.slice(0, limit)
}

/**
 * 카테고리별 공지사항 조회
 */
export async function getNoticesByCategory(
  category: "notice" | "support" | "event",
  limit: number = 10
): Promise<Notice[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notices")
    .select("id, title, content, category, is_pinned, created_at, created_by")
    .eq("category", category)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("카테고리별 공지사항 조회 실패:", error)
    return []
  }

  return data || []
}

/**
 * 공지사항 상세 조회
 */
export async function getNoticeById(id: string): Promise<Notice | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notices")
    .select("id, title, content, category, is_pinned, created_at, created_by")
    .eq("id", id)
    .single()

  if (error) {
    console.error("공지사항 조회 실패:", error)
    return null
  }

  return data
}

/**
 * 공지사항 생성 (관리자/직원만)
 */
export async function createNotice(
  input: CreateNoticeInput
): Promise<{ success: boolean; noticeId?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const profileId = await getCurrentUserProfileId()
    if (!profileId) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("notices")
      .insert({
        title: input.title,
        content: input.content,
        category: input.category || null,
        is_pinned: input.is_pinned || false,
        created_by: profileId,
      })
      .select("id")
      .single()

    if (error) {
      console.error("공지사항 생성 실패:", error)
      return { success: false, error: "공지사항 생성에 실패했습니다" }
    }

    revalidatePath("/notices")
    revalidatePath("/admin/notices-management")

    return { success: true, noticeId: data.id }
  } catch (error) {
    console.error("Unexpected error in createNotice:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 공지사항 수정 (관리자/직원만)
 */
export async function updateNotice(
  input: UpdateNoticeInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const updateData: {
      title?: string
      content?: string
      category?: string | null
      is_pinned?: boolean
      updated_at?: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.category !== undefined) updateData.category = input.category
    if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned

    const { error } = await supabase
      .from("notices")
      .update(updateData)
      .eq("id", input.id)

    if (error) {
      console.error("공지사항 수정 실패:", error)
      return { success: false, error: "공지사항 수정에 실패했습니다" }
    }

    revalidatePath("/notices")
    revalidatePath(`/notices/${input.id}`)
    revalidatePath("/admin/notices")

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in updateNotice:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 공지사항 삭제 (관리자/직원만)
 */
export async function deleteNotice(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { error } = await supabase.from("notices").delete().eq("id", id)

    if (error) {
      console.error("공지사항 삭제 실패:", error)
      return { success: false, error: "공지사항 삭제에 실패했습니다" }
    }

    revalidatePath("/notices")
    revalidatePath("/admin/notices-management")

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteNotice:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 모든 공지사항 조회 (관리자/직원용)
 */
export async function getAllNotices(): Promise<{
  success: boolean
  notices?: Notice[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("notices")
      .select("id, title, content, category, is_pinned, created_at, created_by")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("공지사항 조회 실패:", error)
      return { success: false, error: "공지사항 조회에 실패했습니다" }
    }

    return { success: true, notices: data || [] }
  } catch (error) {
    console.error("Unexpected error in getAllNotices:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

