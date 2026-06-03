'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import type {
  HrContract,
  ContractWithEmployee,
  CreateContractInput,
  UpdateContractInput,
} from '@co-at/types'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getAllContracts(): Promise<Result<ContractWithEmployee[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .select('*, employee:hr_employees(name,department)')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as ContractWithEmployee[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getContractsByEmployee(employeeId: string): Promise<Result<HrContract[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as HrContract[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getExpiringContracts(withinDays = 30): Promise<Result<ContractWithEmployee[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const today = new Date()
    const limit = new Date(today)
    limit.setDate(limit.getDate() + withinDays)

    const { data, error } = await supabase
      .from('hr_contracts')
      .select('*, employee:hr_employees(name,department)')
      .not('end_date', 'is', null)
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', limit.toISOString().split('T')[0])
      .order('end_date')

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as ContractWithEmployee[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createContract(input: CreateContractInput): Promise<Result<HrContract>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .insert({
        employee_id:     input.employee_id,
        contract_type:   input.contract_type,
        start_date:      input.start_date,
        end_date:        input.end_date ?? null,
        employment_type: input.employment_type,
        position:        input.position,
        department:      input.department,
        base_salary:     input.base_salary,
        work_hours:      input.work_hours ?? 40,
        signed_at:       input.signed_at ?? null,
        note:            input.note ?? null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/contracts')
    return { success: true, data: data as HrContract }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateContract(id: string, input: UpdateContractInput): Promise<Result<HrContract>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/contracts')
    return { success: true, data: data as HrContract }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteContract(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('hr_contracts').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/contracts')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
