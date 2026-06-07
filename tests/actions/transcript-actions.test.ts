import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveTranscript, getTranscriptsByClient } from '@/actions/transcript-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'

const mockChain: any = {
  from: vi.fn(),
  insert: vi.fn(() => mockChain),
  select: vi.fn(() => mockChain),
  update: vi.fn(() => mockChain),
  eq: vi.fn(() => mockChain),
  order: vi.fn(() => mockChain),
  limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
  single: vi.fn(() => Promise.resolve({ data: { id: 'tx-1' }, error: null })),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockChain,
}))

describe('saveTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain.from.mockReturnValue(mockChain)
    mockChain.insert.mockReturnValue(mockChain)
    mockChain.select.mockReturnValue(mockChain)
    mockChain.single.mockResolvedValue({ data: { id: 'tx-1' }, error: null })
  })

  it('권한 없으면 오류 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await saveTranscript({
      staff_id: 'user-1',
      session_type: 'call',
      session_date: '2026-06-08',
      transcript: '안녕하세요',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('권한이 없습니다')
  })

  it('성공 — id 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const result = await saveTranscript({
      staff_id: 'user-1',
      session_type: 'call',
      session_date: '2026-06-08',
      transcript: '안녕하세요',
    })
    expect(result.success).toBe(true)
    expect(result.id).toBe('tx-1')
  })
})

describe('getTranscriptsByClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain.from.mockReturnValue(mockChain)
    mockChain.select.mockReturnValue(mockChain)
    mockChain.eq.mockReturnValue(mockChain)
    mockChain.order.mockReturnValue(mockChain)
    mockChain.limit.mockResolvedValue({
      data: [{ id: 'tx-1', session_type: 'call', session_date: '2026-06-08' }],
      error: null,
    })
  })

  it('클라이언트 대화록 목록 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const result = await getTranscriptsByClient('client-1')
    expect(result.success).toBe(true)
    expect(result.transcripts).toHaveLength(1)
  })
})
