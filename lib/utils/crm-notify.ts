'use server'

import { render } from '@react-email/render'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL } from '@/lib/email/resend'
import { RentalConfirmEmail, rentalConfirmSubject } from '@/lib/email/templates/RentalConfirmEmail'
import { RentalReturnEmail, rentalReturnSubject } from '@/lib/email/templates/RentalReturnEmail'
import { RentalExtendEmail, rentalExtendSubject } from '@/lib/email/templates/RentalExtendEmail'
import { ClientRegisteredEmail, clientRegisteredSubject } from '@/lib/email/templates/ClientRegisteredEmail'
import { LifecycleChangedEmail, lifecycleChangedSubject } from '@/lib/email/templates/LifecycleChangedEmail'
import { IppaCompletedEmail, ippaCompletedSubject } from '@/lib/email/templates/IppaCompletedEmail'
import { ServiceStatusChangedEmail, serviceStatusChangedSubject } from '@/lib/email/templates/ServiceStatusChangedEmail'
import { LongInactiveEmail, longInactiveSubject } from '@/lib/email/templates/LongInactiveEmail'
import { StaffHandoverEmail, staffHandoverSubject } from '@/lib/email/templates/StaffHandoverEmail'

type EmailResult = { success: boolean; error?: string }

// ─── Helpers ────────────────────────────────────────────────────────────────

async function isEmailEnabled(): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase as any)
      .from('automation_channels')
      .select('is_enabled')
      .eq('channel_type', 'email')
      .single()
    return data?.is_enabled ?? false
  } catch {
    return false
  }
}

async function isClientEmailOptOut(clientId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase as any)
      .from('notification_preferences')
      .select('email_opt_out')
      .eq('client_id', clientId)
      .maybeSingle()
    return data?.email_opt_out ?? false
  } catch {
    return false
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    const resend = getResend()
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html })
    if (error) return { success: false, error: String(error) }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

interface ClientEmailInfo {
  email: string | null
  name: string
  assigned_staff_id: string | null
}

interface GuardianEmailInfo {
  email: string | null
  name: string
}

async function getClientEmailInfo(clientId: string): Promise<ClientEmailInfo | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase as any)
      .from('clients')
      .select('name, email, assigned_staff_id')
      .eq('id', clientId)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

async function getPrimaryGuardianEmail(clientId: string): Promise<GuardianEmailInfo | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase as any)
      .from('client_guardians')
      .select('name, email')
      .eq('client_id', clientId)
      .eq('is_primary', true)
      .maybeSingle()
    return data ?? null
  } catch {
    return null
  }
}

async function getStaffEmail(staffId: string): Promise<string | null> {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(staffId)
    return user.emailAddresses[0]?.emailAddress ?? null
  } catch {
    return null
  }
}

// Collect all recipient emails: client + primary guardian (if has email, not opted out)
async function collectRecipients(
  clientId: string,
  clientEmail: string | null
): Promise<{ addresses: string[]; clientName: string; guardianName?: string; assignedStaffId: string | null }> {
  const [clientInfo, guardian] = await Promise.all([
    getClientEmailInfo(clientId),
    getPrimaryGuardianEmail(clientId),
  ])

  const addresses: string[] = []
  if (clientEmail) addresses.push(clientEmail)
  if (guardian?.email) addresses.push(guardian.email)

  return {
    addresses,
    clientName: clientInfo?.name ?? '대상자',
    guardianName: guardian?.name ?? undefined,
    assignedStaffId: clientInfo?.assigned_staff_id ?? null,
  }
}

// ─── C-1: 신규 대여 확정 ─────────────────────────────────────────────────────

