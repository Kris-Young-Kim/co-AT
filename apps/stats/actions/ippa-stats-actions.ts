'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface IPPASummary {
  total: number
  completed: number
  preOnly: number
  avgOutcome: number | null
  improvedCount: number
  improvedRate: number | null
}

export async function getIPPASummary(year: number): Promise<
  { success: true; summary: IPPASummary } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('eval_ippa_assessments')
      .select('status, outcome_score')
      .eq('assessment_year', year)

    if (error) return { success: false, error: error.message }

    const rows = (data ?? []) as { status: string; outcome_score: number | null }[]
    const total = rows.length
    const completed = rows.filter((r) => r.status === 'completed')
    const preOnly = rows.filter((r) => r.status === 'pre_only').length

    const scoresWithValue = completed.filter((r) => r.outcome_score !== null)
    const avgOutcome =
      scoresWithValue.length > 0
        ? Math.round(
            (scoresWithValue.reduce((acc, r) => acc + (r.outcome_score as number), 0) /
              scoresWithValue.length) *
              100
          ) / 100
        : null

    const improvedCount = scoresWithValue.filter((r) => (r.outcome_score as number) > 0).length
    const improvedRate =
      scoresWithValue.length > 0
        ? Math.round((improvedCount / scoresWithValue.length) * 100)
        : null

    return {
      success: true,
      summary: {
        total,
        completed: completed.length,
        preOnly,
        avgOutcome,
        improvedCount,
        improvedRate,
      },
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
