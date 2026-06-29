'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from 'next/cache'

export interface NotificationPreference {
  id: string
  client_id: string
  email_opt_out: boolean
  sms_opt_out: boolean
  updated_at: string
}

export async function getNotificationPreference(
  clientId: string
): Promise<{ success: boolean; pref?: NotificationPreference; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('notification_preferences')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    return { success: true, pref: data ?? undefined }
  })
}

export async function upsertNotificationPreference(
  clientId: string,
  update: { email_opt_out?: boolean; sms_opt_out?: boolean }
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from('notification_preferences')
      .upsert(
        { client_id: clientId, ...update, updated_at: new Date().toISOString() },
        { onConflict: 'client_id' }
      )

    if (error) return { success: false, error: error.message }
    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  })
}
