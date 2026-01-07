"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import type { Database } from "@/types/database.types"
import { asTableRowsPick } from "@/lib/utils/supabase-types"

export interface YearOverYearComparison {
  currentYear: number
  previousYear: number
  period: {
    start: string
    end: string
  }
  comparison: {
    applications: {
      current: number
      previous: number
      change: number
      changePercent: number
    }
    completed: {
      current: number
      previous: number
      change: number
      changePercent: number
    }
    byCategory: {
      category: string
      current: number
      previous: number
      change: number
      changePercent: number
    }[]
  }
}

export interface TeamPerformance {
  team: string | null
  teamName: string
  staffCount: number
  applications: {
    total: number
    completed: number
    inProgress: number
  }
  serviceLogs: {
    total: number
    totalCost: number
  }
  schedules: {
    total: number
    completed: number
  }
}

export interface BudgetExecution {
  period: {
    start: string
    end: string
  }
  total: {
    budget: number | null // 예산 (설정 시)
    spent: number
    remaining: number | null
    utilizationRate: number | null
  }
  byCategory: {
    category: string
    spent: number
    count: number
  }[]
  byMonth: {
    month: string
    spent: number
    count: number
  }[]
}

/**
 * 전년 동기 대비 실적 비교
 */
export async function getYearOverYearComparison(
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean
  comparison?: YearOverYearComparison
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 날짜 범위 설정 (기본값: 올해 1월 1일 ~ 오늘)
    const today = new Date()
    const currentYear = today.getFullYear()
    const periodStart = startDate
      ? new Date(startDate)
      : new Date(currentYear, 0, 1)
    const periodEnd = endDate ? new Date(endDate) : today

    // 전년도 같은 기간
    const previousYearStart = new Date(periodStart)
    previousYearStart.setFullYear(currentYear - 1)
    const previousYearEnd = new Date(periodEnd)
    previousYearEnd.setFullYear(currentYear - 1)

    const currentStartStr = periodStart.toISOString()
    const currentEndStr = periodEnd.toISOString()
    const previousStartStr = previousYearStart.toISOString()
    const previousEndStr = previousYearEnd.toISOString()

    // 올해 신청서 수
    const { count: currentApplications } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .gte("created_at", currentStartStr)
      .lte("created_at", currentEndStr)

    // 전년도 신청서 수
    const { count: previousApplications } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .gte("created_at", previousStartStr)
      .lte("created_at", previousEndStr)

    // 올해 완료 건수
    const { count: currentCompleted } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "완료")
      .gte("updated_at", currentStartStr)
      .lte("updated_at", currentEndStr)

    // 전년도 완료 건수
    const { count: previousCompleted } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "완료")
      .gte("updated_at", previousStartStr)
      .lte("updated_at", previousEndStr)

    // 카테고리별 비교
    const categories = ["consult", "custom", "aftercare", "education"]
    const byCategory = await Promise.all(
      categories.map(async (category) => {
        const { count: currentCount } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("category", category)
          .gte("created_at", currentStartStr)
          .lte("created_at", currentEndStr)

        const { count: previousCount } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("category", category)
          .gte("created_at", previousStartStr)
          .lte("created_at", previousEndStr)

        const current = currentCount || 0
        const previous = previousCount || 0
        const change = current - previous
        const changePercent = previous > 0 ? (change / previous) * 100 : 0

        return {
          category,
          current,
          previous,
          change,
          changePercent: Math.round(changePercent * 10) / 10,
        }
      })
    )

    const currentApps = currentApplications || 0
    const previousApps = previousApplications || 0
    const appsChange = currentApps - previousApps
    const appsChangePercent =
      previousApps > 0 ? (appsChange / previousApps) * 100 : 0

    const currentComp = currentCompleted || 0
    const previousComp = previousCompleted || 0
    const compChange = currentComp - previousComp
    const compChangePercent =
      previousComp > 0 ? (compChange / previousComp) * 100 : 0

    const comparison: YearOverYearComparison = {
      currentYear,
      previousYear: currentYear - 1,
      period: {
        start: periodStart.toISOString().split("T")[0],
        end: periodEnd.toISOString().split("T")[0],
      },
      comparison: {
        applications: {
          current: currentApps,
          previous: previousApps,
          change: appsChange,
          changePercent: Math.round(appsChangePercent * 10) / 10,
        },
        completed: {
          current: currentComp,
          previous: previousComp,
          change: compChange,
          changePercent: Math.round(compChangePercent * 10) / 10,
        },
        byCategory,
      },
    }

    console.log("[Advanced Dashboard] 전년 동기 대비 실적 비교 성공")
    return { success: true, comparison }
  } catch (error) {
    console.error("[Advanced Dashboard] 전년 동기 대비 실적 비교 실패:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "전년 동기 대비 실적 비교 중 오류가 발생했습니다",
    }
  }
}

