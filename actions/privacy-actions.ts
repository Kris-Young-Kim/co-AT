"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

/**
 * 개인정보 보유 기간 상수 (5년)
 */
const RETENTION_PERIOD_YEARS = 5
const ALERT_BEFORE_MONTHS = 1 // 만료 1개월 전 알림

/**
 * 개인정보 만료 예정 대상자 조회 (1개월 전 알림)
 */
export async function getExpiringPrivacyData(): Promise<{
  success: boolean
  clients?: Array<{
    id: string
    name: string
    created_at: string
    expiration_date: string
    days_until_expiration: number
  }>
  error?: string
}> {
  try {
    console.log("[Privacy Actions] 만료 예정 개인정보 조회 시작")

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 현재 날짜 기준
    const now = new Date()
    const alertDate = new Date(now)
    alertDate.setMonth(alertDate.getMonth() + ALERT_BEFORE_MONTHS) // 1개월 후

    // 만료 예정일 계산
    // 만료일 = created_at + 5년
    // 만료일이 현재와 현재 + 1개월 사이에 있으면 알림
    // 즉: 현재 <= created_at + 5년 <= 현재 + 1개월
    // 역으로: 현재 - 5년 <= created_at <= 현재 + 1개월 - 5년
    const expirationDateStart = new Date(now)
    expirationDateStart.setFullYear(expirationDateStart.getFullYear() - RETENTION_PERIOD_YEARS)

    const expirationDateEnd = new Date(alertDate)
    expirationDateEnd.setFullYear(expirationDateEnd.getFullYear() - RETENTION_PERIOD_YEARS)

    // created_at이 expirationDateStart와 expirationDateEnd 사이인 클라이언트 조회
    const { data: clients, error } = await supabase
      .from("clients")
      .select("id, name, created_at")
      .gte("created_at", expirationDateStart.toISOString())
      .lte("created_at", expirationDateEnd.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[Privacy Actions] 만료 예정 개인정보 조회 실패:", error)
      return { success: false, error: "만료 예정 개인정보 조회에 실패했습니다" }
    }

    // 만료일 및 남은 일수 계산
    const clientsWithExpiration = (clients || []).map((client: any) => {
      const createdAt = new Date(client.created_at || "")
      const expirationDate = new Date(createdAt)
      expirationDate.setFullYear(expirationDate.getFullYear() + RETENTION_PERIOD_YEARS)

      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: client.id,
        name: client.name,
        created_at: client.created_at || "",
        expiration_date: expirationDate.toISOString().split("T")[0],
        days_until_expiration: daysUntilExpiration,
      }
    })

    console.log("[Privacy Actions] 만료 예정 개인정보 조회 성공:", {
      count: clientsWithExpiration.length,
    })

    return {
      success: true,
      clients: clientsWithExpiration,
    }
  } catch (error) {
    console.error("[Privacy Actions] 만료 예정 개인정보 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 개인정보 만료된 대상자 조회 (보유 기간 경과)
 */
export async function getExpiredPrivacyData(): Promise<{
  success: boolean
  clients?: Array<{
    id: string
    name: string
    created_at: string
    expiration_date: string
    days_since_expiration: number
  }>
  error?: string
}> {
  try {
    console.log("[Privacy Actions] 만료된 개인정보 조회 시작")

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 현재 날짜 기준
    const now = new Date()
    const expirationDateThreshold = new Date(now)
    expirationDateThreshold.setFullYear(
      expirationDateThreshold.getFullYear() - RETENTION_PERIOD_YEARS
    )

    // created_at이 expirationDateThreshold 이전인 클라이언트 조회 (만료됨)
    const { data: clients, error } = await supabase
      .from("clients")
      .select("id, name, created_at")
      .lt("created_at", expirationDateThreshold.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[Privacy Actions] 만료된 개인정보 조회 실패:", error)
      return { success: false, error: "만료된 개인정보 조회에 실패했습니다" }
    }

    // 만료일 및 경과 일수 계산
    const expiredClients = (clients || []).map((client: any) => {
      const createdAt = new Date(client.created_at || "")
      const expirationDate = new Date(createdAt)
      expirationDate.setFullYear(expirationDate.getFullYear() + RETENTION_PERIOD_YEARS)

      const daysSinceExpiration = Math.ceil(
        (now.getTime() - expirationDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: client.id,
        name: client.name,
        created_at: client.created_at || "",
        expiration_date: expirationDate.toISOString().split("T")[0],
        days_since_expiration: daysSinceExpiration,
      }
    })

    console.log("[Privacy Actions] 만료된 개인정보 조회 성공:", {
      count: expiredClients.length,
    })

    return {
      success: true,
      clients: expiredClients,
    }
  } catch (error) {
    console.error("[Privacy Actions] 만료된 개인정보 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 개인정보 보유 기간 통계 조회
 */
export async function getPrivacyRetentionStats(): Promise<{
  success: boolean
  stats?: {
    totalClients: number
    expiringCount: number
    expiredCount: number
    retentionPeriodYears: number
  }
  error?: string
}> {
  try {
    console.log("[Privacy Actions] 개인정보 보유 기간 통계 조회 시작")

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 전체 대상자 수
    const { count: totalCount, error: totalError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })

    if (totalError) {
      console.error("[Privacy Actions] 전체 대상자 수 조회 실패:", totalError)
    }

    // 만료 예정 및 만료된 데이터 조회
    const [expiringResult, expiredResult] = await Promise.all([
      getExpiringPrivacyData(),
      getExpiredPrivacyData(),
    ])

    const expiringCount = expiringResult.success ? expiringResult.clients?.length || 0 : 0
    const expiredCount = expiredResult.success ? expiredResult.clients?.length || 0 : 0

    return {
      success: true,
      stats: {
        totalClients: totalCount || 0,
        expiringCount,
        expiredCount,
        retentionPeriodYears: RETENTION_PERIOD_YEARS,
      },
    }
  } catch (error) {
    console.error("[Privacy Actions] 개인정보 보유 기간 통계 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}
