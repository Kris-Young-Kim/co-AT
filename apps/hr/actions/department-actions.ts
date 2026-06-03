'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import type {
  HrDepartment,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from '@co-at/types'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getDepartments(): Promise<Result<HrDepartment[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_departments')
      .select('*')
      .order('name')
    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as HrDepartment[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Result<HrDepartment>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_departments')
      .insert({ name: input.name, code: input.code ?? null, description: input.description ?? null })
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/departments')
    return { success: true, data: data as HrDepartment }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput): Promise<Result<HrDepartment>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_departments')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/departments')
    return { success: true, data: data as HrDepartment }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteDepartment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('hr_departments').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/departments')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
