'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import ExcelJS from 'exceljs'

export async function generateRentalReport(params: { year: number; month?: number }): Promise<{
  success: boolean; buffer?: number[]; filename?: string; error?: string
}> {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('rentals')
      .select('*, inventory(name, model), eval_clients(name)')
      .order('rental_start_date', { ascending: false })

    if (params.month) {
      const start = `${params.year}-${String(params.month).padStart(2, '0')}-01`
      const end = `${params.year}-${String(params.month).padStart(2, '0')}-31`
      query = query.gte('rental_start_date', start).lte('rental_start_date', end)
    } else {
      query = query.gte('rental_start_date', `${params.year}-01-01`).lte('rental_start_date', `${params.year}-12-31`)
    }

    const { data, error } = await query
    if (error) return { success: false, error: error.message }

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('대여 현황')
    ws.columns = [
      { header: '대여일', key: 'start', width: 14 },
      { header: '반납기한', key: 'end', width: 14 },
      { header: '기기명', key: 'device', width: 24 },
      { header: '모델', key: 'model', width: 20 },
      { header: '이용자', key: 'client', width: 16 },
      { header: '상태', key: 'status', width: 14 },
      { header: '연장횟수', key: 'ext', width: 10 },
    ]
    ws.getRow(1).font = { bold: true }
    ;(data ?? []).forEach(r => {
      const inv = r.inventory as { name?: string; model?: string } | null
      const cli = r.eval_clients as { name?: string } | null
      ws.addRow({
        start: r.rental_start_date, end: r.rental_end_date,
        device: inv?.name ?? '—', model: inv?.model ?? '—',
        client: cli?.name ?? '—', status: r.status ?? '—',
        ext: r.extension_count ?? 0,
      })
    })

    const buffer = await wb.xlsx.writeBuffer()
    const label = params.month ? `${params.year}년_${params.month}월` : `${params.year}년`
    return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename: `대여현황_${label}.xlsx` }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function generateDispatchSummaryReport(params: { year: number }): Promise<{
  success: boolean; buffer?: number[]; filename?: string; error?: string
}> {
  try {
    const supabase = createAdminClient()
    const yearStart = `${params.year}-01-01`
    const yearEnd = `${params.year}-12-31`

    const [rentals, customs, reuses] = await Promise.all([
      supabase.from('rentals').select('client_id, eval_clients(name), status').gte('rental_start_date', yearStart).lte('rental_start_date', yearEnd),
      supabase.from('inventory_custom_orders').select('client_id, eval_clients(name), status').gte('created_at', yearStart).lte('created_at', yearEnd),
      supabase.from('inventory_reuse_dispatches').select('client_id, eval_clients(name), status').gte('created_at', yearStart).lte('created_at', yearEnd),
    ])

    const wb = new ExcelJS.Workbook()

    const addSheet = (name: string, rows: unknown[], type: string) => {
      const ws = wb.addWorksheet(name)
      ws.columns = [
        { header: '이용자', key: 'client', width: 16 },
        { header: '유형', key: 'type', width: 12 },
        { header: '상태', key: 'status', width: 14 },
      ]
      ws.getRow(1).font = { bold: true }
      ;(rows as { eval_clients: { name?: string } | null; status: string }[]).forEach(r => {
        ws.addRow({ client: r.eval_clients?.name ?? '—', type, status: r.status })
      })
    }

    addSheet('대여', rentals.data ?? [], '대여')
    addSheet('맞춤제작', customs.data ?? [], '맞춤제작')
    addSheet('재사용', reuses.data ?? [], '재사용')

    const buffer = await wb.xlsx.writeBuffer()
    return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename: `출고통계_${params.year}년.xlsx` }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
