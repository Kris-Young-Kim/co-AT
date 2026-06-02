'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface SatisfactionSummary {
  count: number
  average: number
  score5: number
  score4: number
  score3: number
  score2: number
  score1: number
}

export async function getSatisfactionSummary(year: number): Promise<
  { success: true; summary: SatisfactionSummary } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    // satisfaction_score column added in migration 066 — cast required until types are regenerated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('eval_service_records')
      .select('satisfaction_score')
      .eq('application_year', year)
      .not('satisfaction_score', 'is', null)

    if (error) return { success: false, error: error.message }

    const rows = (data ?? []) as { satisfaction_score: number }[]
    const count = rows.length

    if (count === 0) {
      return { success: true, summary: { count: 0, average: 0, score5: 0, score4: 0, score3: 0, score2: 0, score1: 0 } }
    }

    const dist = { score5: 0, score4: 0, score3: 0, score2: 0, score1: 0 }
    let total = 0
    for (const r of rows) {
      total += r.satisfaction_score
      if (r.satisfaction_score === 5) dist.score5++
      else if (r.satisfaction_score === 4) dist.score4++
      else if (r.satisfaction_score === 3) dist.score3++
      else if (r.satisfaction_score === 2) dist.score2++
      else if (r.satisfaction_score === 1) dist.score1++
    }

    return {
      success: true,
      summary: { count, average: Math.round((total / count) * 10) / 10, ...dist },
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
