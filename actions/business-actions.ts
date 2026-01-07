"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

/**
 * 맞춤제작 연 2회 횟수 제한 체크
 * @param clientId 대상자 ID
 * @returns 연간 맞춤제작 횟수 및 제한 여부
 */
export async function checkCustomLimit(clientId: string): Promise<{
  success: boolean
  currentCount?: number
  limit?: number
  isExceeded?: boolean
  error?: string
}> {
  try {
    console.log("[Business Actions] 맞춤제작 횟수 제한 체크:", clientId)

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 올해 연도 계산
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1).toISOString()
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString()

    // 올해 맞춤제작 횟수 조회 (custom_makes 테이블 또는 applications 테이블)
    // 1. custom_makes 테이블에서 조회 (완료된 것만 카운트)
    const { count: customMakesCount, error: customMakesError } = await supabase
      .from("custom_makes")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("progress_status", ["completed", "delivery", "manufacturing", "inspection"])
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    if (customMakesError) {
      console.error("[Business Actions] custom_makes 조회 실패:", customMakesError)
    }

    // 2. applications 테이블에서도 조회 (신청서 기준)
    const { count: applicationsCount, error: applicationsError } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("category", "custom")
      .eq("sub_category", "custom_make")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    if (applicationsError) {
      console.error("[Business Actions] applications 조회 실패:", applicationsError)
    }

    // 두 결과 중 큰 값을 사용 (중복 방지)
    const currentCount = Math.max(customMakesCount || 0, applicationsCount || 0)
    const limit = 2 // 연 2회 제한
    const isExceeded = currentCount >= limit

    console.log("[Business Actions] 맞춤제작 횟수 체크 결과:", {
      clientId,
      currentCount,
      limit,
      isExceeded,
    })

    return {
      success: true,
      currentCount,
      limit,
      isExceeded,
    }
  } catch (error) {
    console.error("[Business Actions] 맞춤제작 횟수 제한 체크 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 맞춤제작비 10만원 한도 체크 (재료비 기준)
 * @param clientId 대상자 ID
 * @param amount 신규 맞춤제작비 금액 (재료비)
 * @returns 연간 누적 맞춤제작비 및 한도 여부
 */
export async function checkCustomMakeCostLimit(
  clientId: string,
  amount: number
): Promise<{
  success: boolean
  currentTotal?: number
  newTotal?: number
  limit?: number
  isExceeded?: boolean
  error?: string
}> {
  try {
    console.log("[Business Actions] 맞춤제작비 한도 체크:", { clientId, amount })

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 올해 연도 계산
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1).toISOString()
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString()

    // 올해 누적 맞춤제작비 계산 (custom_makes 테이블에서 재료비 기준)
    const { data: customMakes, error: customMakesError } = await supabase
      .from("custom_makes")
      .select("cost_materials, cost_total")
      .eq("client_id", clientId)
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    let currentTotal = 0

    if (customMakesError) {
      console.error("[Business Actions] custom_makes 조회 실패:", customMakesError)
    } else if (customMakes && customMakes.length > 0) {
      // 재료비(cost_materials) 우선, 없으면 총 비용(cost_total) 사용
      currentTotal =
        customMakes.reduce((sum: number, make: any) => {
          // 재료비 우선, 없으면 총 비용의 70% 추정 (재료비가 대부분)
          const cost =
            parseFloat(make.cost_materials?.toString() || "0") ||
            parseFloat(make.cost_total?.toString() || "0") * 0.7 ||
            0
          return sum + cost
        }, 0) || 0
    }

    const limit = 100000 // 10만원 한도 (재료비 기준)
    const newTotal = currentTotal + amount
    const isExceeded = newTotal > limit

    console.log("[Business Actions] 맞춤제작비 한도 체크 결과:", {
      clientId,
      currentTotal,
      newAmount: amount,
      newTotal,
      limit,
      isExceeded,
    })

    return {
      success: true,
      currentTotal,
      newTotal,
      limit,
      isExceeded,
    }
  } catch (error) {
    console.error("[Business Actions] 맞춤제작비 한도 체크 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 수리비 10만원 한도 체크
 * @param clientId 대상자 ID
 * @param amount 신규 수리비 금액
 * @returns 연간 누적 수리비 및 한도 여부
 */
export async function checkRepairLimit(
  clientId: string,
  amount: number
): Promise<{
  success: boolean
  currentTotal?: number
  newTotal?: number
  limit?: number
  isExceeded?: boolean
  error?: string
}> {
  try {
    console.log("[Business Actions] 수리비 한도 체크:", { clientId, amount })

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 올해 연도 계산
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1).toISOString()
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString()

    // 올해 누적 수리비 계산 (service_logs 테이블에서)
    // service_logs와 applications를 JOIN하여 client_id로 필터링
    const { data: serviceLogs, error: serviceLogsError } = await supabase
      .from("service_logs")
      .select(
        `
        cost_total,
        applications!inner (
          id,
          client_id
        )
      `
      )
      .eq("service_type", "repair")
      .eq("applications.client_id", clientId)
      .gte("service_date", yearStart.split("T")[0])
      .lte("service_date", yearEnd.split("T")[0])

    let currentTotal = 0

    if (serviceLogsError) {
      console.error("[Business Actions] service_logs 조회 실패:", serviceLogsError)
      // JOIN이 실패할 경우 대체 방법 사용
      // 1. 해당 client의 수리 신청서 조회
      const { data: applications, error: appsError } = await supabase
        .from("applications")
        .select("id")
        .eq("client_id", clientId)
        .eq("category", "aftercare")
        .eq("sub_category", "repair")

      if (!appsError && applications && applications.length > 0) {
        const applicationIds = applications.map((app) => app.id)

        // 2. 해당 신청서들의 service_logs 조회
        const { data: logs, error: logsError } = await supabase
          .from("service_logs")
          .select("cost_total")
          .eq("service_type", "repair")
          .in("application_id", applicationIds)
          .gte("service_date", yearStart.split("T")[0])
          .lte("service_date", yearEnd.split("T")[0])

        if (!logsError && logs) {
          currentTotal =
            logs.reduce((sum: number, log: any) => {
              const cost = parseFloat(log.cost_total?.toString() || "0") || 0
              return sum + cost
            }, 0) || 0
        }
      }
    } else if (serviceLogs && serviceLogs.length > 0) {
      // JOIN 성공 시
      currentTotal =
        serviceLogs.reduce((sum: number, log: any) => {
          const cost = parseFloat(log.cost_total?.toString() || "0") || 0
          return sum + cost
        }, 0) || 0
    }

    const limit = 100000 // 10만원 한도
    const newTotal = currentTotal + amount
    const isExceeded = newTotal > limit

    console.log("[Business Actions] 수리비 한도 체크 결과:", {
      clientId,
      currentTotal,
      newAmount: amount,
      newTotal,
      limit,
      isExceeded,
    })

    return {
      success: true,
      currentTotal,
      newTotal,
      limit,
      isExceeded,
    }
  } catch (error) {
    console.error("[Business Actions] 수리비 한도 체크 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}
