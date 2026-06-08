'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type {
  HrDailyAbsence,
  CreateDailyAbsenceInput,
  ReviewDailyAbsenceInput,
} from '@co-at/types'

export type AbsenceWithEmployee = HrDailyAbsence & {
  hr_employees: { name: string; department: string } | null
}

/** 월별 부재 목록 */
export async function getDailyAbsencesByMonth(
  yearMonth: string,
  employeeId?: string
): Promise<AbsenceWithEmployee[]> {
  const supabase = createSupabaseAdmin()
  const lastDay = new Date(
    parseInt(yearMonth.slice(0, 4)),
    parseInt(yearMonth.slice(5, 7)),
    0
  ).getDate()

  let query = supabase
    .from('hr_daily_absences')
    .select('*, hr_employees(name, department)')
    .gte('date', `${yearMonth}-01`)
    .lte('date', `${yearMonth}-${String(lastDay).padStart(2, '0')}`)
    .order('date')
    .order('created_at')

  if (employeeId) query = query.eq('employee_id', employeeId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AbsenceWithEmployee[]
}

/** 특정 날짜 직원 부재 조회 */
export async function getDailyAbsencesByDate(date: string): Promise<AbsenceWithEmployee[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_daily_absences')
    .select('*, hr_employees(name, department)')
    .eq('date', date)
    .order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AbsenceWithEmployee[]
}

/** 부재 신청 등록 */
export async function createDailyAbsence(input: CreateDailyAbsenceInput): Promise<void> {
  const supabase = createSupabaseAdmin()

  // 반차는 고정 시간 자동 설정
  let startTime = input.start_time ?? null
  let endTime = input.end_time ?? null
  let duration = input.duration_minutes

  if (input.type === 'half_am') {
    startTime = '09:00'
    endTime = '14:00'
    duration = 300
  } else if (input.type === 'half_pm') {
    startTime = '14:00'
    endTime = '18:00'
    duration = 240
  }

  // 30분 단위 보정
  duration = Math.round(duration / 30) * 30

  const { error } = await supabase.from('hr_daily_absences').insert({
    employee_id: input.employee_id,
    date: input.date,
    type: input.type,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: duration,
    reason: input.reason ?? null,
  })
  if (error) throw new Error(error.message)
}

/** 부재 승인/반려 */
export async function reviewDailyAbsence(input: ReviewDailyAbsenceInput): Promise<void> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_daily_absences')
    .update({
      status: input.status,
      reviewed_by: input.reviewed_by || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.id)
  if (error) throw new Error(error.message)
}

/** 부재 취소/삭제 (pending 상태만) */
export async function deleteDailyAbsence(id: string): Promise<void> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_daily_absences')
    .delete()
    .eq('id', id)
    .eq('status', 'pending')
  if (error) throw new Error(error.message)
}

/** 근무현황 집계용 — 직원별 월간 부재 통계 */
export async function getAbsenceSummaryByMonth(yearMonth: string): Promise<
  Map<string, { outing: number; half_am: number; half_pm: number; late: number; outing_minutes: number; late_minutes: number }>
> {
  const absences = await getDailyAbsencesByMonth(yearMonth)
  const approved = absences.filter(a => a.status === 'approved')

  const map = new Map<string, { outing: number; half_am: number; half_pm: number; late: number; outing_minutes: number; late_minutes: number }>()

  for (const a of approved) {
    const key = a.employee_id
    const entry = map.get(key) ?? { outing: 0, half_am: 0, half_pm: 0, late: 0, outing_minutes: 0, late_minutes: 0 }
    if (a.type === 'outing')   { entry.outing++;  entry.outing_minutes += a.duration_minutes }
    if (a.type === 'half_am')  { entry.half_am++ }
    if (a.type === 'half_pm')  { entry.half_pm++ }
    if (a.type === 'late')     { entry.late++;    entry.late_minutes += a.duration_minutes }
    map.set(key, entry)
  }

  return map
}
