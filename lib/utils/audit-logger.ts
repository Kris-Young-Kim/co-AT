/**
 * 감사 로그 기록 유틸리티
 * 모든 데이터 변경 이력을 추적하는 헬퍼 함수
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@clerk/nextjs/server"
import { headers } from "next/headers"

export interface AuditLogInput {
  action_type: "create" | "update" | "delete" | "view" | "export"
  table_name: string
  record_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  changed_fields?: string[]
  application_id?: string
  client_id?: string
  request_path?: string
  request_method?: string
  metadata?: Record<string, unknown>
  description?: string
}

/**
 * 감사 로그 기록
 */
export async function logAuditEvent(input: AuditLogInput): Promise<{
  success: boolean
  auditLogId?: string
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    // 사용자 정보 조회
    const { userId: clerkUserId } = await auth()
    let userId: string | null = null
    let userRole: string | null = null

    if (clerkUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("clerk_user_id", clerkUserId)
        .single()

      if (profile) {
        userId = profile.id
        userRole = profile.role
      }
    }

    // IP 주소 및 User Agent 조회
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    // 의심스러운 활동 탐지
    const suspiciousCheck = detectSuspiciousActivity(input, userRole)

    // 감사 로그 생성
    const { data: auditLog, error } = await supabase
      .from("audit_logs" as any)
      .insert({
        action_type: input.action_type,
        table_name: input.table_name,
        record_id: input.record_id || null,
        user_id: userId,
        clerk_user_id: clerkUserId || null,
        user_role: userRole,
        ip_address: ipAddress,
        user_agent: userAgent,
        old_values: input.old_values || null,
        new_values: input.new_values || null,
        changed_fields: input.changed_fields || null,
        application_id: input.application_id || null,
        client_id: input.client_id || null,
        request_path: input.request_path || null,
        request_method: input.request_method || null,
        metadata: input.metadata || null,
        description: input.description || null,
        is_suspicious: suspiciousCheck.isSuspicious,
        suspicion_reason: suspiciousCheck.reason || null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[Audit Logger] 감사 로그 기록 실패:", error)
      return { success: false, error: "감사 로그 기록에 실패했습니다" }
    }

    // 의심스러운 활동이면 알림 발송
    const auditLogTyped = auditLog as { id?: string } | null;
    if (suspiciousCheck.isSuspicious) {
      await notifySuspiciousActivity(auditLogTyped?.id || "", suspiciousCheck.reason || "의심스러운 활동 탐지")
    }

    console.log("[Audit Logger] 감사 로그 기록 성공:", auditLogTyped?.id)
    return { success: true, auditLogId: auditLogTyped?.id || "" }
  } catch (error) {
    console.error("[Audit Logger] 감사 로그 기록 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "감사 로그 기록 중 오류가 발생했습니다",
    }
  }
}

/**
 * 의심스러운 활동 탐지
 */
function detectSuspiciousActivity(
  input: AuditLogInput,
  userRole: string | null
): { isSuspicious: boolean; reason: string | null } {
  // 1. 비정상적인 시간대 활동 (오후 11시 ~ 오전 6시)
  const now = new Date()
  const hour = now.getHours()
  if ((hour >= 23 || hour < 6) && userRole !== "manager") {
    return {
      isSuspicious: true,
      reason: `비정상적인 시간대 활동 (${hour}시)`,
    }
  }

  // 2. 대량 삭제 작업
  if (input.action_type === "delete" && input.table_name === "clients") {
    return {
      isSuspicious: true,
      reason: "고객 정보 삭제 작업",
    }
  }

  // 3. 민감한 정보 수정 (비용, 상태 등)
  if (
    input.action_type === "update" &&
    input.changed_fields &&
    (input.changed_fields.includes("cost_total") ||
      input.changed_fields.includes("status") ||
      input.changed_fields.includes("assigned_staff_id"))
  ) {
    // manager가 아니면 의심스러운 활동
    if (userRole !== "manager") {
      return {
        isSuspicious: true,
        reason: "민감한 정보 수정 (비용, 상태, 담당자 변경)",
      }
    }
  }

  // 4. 일반 사용자가 관리자 전용 테이블 접근
  if (
    userRole === "user" &&
    (input.table_name === "inventory" ||
      input.table_name === "rentals" ||
      input.table_name === "schedules")
  ) {
    return {
      isSuspicious: true,
      reason: "일반 사용자의 관리자 전용 테이블 접근",
    }
  }

  return { isSuspicious: false, reason: null }
}

/**
 * 의심스러운 활동 알림 발송
 */
async function notifySuspiciousActivity(auditLogId: string, reason: string): Promise<void> {
  try {
    const { createNotification } = await import("@/actions/notification-actions")

    await createNotification({
      type: "system",
      title: "의심스러운 활동 탐지",
      body: `감사 로그 ID: ${auditLogId}\n이유: ${reason}`,
      link: `/admin/audit-logs/${auditLogId}`,
      priority: 3, // 높은 우선순위
      metadata: {
        auditLogId,
        reason,
        timestamp: new Date().toISOString(),
      },
    })

    console.log("[Audit Logger] 의심스러운 활동 알림 발송:", auditLogId)
  } catch (error) {
    console.error("[Audit Logger] 의심스러운 활동 알림 발송 실패:", error)
    // 알림 실패해도 감사 로그는 기록됨
  }
}

/**
 * 변경 사항 비교 (old_values와 new_values 비교)
 */
export function compareValues(
  oldValues: Record<string, unknown> | undefined,
  newValues: Record<string, unknown> | undefined
): string[] {
  if (!oldValues || !newValues) {
    return []
  }

  const changedFields: string[] = []

  // 모든 키를 확인
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])

  for (const key of allKeys) {
    const oldValue = oldValues[key]
    const newValue = newValues[key]

    // JSON 문자열로 변환하여 비교 (객체/배열도 비교 가능)
    const oldStr = JSON.stringify(oldValue)
    const newStr = JSON.stringify(newValue)

    if (oldStr !== newStr) {
      changedFields.push(key)
    }
  }

  return changedFields
}
