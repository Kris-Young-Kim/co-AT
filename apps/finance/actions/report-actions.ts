'use server'

import ExcelJS from 'exceljs'
import { assertRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { getExpenditures, getBudgets, getCategories } from './finance-actions'

// ── Monthly expenditure Excel ─────────────────────────────

export async function generateMonthlyReport(params: {
  year: number
  month: number
}): Promise<{ success: boolean; buffer?: number[]; filename?: string; error?: string }> {
  await assertRole(ROLES.MANAGER)

  const rows = await getExpenditures({ year: params.year, month: params.month })
  if (!rows.length) return { success: false, error: '해당 기간에 지출 내역이 없습니다.' }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(`${params.year}-${String(params.month).padStart(2, '0')}`)

  sheet.columns = [
    { header: '지출일',    key: 'spend_date',   width: 14 },
    { header: '카테고리', key: 'category',     width: 20 },
    { header: '내용',      key: 'description',  width: 30 },
    { header: '금액(원)',  key: 'amount',        width: 14 },
    { header: '유형',      key: 'type',          width: 10 },
    { header: '메모',      key: 'note',          width: 20 },
  ]

  for (const row of rows) {
    sheet.addRow({
      spend_date:  row.spend_date,
      category:    row.finance_budget_categories?.name ?? '미분류',
      description: row.description,
      amount:      row.amount,
      type:        row.is_manual ? '수동' : '결재',
      note:        row.note ?? '',
    })
  }

  // Total row
  sheet.addRow({ description: '합계', amount: rows.reduce((s, r) => s + r.amount, 0) })

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `월간지출_${params.year}_${String(params.month).padStart(2, '0')}.xlsx`
  return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename }
}

// ── Annual budget summary Excel ───────────────────────────

export async function generateAnnualBudgetReport(params: {
  year: number
}): Promise<{ success: boolean; buffer?: number[]; filename?: string; error?: string }> {
  await assertRole(ROLES.MANAGER)

  const [categories, budgets, expenditures] = await Promise.all([
    getCategories(),
    getBudgets(params.year),
    getExpenditures({ year: params.year }),
  ])

  const budgetMap = new Map(budgets.map(b => [b.category_id, b.amount]))
  const spendMap  = new Map<string, number>()
  for (const e of expenditures) {
    if (e.category_id) spendMap.set(e.category_id, (spendMap.get(e.category_id) ?? 0) + e.amount)
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(`${params.year}년 예산`)

  sheet.columns = [
    { header: '대분류',   key: 'parent',    width: 16 },
    { header: '소분류',   key: 'child',     width: 20 },
    { header: '예산(원)', key: 'budget',    width: 16 },
    { header: '지출(원)', key: 'spent',     width: 16 },
    { header: '잔액(원)', key: 'remaining', width: 16 },
    { header: '집행률',   key: 'rate',      width: 10 },
  ]

  for (const cat of categories) {
    if (cat.children.length > 0) {
      for (const child of cat.children) {
        const budget  = budgetMap.get(child.id) ?? 0
        const spent   = spendMap.get(child.id) ?? 0
        sheet.addRow({ parent: cat.name, child: child.name, budget, spent, remaining: budget - spent, rate: budget ? `${Math.round((spent / budget) * 100)}%` : '0%' })
      }
    } else {
      const budget  = budgetMap.get(cat.id) ?? 0
      const spent   = spendMap.get(cat.id) ?? 0
      sheet.addRow({ parent: cat.name, child: '', budget, spent, remaining: budget - spent, rate: budget ? `${Math.round((spent / budget) * 100)}%` : '0%' })
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `연간예산_${params.year}.xlsx`
  return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename }
}