/**
 * 팀별 성과 분석
 */
export async function getTeamPerformance(
  year?: number
): Promise<{
  success: boolean
  teams?: TeamPerformance[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const currentYear = year || new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1).toISOString()
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString()

    // 모든 팀 조회
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, team, role")
      .in("role", ["staff", "manager"])

    // profiles가 null일 수 있으므로 빈 배열로 기본값 설정
    const profilesList = asTableRowsPick("profiles", profiles, ["id", "team", "role"])

    if (profilesList.length === 0) {
      return { success: true, teams: [] }
    }

    // 팀별로 그룹화
    const teamMap = new Map<string, TeamPerformance>()

    // 팀 없음도 포함
    teamMap.set("", {
      team: null,
      teamName: "팀 미지정",
      staffCount: 0,
      applications: { total: 0, completed: 0, inProgress: 0 },
      serviceLogs: { total: 0, totalCost: 0 },
      schedules: { total: 0, completed: 0 },
    })

    // 각 프로필의 팀 정보 수집
    for (const profile of profilesList) {
      const team = profile.team || ""
      if (!teamMap.has(team)) {
        teamMap.set(team, {
          team,
          teamName: team || "팀 미지정",
          staffCount: 0,
          applications: { total: 0, completed: 0, inProgress: 0 },
          serviceLogs: { total: 0, totalCost: 0 },
          schedules: { total: 0, completed: 0 },
        })
      }
      const teamData = teamMap.get(team)!
      teamData.staffCount++
    }

    // 각 팀의 실적 조회
    for (const [teamKey, teamData] of teamMap.entries()) {
      // 팀 멤버 ID 목록
      const teamMemberIds = profilesList
        .filter((p) => (p.team || "") === teamKey)
        .map((p) => p.id)

      if (teamMemberIds.length === 0) continue

      // 신청서 통계 (assigned_staff_id 기준)
      const { count: totalApps } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .in("assigned_staff_id", teamMemberIds)
        .gte("created_at", yearStart)
        .lte("created_at", yearEnd)

      const { count: completedApps } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .in("assigned_staff_id", teamMemberIds)
        .eq("status", "완료")
        .gte("updated_at", yearStart)
        .lte("updated_at", yearEnd)

      const { count: inProgressApps } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .in("assigned_staff_id", teamMemberIds)
        .eq("status", "진행")

      // 서비스 로그 통계
      const { count: serviceLogsCount } = await supabase
        .from("service_logs")
        .select("*", { count: "exact", head: true })
        .in("staff_id", teamMemberIds)
        .gte("service_date", yearStart.split("T")[0])
        .lte("service_date", yearEnd.split("T")[0])

      const { data: serviceLogs } = await supabase
        .from("service_logs")
        .select("cost_total")
        .in("staff_id", teamMemberIds)
        .gte("service_date", yearStart.split("T")[0])
        .lte("service_date", yearEnd.split("T")[0])

      const serviceLogsList = asTableRowsPick("service_logs", serviceLogs, ["cost_total"])

      const totalCost =
        serviceLogsList.reduce((sum, log) => sum + (log.cost_total || 0), 0)

      // 일정 통계
      const { count: totalSchedules } = await supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .in("staff_id", teamMemberIds)
        .gte("scheduled_date", yearStart.split("T")[0])
        .lte("scheduled_date", yearEnd.split("T")[0])

      const { count: completedSchedules } = await supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .in("staff_id", teamMemberIds)
        .eq("status", "completed")
        .gte("scheduled_date", yearStart.split("T")[0])
        .lte("scheduled_date", yearEnd.split("T")[0])

      teamData.applications = {
        total: totalApps || 0,
        completed: completedApps || 0,
        inProgress: inProgressApps || 0,
      }
      teamData.serviceLogs = {
        total: serviceLogsCount || 0,
        totalCost,
      }
      teamData.schedules = {
        total: totalSchedules || 0,
        completed: completedSchedules || 0,
      }
    }

    const teams = Array.from(teamMap.values()).sort((a, b) => {
      if (a.team === null) return 1
      if (b.team === null) return -1
      return a.teamName.localeCompare(b.teamName)
    })

    console.log("[Advanced Dashboard] 팀별 성과 분석 성공:", teams.length, "개 팀")
    return { success: true, teams }
  } catch (error) {
    console.error("[Advanced Dashboard] 팀별 성과 분석 실패:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "팀별 성과 분석 중 오류가 발생했습니다",
    }
  }
}

