import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const INACTIVE_DAYS = 180

type ClientRow = { id: string; name: string }

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('Authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const cutoff = new Date()
    cutoff.setUTCDate(cutoff.getUTCDate() - INACTIVE_DAYS)
    const cutoffIso = cutoff.toISOString()

    // Find registered active clients
    const { data: candidates, error: fetchError } = await (supabase as any)
      .from('clients')
      .select('id, name')
      .eq('lifecycle_status', 'active')
      .eq('status', 'registered')

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    const rows = (candidates ?? []) as ClientRow[]
    if (rows.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const allIds = rows.map(r => r.id)

    // Find clients with at least one service record after the cutoff
    const { data: recentRecords } = await (supabase as any)
      .from('eval_service_records')
      .select('client_id')
      .in('client_id', allIds)
      .gte('received_at', cutoffIso)

    const recentSet = new Set<string>((recentRecords ?? []).map((r: any) => r.client_id as string))
    const toInactivate = rows.filter(r => !recentSet.has(r.id))

    if (toInactivate.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const inactivateIds = toInactivate.map(r => r.id)

    const { error: updateError } = await (supabase as any)
      .from('clients')
      .update({ lifecycle_status: 'inactive', updated_at: new Date().toISOString() })
      .in('id', inactivateIds)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    const expiresAt = new Date()
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 14)

    const notifications = toInactivate.map(r => ({
      type: 'schedule',
      title: `장기 미접촉 대상자 — ${r.name}`,
      body: `${INACTIVE_DAYS}일 이상 서비스 기록이 없어 장기미접촉으로 전환되었습니다.`,
      link: `/clients/${r.id}`,
      priority: 2,
      status: 'unread',
      expires_at: expiresAt.toISOString(),
      metadata: { client_id: r.id, rule: 'inactive_client' },
    }))

    await (supabase as any).from('notifications').insert(notifications)

    return NextResponse.json({ success: true, updated: toInactivate.length })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
