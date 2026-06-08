import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { upsertOvertimeFromAttendance } from '@/actions/overtime-actions'

export const runtime = 'nodejs'

/**
 * 월말 근태 자동 집계 Cron
 * Schedule: 매월 1일 01:00 KST (= 매월 1일 16:00 UTC)
 * 전월 출퇴근 기록을 기반으로 hr_overtime_records를 자동 생성/갱신
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  // 전월 계산
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const year = prevMonth.getFullYear()
  const mon = prevMonth.getMonth() + 1
  const yearMonth = `${year}-${String(mon).padStart(2, '0')}`
  const lastDay = new Date(year, mon, 0).getDate()

  const supabase = createSupabaseAdmin()
  const { data: records, error } = await supabase
    .from('hr_attendance_records')
    .select('employee_id, date, check_in, check_out')
    .gte('date', `${yearMonth}-01`)
    .lte('date', `${yearMonth}-${String(lastDay).padStart(2, '0')}`)
    .not('check_in', 'is', null)
    .not('check_out', 'is', null)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  type AttRow = { employee_id: string; date: string; check_in: string; check_out: string }
  const rows = (records ?? []) as unknown as AttRow[]

  let processed = 0
  let failed = 0

  for (const row of rows) {
    try {
      await upsertOvertimeFromAttendance(
        row.employee_id,
        row.date,
        row.check_in,
        row.check_out
      )
      processed++
    } catch {
      failed++
    }
  }

  return Response.json({
    success: true,
    yearMonth,
    processed,
    failed,
    total: rows.length,
  })
}
