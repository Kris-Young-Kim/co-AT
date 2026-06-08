'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type { HrOvertimeRecord, UpsertOvertimeInput } from '@co-at/types'

/** 월별 시간외근무 조회 */
export async function getOvertimeByMonth(
  yearMonth: string
): Promise<(HrOvertimeRecord & { hr_employees: { name: string; department: string } | null })[]> {
  const supabase = createSupabaseAdmin()
  const start = `${yearMonth}-01`
  const year = parseInt(yearMonth.slice(0, 4))
  const month = parseInt(yearMonth.slice(5, 7))
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('hr_overtime_records')
    .select('*, hr_employees(name, department)')
    .gte('date', start)
    .lte('date', end)
    .order('date')
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as (HrOvertimeRecord & { hr_employees: { name: string; department: string } | null })[]
}

/** 직원별 시간외근무 조회 */
export async function getOvertimeByEmployee(
  employeeId: string,
  yearMonth: string
): Promise<HrOvertimeRecord[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_overtime_records')
    .select('*')
    .eq('employee_id', employeeId)
    .like('date', `${yearMonth}%`)
    .order('date')
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as HrOvertimeRecord[]
}

/** 주별 근무시간 조회 (주52시간 모니터링용) */
export async function getWeeklyWorkMinutes(yearMonth: string): Promise<
  { week: string; employee_id: string; name: string; department: string; total_minutes: number }[]
> {
  const supabase = createSupabaseAdmin()
  const start = `${yearMonth}-01`
  const year = parseInt(yearMonth.slice(0, 4))
  const month = parseInt(yearMonth.slice(5, 7))
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('hr_overtime_records')
    .select('*, hr_employees(name, department)')
    .gte('date', start)
    .lte('date', end)
  if (error) throw new Error(error.message)

  type Row = { date: string; employee_id: string; total_minutes: number; hr_employees: { name: string; department: string } | null }
  const rows = (data ?? []) as unknown as Row[]

  const map = new Map<string, { week: string; employee_id: string; name: string; department: string; total_minutes: number }>()

  for (const row of rows) {
    const d = new Date(row.date)
    // ISO 주 번호 (월요일 기준)
    const dayOfWeek = (d.getDay() + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - dayOfWeek)
    const weekStr = monday.toISOString().slice(0, 10)
    const key = `${row.employee_id}_${weekStr}`

    const existing = map.get(key) ?? {
      week: weekStr,
      employee_id: row.employee_id,
      name: row.hr_employees?.name ?? '—',
      department: row.hr_employees?.department ?? '—',
      total_minutes: 0,
    }
    existing.total_minutes += row.total_minutes
    map.set(key, existing)
  }

  return [...map.values()].sort((a, b) => a.week.localeCompare(b.week) || a.name.localeCompare(b.name))
}

/** 출퇴근 기록에서 시간외근무 자동 계산 및 upsert */
export async function upsertOvertimeFromAttendance(
  employeeId: string,
  date: string,
  checkIn: string,
  checkOut: string
): Promise<void> {
  const supabase = createSupabaseAdmin()

  const inTime = new Date(`${date}T${checkIn}`)
  const outTime = new Date(`${date}T${checkOut}`)
  if (outTime <= inTime) return

  const totalMin = Math.floor((outTime.getTime() - inTime.getTime()) / 60000)
  const REGULAR = 8 * 60 // 소정근로 480분

  const regular_minutes = Math.min(totalMin, REGULAR)
  const overtime_minutes = Math.max(0, totalMin - REGULAR)

  // 야간근로: 22:00 ~ 다음날 06:00 겹치는 시간 계산
  const night22 = new Date(`${date}T22:00:00`)
  const night06 = new Date(`${date}T06:00:00`)
  night06.setDate(night06.getDate() + 1)
  const nightStart = Math.max(inTime.getTime(), night22.getTime())
  const nightEnd = Math.min(outTime.getTime(), night06.getTime())
  const night_minutes = nightEnd > nightStart ? Math.floor((nightEnd - nightStart) / 60000) : 0

  const { error } = await supabase
    .from('hr_overtime_records')
    .upsert(
      {
        employee_id: employeeId,
        date,
        regular_minutes,
        overtime_minutes,
        night_minutes,
        holiday_minutes: 0,
        total_minutes: totalMin,
      },
      { onConflict: 'employee_id,date' }
    )
  if (error) throw new Error(error.message)
}

/** 시간외근무 upsert (수동 입력) */
export async function upsertOvertimeRecord(input: UpsertOvertimeInput): Promise<void> {
  const supabase = createSupabaseAdmin()
  const total =
    (input.regular_minutes ?? 0) +
    (input.overtime_minutes ?? 0) +
    (input.night_minutes ?? 0) +
    (input.holiday_minutes ?? 0)

  const { error } = await supabase
    .from('hr_overtime_records')
    .upsert(
      {
        employee_id: input.employee_id,
        date: input.date,
        regular_minutes: input.regular_minutes ?? 0,
        overtime_minutes: input.overtime_minutes ?? 0,
        night_minutes: input.night_minutes ?? 0,
        holiday_minutes: input.holiday_minutes ?? 0,
        total_minutes: total,
        note: input.note,
      },
      { onConflict: 'employee_id,date' }
    )
  if (error) throw new Error(error.message)
}
