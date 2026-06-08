import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveTranscript, updateTranscript, getTranscriptsByClient, getRecentTranscripts } from '@/actions/transcript-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

function makeChain(overrides: Record<string, unknown> = {}) {
  const chain: any = {
    from: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: { id: 'tx-1' }, error: null })),
    ...overrides,
  }
  return chain
}

describe('saveTranscript', () => {
  beforeEach(() => vi.clearAllMocks())

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
    vi.mocked(createAdminClient).mockReturnValueOnce(makeChain() as any)
    const result = await saveTranscript({
      staff_id: 'user-1',
      session_type: 'call',
      session_date: '2026-06-08',
      transcript: '안녕하세요',
    })
    expect(result.success).toBe(true)
    expect(result.id).toBe('tx-1')
  })

  it('동의 없으면 raw_transcript null로 저장', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain()
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    await saveTranscript({
      staff_id: 'user-1',
      session_type: 'call',
      session_date: '2026-06-08',
      transcript: '안녕하세요',
      raw_transcript: '원본 내용',
      consent_given: false,
    })
    const insertArg = chain.insert.mock.calls[0][0]
    expect(insertArg.raw_transcript).toBeNull()
  })
})

describe('updateTranscript', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await updateTranscript('tx-1', { ai_summary: '요약' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('권한이 없습니다')
  })

  it('성공', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })
    chain.update = vi.fn(() => chain)
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await updateTranscript('tx-1', { ai_summary: '요약' })
    expect(result.success).toBe(true)
  })
})

describe('getTranscriptsByClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await getTranscriptsByClient('client-1')
    expect(result.success).toBe(false)
  })

  it('클라이언트 대화록 목록 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({
      limit: vi.fn(() => Promise.resolve({
        data: [{ id: 'tx-1', session_type: 'call', session_date: '2026-06-08' }],
        error: null,
      })),
    })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await getTranscriptsByClient('client-1')
    expect(result.success).toBe(true)
    expect(result.transcripts).toHaveLength(1)
  })
})

describe('getRecentTranscripts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await getRecentTranscripts()
    expect(result.success).toBe(false)
  })

  it('최근 대화록 목록 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({
      limit: vi.fn(() => Promise.resolve({
        data: [{ id: 'tx-1' }, { id: 'tx-2' }],
        error: null,
      })),
    })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await getRecentTranscripts(2)
    expect(result.success).toBe(true)
    expect(result.transcripts).toHaveLength(2)
  })
})
