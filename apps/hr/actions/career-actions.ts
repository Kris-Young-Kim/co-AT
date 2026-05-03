'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import type { HrCareer, CreateCareerInput } from '@co-at/types'

export async function getCareersByEmployee(employeeId: string): Promise<HrCareer[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_careers')
    .select('*')
    .eq('employee_id', employeeId)
    .order('start_date', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function createCareer(input: CreateCareerInput): Promise<HrCareer | null> {
  await assertRole('manager')
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_careers')
    .insert({
      employee_id:  input.employee_id,
      organization: input.organization,
      position:     input.position,
      start_date:   input.start_date,
      end_date:     input.end_date ?? null,
      description:  input.description ?? null,
    })
    .select()
    .single()
  if (error) {
    console.error('[createCareer]', error)
    return null
  }
  return data
}

export async function deleteCareer(id: string): Promise<boolean> {
  await assertRole('admin')
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_careers')
    .delete()
    .eq('id', id)
  return !error
}
