"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"

// ─── Types ─────────────────────────────────────────────────────────────────

export type ReferrerType =
  | 'hospital'
  | 'health_center'
  | 'welfare_center'
  | 'school'
  | 'local_gov'
  | 'agency'
  | 'il_center'
  | 'at_medical'
  | 'individual'

export const REFERRER_TYPE_LABELS: Record<ReferrerType, string> = {
  hospital:      '병원/의원',
  health_center: '보건소',
  welfare_center:'복지관',
  school:        '학교/특수학교',
  local_gov:     '지자체',
  agency:        '공단/기관',
  il_center:     'IL센터',
  at_medical:    '장애인보건의료센터',
  individual:    '개인(자가접수)',
}

export type ActivityType = 'mou' | 'education' | 'visit' | 'consultation' | 'other'
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  mou:          'MOU 체결',
  education:    '합동 교육',
  visit:        '방문',
  consultation: '자문',
  other:        '기타',
}

export interface Referrer {
  id: string
  name: string
  type: ReferrerType
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  notes: string | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ReferrerListItem extends Referrer {
  referral_count: number
  active_contact_count: number
}

export interface CreateReferrerInput {
  name: string
  type: ReferrerType
  address?: string
  phone?: string
  email?: string
  website?: string
  notes?: string
}

export type UpdateReferrerInput = Partial<CreateReferrerInput> & { is_active?: boolean }

export interface ReferrerContact {
  id: string
  referrer_id: string
  name: string
  position: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateContactInput {
  referrer_id: string
  name: string
  position?: string
  phone?: string
  email?: string
  notes?: string
}

export interface ReferrerActivity {
  id: string
  referrer_id: string
  activity_type: ActivityType
  title: string
  activity_date: string
  description: string | null
  created_by: string
  created_at: string
}

export interface CreateActivityInput {
  referrer_id: string
  activity_type: ActivityType
  title: string
  activity_date: string
  description?: string
}

export interface ReferrerReferralStat {
  year: number
  quarter: number
  count: number
}

// ─── Referrer CRUD ──────────────────────────────────────────────────────────

export async function listReferrers(params?: {
  type?: ReferrerType
  is_active?: boolean
  q?: string
}): Promise<{ success: boolean; referrers?: ReferrerListItem[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()

  let query = supabase
    .from('eval_referrers')
    .select(`
      *,
      referral_count:eval_service_records(count),
      active_contact_count:eval_referrer_contacts(count)
    `)
    .order('name')

  if (params?.type) query = query.eq('type', params.type)
  if (params?.is_active !== undefined) query = query.eq('is_active', params.is_active)
  if (params?.q) query = query.ilike('name', `%${params.q}%`)

  const { data, error } = await query
  if (error) return { success: false, error: error.message }

  // Supabase returns count as array with count property
  const referrers = (data ?? []).map((r: any) => ({
    ...r,
    referral_count: Array.isArray(r.referral_count) ? r.referral_count.length : (r.referral_count ?? 0),
    active_contact_count: Array.isArray(r.active_contact_count) ? r.active_contact_count.length : (r.active_contact_count ?? 0),
  })) as ReferrerListItem[]

  return { success: true, referrers }
}

export async function getReferrerById(id: string): Promise<{ success: boolean; referrer?: Referrer; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('eval_referrers').select('*').eq('id', id).single()
  if (error) return { success: false, error: error.message }
  return { success: true, referrer: data as Referrer }
}

export async function createReferrer(
  input: CreateReferrerInput
): Promise<{ success: boolean; referrer?: Referrer; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const { userId } = await auth()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('eval_referrers')
    .insert({ ...input, created_by: userId ?? 'system' })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/referrers')
  return { success: true, referrer: data as Referrer }
}

export async function updateReferrer(
  id: string,
  input: UpdateReferrerInput
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('eval_referrers').update(input).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/referrers')
  revalidatePath(`/referrers/${id}`)
  return { success: true }
}

export async function deleteReferrer(id: string): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('eval_referrers').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/referrers')
  return { success: true }
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export async function getContactsByReferrer(
  referrerId: string
): Promise<{ success: boolean; contacts?: ReferrerContact[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_referrer_contacts')
    .select('*')
    .eq('referrer_id', referrerId)
    .order('is_active', { ascending: false })
    .order('created_at')

  if (error) return { success: false, error: error.message }
  return { success: true, contacts: (data ?? []) as ReferrerContact[] }
}

export async function createContact(
  input: CreateContactInput
): Promise<{ success: boolean; contact?: ReferrerContact; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_referrer_contacts')
    .insert(input)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/referrers/${input.referrer_id}`)
  return { success: true, contact: data as ReferrerContact }
}

export async function updateContact(
  id: string,
  referrerId: string,
  input: Partial<Omit<CreateContactInput, 'referrer_id'>> & { is_active?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('eval_referrer_contacts').update(input).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/referrers/${referrerId}`)
  return { success: true }
}

export async function deleteContact(
  id: string,
  referrerId: string
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('eval_referrer_contacts').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/referrers/${referrerId}`)
  return { success: true }
}

// ─── Activities ──────────────────────────────────────────────────────────────

export async function getActivitiesByReferrer(
  referrerId: string
): Promise<{ success: boolean; activities?: ReferrerActivity[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_referrer_activities')
    .select('*')
    .eq('referrer_id', referrerId)
    .order('activity_date', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, activities: (data ?? []) as ReferrerActivity[] }
}

export async function createActivity(
  input: CreateActivityInput
): Promise<{ success: boolean; activity?: ReferrerActivity; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const { userId } = await auth()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_referrer_activities')
    .insert({ ...input, created_by: userId ?? 'system' })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/referrers/${input.referrer_id}`)
  return { success: true, activity: data as ReferrerActivity }
}

export async function deleteActivity(
  id: string,
  referrerId: string
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('eval_referrer_activities').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/referrers/${referrerId}`)
  return { success: true }
}

// ─── Referral Stats & Pending Status ─────────────────────────────────────────

export async function getReferrerReferralStats(referrerId: string): Promise<{
  success: boolean
  stats?: ReferrerReferralStat[]
  pending_count?: number
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('eval_service_records')
    .select('service_date, status')
    .eq('referrer_id', referrerId)
    .order('service_date', { ascending: false })

  if (error) return { success: false, error: error.message }

  const records = (data ?? []) as { service_date: string; status: string }[]

  // Group by year + quarter
  const map = new Map<string, number>()
  for (const r of records) {
    const d = new Date(r.service_date)
    const year = d.getFullYear()
    const quarter = Math.ceil((d.getMonth() + 1) / 3)
    const key = `${year}-${quarter}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  const stats: ReferrerReferralStat[] = Array.from(map.entries())
    .map(([key, count]) => {
      const [year, quarter] = key.split('-').map(Number)
      return { year, quarter, count }
    })
    .sort((a, b) => b.year - a.year || b.quarter - a.quarter)

  const pending_count = records.filter((r) => r.status === 'pending' || r.status === 'in_progress').length

  return { success: true, stats, pending_count }
}
