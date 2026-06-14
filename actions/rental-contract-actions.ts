"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { revalidatePath } from 'next/cache'

export interface RentalContract {
  id: string
  rental_id: string
  signing_token: string
  status: 'pending' | 'signed' | 'cancelled'
  signer_name: string | null
  signer_type: 'client' | 'guardian' | null
  signature_data: string | null
  sent_to: string | null
  sent_via: 'email' | 'sms' | 'manual' | null
  sent_at: string | null
  signed_at: string | null
  created_at: string
  updated_at: string
}

// Type cast helper — rental_contracts table not yet in generated types (pending gen:types after migration 095)
const db = () => createAdminClient() as any

export async function createRentalContract(rentalId: string): Promise<{
  success: boolean
  contract?: RentalContract
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const { data, error } = await db()
      .from('rental_contracts')
      .insert({ rental_id: rentalId })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, contract: data as RentalContract }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getContractByRentalId(rentalId: string): Promise<{
  success: boolean
  contract?: RentalContract | null
  error?: string
}> {
  try {
    const { data, error } = await db()
      .from('rental_contracts')
      .select('*')
      .eq('rental_id', rentalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    return { success: true, contract: data as RentalContract | null }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getContractByToken(signingToken: string): Promise<{
  success: boolean
  contract?: RentalContract
  error?: string
}> {
  try {
    const { data, error } = await db()
      .from('rental_contracts')
      .select('*')
      .eq('signing_token', signingToken)
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, contract: data as RentalContract }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function sendContractLink(
  contractId: string,
  sentTo: string,
  sentVia: 'email' | 'sms' | 'manual'
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const { error } = await db()
      .from('rental_contracts')
      .update({ sent_to: sentTo, sent_via: sentVia, sent_at: new Date().toISOString() })
      .eq('id', contractId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/rentals', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function cancelContract(contractId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const { error } = await db()
      .from('rental_contracts')
      .update({ status: 'cancelled' })
      .eq('id', contractId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/rentals', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