export async function notifyRentalCreated(params: {
  clientId: string
  clientEmail: string | null
  deviceName: string
  rentalStartDate: string
  rentalEndDate: string
}): Promise<void> {
  const [enabled, optOut] = await Promise.all([
    isEmailEnabled(),
    isClientEmailOptOut(params.clientId),
  ])
  if (!enabled || optOut) return

  const { addresses, clientName, guardianName } = await collectRecipients(params.clientId, params.clientEmail)
  if (addresses.length === 0) return

  const html = await render(RentalConfirmEmail({
    clientName,
    deviceName: params.deviceName,
    rentalStartDate: params.rentalStartDate,
    rentalEndDate: params.rentalEndDate,
    guardianName,
  }))
  const subject = rentalConfirmSubject(params.deviceName)
  await Promise.all(addresses.map(addr => sendEmail(addr, subject, html)))
}

// ─── C-2: 대여 반납 완료 ─────────────────────────────────────────────────────

export async function notifyRentalReturned(params: {
  clientId: string
  clientEmail: string | null
  deviceName: string
  returnDate: string
}): Promise<void> {
  const [enabled, optOut] = await Promise.all([
    isEmailEnabled(),
    isClientEmailOptOut(params.clientId),
  ])
  if (!enabled || optOut) return

  const { addresses, clientName, guardianName } = await collectRecipients(params.clientId, params.clientEmail)
  if (addresses.length === 0) return

  const html = await render(RentalReturnEmail({
    clientName,
    deviceName: params.deviceName,
    returnDate: params.returnDate,
    guardianName,
  }))
  const subject = rentalReturnSubject(params.deviceName)
  await Promise.all(addresses.map(addr => sendEmail(addr, subject, html)))
}

// ─── C-3: 대여 기간 연장 ─────────────────────────────────────────────────────

export async function notifyRentalExtended(params: {
  clientId: string
  clientEmail: string | null
  deviceName: string
  newEndDate: string
}): Promise<void> {
  const [enabled, optOut] = await Promise.all([
    isEmailEnabled(),
    isClientEmailOptOut(params.clientId),
  ])
  if (!enabled || optOut) return

  const { addresses, clientName, guardianName } = await collectRecipients(params.clientId, params.clientEmail)
  if (addresses.length === 0) return

  const html = await render(RentalExtendEmail({
    clientName,
    deviceName: params.deviceName,
    newEndDate: params.newEndDate,
    guardianName,
  }))
  const subject = rentalExtendSubject(params.deviceName)
  await Promise.all(addresses.map(addr => sendEmail(addr, subject, html)))
}

// ─── C-4: 대상자 등록 완료 ───────────────────────────────────────────────────

export async function notifyClientRegistered(params: {
  clientId: string
  clientEmail: string | null
  clientName: string
  registrationNumber: string
  assignedStaffId: string | null
}): Promise<void> {
  const enabled = await isEmailEnabled()
  if (!enabled) return

  const tasks: Promise<EmailResult>[] = []

  // Notify assigned staff
  if (params.assignedStaffId) {
    const staffEmail = await getStaffEmail(params.assignedStaffId)
    if (staffEmail) {
      tasks.push((async () => {
        const html = await render(ClientRegisteredEmail({
          clientName: params.clientName,
          registrationNumber: params.registrationNumber,
        }))
        return sendEmail(staffEmail, clientRegisteredSubject(params.clientName), html)
      })())
    }
  }

  // Notify client if email set and not opted out
  const optOut = await isClientEmailOptOut(params.clientId)
  if (!optOut && params.clientEmail) {
    tasks.push((async () => {
      const html = await render(ClientRegisteredEmail({
        clientName: params.clientName,
        registrationNumber: params.registrationNumber,
      }))
      return sendEmail(params.clientEmail!, clientRegisteredSubject(params.clientName), html)
    })())
  }

  await Promise.all(tasks)
}

// ─── C-5: 대상자 생애주기 변경 ───────────────────────────────────────────────

