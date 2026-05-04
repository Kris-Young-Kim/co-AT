'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import type { HrAllowanceType, CreateAllowanceTypeInput } from '@co-at/types'

const ADMIN = 'admin' as const

export async function getAllowanceTypes(): Promise<HrAllowanceType[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_allowance_types')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) {
    console.error('[getAllowanceTypes]', error)
    return []
  }
  return data ?? []
}

export async function createAllowanceType(input: CreateAllowanceTypeInput): Promise<HrAllowanceType | null> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_allowance_types')
    .insert({ name: input.name })
    .select()
    .single()
  if (error) {
    console.error('[createAllowanceType]', error)
    return null
  }
  return data
}

export async function deactivateAllowanceType(id: string): Promise<boolean> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_allowance_types')
    .update({ is_active: false })
    .eq('id', id)
  return !error
}
