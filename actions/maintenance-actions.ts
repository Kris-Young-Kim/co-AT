'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { revalidatePath } from 'next/cache'
import type { InventoryMaintenanceLog, CreateMaintenanceLogInput } from '@co-at/types'
import { auth } from '@clerk/nextjs/server'

const supabase = () => createAdminClient()

export async function getMaintenanceLogs(filters?: {
  device_id?: string
  limit?: number
}): Promise<{ success: boolean; logs?: (InventoryMaintenanceLog & { device_name?: string | null })[]; error?: string }> {
  let query = supabase()
    .from('inventory_maintenance_logs')
    .select('*, inventory(name)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.device_id) query = query.eq('device_id', filters.device_id)

  const { data, error } = await query
  if (error) return { success: false, error: error.message }

  const logs = (data ?? []).map(l => ({
    ...l,
    type: l.type as InventoryMaintenanceLog['type'],
    status: l.status as InventoryMaintenanceLog['status'],
    device_name: (l.inventory as { name?: string } | null)?.name ?? null,
  }))
  return { success: true, logs }
}

export async function createMaintenanceLog(
  input: CreateMaintenanceLogInput
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { userId } = await auth()

  const { error } = await supabase()
    .from('inventory_maintenance_logs')
    .insert({
      device_id: input.device_id,
      type: input.type,
      status: input.status ?? 'pending',
      performed_at: input.performed_at ?? null,
      technician: input.technician ?? null,
      cost: input.cost ?? 0,
      notes: input.notes ?? null,
      created_by: userId,
    })

  if (error) return { success: false, error: error.message }
  revalidatePath(`/devices/${input.device_id}`)
  revalidatePath('/maintenance')
  return { success: true }
}

export async function updateMaintenanceLogStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'done'
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const updates: Record<string, unknown> = { status }
  if (status === 'done') updates.performed_at = new Date().toISOString()

  const { error } = await supabase()
    .from('inventory_maintenance_logs')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/maintenance')
  return { success: true }
}
