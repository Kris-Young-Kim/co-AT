/**
 * 보안 알림 시스템
 * 크리티컬 보안 이벤트 발생 시 Notion 또는 Google Sheet로 알림 발송
 */

import { createAdminClient } from "@/lib/supabase/admin"

export interface SecurityAlert {
  eventType: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  ipAddress?: string
  userId?: string
  metadata?: Record<string, unknown>
}

/**
 * 보안 알림 발송
 * 현재는 로그만 기록하고, 향후 Notion/Google Sheet 연동
 */
export async function sendSecurityAlert(alert: SecurityAlert): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.warn("[Security Alert]", {
      eventType: alert.eventType,
      severity: alert.severity,
      description: alert.description,
      ipAddress: alert.ipAddress,
      userId: alert.userId,
      timestamp: new Date().toISOString(),
    })

    // 크리티컬 이벤트만 즉시 알림 발송
    if (alert.severity === "critical" || alert.severity === "high") {
      // TODO: Notion 또는 Google Sheet로 알림 발송
      // 현재는 로그만 기록
      await logSecurityAlert(alert)
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[Security Alert] 알림 발송 실패:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * 보안 알림을 데이터베이스에 기록
 */
async function logSecurityAlert(alert: SecurityAlert): Promise<void> {
  try {
    const supabase = createAdminClient()

    await supabase.from("security_logs" as any).insert({
      event_type: "security_alert",
      severity: alert.severity,
      threat_description: alert.description,
      ip_address: alert.ipAddress,
      clerk_user_id: alert.userId,
      metadata: {
        eventType: alert.eventType,
        ...alert.metadata,
      },
      notified: true,
      notification_sent_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Security Alert] 로그 기록 실패:", error)
    // 로그 기록 실패해도 알림은 계속 진행
  }
}

/**
 * Notion 데이터베이스로 알림 발송 (향후 구현)
 */
async function sendToNotion(alert: SecurityAlert): Promise<void> {
  // TODO: Notion API 연동
  // const notionToken = process.env.NOTION_API_KEY
  // const notionDatabaseId = process.env.NOTION_SECURITY_DB_ID
  // ...
}

/**
 * Google Sheet로 알림 발송 (향후 구현)
 */
async function sendToGoogleSheet(alert: SecurityAlert): Promise<void> {
  // TODO: Google Sheets API 연동
  // const googleServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT
  // const spreadsheetId = process.env.GOOGLE_SECURITY_SHEET_ID
  // ...
}