/**
 * 예산 집행 현황
 */
export async function getBudgetExecution(
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean
  budget?: BudgetExecution
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 날짜 범위 설정 (기본값: 올해 1월 1일 ~ 오늘)
    const today = new Date()
    const currentYear = today.getFullYear()
    const periodStart = startDate
      ? new Date(startDate)
      : new Date(currentYear, 0, 1)
    const periodEnd = endDate ? new Date(endDate) : today

    const startStr = periodStart.toISOString().split("T")[0]
    const endStr = periodEnd.toISOString().split("T")[0]

    // 전체 비용 집계
    const { data: allServiceLogs } = await supabase
      .from("service_logs")
      .select("cost_total, service_type, service_date")
      .gte("service_date", startStr)
      .lte("service_date", endStr)
      .not("cost_total", "is", null)

    const allServiceLogsList = asTableRowsPick("service_logs", allServiceLogs, ["cost_total", "service_type", "service_date"])

    const totalSpent =
      allServiceLogsList.reduce((sum, log) => sum + (log.cost_total || 0), 0)

    // 카테고리별 집계
    const categoryMap = new Map<string, { spent: number; count: number }>()
    for (const log of allServiceLogsList) {
      const category = log.service_type || "기타"
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { spent: 0, count: 0 })
      }
      const data = categoryMap.get(category)!
      data.spent += log.cost_total || 0
      data.count++
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      spent: data.spent,
      count: data.count,
    }))

    // 월별 집계
    const monthMap = new Map<string, { spent: number; count: number }>()
    for (const log of allServiceLogsList) {
      if (!log.service_date) continue
      const month = log.service_date.substring(0, 7) // YYYY-MM
      if (!monthMap.has(month)) {
        monthMap.set(month, { spent: 0, count: 0 })
      }
      const data = monthMap.get(month)!
      data.spent += log.cost_total || 0
      data.count++
    }

    const byMonth = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        spent: data.spent,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // 예산은 설정되지 않았으므로 null
    // 향후 예산 테이블이 추가되면 연동 가능
    const budget: BudgetExecution = {
      period: {
        start: startStr,
        end: endStr,
      },
      total: {
        budget: null,
        spent: totalSpent,
        remaining: null,
        utilizationRate: null,
      },
      byCategory,
      byMonth,
    }

    console.log("[Advanced Dashboard] 예산 집행 현황 조회 성공")
    return { success: true, budget }
  } catch (error) {
    console.error("[Advanced Dashboard] 예산 집행 현황 조회 실패:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예산 집행 현황 조회 중 오류가 발생했습니다",
    }
  }
}
