"use server"

import { createClient } from "@/lib/supabase/server"

export interface Notice {
  id: string
  title: string
  content: string
  category: "notice" | "support" | "event" | null
  is_pinned: boolean
  created_at: string
  created_by: string | null
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

