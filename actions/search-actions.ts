"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { type Notice } from "./notice-actions"
import { type Resource } from "./resource-actions"

export interface SearchResult {
  notices: Notice[]
  resources: Resource[]
  total: number
}

/**
 * 통합 검색 수행
 * 공지사항, 지원사업, 자료실 데이터를 검색합니다.
 */
export async function performGlobalSearch(query: string): Promise<SearchResult> {
  if (!query || query.trim().length < 2) {
    return { notices: [], resources: [], total: 0 }
  }

  const supabase = createAdminClient()
  const searchTerm = `%${query.trim()}%`

  try {
    // 1. 공지사항 및 지원사업 검색
    const { data: noticesData, error: noticesError } = await supabase
      .from("notices")
      .select("id, title, content, category, is_pinned, created_at, created_by")
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order("created_at", { ascending: false })
      .limit(20)

    if (noticesError) {
      console.error("[Search Actions] 공지사항 검색 실패:", noticesError)
    }

    // 2. 자료실 검색
    const { data: resourcesData, error: resourcesError } = await supabase
      .from("resources")
      .select("*")
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .order("created_at", { ascending: false })
      .limit(20)

    if (resourcesError) {
      console.error("[Search Actions] 자료실 검색 실패:", resourcesError)
    }

    const notices = (noticesData || []) as Notice[]
    const resources = (resourcesData || []) as Resource[]

    return {
      notices,
      resources,
      total: notices.length + resources.length
    }
  } catch (error) {
    console.error("[Search Actions] 예기치 못한 검색 에러:", error)
    return { notices: [], resources: [], total: 0 }
  }
}
