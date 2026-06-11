import { describe, it, expect } from 'vitest'
import {
  formatKRW,
  getExecutionColor,
  buildFundingSourceData,
  buildQuarterlyData,
  buildSubsidyTypeData,
} from '../../apps/finance/app/reports/chart-utils'
import type { FinanceCategoryStats, FinanceMonthlySpend } from '@co-at/types'

describe('formatKRW', () => {
  it('formats zero', () => expect(formatKRW(0)).toBe('0원'))
  it('formats thousands with comma', () => expect(formatKRW(1_000)).toBe('1,000원'))
  it('formats millions', () => expect(formatKRW(5_000_000)).toBe('5,000,000원'))
})

describe('getExecutionColor', () => {
  it('returns blue below 50', () => expect(getExecutionColor(0)).toBe('#3b82f6'))
  it('returns blue at 49', () => expect(getExecutionColor(49)).toBe('#3b82f6'))
  it('returns yellow at 50', () => expect(getExecutionColor(50)).toBe('#f59e0b'))
  it('returns yellow at 79', () => expect(getExecutionColor(79)).toBe('#f59e0b'))
  it('returns green at 80', () => expect(getExecutionColor(80)).toBe('#10b981'))
  it('returns green at 100', () => expect(getExecutionColor(100)).toBe('#10b981'))
})

describe('buildFundingSourceData', () => {
  it('splits budget and spent 50/50', () => {
    const result = buildFundingSourceData(10_000_000, 6_000_000)
    expect(result).toEqual([
      { name: '국비', 예산: 5_000_000, 집행액: 3_000_000 },
      { name: '도비', 예산: 5_000_000, 집행액: 3_000_000 },
    ])
  })
  it('handles zero values', () => {
    expect(buildFundingSourceData(0, 0)).toEqual([
      { name: '국비', 예산: 0, 집행액: 0 },
      { name: '도비', 예산: 0, 집행액: 0 },
    ])
  })
  it('rounds odd amounts down', () => {
    const result = buildFundingSourceData(9_999_999, 5_000_001)
    expect(result[0]['예산']).toBe(4_999_999)
    expect(result[0]['집행액']).toBe(2_500_000)
  })
})

describe('buildQuarterlyData', () => {
  it('groups months 1-3 into Q1', () => {
    const monthly: FinanceMonthlySpend[] = [
      { month: 1, amount: 100 }, { month: 2, amount: 200 }, { month: 3, amount: 300 },
    ]
    const result = buildQuarterlyData(monthly, 0)
    expect(result[0]).toEqual({ name: 'Q1', 집행액: 600 })
  })
  it('groups all 4 quarters correctly', () => {
    const monthly: FinanceMonthlySpend[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amount: (i + 1) * 100,
    }))
    const result = buildQuarterlyData(monthly, 0)
    expect(result).toEqual([
      { name: 'Q1', 집행액: 600 },
      { name: 'Q2', 집행액: 1_500 },
      { name: 'Q3', 집행액: 2_400 },
      { name: 'Q4', 집행액: 3_300 },
    ])
  })
  it('treats missing months as zero', () => {
    const result = buildQuarterlyData([], 0)
    expect(result).toEqual([
      { name: 'Q1', 집행액: 0 },
      { name: 'Q2', 집행액: 0 },
      { name: 'Q3', 집행액: 0 },
      { name: 'Q4', 집행액: 0 },
    ])
  })
})

describe('buildSubsidyTypeData', () => {
  const makeCategory = (id: string, name: string, code: string, parentId: string | null) => ({
    id, name, code, parent_id: parentId, order_no: 0, created_at: '',
  })

  it('returns name as "{parent} {child}" with budget and spent', () => {
    const stats: FinanceCategoryStats[] = [
      {
        category: makeCategory('1', '본사업', 'MAIN', null),
        budget: 10_000_000, spent: 4_000_000, remaining: 6_000_000, rate: 40,
        children: [
          { category: makeCategory('2', '경상보조', 'MAIN_CURRENT', '1'), budget: 5_000_000, spent: 2_000_000, remaining: 3_000_000, rate: 40 },
          { category: makeCategory('3', '자본보조', 'MAIN_CAPITAL', '1'), budget: 5_000_000, spent: 2_000_000, remaining: 3_000_000, rate: 40 },
        ],
      },
    ]
    expect(buildSubsidyTypeData(stats)).toEqual([
      { name: '본사업 경상보조', 예산: 5_000_000, 집행액: 2_000_000 },
      { name: '본사업 자본보조', 예산: 5_000_000, 집행액: 2_000_000 },
    ])
  })

  it('returns empty array when no children', () => {
    const stats: FinanceCategoryStats[] = [
      { category: makeCategory('1', '본사업', 'MAIN', null), budget: 0, spent: 0, remaining: 0, rate: 0 },
    ]
    expect(buildSubsidyTypeData(stats)).toEqual([])
  })

  it('flattens multiple parents', () => {
    const stats: FinanceCategoryStats[] = [
      {
        category: makeCategory('1', '본사업', 'MAIN', null),
        budget: 0, spent: 0, remaining: 0, rate: 0,
        children: [
          { category: makeCategory('2', '경상보조', 'MAIN_CURRENT', '1'), budget: 100, spent: 50, remaining: 50, rate: 50 },
        ],
      },
      {
        category: makeCategory('3', '기능보강 사업', 'INFRA', null),
        budget: 0, spent: 0, remaining: 0, rate: 0,
        children: [
          { category: makeCategory('4', '자본보조', 'INFRA_CAPITAL', '3'), budget: 200, spent: 80, remaining: 120, rate: 40 },
        ],
      },
    ]
    expect(buildSubsidyTypeData(stats)).toEqual([
      { name: '본사업 경상보조', 예산: 100, 집행액: 50 },
      { name: '기능보강 사업 자본보조', 예산: 200, 집행액: 80 },
    ])
  })
})
