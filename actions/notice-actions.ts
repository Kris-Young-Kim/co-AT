"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission, getCurrentUserProfileId } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface Attachment {
  type: "image" | "pdf" | "youtube"
  url: string
  name: string
  size?: number
}

export interface Notice {
  id: string
  title: string
  content: string
  category: "notice" | "activity" | "support" | "case" | null
  is_pinned: boolean
  attachments?: Attachment[]
  created_at: string
  created_by: string | null
}

export interface CreateNoticeInput {
  title: string
  content: string
  category?: "notice" | "activity" | "support" | "case" | null
  is_pinned?: boolean
  attachments?: Attachment[]
}

export interface UpdateNoticeInput {
  id: string
  title?: string
  content?: string
  category?: "notice" | "activity" | "support" | "case" | null
  is_pinned?: boolean
  attachments?: Attachment[]
}

/**
 * 최신 공지사항 조회 (고정 공지 + 최신 공지)
 * 공개 페이지용 - RLS를 우회하여 모든 공지사항 조회
 */
export async function getRecentNotices(limit: number = 5): Promise<Notice[]> {
  // 공개 페이지이므로 RLS를 우회하여 조회
  const supabase = createAdminClient()

  // 고정 공지사항 조회
  const { data: pinned, error: pinnedError } = await supabase
    .from("notices")
    .select("id, title, content, category, is_pinned, created_at, created_by")
    .eq("is_pinned", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (pinnedError) {
    console.error("[공지사항 조회] 고정 공지사항 조회 실패:", {
      error: pinnedError.message,
      code: pinnedError.code,
    })
  }

  // 최신 공지사항 조회 (고정 제외)
  const { data: recent, error: recentError } = await supabase
    .from("notices")
    .select("id, title, content, category, is_pinned, created_at, created_by")
    .eq("is_pinned", false)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (recentError) {
    console.error("[공지사항 조회] 최신 공지사항 조회 실패:", {
      error: recentError.message,
      code: recentError.code,
    })
  }

  // 고정 공지 + 최신 공지 합치기
  const allNotices = [...(pinned || []), ...(recent || [])]

  // attachments 필드가 있는 경우 추가로 조회
  const noticesWithAttachments = await Promise.all(
    allNotices.slice(0, limit).map(async (notice: { id: string }) => {
      try {
        const { data: noticeData } = await supabase
          .from("notices")
          .select("attachments")
          .eq("id", notice.id)
          .single()
        
        return {
          ...notice,
          attachments: noticeData && (noticeData as unknown as { attachments?: any }).attachments
            ? (typeof (noticeData as unknown as { attachments: any }).attachments === "string"
                ? JSON.parse((noticeData as unknown as { attachments: string }).attachments)
                : (noticeData as unknown as { attachments: any }).attachments)
            : undefined,
        }
      } catch {
        // attachments 컬럼이 없거나 파싱 실패 시 무시
        return {
          ...notice,
          attachments: undefined,
        }
      }
    })
  )

  return noticesWithAttachments as Notice[]
}

/**
 * 카테고리별 공지사항 조회
 * 공개 페이지용 - RLS를 우회하여 조회
 */
export async function getNoticesByCategory(
  category: "notice" | "activity" | "support" | "case",
  limit: number = 10
): Promise<Notice[]> {
  // 공개 페이지이므로 RLS를 우회하여 조회
  const supabase = createAdminClient()

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

  // attachments 필드가 있는 경우 추가로 조회
  const noticesWithAttachments = await Promise.all(
    (data || []).map(async (notice: { id: string }) => {
      try {
        const { data: noticeData } = await supabase
          .from("notices")
          .select("attachments")
          .eq("id", notice.id)
          .single()
        
        return {
          ...notice,
          attachments: noticeData && (noticeData as unknown as { attachments?: any }).attachments
            ? (typeof (noticeData as unknown as { attachments: any }).attachments === "string"
                ? JSON.parse((noticeData as unknown as { attachments: string }).attachments)
                : (noticeData as unknown as { attachments: any }).attachments)
            : undefined,
        }
      } catch {
        // attachments 컬럼이 없거나 파싱 실패 시 무시
        return {
          ...notice,
          attachments: undefined,
        }
      }
    })
  )

  return noticesWithAttachments as Notice[]
}

/**
 * 공지사항 상세 조회
 * 공개 페이지용 - RLS를 우회하여 조회
 */
export async function getNoticeById(id: string): Promise<Notice | null> {
  // 공개 페이지이므로 RLS를 우회하여 조회
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("notices")
    .select("id, title, content, category, is_pinned, created_at, created_by")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[공지사항 조회] 상세 조회 실패:", {
      error: error.message,
      code: error.code,
      id,
    })
    return null
  }

  if (!data) {
    return null
  }

  // attachments 필드가 있는 경우 추가로 조회
  try {
    const { data: noticeData } = await supabase
      .from("notices")
      .select("attachments")
      .eq("id", id)
      .single()
    
    const dataTyped = data as { id: string; title: string; content: string; category: "notice" | "activity" | "support" | "case" | null; is_pinned: boolean; created_at: string; created_by: string | null }
    return {
      ...dataTyped,
      attachments: noticeData && (noticeData as unknown as { attachments?: any }).attachments
        ? (typeof (noticeData as unknown as { attachments: any }).attachments === "string"
            ? JSON.parse((noticeData as unknown as { attachments: string }).attachments)
            : (noticeData as unknown as { attachments: any }).attachments)
        : undefined,
    } as Notice
  } catch {
    // attachments 컬럼이 없거나 파싱 실패 시 무시
    if (!data) {
      return null
    }
    const dataTyped = data as { id: string; title: string; content: string; category: "notice" | "activity" | "support" | "case" | null; is_pinned: boolean; created_at: string; created_by: string | null }
    return {
      ...dataTyped,
      attachments: undefined,
    } as Notice
  }
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

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    // attachments 컬럼이 있는지 확인하고 선택적으로 저장
    const insertData: any = {
      title: input.title,
      content: input.content,
      category: input.category || null,
      is_pinned: input.is_pinned || false,
      created_by: profileId,
    }

    // attachments 컬럼이 있는 경우에만 추가
    if (input.attachments && input.attachments.length > 0) {
      try {
        insertData.attachments = JSON.stringify(input.attachments)
      } catch {
        // JSON 변환 실패 시 무시
      }
    }

    const { data, error } = await supabase
      .from("notices")
      .insert(insertData as any)
      .select("id")
      .single()

    if (error) {
      console.error("[공지사항 생성] 실패:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        insertData,
        profileId,
      })
      return { 
        success: false, 
        error: `공지사항 생성에 실패했습니다: ${error.message || error.code || "알 수 없는 오류"}` 
      }
    }

    revalidatePath("/notices")
    revalidatePath("/admin/notices-management")

    return { success: true, noticeId: (data as { id: string }).id }
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
      attachments?: string | null
      updated_at?: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.category !== undefined) updateData.category = input.category
    if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned
    if (input.attachments !== undefined) {
      updateData.attachments = input.attachments.length > 0
        ? JSON.stringify(input.attachments)
        : null
    }

    const { error } = await supabase
      .from("notices")
      // @ts-expect-error - notices 테이블 attachments 타입 불일치
      .update(updateData as any)
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

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    // attachments 컬럼이 있는지 확인하고 선택적으로 조회
    const { data, error } = await supabase
      .from("notices")
      .select("id, title, content, category, is_pinned, created_at, created_by")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[공지사항 조회] 실패:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return { 
        success: false, 
        error: `공지사항 조회에 실패했습니다: ${error.message || error.code || "알 수 없는 오류"}` 
      }
    }

    // attachments 필드가 있는 경우 추가로 조회
    const noticesWithAttachments = await Promise.all(
      (data || []).map(async (notice: { id: string }) => {
        try {
          const { data: noticeData } = await supabase
            .from("notices")
            .select("attachments")
            .eq("id", notice.id)
            .single()
          
          return {
            ...notice,
            attachments: noticeData && (noticeData as unknown as { attachments?: any }).attachments
              ? (typeof (noticeData as unknown as { attachments: any }).attachments === "string"
                  ? JSON.parse((noticeData as unknown as { attachments: string }).attachments)
                  : (noticeData as unknown as { attachments: any }).attachments)
              : undefined,
          }
        } catch {
          // attachments 컬럼이 없거나 파싱 실패 시 무시
          return {
            ...notice,
            attachments: undefined,
          }
        }
      })
    )

    return { success: true, notices: noticesWithAttachments as Notice[] }
  } catch (error) {
    console.error("Unexpected error in getAllNotices:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