export async function notifyLifecycleChanged(params: {
  clientId: string
  clientName: string
  newStatus: string
  assignedStaffId: string | null
}): Promise<void> {
  const enabled = await isEmailEnabled()
  if (!enabled || !params.assignedStaffId) return

  const staffEmail = await getStaffEmail(params.assignedStaffId)
  if (!staffEmail) return

  const html = await render(LifecycleChangedEmail({
    clientName: params.clientName,
    newStatus: params.newStatus,
  }))
  await sendEmail(staffEmail, lifecycleChangedSubject(params.clientName), html)
}

// ─── C-6: K-IPPA 사후측정 완료 ───────────────────────────────────────────────

export async function notifyIppaCompleted(params: {
  clientId: string
  clientName: string
  outcomeScore: number | null
  assignedStaffId: string | null
}): Promise<void> {
  const enabled = await isEmailEnabled()
  if (!enabled || !params.assignedStaffId) return

  const staffEmail = await getStaffEmail(params.assignedStaffId)
  if (!staffEmail) return

  const html = await render(IppaCompletedEmail({
    clientName: params.clientName,
    outcomeScore: params.outcomeScore,
  }))
  await sendEmail(staffEmail, ippaCompletedSubject(params.clientName), html)
}

// ─── C-7: 서비스 기록 상태 변경 ──────────────────────────────────────────────

export async function notifyServiceStatusChanged(params: {
  clientId: string
  clientName: string
  serviceType: string
  newStatus: string
  assignedStaffId: string | null
}): Promise<void> {
  const enabled = await isEmailEnabled()
  if (!enabled || !params.assignedStaffId) return

  const staffEmail = await getStaffEmail(params.assignedStaffId)
  if (!staffEmail) return

  const html = await render(ServiceStatusChangedEmail({
    clientName: params.clientName,
    serviceType: params.serviceType,
    newStatus: params.newStatus,
  }))
  await sendEmail(staffEmail, serviceStatusChangedSubject(params.clientName), html)
}

// ─── C-9: 담당자 인수인계 ────────────────────────────────────────────────────

export async function notifyStaffHandover(params: {
  newStaffId: string
  prevStaffName: string | null
  clientId: string
  clientName: string
  clientDisabilityType: string | null
  clientBirthDate: string | null
  clientContact: string | null
  lifecycleStatus: string
  serviceCount: number
  consultationCount: number
  hasActiveIppa: boolean
}): Promise<void> {
  const enabled = await isEmailEnabled()
  if (!enabled) return

  const newStaffEmail = await getStaffEmail(params.newStaffId)
  if (!newStaffEmail) return

  const { clerkClient } = await import('@clerk/nextjs/server')
  const clerk = await clerkClient()
  const newUser = await clerk.users.getUser(params.newStaffId).catch(() => null)
  const newStaffName = newUser?.fullName ?? '담당자'

  const evalBaseUrl = process.env.NEXT_PUBLIC_EVAL_URL ?? 'https://eval.gwatc.cloud'
  const clientPageUrl = `${evalBaseUrl}/clients/${params.clientId}`

  const html = await render(StaffHandoverEmail({
    newStaffName,
    prevStaffName: params.prevStaffName,
    clientName: params.clientName,
    clientDisabilityType: params.clientDisabilityType,
    clientBirthDate: params.clientBirthDate,
    clientContact: params.clientContact,
    lifecycleStatus: params.lifecycleStatus,
    serviceCount: params.serviceCount,
    consultationCount: params.consultationCount,
    hasActiveIppa: params.hasActiveIppa,
    clientPageUrl,
  }))
  await sendEmail(newStaffEmail, staffHandoverSubject(params.clientName), html)
}

// ─── C-8: 장기 미활동 (cron에서 호출) ────────────────────────────────────────

export async function sendLongInactiveEmail(params: {
  toEmail: string
  clientName: string
  lastServiceDate: string
  staffName?: string
}): Promise<EmailResult> {
  const html = await render(LongInactiveEmail({
    clientName: params.clientName,
    lastServiceDate: params.lastServiceDate,
    staffName: params.staffName,
  }))
  return sendEmail(params.toEmail, longInactiveSubject(params.clientName), html)
}
