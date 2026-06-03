'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type {
  HrSalaryStep,
  HrSalaryStepHistory,
  CreateSalaryStepInput,
  UpdateSalaryStepInput,
  CreateSalaryStepHistoryInput,
} from '@co-at/types'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getSalarySteps(): Promise<Result<HrSalaryStep[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_salary_steps')
      .select('*')
      .order('step_number')
    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as HrSalaryStep[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createSalaryStep(input: CreateSalaryStepInput): Promise<Result<HrSalaryStep>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_salary_steps')
      .insert({
        step_number: input.step_number,
        step_name: input.step_name ?? null,
        base_amount: input.base_amount,
      })
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/salary-steps')
    return { success: true, data: data as HrSalaryStep }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateSalaryStep(id: string, input: UpdateSalaryStepInput): Promise<Result<HrSalaryStep>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_salary_steps')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/salary-steps')
    return { success: true, data: data as HrSalaryStep }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteSalaryStep(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('hr_salary_steps').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/salary-steps')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getStepHistoryByEmployee(employeeId: string): Promise<Result<HrSalaryStepHistory[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_salary_step_history')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false })
    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as HrSalaryStepHistory[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getAllStepHistory(): Promise<Result<(HrSalaryStepHistory & { employee_name: string | null; to_step_number: number | null })[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_salary_step_history')
      .select('*, hr_employees(name), hr_salary_steps!to_step_id(step_number)')
      .order('effective_date', { ascending: false })
      .limit(200)
    if (error) return { success: false, error: error.message }
    const rows = (data ?? []).map((r: Record<string, unknown>) => ({
      ...(r as HrSalaryStepHistory),
      employee_name: (r.hr_employees as { name?: string } | null)?.name ?? null,
      to_step_number: (r.hr_salary_steps as { step_number?: number } | null)?.step_number ?? null,
    }))
    return { success: true, data: rows }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function promoteEmployeeSalaryStep(input: CreateSalaryStepHistoryInput): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    const supabase = createSupabaseAdmin()

    const { error: histError } = await supabase
      .from('hr_salary_step_history')
      .insert({
        employee_id: input.employee_id,
        from_step_id: input.from_step_id ?? null,
        to_step_id: input.to_step_id,
        effective_date: input.effective_date,
        reason: input.reason ?? null,
        created_by: userId,
      })
    if (histError) return { success: false, error: histError.message }

    const { error: empError } = await supabase
      .from('hr_employees')
      .update({ salary_step_id: input.to_step_id, updated_at: new Date().toISOString() })
      .eq('id', input.employee_id)
    if (empError) return { success: false, error: empError.message }

    revalidatePath('/salary-step-promotions')
    revalidatePath('/employees')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
