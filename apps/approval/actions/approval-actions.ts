// apps/approval/actions/approval-actions.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { assertRole, requireRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type {
  ApprovalDocument,
  ApprovalDocumentWithSteps,
  ApprovalSignature,
  ApprovalStepRole,
  CreateDocumentInput,
  ApprovalDelegation,
  DelegationWithNames,
  ApprovalVehicle,
  VehicleLogContent,
} from '@co-at/types'

// ── Helpers ───────────────────────────────────────────────

async function getUserIdsByRole(role: string): Promise<string[]> {
  const clerk = await clerkClient()
  const response = await clerk.users.getUserList({ limit: 200 })
  return response.data
    .filter(u => (u.publicMetadata as { role?: string }).role === role)
    .map(u => u.id)
}

async function sendApprovalNotification(
  targetClerkUserIds: string[],
  title: string,
  body: string,
  link: string
): Promise<void> {
  const supabase = createSupabaseAdmin()
  const inserts = targetClerkUserIds.map(userId => ({
    user_id:       null,
    clerk_user_id: userId,
    type:          'approval',
    title,
    body,
    link,
    priority:      1,
    status:        'unread',
  }))
  if (inserts.length > 0) {
    await supabase.from('notifications').insert(inserts)
  }
}

// ── Signature ─────────────────────────────────────────────

export async function getSignature(clerkUserId: string): Promise<ApprovalSignature | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_signatures')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
  if (error) { console.error('[getSignature]', error); return null }
  return data
}

export async function upsertSignature(
  clerkUserId: string,
  imageUrl: string
): Promise<ApprovalSignature | null> {
  await assertRole(ROLES.STAFF)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_signatures')
    .upsert(
      { clerk_user_id: clerkUserId, image_url: imageUrl, updated_at: new Date().toISOString() },
      { onConflict: 'clerk_user_id' }
    )
    .select()
    .single()
  if (error) { console.error('[upsertSignature]', error); return null }
  return data
}

// ── Documents ─────────────────────────────────────────────

export async function createDocument(input: CreateDocumentInput): Promise<ApprovalDocument | null> {
  await assertRole(ROLES.STAFF)
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_documents')
    .insert({
      type:       input.type,
      title:      input.title,
      content:    input.content,
      status:     'draft',
      created_by: userId,
    })
    .select()
    .single()
  if (error) { console.error('[createDocument]', error); return null }
  return data
}

export async function submitDocument(id: string): Promise<boolean> {
  await assertRole(ROLES.STAFF)
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()

  // Verify ownership
  const { data: doc } = await supabase
    .from('approval_documents')
    .select('id, title, status, created_by')
    .eq('id', id)
    .single()
  if (!doc || doc.created_by !== userId || doc.status !== 'draft') return false

  // Update status to pending
  const { error: updateError } = await supabase
    .from('approval_documents')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (updateError) { console.error('[submitDocument] update', updateError); return false }

  // Create 2 approval steps
  const { error: stepsError } = await supabase
    .from('approval_steps')
    .insert([
      { document_id: id, step: 1, approver_role: 'manager' as ApprovalStepRole, status: 'pending' },
      { document_id: id, step: 2, approver_role: 'admin'   as ApprovalStepRole, status: 'pending' },
    ])
  if (stepsError) { console.error('[submitDocument] steps', stepsError); return false }

  // Notify all MANAGER users
  const managerIds = await getUserIdsByRole(ROLES.MANAGER)
  await sendApprovalNotification(
    managerIds,
    '결재 요청',
    `새로운 결재 요청: ${doc.title}`,
    `/approval/${id}`
  )

  return true
}

