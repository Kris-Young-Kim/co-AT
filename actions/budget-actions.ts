// actions/budget-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { Budget, BudgetWithActual, CreateBudgetInput } from '@/lib/budget-constants'

export async function getBudgets(year: number): Promise<{
  success: boolean
  budgets?: Budget[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('budgets')
      .select('*')
      .eq('year', year)
      .order('category')

    if (error) throw error
    return { success: true, budgets: data as Budget[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getBudgetsWithActual(year: number): Promise<{
  success: boolean
  data?: BudgetWithActual[]
  totalPlanned?: number
  totalActual?: number
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()

    // 예산 계획 조회
    const { data: budgets, error: budgetErr } = await (supabase as any)
      .from('budgets')
      .select('*')
      .eq('year', year)
      .order('category')

    if (budgetErr) throw budgetErr

    // 실제 지출 집계 (service_logs.cost_total by service_type)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data: logs, error: logErr } = await (supabase as any)
      .from('service_logs')
      .select('service_type, cost_total')
      .gte('service_date', startDate)
      .lte('service_date', endDate)
      .not('cost_total', 'is', null)

    if (logErr) throw logErr

    // 카테고리별 실제 지출 집계
    const actualByCategory: Record<string, number> = {}
    ;(logs ?? []).forEach((log: any) => {
      const cat = log.service_type ?? 'other'
      actualByCategory[cat] = (actualByCategory[cat] ?? 0) + (log.cost_total ?? 0)
    })

    const result: BudgetWithActual[] = (budgets ?? []).map((b: Budget) => {
      const actual = actualByCategory[b.category] ?? 0
      const planned = b.planned_amount
      return {
        ...b,
        actual_amount: actual,
        variance: planned - actual,
        utilization_rate: planned > 0 ? Math.round((actual / planned) * 100) : 0,
      }
    })

    const totalPlanned = result.reduce((s, b) => s + b.planned_amount, 0)
    const totalActual = result.reduce((s, b) => s + b.actual_amount, 0)

    return { success: true, data: result, totalPlanned, totalActual }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function upsertBudget(input: CreateBudgetInput): Promise<{
  success: boolean
  budget?: Budget
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('budgets')
      .upsert(
        {
          year: input.year,
          month: input.month ?? null,
          category: input.category,
          planned_amount: input.planned_amount,
          notes: input.notes ?? null,
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'year,month,category' }
      )
      .select()
      .single()

    if (error) throw error
    revalidatePath('/budget')
    return { success: true, budget: data as Budget }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteBudget(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any).from('budgets').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/budget')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
