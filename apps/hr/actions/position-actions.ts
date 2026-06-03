'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import type {
  HrPosition,
  CreatePositionInput,
  UpdatePositionInput,
} from '@co-at/types'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getPositions(): Promise<Result<HrPosition[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_positions')
      .select('*')
      .order('level', { ascending: false })
    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as HrPosition[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createPosition(input: CreatePositionInput): Promise<Result<HrPosition>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_positions')
      .insert({ name: input.name, code: input.code ?? null, level: input.level ?? 1 })
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/positions')
    return { success: true, data: data as HrPosition }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updatePosition(id: string, input: UpdatePositionInput): Promise<Result<HrPosition>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_positions')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/positions')
    return { success: true, data: data as HrPosition }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deletePosition(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('hr_positions').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/positions')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
