import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { createInAppNotification, sendRentalExpiryEmail } from '@/actions/notify-actions'
import { createLog } from '@/actions/log-actions'

const DAYS_TO_CHECK = [7, 3, 0]

export async function GET(request: Request) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  const supabase = createSupabaseAdmin()
  const today = new Date()
  let totalSent = 0
  let failCount = 0

  try {
    const { data: emailChannel } = await supabase
      .from('automation_channels')
      .select('is_enabled, config')
      .eq('channel_type', 'email')
      .single()
    const emailEnabled = emailChannel?.is_enabled ?? false

    for (const days of DAYS_TO_CHECK) {
      const target = new Date(today)
      target.setDate(today.getDate() + days)
      const targetDate = target.toISOString().split('T')[0]

      const { data: rentals, error } = await supabase
        .from('rentals')
        .select(`
          id, client_id, rental_end_date,
          inventory:inventory_id ( name ),
          clients:client_id (
            id,
            profiles!rentals_client_id_fkey ( clerk_user_id )
          )
        `)
        .eq('status', 'rented')
        .eq('rental_end_date', targetDate)

      if (error || !rentals) continue

      for (const rental of rentals) {
        const clientId = rental.client_id as string
        const clerkUserId = (rental.clients as unknown as Record<string, unknown> | null)?.clerk_user_id as string | undefined
        const deviceName = (rental.inventory as { name?: string } | null)?.name ?? '보조기기'

        const inApp = await createInAppNotification({
          userId:      clientId,
          clerkUserId: clerkUserId,
          type:        'rental_expiry',
          title:       `대여 기간 만료 ${days === 0 ? '오늘' : `D-${days}`} 안내`,
          body:        `${deviceName} 대여 기간이 ${days === 0 ? '오늘' : `${days}일 후`} 만료됩니다.`,
          link:        '/mypage',
          priority:    days === 0 ? 3 : 2,
          metadata:    { rentalId: rental.id, daysLeft: days, expiryDate: targetDate },
        })
        if (inApp.success) totalSent++
        else failCount++

        if (emailEnabled && clerkUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('clerk_user_id', clerkUserId)
            .single()
          if (profile?.email) {
            const email = await sendRentalExpiryEmail({
              toEmail:    profile.email,
              deviceName,
              daysLeft:   days,
              expiryDate: targetDate,
            })
            if (email.success) totalSent++
            else failCount++
          }
        }
      }
    }

    await createLog({
      jobName:      'rental-expiry',
      triggeredBy:  'cron',
      status:       failCount === 0 ? 'success' : totalSent > 0 ? 'partial' : 'failed',
      totalSent:    totalSent + failCount,
      successCount: totalSent,
      failCount,
      channel:      emailEnabled ? 'email' : 'in-app',
      metadata:     { date: today.toISOString().split('T')[0] },
    })

    return NextResponse.json({ success: true, totalSent, failCount })
  } catch (error) {
    await createLog({
      jobName: 'rental-expiry', triggeredBy: 'cron', status: 'failed',
      totalSent: 0, successCount: 0, failCount: 1,
      channel: 'in-app', errorMessage: String(error),
    })
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
