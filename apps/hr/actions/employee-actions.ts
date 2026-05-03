'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import type {
  HrEmployee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from '@co-at/types'

const ADMIN = 'admin' as const

export async function getEmployees(): Promise<HrEmployee[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_employees')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) {
    console.error('[getEmployees]', error)
    return []
  }
  return data ?? []
}

export async function getEmployee(id: string): Promise<HrEmployee | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_employees')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getEmployeeByClerkId(clerkUserId: string): Promise<HrEmployee | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_employees')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
  if (error) return null
  return data
}

export async function createEmployee(input: CreateEmployeeInput): Promise<HrEmployee | null> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_employees')
    .insert({
      clerk_user_id:   input.clerk_user_id ?? null,
      name:            input.name,
      email:           input.email,
      phone:           input.phone ?? null,
      department:      input.department,
      position:        input.position,
      employment_type: input.employment_type,
      hire_date:       input.hire_date,
      leave_date:      input.leave_date ?? null,
    })
    .select()
    .single()
  if (error) {
    console.error('[createEmployee]', error)
    return null
  }
  return data
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<HrEmployee | null> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_employees')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error('[updateEmployee]', error)
    return null
  }
  return data
}

export async function deactivateEmployee(id: string): Promise<boolean> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_employees')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}
