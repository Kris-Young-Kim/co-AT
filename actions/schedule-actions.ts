"use server"

import { createClient } from "@/lib/supabase/server"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { hasAdminOrStaffPermission, getCurrentUserProfileId } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface PublicSchedule {
  id: string
  schedule_type: "exhibition" | "education"
  scheduled_date: string
  scheduled_time: string | null
  address: string | null
  notes: string | null
  status: "scheduled" | "completed" | "cancelled"
}

/**
 * 공개 일정 조회 (견학, 교육 일정만)
 * schedule_type이 'exhibition' 또는 'education'인 일정만 반환
 */
export async function getPublicSchedules(
  year?: number,
  month?: number
): Promise<PublicSchedule[]> {
  const supabase = await createClient()

  let query = supabase
    .from("schedules")
    .select("id, schedule_type, scheduled_date, scheduled_time, address, notes, status")
    .in("schedule_type", ["exhibition", "education"])
    .eq("status", "scheduled")
    .order("scheduled_date", { ascending: true })

  // 특정 년/월 필터링
  if (year && month) {
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    query = query
      .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
      .lte("scheduled_date", format(endDate, "yyyy-MM-dd"))
  }

  const { data, error } = await query

  if (error) {
    console.error("공개 일정 조회 실패:", error)
    return []
  }

  return data || []
}

/**
 * 특정 날짜의 공개 일정 조회
 */
export async function getPublicSchedulesByDate(
  date: Date
): Promise<PublicSchedule[]> {
  const dateStr = format(date, "yyyy-MM-dd")
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("schedules")
    .select("id, schedule_type, scheduled_date, scheduled_time, address, notes, status")
    .in("schedule_type", ["exhibition", "education"])
    .eq("scheduled_date", dateStr)
    .eq("status", "scheduled")
    .order("scheduled_time", { ascending: true })

  if (error) {
    console.error("일정 조회 실패:", error)
    return []
  }

  return data || []
}

// 관리자용 일정 타입 정의
export interface Schedule {
  id: string
  application_id: string | null
  staff_id: string
  client_id: string | null
  schedule_type: "visit" | "consult" | "assessment" | "delivery" | "pickup" | "exhibition" | "education"
  scheduled_date: string
  scheduled_time: string | null
  address: string | null
  notes: string | null
  status: "scheduled" | "completed" | "cancelled"
  created_at: string | null
  updated_at: string | null
}

export interface CreateScheduleInput {
  application_id?: string | null
  client_id?: string | null
  schedule_type: "visit" | "consult" | "assessment" | "delivery" | "pickup" | "exhibition" | "education"
  scheduled_date: string
  scheduled_time?: string | null
  address?: string | null
  notes?: string | null
  status?: "scheduled" | "completed" | "cancelled"
}

export interface UpdateScheduleInput {
  id: string
  application_id?: string | null
  client_id?: string | null
  schedule_type?: "visit" | "consult" | "assessment" | "delivery" | "pickup" | "exhibition" | "education"
  scheduled_date?: string
  scheduled_time?: string | null
  address?: string | null
  notes?: string | null
  status?: "scheduled" | "completed" | "cancelled"
}

/**
 * 관리자용 일정 조회 (모든 타입, 모든 상태)
 */
export async function getSchedules(
  year?: number,
  month?: number,
  scheduleType?: string,
  status?: string
): Promise<{ success: boolean; data?: Schedule[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      console.error("[일정 조회] 권한 없음")
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()
    let query = supabase
      .from("schedules")
      .select("*")
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })

    // 특정 년/월 필터링
    if (year && month) {
      const startDate = startOfMonth(new Date(year, month - 1))
      const endDate = endOfMonth(new Date(year, month - 1))

      query = query
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"))
    }

    // 일정 타입 필터링
    if (scheduleType) {
      query = query.eq("schedule_type", scheduleType)
    }

    // 상태 필터링
    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[일정 조회] 실패:", error)
      return { success: false, error: error.message }
    }

    console.log("[일정 조회] 성공:", data?.length || 0, "개")
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[일정 조회] 예외:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * 일정 생성
 */
export async function createSchedule(
  input: CreateScheduleInput
): Promise<{ success: boolean; data?: Schedule; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      console.error("[일정 생성] 권한 없음")
      return { success: false, error: "권한이 없습니다" }
    }

    const staffId = await getCurrentUserProfileId()
    if (!staffId) {
      console.error("[일정 생성] 사용자 프로필 ID 없음")
      return { success: false, error: "사용자 정보를 찾을 수 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("schedules")
      .insert({
        staff_id: staffId,
        application_id: input.application_id || null,
        client_id: input.client_id || null,
        schedule_type: input.schedule_type,
        scheduled_date: input.scheduled_date,
        scheduled_time: input.scheduled_time || null,
        address: input.address || null,
        notes: input.notes || null,
        status: input.status || "scheduled",
      })
      .select()
      .single()

    if (error) {
      console.error("[일정 생성] 실패:", error)
      return { success: false, error: error.message }
    }

    console.log("[일정 생성] 성공:", data.id)
    revalidatePath("/admin/schedule")
    revalidatePath("/") // 메인페이지 캘린더도 갱신
    return { success: true, data }
  } catch (error) {
    console.error("[일정 생성] 예외:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * 일정 수정
 */
export async function updateSchedule(
  input: UpdateScheduleInput
): Promise<{ success: boolean; data?: Schedule; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      console.error("[일정 수정] 권한 없음")
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const updateData: Partial<CreateScheduleInput> = {}
    if (input.application_id !== undefined) updateData.application_id = input.application_id
    if (input.client_id !== undefined) updateData.client_id = input.client_id
    if (input.schedule_type) updateData.schedule_type = input.schedule_type
    if (input.scheduled_date) updateData.scheduled_date = input.scheduled_date
    if (input.scheduled_time !== undefined) updateData.scheduled_time = input.scheduled_time
    if (input.address !== undefined) updateData.address = input.address
    if (input.notes !== undefined) updateData.notes = input.notes
    if (input.status) updateData.status = input.status

    const { data, error } = await supabase
      .from("schedules")
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single()

    if (error) {
      console.error("[일정 수정] 실패:", error)
      return { success: false, error: error.message }
    }

    console.log("[일정 수정] 성공:", data.id)
    revalidatePath("/admin/schedule")
    revalidatePath("/") // 메인페이지 캘린더도 갱신
    return { success: true, data }
  } catch (error) {
    console.error("[일정 수정] 예외:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * 일정 삭제
 */
export async function deleteSchedule(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      console.error("[일정 삭제] 권한 없음")
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[일정 삭제] 실패:", error)
      return { success: false, error: error.message }
    }

    console.log("[일정 삭제] 성공:", id)
    revalidatePath("/admin/schedule")
    revalidatePath("/") // 메인페이지 캘린더도 갱신
    return { success: true }
  } catch (error) {
    console.error("[일정 삭제] 예외:", error)
    return { success: false, error: String(error) }
  }
}
