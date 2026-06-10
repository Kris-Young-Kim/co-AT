import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getClientActiveServices } from '@/actions/client-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

function makeTerminal(data: unknown[]) {
  const chain: Record<string, unknown> = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(() => Promise.resolve({ data, error: null })),
    not: vi.fn(() => Promise.resolve({ data, error: null })),
  }
  // make select/eq return the same chain
  ;(chain.select as ReturnType<typeof vi.fn>).mockReturnValue(chain)
  ;(chain.eq as ReturnType<typeof vi.fn>).mockReturnValue(chain)
  return chain
}

describe('getClientActiveServices', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 실패', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await getClientActiveServices('client-1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('권한이 없습니다')
  })

  it('활성 서비스 통합 반환 — grant + rental', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    const grantChain = makeTerminal([
      { id: 'g1', status: 'submitted', created_at: '2026-05-01T00:00:00Z', referral_org: '강릉시청' },
    ])
    const rentalChain = makeTerminal([
      { id: 'r1', status: 'rented', rental_start_date: '2026-04-01', inventory_id: 'i1' },
    ])
    const customChain = makeTerminal([])
    const appChain = makeTerminal([])

    const mockClient = {
      from: vi.fn()
        .mockReturnValueOnce(grantChain)   // eval_grant_assessments
        .mockReturnValueOnce(rentalChain)  // rentals
        .mockReturnValueOnce(customChain)  // custom_makes
        .mockReturnValueOnce(appChain),    // applications
    }
    vi.mocked(createAdminClient).mockReturnValueOnce(mockClient as ReturnType<typeof createAdminClient>)

    const result = await getClientActiveServices('client-1')
    expect(result.success).toBe(true)
    expect(result.services).toHaveLength(2)
    expect(result.services![0].service_type).toBe('grant_eval')
    expect(result.services![0].status_label).toBe('제출 완료')
    expect(result.services![1].service_type).toBe('rental')
  })

  it('활성 서비스 없으면 빈 배열', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const empty = makeTerminal([])
    const mockClient = {
      from: vi.fn()
        .mockReturnValueOnce(empty)
        .mockReturnValueOnce(empty)
        .mockReturnValueOnce(empty)
        .mockReturnValueOnce(empty),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce(mockClient as ReturnType<typeof createAdminClient>)
    const result = await getClientActiveServices('client-1')
    expect(result.success).toBe(true)
    expect(result.services).toHaveLength(0)
  })
})
