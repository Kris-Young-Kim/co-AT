import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveServiceBadgesByClientIds } from '@/actions/client-actions'

vi.mock('@/lib/supabase/admin')

const makeMockClient = (tableMap: Record<string, any[]>) => ({
  from: (table: string) => {
    const data = tableMap[table] ?? []
    const chain: any = {
      select: vi.fn(() => chain),
      in:     vi.fn(() => chain),
      not:    vi.fn(() => chain),
      then:   (resolve: any) => Promise.resolve({ data, error: null }).then(resolve),
    }
    return chain
  },
})

describe('getActiveServiceBadgesByClientIds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('빈 배열 전달 시 DB 조회 없이 빈 맵 반환', async () => {
    const result = await getActiveServiceBadgesByClientIds([])
    expect(result).toEqual({ success: true, data: {} })
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('대여 중 서비스를 올바른 client_id 키에 그룹핑', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [],
        rentals: [
          { id: 'r-1', client_id: 'c-1', status: 'rented', rental_start_date: '2026-01-01' },
        ],
        custom_makes: [],
        applications: [],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1'])

    expect(result.success).toBe(true)
    expect(result.data?.['c-1']).toHaveLength(1)
    expect(result.data?.['c-1'][0].service_type).toBe('rental')
    expect(result.data?.['c-1'][0].status_label).toBe('대여 중')
    expect(result.data?.['c-1'][0].status).toBe('rented')
  })

  it('연체 상태 라벨 올바르게 설정', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [],
        rentals: [
          { id: 'r-2', client_id: 'c-1', status: 'overdue', rental_start_date: '2026-01-01' },
        ],
        custom_makes: [],
        applications: [],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1'])
    expect(result.data?.['c-1'][0].status_label).toBe('연체')
  })

  it('여러 클라이언트 각자의 키로 분리 저장', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [
          { id: 'g-1', client_id: 'c-1', status: 'draft',     created_at: '2026-01-01', referral_org: null },
          { id: 'g-2', client_id: 'c-2', status: 'submitted', created_at: '2026-01-02', referral_org: '기관A' },
        ],
        rentals: [],
        custom_makes: [],
        applications: [],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1', 'c-2'])

    expect(result.data?.['c-1']).toHaveLength(1)
    expect(result.data?.['c-2']).toHaveLength(1)
    expect(result.data?.['c-2'][0].metadata?.referral_org).toBe('기관A')
  })

  it('중복 client_id는 Set으로 제거 후 단일 조회', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [
          { id: 'g-1', client_id: 'c-1', status: 'draft', created_at: '2026-01-01', referral_org: null },
        ],
        rentals: [],
        custom_makes: [],
        applications: [],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1', 'c-1', 'c-1'])
    expect(result.success).toBe(true)
    expect(result.data?.['c-1']).toHaveLength(1)
  })

  it('맞춤제작·서비스신청 서비스 타입 정상 처리', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [],
        rentals: [],
        custom_makes: [
          { id: 'cm-1', client_id: 'c-1', progress_status: 'manufacturing', created_at: '2026-01-01' },
        ],
        applications: [
          { id: 'ap-1', client_id: 'c-1', category: 'consult', status: '진행중', created_at: '2026-01-02' },
        ],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1'])

    expect(result.data?.['c-1']).toHaveLength(2)
    const types = result.data?.['c-1'].map(s => s.service_type)
    expect(types).toContain('custom_make')
    expect(types).toContain('application')
  })
})
