"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

export interface DashboardStats {
  newToday: number
  inProgress: number
  completedToday: number
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

    const stats: DashboardStats = {
      newToday: newTodayCount || 0,
      inProgress: inProgressCount || 0,
      completedToday: completedTodayCount || 0,
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

