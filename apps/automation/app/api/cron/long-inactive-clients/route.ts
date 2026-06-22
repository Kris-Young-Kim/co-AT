import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { createInAppNotification } from '@/actions/notify-actions'
import { createLog } from '@/actions/log-actions'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { render } from '@react-email/render'
import { LongInactiveEmail, longInactiveSubject } from '@/emails/LongInactiveEmail'

function sixMonthsAgo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return d.toISOString().split('T')[0]
}

type ClientRow = {
  id: string
  name: string
  email: string | null
  assigned_staff_id: string | null
}

export async function GET(request: Request) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  const supabase = createSupabaseAdmin()
  let totalSent = 0
  let failCount = 0

  try {
    const { data: emailChannel } = await supabase
      .from('automation_channels')
      .select('is_enabled')
      .eq('channel_type', 'email')
      .single()
    const emailEnabled = emailChannel?.is_enabled ?? false

    const cutoff = sixMonthsAgo()

    // Clients active in last 6 months (have recent service records or case records)
    const { data: activeServiceClients } = await supabase
      .from('eval_service_records')
      .select('client_id')
      .gte('received_at', cutoff)
    const { data: activeCaseClients } = await supabase
      .from('eval_case_records')
      .select('client_id')
      .gte('created_at', cutoff)

    const activeIds = new Set<string>([
      ...((activeServiceClients ?? []) as { client_id: string }[]).map(r => r.client_id),
      ...((activeCaseClients ?? []) as { client_id: string }[]).map(r => r.client_id),
    ])

    // All registered clients
    const { data: allClients, error } = await supabase
      .from('clients')
      .select('id, name, email, assigned_staff_id')
      .eq('status', 'registered')

    if (error || !allClients) {
      await createLog({
        jobName: 'long-inactive-clients', triggeredBy: 'cron', status: 'failed',
        totalSent: 0, successCount: 0, failCount: 1,
        channel: 'in-app', errorMessage: error?.message ?? 'no data',
      })
      return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
    }

    const inactiveClients = (allClients as unknown as ClientRow[]).filter(c => !activeIds.has(c.id))

    for (const client of inactiveClients) {
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('email_opt_out')
        .eq('client_id', client.id)
        .maybeSingle()
      const emailOptOut = (pref as any)?.email_opt_out ?? false

      // In-app notification
      const inApp = await createInAppNotification({
        userId: client.id,
        type: 'long_inactive',
        title: '장기 미활동 대상자',
        body: `${client.name}님이 6개월 이상 서비스 활동이 없습니다. 팔로업이 필요합니다.`,
        link: `/clients/${client.id}`,
        priority: 2,
        metadata: { clientId: client.id, cutoffDate: cutoff },
      })
      if (inApp.success) totalSent++
      else failCount++

      // Email to assigned staff (or client directly if no staff)
      if (emailEnabled && !emailOptOut) {
        let staffEmail: string | null = null
        let staffName: string | undefined

        if (client.assigned_staff_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', client.assigned_staff_id)
            .single()
          staffEmail = (profile as any)?.email ?? null
          staffName = (profile as any)?.full_name ?? undefined
        }

        const toEmail = staffEmail ?? client.email
        if (toEmail) {
          try {
            const resend = getResend()
            const html = await render(LongInactiveEmail({
              clientName: client.name,
              lastServiceDate: cutoff,
              staffName,
            }))
            const { error: emailError } = await resend.emails.send({
              from: FROM_EMAIL,
              to: toEmail,
              subject: longInactiveSubject(client.name),
              html,
            })
            if (emailError) failCount++
            else totalSent++
          } catch {
            failCount++
          }
        }
      }
    }

    await createLog({
      jobName: 'long-inactive-clients',
      triggeredBy: 'cron',
      status: failCount === 0 ? 'success' : totalSent > 0 ? 'partial' : 'failed',
      totalSent: totalSent + failCount,
      successCount: totalSent,
      failCount,
      channel: emailEnabled ? 'email+in-app' : 'in-app',
      metadata: { cutoffDate: cutoff, clientCount: inactiveClients.length },
    })

    return NextResponse.json({ success: true, totalSent, failCount, clientCount: inactiveClients.length })
  } catch (error) {
    await createLog({
      jobName: 'long-inactive-clients', triggeredBy: 'cron', status: 'failed',
      totalSent: 0, successCount: 0, failCount: 1,
      channel: 'in-app', errorMessage: String(error),
    })
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
