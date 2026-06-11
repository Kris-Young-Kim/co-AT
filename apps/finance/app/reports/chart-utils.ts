import type { FinanceCategoryStats, FinanceMonthlySpend } from '@co-at/types'

export function formatKRW(n: number): string {
  return n.toLocaleString('ko-KR') + '원'
}

export function getExecutionColor(rate: number): string {
  if (rate < 50) return '#3b82f6'
  if (rate < 80) return '#f59e0b'
  return '#10b981'
}

export interface FundingSourceRow {
  name: string
  예산: number
  집행액: number
}

export function buildFundingSourceData(totalBudget: number, totalSpent: number): FundingSourceRow[] {
  return [
    { name: '국비', 예산: Math.floor(totalBudget * 0.5), 집행액: Math.floor(totalSpent * 0.5) },
    { name: '도비', 예산: Math.floor(totalBudget * 0.5), 집행액: Math.floor(totalSpent * 0.5) },
  ]
}

export interface QuarterlyRow {
  name: string
  집행액: number
}

export function buildQuarterlyData(monthlySpend: FinanceMonthlySpend[], _totalBudget: number): QuarterlyRow[] {
  const QUARTERS = [
    { name: 'Q1', months: [1, 2, 3] },
    { name: 'Q2', months: [4, 5, 6] },
    { name: 'Q3', months: [7, 8, 9] },
    { name: 'Q4', months: [10, 11, 12] },
  ]
  return QUARTERS.map(q => ({
    name: q.name,
    집행액: q.months.reduce(
      (sum, m) => sum + (monthlySpend.find(ms => ms.month === m)?.amount ?? 0),
      0
    ),
  }))
}

export interface SubsidyTypeRow {
  name: string
  예산: number
  집행액: number
}

export function buildSubsidyTypeData(categoryStats: FinanceCategoryStats[]): SubsidyTypeRow[] {
  return categoryStats.flatMap(s =>
    (s.children ?? []).map(child => ({
      name: `${s.category.name} ${child.category.name}`,
      예산: child.budget,
      집행액: child.spent,
    }))
  )
}