export async function approveStep(
  stepId: string,
  actorClerkUserId: string,
  signatureUrl: string | null,
  isDelegated?: boolean
): Promise<boolean> {
  await assertRole(ROLES.MANAGER)
  const supabase = createSupabaseAdmin()

  // Load step
  const { data: step } = await supabase
    .from('approval_steps')
    .select('*, approval_documents(id, title, created_by, status, type, content)')
    .eq('id', stepId)
    .single()
  if (!step || step.status !== 'pending') return false

  const doc = step.approval_documents as { id: string; title: string; created_by: string; status: string; type: string; content: Record<string, unknown> }

  // Verify actor has the right role
  const actorRole = step.step === 1 ? ROLES.MANAGER : ROLES.ADMIN
  const hasRole = await requireRole(actorRole)
  if (!hasRole) return false

  // Update step
  const { error } = await supabase
    .from('approval_steps')
    .update({
      status:        'approved',
      acted_by:      actorClerkUserId,
      signature_url: signatureUrl,
      acted_at:      new Date().toISOString(),
      is_delegated:  isDelegated ?? false,
    })
    .eq('id', stepId)
  if (error) { console.error('[approveStep]', error); return false }

  if (step.step === 1) {
    // Notify ADMIN users for step 2
    const adminIds = await getUserIdsByRole(ROLES.ADMIN)
    await sendApprovalNotification(
      adminIds,
      '결재 대기',
      `팀장 승인 완료, 최종 결재 대기: ${doc.title}`,
      `/approval/${doc.id}`
    )
  } else {
    // step === 2: final approval
    await supabase
      .from('approval_documents')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', doc.id)

    // Auto-insert inventory record based on document type
    const clientId = (doc.content as { client_id?: string }).client_id
    if (clientId) {
      if (doc.type === 'rental') {
        await supabase.from('rentals').insert({
          client_id:    clientId,
          approval_id:  doc.id,
          status:       'pending_assignment',
        })
      } else if (doc.type === 'custom_make') {
        await supabase.from('inventory_custom_orders').insert({
          client_id:   clientId,
          approval_id: doc.id,
          status:      'requested',
        })
      } else if (doc.type === 'reuse') {
        await supabase.from('inventory_reuse_dispatches').insert({
          client_id:   clientId,
          approval_id: doc.id,
          status:      'donated',
        })
      }
    }

    await sendApprovalNotification(
      [doc.created_by],
      '결재 완료',
      `결재가 최종 승인되었습니다: ${doc.title}`,
      `/approval/${doc.id}`
    )
  }

  return true
}

export async function rejectStep(
  stepId: string,
  actorClerkUserId: string,
  comment: string
): Promise<boolean> {
  await assertRole(ROLES.MANAGER)
  const supabase = createSupabaseAdmin()

  const { data: step } = await supabase
    .from('approval_steps')
    .select('*, approval_documents(id, title, created_by)')
    .eq('id', stepId)
    .single()
  if (!step || step.status !== 'pending') return false

  const doc = step.approval_documents as { id: string; title: string; created_by: string }

  // Verify actor role
  const actorRole = step.step === 1 ? ROLES.MANAGER : ROLES.ADMIN
  const hasRole = await requireRole(actorRole)
  if (!hasRole) return false

  // Update step
  await supabase
    .from('approval_steps')
    .update({
      status:   'rejected',
      acted_by: actorClerkUserId,
      comment,
      acted_at: new Date().toISOString(),
    })
    .eq('id', stepId)

  // Update document status
  await supabase
    .from('approval_documents')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', doc.id)

  // Notify drafter
  await sendApprovalNotification(
    [doc.created_by],
    '결재 반려',
    `결재가 반려되었습니다: ${doc.title} — ${comment}`,
    `/approval/${doc.id}`
  )

  return true
}

// ── Delegation ────────────────────────────────────────────

export async function getActiveDelegatorsForUser(
  delegateeClerkId: string
): Promise<string[]> {
  const supabase = createSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('approval_delegations')
    .select('delegator_clerk_id')
    .eq('delegatee_clerk_id', delegateeClerkId)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
  if (error || !data) return []
  return data.map(d => d.delegator_clerk_id)
}

