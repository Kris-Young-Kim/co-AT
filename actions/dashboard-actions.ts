"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

export interface DashboardStats {
  newToday: number
  inProgress: number
  completedToday: number
  // 4대 사업별 통계
  businessStats: {
    // I. 상담 및 정보제공사업
    consultation: {
      total: number
      today: number
      inProgress: number
      completed: number
    }
    // II. 맞춤형 지원사업
    customSupport: {
      total: number
      today: number
      inProgress: number
      completed: number
      rental: number // 대여 건수
      customMake: number // 맞춤 제작 건수
      assessment: number // 평가지원 건수
    }
    // III. 사후관리 지원사업
    aftercare: {
      total: number
      today: number
      inProgress: number
      completed: number
      cleaning: number // 소독 및 세척 건수
      repair: number // 수리 건수
      reuse: number // 재사용 지원 건수
    }
    // IV. 교육 및 홍보사업
    education: {
      total: number
      today: number
      inProgress: number
      completed: number
      training: number // 교육 건수
      promotion: number // 홍보 건수
    }
  }
}

export interface NewApplication {
  id: string
  category: string | null
  sub_category: string | null
  status: string | null
  created_at: string | null
  client: {
    id: string
    name: string
  } | null
}

export interface TodaySchedule {
  id: string
  schedule_type: string
  scheduled_date: string
  scheduled_time: string | null
  address: string | null
  notes: string | null
  client: {
    id: string
    name: string
  } | null
  staff: {
    id: string
    full_name: string | null
  } | null
}

/**
 * 대시보드 통계 조회 (오늘의 실적 요약)
 */
