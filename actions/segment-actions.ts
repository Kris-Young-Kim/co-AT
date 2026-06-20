"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SegmentFilters {
  disability_type?: string
  city?: string
  service_type?: 'grant' | 'rental' | 'custom'
  staff_id?: string
  lifecycle_status?: string
}

export interface ClientSegment {
  id: string
  name: string
  description: string | null
  filters: SegmentFilters
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateSegmentInput {
  name: string
  description?: string
  filters: SegmentFilters
}

export interface SegmentClient {
  id: string
  name: string
  birth_date: string | null
  disability_type: string | null
  city: string | null
  contact: string | null
  lifecycle_status: string | null
  assigned_staff_id: string | null
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function listSegments(): Promise<{ success: boolean; segments?: ClientSegment[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_client_segments')
    .select('*')
    .order('name')

  if (error) return { success: false, error: error.message }
  return { success: true, segments: (data ?? []) as ClientSegment[] }
}

export async function getSegmentById(
  id: string
): Promise<{ success: boolean; segment?: ClientSegment; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_client_segments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, segment: data as ClientSegment }
}

export async function createSegment(
  input: CreateSegmentInput
): Promise<{ success: boolean; segment?: ClientSegment; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const { userId } = await auth()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('eval_client_segments')
    .insert({ ...input, created_by: userId ?? 'system' })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/segments')
  return { success: true, segment: data as ClientSegment }
}

export async function updateSegment(
  id: string,
  input: Partial<CreateSegmentInput>
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('eval_client_segments').update(input).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/segments')
  return { success: true }
}

export async function deleteSegment(id: string): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('eval_client_segments').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/segments')
  return { success: true }
}

// ─── Apply segment filters to get matching clients ─────────────────────────

export async function getClientsBySegment(
  filters: SegmentFilters
): Promise<{ success: boolean; clients?: SegmentClient[]; total?: number; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()

  let query = supabase
    .from('clients')
    .select('id, name, birth_date, disability_type, city, contact, lifecycle_status, assigned_staff_id', { count: 'exact' })
    .eq('status', 'registered')

  if (filters.disability_type) query = query.eq('disability_type', filters.disability_type)
  if (filters.city)             query = query.eq('city', filters.city)
  if (filters.lifecycle_status) query = query.eq('lifecycle_status', filters.lifecycle_status)
  if (filters.staff_id)         query = query.eq('assigned_staff_id', filters.staff_id)

  // service_type filter: check existence in respective tables
  if (filters.service_type === 'grant') {
    const { data: grantIds } = await supabase
      .from('eval_grant_assessments')
      .select('client_id')
    const ids = (grantIds ?? []).map((r: any) => r.client_id)
    if (ids.length > 0) query = query.in('id', ids)
    else return { success: true, clients: [], total: 0 }
  }

  if (filters.service_type === 'rental') {
    const { data: rentalIds } = await supabase
      .from('inventory_rentals')
      .select('client_id')
    const ids = (rentalIds ?? []).map((r: any) => r.client_id)
    if (ids.length > 0) query = query.in('id', ids)
    else return { success: true, clients: [], total: 0 }
  }

  if (filters.service_type === 'custom') {
    const { data: customIds } = await supabase
      .from('inventory_custom_orders')
      .select('client_id')
    const ids = (customIds ?? []).map((r: any) => r.client_id)
    if (ids.length > 0) query = query.in('id', ids)
    else return { success: true, clients: [], total: 0 }
  }

  query = query.order('name')

  const { data, error, count } = await query
  if (error) return { success: false, error: error.message }

  return { success: true, clients: (data ?? []) as SegmentClient[], total: count ?? 0 }
}
