'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from 'next/cache'
import type {
  InventoryCustomOrderWithDetails,
  InventoryFabEquipmentAssignment,
  InventoryFabEquipment,
  CreateCustomOrderInput,
  CustomOrderStatus,
} from '@co-at/types'

const supabase = () => createAdminClient()

export async function getCustomOrders(filters?: {
  status?: CustomOrderStatus
  limit?: number
}): Promise<{ success: boolean; orders?: InventoryCustomOrderWithDetails[]; error?: string }> {
  let query = supabase()
    .from('inventory_custom_orders')
    .select('*, clients(name), inventory(name)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query

  if (error) return { success: false, error: error.message }
  const orders = (data ?? []).map(o => ({
    ...o,
    status: o.status as CustomOrderStatus,
    client_name: (o.clients as { name?: string } | null)?.name ?? null,
    device_name: (o.inventory as { name?: string } | null)?.name ?? null,
  }))
  return { success: true, orders }
}

export async function getCustomOrderById(id: string): Promise<{
  success: boolean
  order?: InventoryCustomOrderWithDetails
  error?: string
}> {
  const { data, error } = await supabase()
    .from('inventory_custom_orders')
    .select('*, clients(name), inventory(name), inventory_custom_order_equipment(*, inventory_fab_equipment(*))')
    .eq('id', id)
    .single()

  if (error || !data) return { success: false, error: error?.message ?? 'Not found' }

  const equipment = ((data.inventory_custom_order_equipment as InventoryFabEquipmentAssignment[]) ?? [])

  return {
    success: true,
    order: {
      ...data,
      status: data.status as CustomOrderStatus,
      client_name: (data.clients as { name?: string } | null)?.name ?? null,
      device_name: (data.inventory as { name?: string } | null)?.name ?? null,
      equipment,
    },
  }
}

export async function createCustomOrder(
  input: CreateCustomOrderInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  return withStaffPermission(async () => {

    const { data, error } = await supabase()
      .from('inventory_custom_orders')
      .insert({ client_id: input.client_id, approval_id: input.approval_id ?? null, notes: input.notes ?? null })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/custom-orders')
    return { success: true, id: data.id }
  })
}

export async function updateCustomOrderStatus(
  id: string,
  status: CustomOrderStatus,
  extra?: { device_id?: string; delivered_at?: string }
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (extra?.device_id) updates.device_id = extra.device_id
    if (status === 'delivered') updates.delivered_at = extra?.delivered_at ?? new Date().toISOString()

    const { error } = await supabase()
      .from('inventory_custom_orders')
      .update(updates)
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/custom-orders')
    revalidatePath(`/custom-orders/${id}`)
    return { success: true }
  })
}

export async function assignEquipmentToOrder(
  customOrderId: string,
  equipmentId: string
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const { error } = await supabase()
      .from('inventory_custom_order_equipment')
      .upsert({ custom_order_id: customOrderId, equipment_id: equipmentId, started_at: new Date().toISOString() })

    if (error) return { success: false, error: error.message }

    await supabase()
      .from('inventory_fab_equipment')
      .update({ status: 'in_use', updated_at: new Date().toISOString() })
      .eq('id', equipmentId)

    revalidatePath(`/custom-orders/${customOrderId}`)
    revalidatePath('/fab-equipment')
    return { success: true }
  })
}

export async function finishEquipmentUsage(
  customOrderId: string,
  equipmentId: string
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    await supabase()
      .from('inventory_custom_order_equipment')
      .update({ finished_at: new Date().toISOString() })
      .eq('custom_order_id', customOrderId)
      .eq('equipment_id', equipmentId)

    const { data: activeAssignments } = await supabase()
      .from('inventory_custom_order_equipment')
      .select('id')
      .eq('equipment_id', equipmentId)
      .is('finished_at', null)

    if (!activeAssignments || activeAssignments.length === 0) {
      await supabase()
        .from('inventory_fab_equipment')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', equipmentId)
    }

    revalidatePath(`/custom-orders/${customOrderId}`)
    revalidatePath('/fab-equipment')
    return { success: true }
  })
}

export async function createCustomOrderFromApproval(
  clientId: string,
  approvalId: string
): Promise<{ success: boolean; id?: string; trackToken?: string; error?: string }> {
  const { data, error } = await supabase()
    .from('inventory_custom_orders')
    .insert({ client_id: clientId, approval_id: approvalId, status: 'requested' })
    .select('id, track_token')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, id: data.id, trackToken: data.track_token ?? undefined }
}
