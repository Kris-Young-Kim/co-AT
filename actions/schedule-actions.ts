"use server"

import { createClient } from "@/lib/supabase/server"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ko } from "date-fns/locale"

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

