'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

export interface DeviceCleaningStatus {
  device_id: string
  device_name: string
  last_cleaned_at: string | null
  days_since_cleaning: number | null
}

export interface CleaningLog {
  id: string
  device_id: string
  device_name: string | null
  performed_at: string | null
  technician: string | null
  notes: string | null
  created_at: string | null
}

export async function getDeviceCleaningStatus(): Promise<
  { success: true; devices: DeviceCleaningStatus[] } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    const { data: devices, error: devErr } = await supabase
      .from('inventory')
      .select('id, name')
      .order('name')

    if (devErr) return { success: false, error: devErr.message }

    const { data: logs, error: logErr } = await supabase
      .from('inventory_maintenance_logs')
      .select('device_id, performed_at')
      .eq('type', 'cleaning')
      .eq('status', 'done')
      .order('performed_at', { ascending: false })

    if (logErr) return { success: false, error: logErr.message }

    const lastCleanedMap = new Map<string, string>()
    for (const l of logs ?? []) {
      if (l.performed_at && !lastCleanedMap.has(l.device_id)) {
        lastCleanedMap.set(l.device_id, l.performed_at)
      }
    }

    const now = Date.now()
    const result: DeviceCleaningStatus[] = (devices ?? []).map(d => {
      const lastAt = lastCleanedMap.get(d.id) ?? null
      const daysSince = lastAt
        ? Math.floor((now - new Date(lastAt).getTime()) / (1000 * 60 * 60 * 24))
        : null
      return { device_id: d.id, device_name: d.name, last_cleaned_at: lastAt, days_since_cleaning: daysSince }
    })

    result.sort((a, b) => {
      if (a.days_since_cleaning === null && b.days_since_cleaning === null) return 0
      if (a.days_since_cleaning === null) return -1
      if (b.days_since_cleaning === null) return 1
      return b.days_since_cleaning - a.days_since_cleaning
    })

    return { success: true, devices: result }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getCleaningLogs(limit = 100): Promise<
  { success: true; logs: CleaningLog[] } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('inventory_maintenance_logs')
      .select('id, device_id, performed_at, technician, notes, created_at, inventory(name)')
      .eq('type', 'cleaning')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { success: false, error: error.message }

    const logs: CleaningLog[] = (data ?? []).map(l => ({
      id: l.id,
      device_id: l.device_id,
      device_name: (l.inventory as { name?: string } | null)?.name ?? null,
      performed_at: l.performed_at,
      technician: l.technician,
      notes: l.notes,
      created_at: l.created_at,
    }))

    return { success: true, logs }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function logBatchCleaning(input: {
  deviceIds: string[]
  performedAt: string
  technician: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const { userId } = await auth()
    const supabase = createAdminClient()

    const rows = input.deviceIds.map(device_id => ({
      device_id,
      type: 'cleaning' as const,
      status: 'done' as const,
      performed_at: input.performedAt,
      technician: input.technician || null,
      notes: input.notes || null,
      created_by: userId,
    }))

    const { error } = await supabase.from('inventory_maintenance_logs').insert(rows)
    if (error) return { success: false, error: error.message }

    revalidatePath('/cleaning')
    revalidatePath('/maintenance')
    return { success: true }
  })
}
