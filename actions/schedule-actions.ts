"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
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
  schedule_type: "visit" | "consult" | "assessment" | "delivery" | "pickup" | "exhibition" | "education" | "custom_make"
  scheduled_date: string
  scheduled_time: string | null
  address: string | null
  notes: string | null
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
  created_at: string | null
  updated_at: string | null
}

export interface CreateScheduleInput {
  application_id?: string | null
  client_id?: string | null
  schedule_type: "visit" | "consult" | "assessment" | "delivery" | "pickup" | "exhibition" | "education" | "custom_make"
  scheduled_date: string
  scheduled_time?: string | null
  address?: string | null
  notes?: string | null
  status?: "scheduled" | "confirmed" | "completed" | "cancelled"
}

export interface UpdateScheduleInput {
  id: string
  application_id?: string | null
  client_id?: string | null
  schedule_type?: "visit" | "consult" | "assessment" | "delivery" | "pickup" | "exhibition" | "education" | "custom_make"
  scheduled_date?: string
  scheduled_time?: string | null
  address?: string | null
  notes?: string | null
  status?: "scheduled" | "confirmed" | "completed" | "cancelled"
}

/**
 * 관리자용 일정 조회 (모든 타입, 모든 상태)
 * 맞춤제작 일정도 함께 조회
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

    const { data: schedules, error } = await query

    if (error) {
      console.error("[일정 조회] 실패:", error)
      return { success: false, error: error.message }
    }

    // 맞춤제작 일정 추가 조회 (custom_makes 테이블의 날짜 필드 기반)
    // schedule_type 필터가 없거나 'custom_make'인 경우에만 조회
    if (!scheduleType || scheduleType === "custom_make") {
      let customMakeQuery = supabase
        .from("custom_makes")
        .select("id, application_id, client_id, assigned_staff_id, item_name, design_start_date, manufacturing_start_date, expected_completion_date, delivery_date, progress_status")
        .in("progress_status", ["design", "manufacturing", "inspection", "delivery", "completed"])

      const { data: customMakes, error: customMakeError } = await customMakeQuery

      if (!customMakeError && customMakes) {
        const staffId = await getCurrentUserProfileId()
        const customMakeSchedules: Schedule[] = []
        const startDateStr = year && month ? format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd") : null
        const endDateStr = year && month ? format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd") : null

        for (const cm of customMakes) {
          // 날짜 필드들을 배열로 만들어서 처리
          const cmTyped = cm as { id?: string; application_id?: string; assigned_staff_id?: string | null; client_id?: string; design_start_date?: string | null; manufacturing_start_date?: string | null; expected_completion_date?: string | null; delivery_date?: string | null; progress_status?: string | null; item_name?: string } | null;
          const dateFields = [
            { date: cmTyped?.design_start_date, label: "설계 시작", type: "design" },
            { date: cmTyped?.manufacturing_start_date, label: "제작 시작", type: "manufacturing" },
            { date: cmTyped?.expected_completion_date, label: "완료 예정", type: "completion" },
            { date: cmTyped?.delivery_date, label: "납품", type: "delivery" },
          ]

          for (const field of dateFields) {
            if (!field.date) continue

            // 년/월 필터링
            if (startDateStr && endDateStr) {
              if (field.date < startDateStr || field.date > endDateStr) continue
            }

            // 상태 결정
            let scheduleStatus: "scheduled" | "confirmed" | "completed" | "cancelled" = "scheduled"
            const cmWithStatus = cmTyped;
            if (field.type === "design") {
              scheduleStatus = cmWithStatus?.progress_status === "design" ? "scheduled" : "completed"
            } else if (field.type === "manufacturing") {
              scheduleStatus = ["manufacturing", "inspection", "delivery", "completed"].includes(cmWithStatus?.progress_status || "") ? "completed" : "scheduled"
            } else if (field.type === "completion" || field.type === "delivery") {
              scheduleStatus = cmWithStatus?.progress_status === "completed" ? "completed" : "scheduled"
            }

            customMakeSchedules.push({
              id: `custom_make_${cmTyped?.id || ""}_${field.type}`,
              application_id: cmTyped?.application_id || "",
              staff_id: cmTyped?.assigned_staff_id || staffId || "",
              client_id: cmTyped?.client_id || "",
              schedule_type: "custom_make",
              scheduled_date: field.date,
              scheduled_time: null,
              address: null,
              notes: `맞춤제작 ${field.label}: ${cmTyped?.item_name || ""}`,
              status: scheduleStatus,
              created_at: null,
              updated_at: null,
            })
          }
        }

        // 기존 일정과 맞춤제작 일정 합치기
        const allSchedules = [...(schedules || []), ...customMakeSchedules]
        // 날짜 및 시간 순으로 정렬
        allSchedules.sort((a, b) => {
          const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date)
          if (dateCompare !== 0) return dateCompare
          return (a.scheduled_time || "").localeCompare(b.scheduled_time || "")
        })

        console.log("[일정 조회] 성공:", allSchedules.length, "개 (일반:", schedules?.length || 0, "개, 맞춤제작:", customMakeSchedules.length, "개)")
        return { success: true, data: allSchedules }
      }
    }

    console.log("[일정 조회] 성공:", schedules?.length || 0, "개")
    return { success: true, data: schedules || [] }
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

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("schedules")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16): TableInsert 타입이 insert 메서드와 완전히 호환되지 않음
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
      console.error("[일정 생성] 실패:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        input,
      })
      return { 
        success: false, 
        error: `일정 생성에 실패했습니다: ${error.message || error.code || "알 수 없는 오류"}` 
      }
    }

    const scheduleData = data as Schedule | null;
    console.log("[일정 생성] 성공:", scheduleData?.id)
    revalidatePath("/admin/schedule")
    revalidatePath("/") // 메인페이지 캘린더도 갱신
    return { success: true, data: scheduleData || undefined }
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

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

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
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16): TableUpdate 타입이 update 메서드와 완전히 호환되지 않음
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single()

    if (error) {
      console.error("[일정 수정] 실패:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        id: input.id,
        updateData,
      })
      return { 
        success: false, 
        error: `일정 수정에 실패했습니다: ${error.message || error.code || "알 수 없는 오류"}` 
      }
    }

    const updatedScheduleData = data as Schedule | null;
    console.log("[일정 수정] 성공:", updatedScheduleData?.id)
    revalidatePath("/admin/schedule")
    revalidatePath("/") // 메인페이지 캘린더도 갱신
    return { success: true, data: updatedScheduleData || undefined }
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

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[일정 삭제] 실패:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        id,
      })
      return { 
        success: false, 
        error: `일정 삭제에 실패했습니다: ${error.message || error.code || "알 수 없는 오류"}` 
      }
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
