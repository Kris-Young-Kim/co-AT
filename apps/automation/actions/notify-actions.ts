'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { render } from '@react-email/render'
import { RentalExpiryEmail, rentalExpirySubject } from '@/emails/RentalExpiryEmail'
import { ScheduleReminderEmail, scheduleReminderSubject } from '@/emails/ScheduleReminderEmail'

export interface InAppNotificationInput {
  userId: string
  clerkUserId?: string
  type: string
  title: string
  body: string
  link?: string
  priority?: number
  metadata?: Record<string, unknown>
}

export interface NotifyResult {
  success: boolean
  error?: string
}

export async function createInAppNotification(input: InAppNotificationInput): Promise<NotifyResult> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('notifications').insert({
    user_id:       input.userId,
    clerk_user_id: input.clerkUserId,
    type:          input.type,
    title:         input.title,
    body:          input.body,
    link:          input.link,
    priority:      input.priority ?? 0,
    metadata:      input.metadata,
    status:        'unread',
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function sendRentalExpiryEmail(params: {
  toEmail: string
  deviceName: string
  daysLeft: number
  expiryDate: string
}): Promise<NotifyResult> {
  try {
    const resend = getResend()
    const html = await render(
      RentalExpiryEmail({ deviceName: params.deviceName, daysLeft: params.daysLeft, expiryDate: params.expiryDate })
    )
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: rentalExpirySubject(params.deviceName, params.daysLeft),
      html,
    })
    if (error) return { success: false, error: String(error) }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function sendScheduleReminderEmail(params: {
  toEmail: string
  scheduleType: string
  scheduledDate: string
  scheduledTime?: string
  address?: string
  clientName?: string
}): Promise<NotifyResult> {
  try {
    const resend = getResend()
    const html = await render(
      ScheduleReminderEmail({
        scheduleType:  params.scheduleType,
        scheduledDate: params.scheduledDate,
        scheduledTime: params.scheduledTime,
        address:       params.address,
        clientName:    params.clientName,
      })
    )
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: scheduleReminderSubject(params.scheduleType, params.scheduledDate),
      html,
    })
    if (error) return { success: false, error: String(error) }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function sendManualNotification(params: {
  userIds: string[]
  title: string
  body: string
  link?: string
}): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0
  let failCount = 0
  for (const userId of params.userIds) {
    const result = await createInAppNotification({
      userId,
      type: 'info',
      title: params.title,
      body: params.body,
      link: params.link,
      priority: 1,
    })
    if (result.success) successCount++
    else failCount++
  }
  return { successCount, failCount }
}
