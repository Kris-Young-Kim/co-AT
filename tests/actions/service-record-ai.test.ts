import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateServiceRecordDraft } from '@/actions/ai-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { getGeminiModel } from '@/lib/gemini/client'
import { createAdminClient } from '@/lib/supabase/admin'

const MOCK_DRAFT = {
  service_content: '전동휠체어 관련 공적급여 상담을 진행하였습니다.',
  service_major_category: '공적급여',
  service_sub_category: '건강보험 급여',
  service_category: '상담',
  service_area: 'WC',
  product_name: '전동휠체어',
  referral_type: '유선',
  is_consult: true,
  is_assessment: false,
  is_trial: false,
  is_rental: false,
  is_custom_make: false,
  is_grant: false,
  is_education: false,
  is_info_provision: false,
  is_repair: false,
}

describe('generateServiceRecordDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('성공 — 초안 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    const mockChain: any = {
      select: vi.fn(() => mockChain),
      eq: vi.fn(() => mockChain),
      not: vi.fn(() => mockChain),
      order: vi.fn(() => mockChain),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({
        data: {
          client_id: 'client-1',
          referral_type: '유선',
          progress_type: '신규',
          category: '보조기기 교부사업',
          sub_category: '상담',
          requested_item: '전동휠체어',
          service_area: 'WC',
        },
        error: null,
      })),
    }
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => mockChain) } as any)

    vi.mocked(getGeminiModel).mockReturnValueOnce({
      generateContent: vi.fn(() => Promise.resolve({
        response: { text: () => JSON.stringify(MOCK_DRAFT) },
      })),
    } as any)

    const result = await generateServiceRecordDraft({
      applicationId: 'app-1',
      clientId: 'client-1',
    })

    expect(result.success).toBe(true)
    expect(result.draft?.service_content).toBeDefined()
    expect(result.draft?.service_major_category).toBe('공적급여')
    expect(result.draft?.is_consult).toBe(true)
  })

  it('권한 없음 — 실패', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await generateServiceRecordDraft({ applicationId: 'app-1', clientId: 'c-1' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('권한')
  })

  it('application이 client 소유가 아님 — 실패', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const mockChain: any = {
      select: vi.fn(() => mockChain),
      eq: vi.fn(() => mockChain),
      single: vi.fn(() => Promise.resolve({
        data: { client_id: 'other-client' },
        error: null,
      })),
    }
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => mockChain) } as any)

    const result = await generateServiceRecordDraft({ applicationId: 'app-1', clientId: 'client-1' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('접근 권한')
  })
})
