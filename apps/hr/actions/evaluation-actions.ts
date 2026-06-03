'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import type {
  HrEvaluation,
  EvaluationWithEmployee,
  CreateEvaluationInput,
  UpdateEvaluationInput,
  EvalStatus,
} from '@co-at/types'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getEvaluations(
  year: number,
  period?: string
): Promise<Result<EvaluationWithEmployee[]>> {
  try {
    const supabase = createSupabaseAdmin()
    let query = supabase
      .from('hr_evaluations')
      .select('*, employee:hr_employees!employee_id(name,department,position), evaluator:hr_employees!evaluator_id(name)')
      .eq('year', year)
      .order('created_at', { ascending: false })

    if (period) query = query.eq('period', period)

    const { data, error } = await query
    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as EvaluationWithEmployee[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getEmployeeEvaluations(employeeId: string): Promise<Result<HrEvaluation[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_evaluations')
      .select('*')
      .eq('employee_id', employeeId)
      .order('year', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as HrEvaluation[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createEvaluation(input: CreateEvaluationInput): Promise<Result<HrEvaluation>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_evaluations')
      .insert({
        employee_id:  input.employee_id,
        evaluator_id: input.evaluator_id ?? null,
        year:         input.year,
        period:       input.period,
        rating:       input.rating ?? null,
        score:        input.score ?? null,
        strengths:    input.strengths ?? null,
        improvements: input.improvements ?? null,
        comment:      input.comment ?? null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/performance')
    return { success: true, data: data as HrEvaluation }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateEvaluation(id: string, input: UpdateEvaluationInput): Promise<Result<HrEvaluation>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_evaluations')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/performance')
    return { success: true, data: data as HrEvaluation }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function changeEvaluationStatus(id: string, status: EvalStatus): Promise<Result<HrEvaluation>> {
  return updateEvaluation(id, { status })
}

export async function deleteEvaluation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('hr_evaluations').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/performance')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
