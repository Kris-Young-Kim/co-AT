'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'

const ADMIN = 'admin' as const

export type PayItemRow = {
  id: string
  name: string
  type: 'pay' | 'deduction'
  is_statutory: boolean
  rate: number | null
  fixed_amount: number | null
  is_active: boolean
}

export async function createPayItem(input: Omit<PayItemRow, 'id'>): Promise<PayItemRow | null> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin() as ReturnType<typeof createSupabaseAdmin> & { from: (t: string) => any }
  const { data, error } = await (supabase as any)
    .from('hr_pay_items')
    .insert(input)
    .select()
    .single()
  if (error) { console.error('[createPayItem]', error); return null }
  return data
}

export async function updatePayItem(id: string, input: Partial<Omit<PayItemRow, 'id' | 'is_statutory'>>): Promise<boolean> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await (supabase as any)
    .from('hr_pay_items')
    .update(input)
    .eq('id', id)
  return !error
}

export async function deletePayItem(id: string): Promise<boolean> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await (supabase as any)
    .from('hr_pay_items')
    .delete()
    .eq('id', id)
    .eq('is_statutory', false)
  return !error
}
