'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'

export interface ChannelConfig {
  apiKey?: string
  fromEmail?: string
  [key: string]: unknown
}

export async function getChannels() {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('automation_channels')
    .select('*')
    .order('channel_type')
  if (error) throw new Error(error.message)
  return data
}

export async function toggleChannel(channelType: 'email' | 'kakao', enabled: boolean) {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('automation_channels')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('channel_type', channelType)
  if (error) throw new Error(error.message)
}

export async function saveChannelConfig(channelType: 'email' | 'kakao', config: ChannelConfig) {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('automation_channels')
    .update({ config, updated_at: new Date().toISOString() })
    .eq('channel_type', channelType)
  if (error) throw new Error(error.message)
}

export async function markChannelTested(channelType: 'email' | 'kakao') {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('automation_channels')
    .update({ last_tested_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('channel_type', channelType)
  if (error) throw new Error(error.message)
}
