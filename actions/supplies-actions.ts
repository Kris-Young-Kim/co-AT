// actions/supplies-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface Supply {
  id: string
  name: string
  category: string | null
  unit: string
  current_stock: number
  minimum_stock: number
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplyTransaction {
  id: string
  supply_id: string
  type: 'in' | 'out'
  quantity: number
  reason: string | null
  clerk_user_id: string
  created_at: string
}

export interface CreateSupplyInput {
  name: string
  category?: string
  unit?: string
  current_stock?: number
  minimum_stock?: number
  location?: string
  notes?: string
}

export async function getSupplies(): Promise<{
  success: boolean
  supplies?: Supply[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('supplies')
      .select('*')
      .order('name')

    if (error) throw error
    return { success: true, supplies: data as Supply[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function createSupply(input: CreateSupplyInput): Promise<{
  success: boolean
  supply?: Supply
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('supplies')
      .insert({
        name: input.name,
        category: input.category ?? null,
        unit: input.unit ?? '개',
        current_stock: input.current_stock ?? 0,
        minimum_stock: input.minimum_stock ?? 0,
        location: input.location ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/admin/supplies')
    return { success: true, supply: data as Supply }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateSupply(
  id: string,
  input: Partial<CreateSupplyInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from('supplies')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    revalidatePath('/admin/supplies')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteSupply(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any).from('supplies').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/admin/supplies')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function addSupplyTransaction(
  supplyId: string,
  type: 'in' | 'out',
  quantity: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()

    const { data: supply } = await (supabase as any)
      .from('supplies')
      .select('current_stock')
      .eq('id', supplyId)
      .single()

    if (!supply) throw new Error('소모품을 찾을 수 없습니다')

    const newStock = type === 'in'
      ? supply.current_stock + quantity
      : supply.current_stock - quantity

    if (newStock < 0) throw new Error('재고가 부족합니다')

    await (supabase as any).from('supply_transactions').insert({
      supply_id: supplyId,
      type,
      quantity,
      reason: reason ?? null,
      clerk_user_id: userId,
    })

    await (supabase as any)
      .from('supplies')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', supplyId)

    revalidatePath('/admin/supplies')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getSupplyTransactions(supplyId: string): Promise<{
  success: boolean
  transactions?: SupplyTransaction[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('supply_transactions')
      .select('*')
      .eq('supply_id', supplyId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return { success: true, transactions: data as SupplyTransaction[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
