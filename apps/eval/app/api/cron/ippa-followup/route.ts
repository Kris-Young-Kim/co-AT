import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const FOLLOWUP_WINDOWS = [
  {
    days: 28,
    label: '4주',
    title: (name: string) => `K-IPPA 사후 측정 알림 — ${name}`,
    body: '보조기기 지원 후 4~6주가 경과했습니다. 사후 측정을 진행해 주세요.',
  },
  {
    days: 84,
    label: '12주',
    title: (name: string) => `K-IPPA 12주 팔로업 — ${name}`,
    body: '12주 모니터링 시점입니다. 아직 사후 측정이 완료되지 않았습니다.',
  },
  {
    days: 168,
    label: '24주',
    title: (name: string) => `K-IPPA 24주 장기성과 확인 — ${name}`,
    body: '24주 장기 성과 확인 시점입니다. K-IPPA 사후 측정을 완료해 주세요.',
  },
] as const

type AssessmentRow = {
  id: string
  client_id: string
  pre_date: string
  clients: { name: string } | null
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('Authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const windowMap = new Map(
      FOLLOWUP_WINDOWS.map((w) => {
        const d = new Date(today)
        d.setUTCDate(d.getUTCDate() - w.days)
        return [d.toISOString().split('T')[0], w]
      })
    )

    const targetDates = [...windowMap.keys()]

    const { data, error } = await (supabase as any)
      .from('eval_ippa_assessments')
      .select('id, client_id, pre_date, clients(name)')
      .eq('status', 'pre_only')
      .in('pre_date', targetDates)

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    const rows = (data ?? []) as AssessmentRow[]

    if (rows.length === 0) {
      return NextResponse.json({ success: true, notified: 0, checkedAt: today.toISOString() })
    }

    const expiresAt = new Date(today)
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 7)

    const notifications = rows.map((row) => {
      const window = windowMap.get(row.pre_date)!
      const clientName = row.clients?.name ?? '대상자'
      return {
        type: 'schedule',
        title: window.title(clientName),
        body: window.body,
        link: `/clients/${row.client_id}`,
        priority: 2,
        status: 'unread',
        expires_at: expiresAt.toISOString(),
        metadata: {
          assessment_id: row.id,
          client_id: row.client_id,
          pre_date: row.pre_date,
          followup_weeks: window.days / 7,
        },
      }
    })

    await (supabase as any).from('notifications').insert(notifications)

    return NextResponse.json({
      success: true,
      notified: notifications.length,
      checkedAt: today.toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
