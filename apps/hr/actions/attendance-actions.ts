'use server'

import { createSupabaseAdmin } from '@/apps/hr/lib/supabase-admin'
import type { HrAttendanceRecord, UpsertAttendanceInput } from '@co-at/types'

export async function getAttendanceByEmployee(
  employeeId: string,
  yearMonth: string // 'YYYY-MM'
): Promise<HrAttendanceRecord[]> {
  const supabase = createSupabaseAdmin()
  const startDate = `${yearMonth}-01`
  const endDate = new Date(
    parseInt(yearMonth.split('-')[0]),
    parseInt(yearMonth.split('-')[1]),
    0
  ).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('hr_attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
  if (error) {
    console.error('[getAttendanceByEmployee]', error)
    return []
  }
  return data ?? []
}

export async function getAllAttendance(yearMonth: string): Promise<HrAttendanceRecord[]> {
  const supabase = createSupabaseAdmin()
  const startDate = `${yearMonth}-01`
  const endDate = new Date(
    parseInt(yearMonth.split('-')[0]),
    parseInt(yearMonth.split('-')[1]),
    0
  ).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('hr_attendance_records')
    .select('*, hr_employees(name, department)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
  if (error) return []
  return data ?? []
}

export async function upsertAttendance(input: UpsertAttendanceInput): Promise<HrAttendanceRecord | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_attendance_records')
    .upsert(
      {
        employee_id: input.employee_id,
        date:        input.date,
        check_in:    input.check_in ?? null,
        check_out:   input.check_out ?? null,
        note:        input.note ?? null,
      },
      { onConflict: 'employee_id,date' }
    )
    .select()
    .single()
  if (error) {
    console.error('[upsertAttendance]', error)
    return null
  }
  return data
}
