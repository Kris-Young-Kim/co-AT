'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from 'next/cache'
import type {
  InventoryReuseDispatchWithDetails,
  CreateReuseDispatchInput,
  ReuseDispatchStatus,
} from '@co-at/types'

const supabase = () => createAdminClient()

export async function getReuseDispatches(filters?: {
  status?: ReuseDispatchStatus
  limit?: number
}): Promise<{ success: boolean; dispatches?: InventoryReuseDispatchWithDetails[]; error?: string }> {
  let query = supabase()
    .from('inventory_reuse_dispatches')
    .select('*, clients(name), inventory(name)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) return { success: false, error: error.message }

  const dispatches = (data ?? []).map(d => ({
    ...d,
    status: d.status as ReuseDispatchStatus,
    client_name: (d.clients as { name?: string } | null)?.name ?? null,
    device_name: (d.inventory as { name?: string } | null)?.name ?? null,
  }))
  return { success: true, dispatches }
}

export async function getReuseDispatchById(id: string): Promise<{
  success: boolean
  dispatch?: InventoryReuseDispatchWithDetails
  error?: string
}> {
  const { data, error } = await supabase()
    .from('inventory_reuse_dispatches')
    .select('*, clients(name), inventory(name)')
    .eq('id', id)
    .single()

  if (error || !data) return { success: false, error: error?.message ?? 'Not found' }
  return {
    success: true,
    dispatch: {
      ...data,
      status: data.status as ReuseDispatchStatus,
      client_name: (data.clients as { name?: string } | null)?.name ?? null,
      device_name: (data.inventory as { name?: string } | null)?.name ?? null,
    },
  }
}

export async function createReuseDispatch(
  input: CreateReuseDispatchInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  return withStaffPermission(async () => {

    const { data, error } = await supabase()
      .from('inventory_reuse_dispatches')
      .insert({
        device_id: input.device_id,
        client_id: input.client_id,
        approval_id: input.approval_id ?? null,
        notes: input.notes ?? null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await supabase()
      .from('inventory')
      .update({ status: '대여중', updated_at: new Date().toISOString() })
      .eq('id', input.device_id)

    revalidatePath('/reuse')
    return { success: true, id: data.id }
  })
}

export async function updateReuseStatus(
  id: string,
  status: ReuseDispatchStatus
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (status === 'delivered') updates.dispatched_at = new Date().toISOString()

    const { error } = await supabase()
      .from('inventory_reuse_dispatches')
      .update(updates)
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/reuse')
    revalidatePath(`/reuse/${id}`)
    return { success: true }
  })
}

export async function createReuseFromApproval(
  deviceId: string,
  clientId: string,
  approvalId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase()
    .from('inventory_reuse_dispatches')
    .insert({ device_id: deviceId, client_id: clientId, approval_id: approvalId, status: 'donated' })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, id: data.id }
}
