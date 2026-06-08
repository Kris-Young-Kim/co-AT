'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { upsertOvertimeFromAttendance } from './overtime-actions'

export interface QrScanResult {
  success: boolean
  action: 'check_in' | 'check_out' | 'already_complete'
  employee_name: string
  time: string
  message: string
}

/** QR 스캔 처리: 출근 또는 퇴근 자동 판단 */
export async function processQrScan(
  employeeId: string
): Promise<QrScanResult> {
  const supabase = createSupabaseAdmin()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const timeStr = now.toTimeString().slice(0, 5) // HH:MM

  // 직원 정보 확인
  const { data: emp, error: empErr } = await supabase
    .from('hr_employees')
    .select('name')
    .eq('id', employeeId)
    .eq('is_active', true)
    .single()

  if (empErr || !emp) {
    return {
      success: false,
      action: 'check_in',
      employee_name: '—',
      time: timeStr,
      message: '등록된 직원을 찾을 수 없습니다.',
    }
  }

  const empName = emp.name as string

  // 오늘 출퇴근 기록 조회
  const { data: existing } = await supabase
    .from('hr_attendance_records')
    .select('id, check_in, check_out')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .single()

  if (!existing) {
    // 출근 처리
    const { error } = await supabase
      .from('hr_attendance_records')
      .insert({ employee_id: employeeId, date: today, check_in: timeStr })
    if (error) throw new Error(error.message)
    return {
      success: true,
      action: 'check_in',
      employee_name: empName,
      time: timeStr,
      message: `${empName}님 출근 완료 (${timeStr})`,
    }
  }

  if (!existing.check_in) {
    // 출근 시간 없으면 출근 처리
    const { error } = await supabase
      .from('hr_attendance_records')
      .update({ check_in: timeStr })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
    return {
      success: true,
      action: 'check_in',
      employee_name: empName,
      time: timeStr,
      message: `${empName}님 출근 완료 (${timeStr})`,
    }
  }

  if (!existing.check_out) {
    // 퇴근 처리
    const { error } = await supabase
      .from('hr_attendance_records')
      .update({ check_out: timeStr })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)

    // 시간외근무 자동 계산
    await upsertOvertimeFromAttendance(
      employeeId,
      today,
      existing.check_in as string,
      timeStr
    ).catch(() => { /* 오류 무시 — 기록은 성공 */ })

    return {
      success: true,
      action: 'check_out',
      employee_name: empName,
      time: timeStr,
      message: `${empName}님 퇴근 완료 (${timeStr})`,
    }
  }

  // 이미 출퇴근 완료
  return {
    success: false,
    action: 'already_complete',
    employee_name: empName,
    time: timeStr,
    message: `${empName}님은 오늘 출퇴근이 이미 완료되었습니다.`,
  }
}
