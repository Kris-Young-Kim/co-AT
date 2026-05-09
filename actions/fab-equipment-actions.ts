'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { revalidatePath } from 'next/cache'
import type { InventoryFabEquipment, FabEquipmentStatus } from '@co-at/types'

const supabase = () => createAdminClient()

export async function getFabEquipment(): Promise<{
  success: boolean
  equipment?: InventoryFabEquipment[]
  error?: string
}> {
  const { data, error } = await supabase()
    .from('inventory_fab_equipment')
    .select('*')
    .order('name')

  if (error) return { success: false, error: error.message }
  return { success: true, equipment: data ?? [] }
}

export async function getFabEquipmentById(id: string): Promise<{
  success: boolean
  equipment?: InventoryFabEquipment & { active_orders?: { id: string; client_name: string | null; status: string }[] }
  error?: string
}> {
  const [eqResult, ordersResult] = await Promise.all([
    supabase().from('inventory_fab_equipment').select('*').eq('id', id).single(),
    supabase()
      .from('inventory_custom_order_equipment')
      .select('custom_order_id, inventory_custom_orders(id, status, clients(name))')
      .eq('equipment_id', id)
      .order('started_at', { ascending: false })
      .limit(20),
  ])

  if (eqResult.error || !eqResult.data) return { success: false, error: eqResult.error?.message ?? 'Not found' }

  const active_orders = (ordersResult.data ?? []).map(r => {
    const o = r.inventory_custom_orders as { id: string; status: string; clients: { name?: string } | null } | null
    return { id: o?.id ?? '', client_name: o?.clients?.name ?? null, status: o?.status ?? '' }
  })

  return { success: true, equipment: { ...eqResult.data, active_orders } }
}

export async function createFabEquipment(input: {
  name: string
  type: string
  serial_number?: string
  purchased_at?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { error } = await supabase()
    .from('inventory_fab_equipment')
    .insert({
      name: input.name,
      type: input.type,
      serial_number: input.serial_number ?? null,
      purchased_at: input.purchased_at ?? null,
      notes: input.notes ?? null,
    })

  if (error) return { success: false, error: error.message }
  revalidatePath('/fab-equipment')
  return { success: true }
}

export async function updateFabEquipmentStatus(
  id: string,
  status: FabEquipmentStatus
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { error } = await supabase()
    .from('inventory_fab_equipment')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/fab-equipment')
  return { success: true }
}