export async function createDelegation(input: {
  delegatorClerkId: string
  delegateeClerkId: string
  startDate?: string | null
  endDate?: string | null
  note?: string | null
}): Promise<{ success: boolean; error?: string }> {
  await assertRole(ROLES.MANAGER)
  const { userId } = await auth()
  if (!userId || userId !== input.delegatorClerkId) {
    return { success: false, error: '권한이 없습니다.' }
  }
  if (input.delegatorClerkId === input.delegateeClerkId) {
    return { success: false, error: '자기 자신에게 위임할 수 없습니다.' }
  }
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('approval_delegations')
    .insert({
      delegator_clerk_id: input.delegatorClerkId,
      delegatee_clerk_id: input.delegateeClerkId,
      start_date:         input.startDate ?? null,
      end_date:           input.endDate ?? null,
      note:               input.note ?? null,
    })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deactivateDelegation(
  id: string,
  clerkUserId: string
): Promise<{ success: boolean; error?: string }> {
  await assertRole(ROLES.MANAGER)
  const { userId } = await auth()
  if (!userId) return { success: false, error: '권한이 없습니다.' }
  const supabase = createSupabaseAdmin()
  const { data: existing } = await supabase
    .from('approval_delegations')
    .select('delegator_clerk_id')
    .eq('id', id)
    .single()
  if (!existing || existing.delegator_clerk_id !== userId) {
    return { success: false, error: '권한이 없습니다.' }
  }
  const { error } = await supabase
    .from('approval_delegations')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getMyDelegations(
  clerkUserId: string
): Promise<{ given: DelegationWithNames[]; received: DelegationWithNames[] }> {
  const supabase = createSupabaseAdmin()
  const clerk = await clerkClient()

  const [givenRes, receivedRes] = await Promise.all([
    supabase
      .from('approval_delegations')
      .select('*')
      .eq('delegator_clerk_id', clerkUserId)
      .order('created_at', { ascending: false }),
    supabase
      .from('approval_delegations')
      .select('*')
      .eq('delegatee_clerk_id', clerkUserId)
      .order('created_at', { ascending: false }),
  ])

  if (givenRes.error)    console.error('[getMyDelegations] given', givenRes.error)
  if (receivedRes.error) console.error('[getMyDelegations] received', receivedRes.error)

  const allRows = [
    ...(givenRes.data ?? []),
    ...(receivedRes.data ?? []),
  ] as ApprovalDelegation[]

  const uniqueIds = [...new Set(allRows.flatMap(r => [r.delegator_clerk_id, r.delegatee_clerk_id]))]
  const nameMap: Record<string, string> = {}
  await Promise.all(
    uniqueIds.map(async id => {
      try {
        const u = await clerk.users.getUser(id)
        nameMap[id] = [u.firstName, u.lastName].filter(Boolean).join(' ') || id
      } catch {
        nameMap[id] = id
      }
    })
  )

  const enrich = (rows: ApprovalDelegation[]): DelegationWithNames[] =>
    rows.map(r => ({
      ...r,
      delegator_name: nameMap[r.delegator_clerk_id] ?? r.delegator_clerk_id,
      delegatee_name: nameMap[r.delegatee_clerk_id] ?? r.delegatee_clerk_id,
    }))

  return {
    given:    enrich((givenRes.data ?? []) as ApprovalDelegation[]),
    received: enrich((receivedRes.data ?? []) as ApprovalDelegation[]),
  }
}

// ── Queries ───────────────────────────────────────────────

export async function getMyDocuments(userId: string): Promise<ApprovalDocumentWithSteps[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_documents')
    .select('*, approval_steps(*)')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('[getMyDocuments]', error); return [] }
  return (data ?? []) as ApprovalDocumentWithSteps[]
}

export async function getPendingApprovals(
  role: ApprovalStepRole,
  clerkUserId: string
): Promise<ApprovalDocumentWithSteps[]> {
  const supabase = createSupabaseAdmin()
  const stepNum = role === 'manager' ? 1 : 2

  const [ownRes, delegatorIds] = await Promise.all([
    supabase
      .from('approval_documents')
      .select('*, approval_steps!inner(*)')
      .eq('status', 'pending')
      .eq('approval_steps.step', stepNum)
      .eq('approval_steps.status', 'pending')
      .order('created_at', { ascending: false }),
    getActiveDelegatorsForUser(clerkUserId),
  ])

  if (ownRes.error) { console.error('[getPendingApprovals]', ownRes.error); return [] }
  const own = (ownRes.data ?? []) as ApprovalDocumentWithSteps[]

  if (delegatorIds.length === 0) return own

  const { data: delegatedData, error: delegatedError } = await supabase
    .from('approval_documents')
    .select('*, approval_steps!inner(*)')
    .eq('status', 'pending')
    .in('created_by', delegatorIds)
    .eq('approval_steps.step', 1)
    .eq('approval_steps.status', 'pending')
    .order('created_at', { ascending: false })
  if (delegatedError) { console.error('[getPendingApprovals delegated]', delegatedError) }

  const delegated = (delegatedData ?? []) as ApprovalDocumentWithSteps[]
  const ownIds = new Set(own.map(d => d.id))
  const merged = [...own, ...delegated.filter(d => !ownIds.has(d.id))]
  return merged
}

// ── Vehicles ──────────────────────────────────────────────

export async function getVehicles(): Promise<ApprovalVehicle[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_vehicles')
    .select('*')
    .eq('is_active', true)
    .order('created_at')
  if (error) { console.error('[getVehicles]', error); return [] }
  return (data ?? []) as ApprovalVehicle[]
}

export interface VehicleLogReportRow {
  id: string
  title: string
  status: string
  created_at: string
  content: VehicleLogContent
}

export interface VehicleLogReport {
  vehicle_id: string
  vehicle_number: string
  vehicle_name: string
  logs: VehicleLogReportRow[]
  total_distance: number
  total_fuel_cost: number
  total_toll_fee: number
  total_parking_fee: number
}

export async function getVehicleLogReport(
  year: number,
  month: number
): Promise<VehicleLogReport[]> {
  await assertRole(ROLES.STAFF)
  const supabase = createSupabaseAdmin()

  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const toDate = new Date(year, month, 1)
  const to = toDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('approval_documents')
    .select('id, title, status, created_at, content')
    .eq('type', 'vehicle_log')
    .eq('status', 'approved')
    .gte('created_at', from)
    .lt('created_at', to)
    .order('created_at')
  if (error) { console.error('[getVehicleLogReport]', error); return [] }

  const vehicles = await getVehicles()
  const reportMap = new Map<string, VehicleLogReport>()

  for (const v of vehicles) {
    reportMap.set(v.id, {
      vehicle_id: v.id,
      vehicle_number: v.number,
      vehicle_name: v.name,
      logs: [],
      total_distance: 0,
      total_fuel_cost: 0,
      total_toll_fee: 0,
      total_parking_fee: 0,
    })
  }

  for (const row of data ?? []) {
    const c = row.content as VehicleLogContent
    if (!c?.vehicle_id) continue
    let entry = reportMap.get(c.vehicle_id)
    if (!entry) continue
    const distance = c.end_odometer - c.start_odometer
    entry.logs.push({ id: row.id, title: row.title, status: row.status, created_at: row.created_at, content: c })
    entry.total_distance    += distance
    entry.total_fuel_cost   += c.fuel_cost   ?? 0
    entry.total_toll_fee    += c.toll_fee    ?? 0
    entry.total_parking_fee += c.parking_fee ?? 0
  }

  return [...reportMap.values()]
}

export async function getDocument(id: string): Promise<ApprovalDocumentWithSteps | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_documents')
    .select('*, approval_steps(*)')
    .eq('id', id)
    .single()
  if (error) { console.error('[getDocument]', error); return null }
  return data as ApprovalDocumentWithSteps
}

export async function getArchive(filters?: {
  type?: string
  status?: string
  search?: string
}): Promise<ApprovalDocumentWithSteps[]> {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('approval_documents')
    .select('*, approval_steps(*)')
    .order('created_at', { ascending: false })

  if (filters?.type)   query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error } = await query
  if (error) { console.error('[getArchive]', error); return [] }
  return (data ?? []) as ApprovalDocumentWithSteps[]
}
