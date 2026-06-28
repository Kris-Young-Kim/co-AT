"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'

export interface LabelDevice {
  id: string
  name: string
  model: string | null
  qr_token: string
  asset_code: string | null
  status: string
}

export async function getInventoryDevicesForLabels(): Promise<{
  success: boolean
  devices?: LabelDevice[]
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('id, name, model, qr_token, asset_code, status')
    .not('qr_token', 'is', null)
    .order('name')

  if (error) return { success: false, error: error.message }

  return { success: true, devices: (data ?? []) as LabelDevice[] }
}
