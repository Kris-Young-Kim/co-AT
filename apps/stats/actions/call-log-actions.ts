'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getCallLogMonthlyCount(year: number): Promise<
  | { success: true; total: number; monthly: { month: number; count: number }[] }
  | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('call_logs')
      .select('log_date')
      .gte('log_date', `${year}-01-01`)
      .lte('log_date', `${year}-12-31`)

    if (error) return { success: false, error: error.message }

    const monthly: { month: number; count: number }[] = []
    const countByMonth: Record<number, number> = {}

    for (const row of (data ?? []) as { log_date: string }[]) {
      const m = new Date(row.log_date).getMonth() + 1
      countByMonth[m] = (countByMonth[m] ?? 0) + 1
    }

    for (let m = 1; m <= 12; m++) {
      monthly.push({ month: m, count: countByMonth[m] ?? 0 })
    }

    const total = Object.values(countByMonth).reduce((s, c) => s + c, 0)
    return { success: true, total, monthly }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