export async function getDashboardStats(): Promise<{
  success: boolean
  stats?: DashboardStats
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 오늘 날짜 시작 시간 (00:00:00)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.toISOString()

    // 오늘 날짜 종료 시간 (23:59:59)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const todayEndStr = todayEnd.toISOString()

    // 오늘의 신규 접수 건수
    const { count: newTodayCount, error: newTodayError } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "접수")
      .gte("created_at", todayStart)
      .lte("created_at", todayEndStr)

    if (newTodayError) {
      console.error("오늘의 신규 접수 조회 실패:", newTodayError)
    }

    // 진행 중 건수
    const { count: inProgressCount, error: inProgressError } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "진행")

    if (inProgressError) {
      console.error("진행 중 건수 조회 실패:", inProgressError)
    }

    // 오늘 완료 건수
    const { count: completedTodayCount, error: completedTodayError } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "완료")
      .gte("updated_at", todayStart)
      .lte("updated_at", todayEndStr)

    if (completedTodayError) {
      console.error("오늘 완료 건수 조회 실패:", completedTodayError)
    }

    // 4대 사업별 통계 조회
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1).toISOString()
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString()

    // I. 상담 및 정보제공사업 (consult)
    const { count: consultTotal } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "consult")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    const { count: consultToday } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "consult")
      .eq("status", "접수")
      .gte("created_at", todayStart)
      .lte("created_at", todayEndStr)

    const { count: consultInProgress } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "consult")
      .eq("status", "진행")

    const { count: consultCompleted } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "consult")
      .eq("status", "완료")
      .gte("updated_at", yearStart)
      .lte("updated_at", yearEnd)

    // II. 맞춤형 지원사업 (custom)
    const { count: customTotal } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "custom")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    const { count: customToday } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "custom")
      .eq("status", "접수")
      .gte("created_at", todayStart)
      .lte("created_at", todayEndStr)

    const { count: customInProgress } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "custom")
      .eq("status", "진행")

    const { count: customCompleted } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "custom")
      .eq("status", "완료")
      .gte("updated_at", yearStart)
      .lte("updated_at", yearEnd)

    // 대여 건수 (sub_category: rental)
    const { count: rentalCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "custom")
      .eq("sub_category", "rental")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    // 맞춤 제작 건수 (sub_category: custom_make)
    const { count: customMakeCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "custom")
      .eq("sub_category", "custom_make")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    // 평가지원 건수 (category: consult + sub_category: visit 또는 assessment)
    const { count: assessmentCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "consult")
      .in("sub_category", ["visit", "exhibition"])
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    // III. 사후관리 지원사업 (aftercare)
    const { count: aftercareTotal } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "aftercare")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    const { count: aftercareToday } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "aftercare")
      .eq("status", "접수")
      .gte("created_at", todayStart)
      .lte("created_at", todayEndStr)

    const { count: aftercareInProgress } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "aftercare")
      .eq("status", "진행")

    const { count: aftercareCompleted } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "aftercare")
      .eq("status", "완료")
      .gte("updated_at", yearStart)
      .lte("updated_at", yearEnd)

    // 소독 및 세척 건수 (sub_category: cleaning)
    const { count: cleaningCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "aftercare")
      .eq("sub_category", "cleaning")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    // 수리 건수 (sub_category: repair)
    const { count: repairCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "aftercare")
      .eq("sub_category", "repair")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    // 재사용 지원 건수 (sub_category: reuse)
    const { count: reuseCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "aftercare")
      .eq("sub_category", "reuse")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    // IV. 교육 및 홍보사업 (education)
    const { count: educationTotal } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "education")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    const { count: educationToday } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "education")
      .eq("status", "접수")
      .gte("created_at", todayStart)
      .lte("created_at", todayEndStr)

    const { count: educationInProgress } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "education")
      .eq("status", "진행")

    const { count: educationCompleted } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "education")
      .eq("status", "완료")
      .gte("updated_at", yearStart)
      .lte("updated_at", yearEnd)

    // 교육 건수 (sub_category: education 또는 전체 education 카테고리)
    const { count: trainingCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("category", "education")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    // 홍보 건수는 공지사항이나 별도 테이블에서 관리될 수 있음
    // 일단 education 카테고리로 통합 관리
    const promotionCount = 0

    const stats: DashboardStats = {
      newToday: newTodayCount || 0,
      inProgress: inProgressCount || 0,
      completedToday: completedTodayCount || 0,
      businessStats: {
        consultation: {
          total: consultTotal || 0,
          today: consultToday || 0,
          inProgress: consultInProgress || 0,
          completed: consultCompleted || 0,
        },
        customSupport: {
          total: customTotal || 0,
          today: customToday || 0,
          inProgress: customInProgress || 0,
          completed: customCompleted || 0,
          rental: rentalCount || 0,
          customMake: customMakeCount || 0,
          assessment: assessmentCount || 0,
        },
        aftercare: {
          total: aftercareTotal || 0,
          today: aftercareToday || 0,
          inProgress: aftercareInProgress || 0,
          completed: aftercareCompleted || 0,
          cleaning: cleaningCount || 0,
          repair: repairCount || 0,
          reuse: reuseCount || 0,
        },
        education: {
          total: educationTotal || 0,
          today: educationToday || 0,
          inProgress: educationInProgress || 0,
          completed: educationCompleted || 0,
          training: trainingCount || 0,
          promotion: promotionCount,
        },
      },
    }

    return { success: true, stats }
  } catch (error) {
    console.error("Unexpected error in getDashboardStats:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 신규 접수 건 리스트 조회 (최신순)
 */
export async function getNewApplications(limit: number = 10): Promise<{
  success: boolean
  applications?: NewApplication[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        id,
        category,
        sub_category,
        status,
        created_at,
        clients (
          id,
          name
        )
      `
      )
      .eq("status", "접수")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("신규 접수 조회 실패:", error)
      return { success: false, error: "신규 접수 조회에 실패했습니다" }
    }

    const applications: NewApplication[] =
      data?.map((app: any) => ({
        id: app.id,
        category: app.category,
        sub_category: app.sub_category,
        status: app.status,
        created_at: app.created_at,
        client: app.clients
          ? {
              id: app.clients.id,
              name: app.clients.name,
            }
          : null,
      })) || []

    return { success: true, applications }
  } catch (error) {
    console.error("Unexpected error in getNewApplications:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 오늘의 일정 조회 (방문 예정)
 */
export async function getTodaySchedules(): Promise<{
  success: boolean
  schedules?: TodaySchedule[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 오늘 날짜 (YYYY-MM-DD 형식)
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
        id,
        schedule_type,
        scheduled_date,
        scheduled_time,
        address,
        notes,
        clients (
          id,
          name
        ),
        profiles (
          id,
          full_name
        )
      `
      )
      .eq("scheduled_date", todayStr)
      .order("scheduled_time", { ascending: true, nullsFirst: false })

    if (error) {
      console.error("오늘의 일정 조회 실패:", error)
      return { success: false, error: "오늘의 일정 조회에 실패했습니다" }
    }

    const schedules: TodaySchedule[] =
      data?.map((schedule: any) => ({
        id: schedule.id,
        schedule_type: schedule.schedule_type,
        scheduled_date: schedule.scheduled_date,
        scheduled_time: schedule.scheduled_time,
        address: schedule.address,
        notes: schedule.notes,
        client: schedule.clients
          ? {
              id: schedule.clients.id,
              name: schedule.clients.name,
            }
          : null,
        staff: schedule.profiles
          ? {
              id: schedule.profiles.id,
              full_name: schedule.profiles.full_name,
            }
          : null,
      })) || []

    return { success: true, schedules }
  } catch (error) {
    console.error("Unexpected error in getTodaySchedules:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

