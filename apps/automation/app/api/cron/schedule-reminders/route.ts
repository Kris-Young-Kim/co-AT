import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { createInAppNotification, sendScheduleReminderEmail } from '@/actions/notify-actions'
import { createLog } from '@/actions/log-actions'

const SCHEDULE_TYPE_MAP: Record<string, string> = {
  visit: '방문', consult: '상담', assessment: '평가',
  delivery: '배송', pickup: '수거', exhibition: '견학',
  education: '교육', custom_make: '맞춤제작',
}

export async function GET(request: Request) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  const supabase = createSupabaseAdmin()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  let totalSent = 0
  let failCount = 0

  try {
    const { data: emailChannel } = await supabase
      .from('automation_channels')
      .select('is_enabled')
      .eq('channel_type', 'email')
      .single()
    const emailEnabled = emailChannel?.is_enabled ?? false

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        id, staff_id, client_id, schedule_type,
        scheduled_date, scheduled_time, address,
        profiles:staff_id ( clerk_user_id ),
        clients:client_id ( name )
      `)
      .eq('scheduled_date', tomorrowStr)
      .eq('status', 'scheduled')

    if (error || !schedules) {
      await createLog({
        jobName: 'schedule-reminders', triggeredBy: 'cron', status: 'failed',
        totalSent: 0, successCount: 0, failCount: 1,
        channel: 'in-app', errorMessage: error?.message,
      })
      return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
    }

    for (const schedule of schedules) {
      const staffId     = schedule.staff_id as string | null
      const clerkUserId = (schedule.profiles as { clerk_user_id?: string } | null)?.clerk_user_id
      const clientName  = (schedule.clients  as { name?: string }          | null)?.name
      const typeName    = SCHEDULE_TYPE_MAP[schedule.schedule_type] ?? schedule.schedule_type

      if (staffId) {
        const result = await createInAppNotification({
          userId:      staffId,
          clerkUserId: clerkUserId,
          type:        'schedule',
          title:       '내일 일정 리마인더',
          body:        `${typeName} 일정이 내일${schedule.scheduled_time ? ` ${schedule.scheduled_time}` : ''}에 예정되어 있습니다.${clientName ? ` (${clientName})` : ''}`,
          link:        '/schedule',
          priority:    2,
          metadata:    { scheduleId: schedule.id, scheduleType: schedule.schedule_type, scheduledDate: schedule.scheduled_date },
        })
        if (result.success) totalSent++
        else failCount++

        if (emailEnabled && clerkUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('clerk_user_id', clerkUserId)
            .single()
          if (profile?.email) {
            const email = await sendScheduleReminderEmail({
              toEmail:       profile.email,
              scheduleType:  typeName,
              scheduledDate: schedule.scheduled_date,
              scheduledTime: schedule.scheduled_time ?? undefined,
              address:       schedule.address ?? undefined,
              clientName:    clientName ?? undefined,
            })
            if (email.success) totalSent++
            else failCount++
          }
        }
      }

      if (schedule.client_id) {
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('id, clerk_user_id')
          .eq('id', schedule.client_id)
          .single()
        if (clientProfile) {
          const result = await createInAppNotification({
            userId:      clientProfile.id,
            clerkUserId: clientProfile.clerk_user_id ?? undefined,
            type:        'schedule',
            title:       '내일 일정 안내',
            body:        `${typeName} 일정이 내일${schedule.scheduled_time ? ` ${schedule.scheduled_time}` : ''}에 예정되어 있습니다.${schedule.address ? ` (${schedule.address})` : ''}`,
            link:        '/mypage',
            priority:    1,
            metadata:    { scheduleId: schedule.id },
          })
          if (result.success) totalSent++
          else failCount++
        }
      }
    }

    await createLog({
      jobName:      'schedule-reminders',
      triggeredBy:  'cron',
      status:       failCount === 0 ? 'success' : totalSent > 0 ? 'partial' : 'failed',
      totalSent:    totalSent + failCount,
      successCount: totalSent,
      failCount,
      channel:      emailEnabled ? 'email' : 'in-app',
      metadata:     { date: tomorrowStr, schedulesProcessed: schedules.length },
    })

    return NextResponse.json({ success: true, totalSent, failCount, schedulesProcessed: schedules.length })
  } catch (error) {
    await createLog({
      jobName: 'schedule-reminders', triggeredBy: 'cron', status: 'failed',
      totalSent: 0, successCount: 0, failCount: 1,
      channel: 'in-app', errorMessage: String(error),
    })
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
