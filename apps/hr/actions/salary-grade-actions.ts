'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import type { HrSalaryGrade, CreateSalaryGradeInput, UpdateSalaryGradeInput } from '@co-at/types'

const ADMIN = 'admin' as const

export async function getSalaryGrades(): Promise<HrSalaryGrade[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_salary_grades')
    .select('*')
    .order('grade_name')
  if (error) {
    console.error('[getSalaryGrades]', error)
    return []
  }
  return data ?? []
}

export async function createSalaryGrade(input: CreateSalaryGradeInput): Promise<HrSalaryGrade | null> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_salary_grades')
    .insert({ grade_name: input.grade_name, base_salary: input.base_salary })
    .select()
    .single()
  if (error) {
    console.error('[createSalaryGrade]', error)
    return null
  }
  return data
}

export async function updateSalaryGrade(id: string, input: UpdateSalaryGradeInput): Promise<HrSalaryGrade | null> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_salary_grades')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error('[updateSalaryGrade]', error)
    return null
  }
  return data
}

export async function deleteSalaryGrade(id: string): Promise<boolean> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('hr_salary_grades').delete().eq('id', id)
  return !error
}
