"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"

export interface AuditLog {
  id: string
  action_type: "create" | "update" | "delete" | "view" | "export"
  table_name: string
  record_id: string | null
  user_id: string | null
  clerk_user_id: string | null
  user_role: string | null
  ip_address: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  changed_fields: string[] | null
  application_id: string | null
  client_id: string | null
  request_path: string | null
  request_method: string | null
  metadata: Record<string, unknown> | null
  description: string | null
  is_suspicious: boolean
  suspicion_reason: string | null
  created_at: string
}

export interface AuditLogFilters {
  action_type?: "create" | "update" | "delete" | "view" | "export"
  table_name?: string
  user_id?: string
  clerk_user_id?: string
  application_id?: string
  client_id?: string
  is_suspicious?: boolean
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

/**
 * 감사 로그 조회
 */
export async function getAuditLogs(
  filters?: AuditLogFilters
): Promise<{
  success: boolean
  auditLogs?: AuditLog[]
  total?: number
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    let query = supabase.from("audit_logs").select("*", { count: "exact" })

    // 필터 적용
    if (filters?.action_type) {
      query = query.eq("action_type", filters.action_type)
    }

    if (filters?.table_name) {
      query = query.eq("table_name", filters.table_name)
    }

    if (filters?.user_id) {
      query = query.eq("user_id", filters.user_id)
    }

    if (filters?.clerk_user_id) {
      query = query.eq("clerk_user_id", filters.clerk_user_id)
    }

    if (filters?.application_id) {
      query = query.eq("application_id", filters.application_id)
    }

    if (filters?.client_id) {
      query = query.eq("client_id", filters.client_id)
    }

    if (filters?.is_suspicious !== undefined) {
      query = query.eq("is_suspicious", filters.is_suspicious)
    }

    if (filters?.start_date) {
      query = query.gte("created_at", filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte("created_at", filters.end_date)
    }

    // 정렬 (최신순)
    query = query.order("created_at", { ascending: false })

    // 페이지네이션
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data: auditLogs, error, count } = await query

    if (error) {
      console.error("[Audit Actions] 감사 로그 조회 실패:", error)
      return { success: false, error: "감사 로그 조회에 실패했습니다" }
    }

    console.log("[Audit Actions] 감사 로그 조회 성공:", {
      count: auditLogs?.length,
      total: count,
    })

    return {
      success: true,
      auditLogs: (auditLogs || []) as AuditLog[],
      total: count || 0,
    }
  } catch (error) {
    console.error("[Audit Actions] 감사 로그 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "감사 로그 조회 중 오류가 발생했습니다",
    }
  }
}

/**
 * 특정 레코드의 감사 로그 조회
 */
export async function getAuditLogsByRecord(
  tableName: string,
  recordId: string
): Promise<{
  success: boolean
  auditLogs?: AuditLog[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { data: auditLogs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("table_name", tableName)
      .eq("record_id", recordId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Audit Actions] 레코드 감사 로그 조회 실패:", error)
      return { success: false, error: "감사 로그 조회에 실패했습니다" }
    }

    console.log("[Audit Actions] 레코드 감사 로그 조회 성공:", {
      tableName,
      recordId,
      count: auditLogs?.length,
    })

    return {
      success: true,
      auditLogs: (auditLogs || []) as AuditLog[],
    }
  } catch (error) {
    console.error("[Audit Actions] 레코드 감사 로그 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "감사 로그 조회 중 오류가 발생했습니다",
    }
  }
}

/**
 * 의심스러운 활동 로그 조회
 */
export async function getSuspiciousActivityLogs(
  limit?: number
): Promise<{
  success: boolean
  auditLogs?: AuditLog[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    let query = supabase
      .from("audit_logs")
      .select("*")
      .eq("is_suspicious", true)
      .order("created_at", { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: auditLogs, error } = await query

    if (error) {
      console.error("[Audit Actions] 의심스러운 활동 로그 조회 실패:", error)
      return { success: false, error: "의심스러운 활동 로그 조회에 실패했습니다" }
    }

    console.log("[Audit Actions] 의심스러운 활동 로그 조회 성공:", auditLogs?.length)

    return {
      success: true,
      auditLogs: (auditLogs || []) as AuditLog[],
    }
  } catch (error) {
    console.error("[Audit Actions] 의심스러운 활동 로그 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "의심스러운 활동 로그 조회 중 오류가 발생했습니다",
    }
  }
}
