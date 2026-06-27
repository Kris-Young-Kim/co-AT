'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface GrantEvalOrgStat {
  org: string
  total: number
  approved: number
  rejected: number
  conditional: number
  pending: number
}

export interface GrantEvalMonthStat {
  month: number
  total: number
  approved: number
}

export interface GrantEvalSummary {
  total: number
  approved: number
  rejected: number
  conditional: number
  pending: number
  completion_rate: number
}

type GrantRow = {
  referral_org: string | null
  assessment_month: number | null
  final_result: string | null
  status: string
}

export async function getGrantEvalSummary(
  year: number
): Promise<{ success: boolean; summary?: GrantEvalSummary; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('eval_grant_assessments')
      .select('final_result, status')
      .eq('assessment_year', year)

    if (error) return { success: false, error: '요약 조회에 실패했습니다' }

    const rows = (data ?? []) as { final_result: string | null; status: string }[]
    const total = rows.length
    const approved = rows.filter(r => r.final_result === '적합').length
    const rejected = rows.filter(r => r.final_result === '부적합').length
    const conditional = rows.filter(r => r.final_result === '조건부적합').length
    const pending = rows.filter(r => !['적합', '부적합', '조건부적합'].includes(r.final_result ?? '')).length
    const completed = rows.filter(r => r.status === 'completed').length

    return {
      success: true,
      summary: {
        total,
        approved,
        rejected,
        conditional,
        pending,
        completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    }
  } catch (e) {
    console.error('getGrantEvalSummary:', e)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}

export async function getGrantEvalStatsByOrg(
  year: number
): Promise<{ success: boolean; stats?: GrantEvalOrgStat[]; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('eval_grant_assessments')
      .select('referral_org, final_result')
      .eq('assessment_year', year)

    if (error) return { success: false, error: '의뢰기관별 통계 조회에 실패했습니다' }

    const rows = (data ?? []) as { referral_org: string | null; final_result: string | null }[]
    const map = new Map<string, GrantEvalOrgStat>()

    for (const row of rows) {
      const org = row.referral_org ?? '미지정'
      const s = map.get(org) ?? { org, total: 0, approved: 0, rejected: 0, conditional: 0, pending: 0 }
      s.total += 1
      if (row.final_result === '적합') s.approved += 1
      else if (row.final_result === '부적합') s.rejected += 1
      else if (row.final_result === '조건부적합') s.conditional += 1
      else s.pending += 1
      map.set(org, s)
    }

    const stats = Array.from(map.values()).sort((a, b) => b.total - a.total)
    return { success: true, stats }
  } catch (e) {
    console.error('getGrantEvalStatsByOrg:', e)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}

export async function getGrantEvalStatsByMonth(
  year: number
): Promise<{ success: boolean; stats?: GrantEvalMonthStat[]; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('eval_grant_assessments')
      .select('assessment_month, final_result')
      .eq('assessment_year', year)

    if (error) return { success: false, error: '월별 통계 조회에 실패했습니다' }

    const rows = (data ?? []) as { assessment_month: number | null; final_result: string | null }[]
    const map = new Map<number, GrantEvalMonthStat>()

    for (const row of rows) {
      const month = row.assessment_month
      if (!month) continue
      const s = map.get(month) ?? { month, total: 0, approved: 0 }
      s.total += 1
      if (row.final_result === '적합') s.approved += 1
      map.set(month, s)
    }

    const stats = Array.from({ length: 12 }, (_, i) => map.get(i + 1) ?? { month: i + 1, total: 0, approved: 0 })
    return { success: true, stats }
  } catch (e) {
    console.error('getGrantEvalStatsByMonth:', e)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}
