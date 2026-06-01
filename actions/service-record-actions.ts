"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface ServiceRecordInput {
  application_id?: string | null
  client_id?: string | null
  received_at: string
  application_year?: number | null
  application_month?: number | null
  application_no?: number | null
  is_re_application?: boolean | null
  record_status?: string | null
  name?: string | null
  birth_date?: string | null
  gender?: string | null
  disability_type?: string | null
  disability_severity?: string | null
  economic_status?: string | null
  region?: string | null
  contact?: string | null
  address?: string | null
  service_major_category?: string | null
  service_sub_category?: string | null
  service_category?: string | null
  product_name?: string | null
  item_category?: string | null
  service_area?: string | null
  service_content?: string | null
  referral_type?: string | null
  consultation_date?: string | null
  performance_date?: string | null
  closed_at?: string | null
  monitoring_date?: string | null
  is_consult?: boolean | null
  is_assessment?: boolean | null
  is_trial?: boolean | null
  is_rental?: boolean | null
  is_custom_make?: boolean | null
  is_grant?: boolean | null
  is_education?: boolean | null
  is_info_provision?: boolean | null
  is_repair?: boolean | null
  is_cleaning?: boolean | null
  is_reuse?: boolean | null
  is_monitoring?: boolean | null
  is_other_business?: boolean | null
  is_phone?: boolean | null
  is_visit_in?: boolean | null
  is_visit_out?: boolean | null
  is_public_funding?: boolean | null
  is_private_funding?: boolean | null
  is_self_pay?: boolean | null
  is_funding_secured?: boolean | null
  is_closed?: boolean | null
  trial_device_count?: number | null
  info_provision_area?: string | null
  funding_source_detail?: string | null
  staff_name?: string | null
}

export interface ServiceRecord extends ServiceRecordInput {
  id: string
  created_at: string | null
  updated_at: string | null
}

export async function createServiceRecord(
  input: ServiceRecordInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  // eval_service_records types are stale — application_id column exists in DB but not in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('eval_service_records')
    .insert(input)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  if (input.client_id && input.application_id) {
    revalidatePath(`/clients/${input.client_id}/applications/${input.application_id}`)
  }
  revalidatePath('/service-records')

  return { success: true, id: (data as { id: string }).id }
}

export async function updateServiceRecord(
  id: string,
  input: Partial<ServiceRecordInput>
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('eval_service_records')
    .update(input)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/service-records')
  return { success: true }
}

export async function getServiceRecordsByApplication(
  applicationId: string
): Promise<{ success: boolean; records?: ServiceRecord[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from('eval_service_records')
    .select('*')
    .eq('application_id', applicationId)
    .order('received_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, records: (data ?? []) as ServiceRecord[] }
}

export async function getServiceRecords(
  params: { year?: number; month?: number } = {}
): Promise<{ success: boolean; records?: ServiceRecord[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  let query = supabase
    .from('eval_service_records')
    .select('*')
    .order('received_at', { ascending: false })

  if (params.year) query = query.eq('application_year', params.year)
  if (params.month) query = query.eq('application_month', params.month)

  const { data, error } = await query.limit(500)
  if (error) return { success: false, error: error.message }
  return { success: true, records: (data ?? []) as ServiceRecord[] }
}
