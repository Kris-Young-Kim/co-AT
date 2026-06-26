import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMonthlyConfirmedSummary, generateMonthlyConfirmedExcel } from '@/actions/monthly-report-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin')

describe('getMonthlyConfirmedSummary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 error 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await getMonthlyConfirmedSummary(2026)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('권한이 없습니다')
  })

  it('완료 기록 없으면 12개 월 전부 0으로 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const mockResult = { data: [], error: null }
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => void) => Promise.resolve(mockResult).then(resolve),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce({ from: () => chain } as any)

    const result = await getMonthlyConfirmedSummary(2026)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows).toHaveLength(12)
      expect(result.rows[0].month).toBe(1)
      expect(result.rows[0].total_cases).toBe(0)
      expect(result.rows[11].month).toBe(12)
    }
  })

  it('완료 기록을 월별로 집계한다', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const fakeRows = [
      { client_id: 'c1', application_month: 3, received_at: null, is_consult: true, is_assessment: false, is_trial: false, is_rental: true, is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false, is_other_business: false },
      { client_id: 'c2', application_month: 3, received_at: null, is_consult: false, is_assessment: false, is_trial: false, is_rental: false, is_custom_make: false, is_grant: true, is_education: false, is_info_provision: false, is_other_business: false },
      { client_id: 'c1', application_month: 5, received_at: null, is_consult: true, is_assessment: false, is_trial: false, is_rental: false, is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false, is_other_business: false },
    ]
    const mockResult = { data: fakeRows, error: null }
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => void) => Promise.resolve(mockResult).then(resolve),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce({ from: () => chain } as any)

    const result = await getMonthlyConfirmedSummary(2026)
    expect(result.success).toBe(true)
    if (!result.success) return

    const march = result.rows.find(r => r.month === 3)!
    expect(march.total_cases).toBe(2)
    expect(march.total_clients).toBe(2)
    expect(march.consult).toBe(1)
    expect(march.rental).toBe(1)
    expect(march.grant).toBe(1)

    const may = result.rows.find(r => r.month === 5)!
    expect(may.total_cases).toBe(1)
    expect(may.consult).toBe(1)
    expect(may.total_clients).toBe(1)
  })

  it('received_at 으로 월을 fallback 처리한다', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const fakeRows = [
      { client_id: 'c1', application_month: null, received_at: '2026-07-15', is_consult: true, is_assessment: false, is_trial: false, is_rental: false, is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false, is_other_business: false },
    ]
    const mockResult = { data: fakeRows, error: null }
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => void) => Promise.resolve(mockResult).then(resolve),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce({ from: () => chain } as any)

    const result = await getMonthlyConfirmedSummary(2026)
    expect(result.success).toBe(true)
    if (!result.success) return
    const july = result.rows.find(r => r.month === 7)!
    expect(july.consult).toBe(1)
  })

  it('generateMonthlyConfirmedExcel - 데이터 있으면 buffer와 filename 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const fakeRows = [
      { client_id: 'c1', application_month: 1, received_at: null, is_consult: true, is_assessment: false, is_trial: false, is_rental: false, is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false, is_other_business: false },
    ]
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: any) => Promise.resolve({ data: fakeRows, error: null }).then(resolve),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce({ from: () => chain } as any)

    const result = await generateMonthlyConfirmedExcel(2026)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.buffer).toBeDefined()
      expect(Array.isArray(result.buffer)).toBe(true)
      expect((result.buffer ?? []).length).toBeGreaterThan(0)
      expect(result.filename).toBe('월별확정실적_2026년.xlsx')
    }
  })
})
