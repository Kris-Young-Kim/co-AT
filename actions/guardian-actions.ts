"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from "next/cache"

// ─── Types ─────────────────────────────────────────────────────────────────

export type GuardianRelationship =
  | '부모' | '배우자' | '자녀' | '형제자매'
  | '법정후견인' | '요양보호사' | '사회복지사' | '활동지원사' | '기타'

export interface Guardian {
  id: string
  client_id: string
  name: string
  relationship: GuardianRelationship
  phone: string | null
  email: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateGuardianInput {
  client_id: string
  name: string
  relationship: GuardianRelationship
  phone?: string
  email?: string
  is_primary?: boolean
  notes?: string
}

export type UpdateGuardianInput = Partial<Omit<CreateGuardianInput, 'client_id'>>

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function getGuardiansByClient(
  clientId: string
): Promise<{ success: boolean; guardians?: Guardian[]; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('client_guardians')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
      .order('created_at')

    if (error) return { success: false, error: error.message }
    return { success: true, guardians: (data ?? []) as Guardian[] }
  })
}

export async function createGuardian(
  input: CreateGuardianInput
): Promise<{ success: boolean; guardian?: Guardian; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()

    // 주 보호자로 설정하면 기존 주 보호자 해제
    if (input.is_primary) {
      await supabase
        .from('client_guardians')
        .update({ is_primary: false })
        .eq('client_id', input.client_id)
        .eq('is_primary', true)
    }

    const { data, error } = await supabase
      .from('client_guardians')
      .insert(input)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath(`/clients/${input.client_id}`)
    return { success: true, guardian: data as Guardian }
  })
}

export async function updateGuardian(
  id: string,
  clientId: string,
  input: UpdateGuardianInput
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()

    if (input.is_primary) {
      await supabase
        .from('client_guardians')
        .update({ is_primary: false })
        .eq('client_id', clientId)
        .eq('is_primary', true)
        .neq('id', id)
    }

    const { error } = await supabase.from('client_guardians').update(input).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  })
}

export async function deleteGuardian(
  id: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { error } = await supabase.from('client_guardians').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  })
}

export async function setPrimaryGuardian(
  id: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()

    // Clear existing primary
    await supabase
      .from('client_guardians')
      .update({ is_primary: false })
      .eq('client_id', clientId)

    const { error } = await supabase
      .from('client_guardians')
      .update({ is_primary: true })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  })
}
