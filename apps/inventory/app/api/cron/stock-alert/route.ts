import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type InventoryRow = { category: string | null; status: string | null }

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('Authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const { data: items, error } = await supabase
      .from('inventory')
      .select('category, status')
      .neq('status', '폐기')

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    const rows = (items ?? []) as InventoryRow[]

    // Group by category: count total and available (보관)
    const byCategory = new Map<string, { total: number; available: number }>()
    for (const row of rows) {
      const cat = row.category ?? '미분류'
      const entry = byCategory.get(cat) ?? { total: 0, available: 0 }
      entry.total++
      if (row.status === '보관') entry.available++
      byCategory.set(cat, entry)
    }

    const outOfStock: string[] = []
    const lowStock: string[] = []

    for (const [cat, { total, available }] of byCategory) {
      if (available === 0) outOfStock.push(cat)
      else if (available / total <= 0.2) lowStock.push(cat)
    }

    const hasAlert = outOfStock.length > 0 || lowStock.length > 0

    if (hasAlert) {
      const title = outOfStock.length > 0
        ? `재고 부족 경고: ${outOfStock.join(', ')} 재고 없음`
        : `재고 부족 주의: ${lowStock.join(', ')} 20% 미만`
      const body = [
        outOfStock.length > 0 ? `재고 없음: ${outOfStock.join(', ')}` : null,
        lowStock.length > 0 ? `20% 미만: ${lowStock.join(', ')}` : null,
      ].filter(Boolean).join(' / ')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('notifications').insert({
        type: 'warning',
        title,
        body,
        link: '/devices',
        priority: outOfStock.length > 0 ? 3 : 2,
        status: 'unread',
        metadata: { outOfStock, lowStock, checkedAt: new Date().toISOString() },
      })
    }

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      outOfStock,
      lowStock,
      hasAlert,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
