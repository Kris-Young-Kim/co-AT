import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listGrantAssessments,
  createGrantAssessment,
  updateGrantAssessment,
  deleteGrantAssessment,
  submitGrantAssessment,
} from '@/actions/grant-assessment-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

function makeChain(overrides: Record<string, unknown> = {}) {
  const result = { data: null, error: null }
  const chain: any = {
    from: vi.fn(() => chain),
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    ...overrides,
  }
  // Make chain thenable so `await chain` (from .update().eq()) resolves
  chain.then = (resolve: (v: typeof result) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

describe('listGrantAssessments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await listGrantAssessments()
    expect(result.success).toBe(false)
    expect(result.error).toBe('권한이 없습니다')
  })

  it('성공 — 목록 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({
      order: vi.fn(() => Promise.resolve({ data: [{ id: 'a-1', client_name: '홍길동' }], error: null })),
    })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await listGrantAssessments()
    expect(result.success).toBe(true)
    expect(result.assessments).toHaveLength(1)
  })
})

describe('createGrantAssessment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await createGrantAssessment({ client_id: 'c-1', assessment_year: 2026 })
    expect(result.success).toBe(false)
  })

  it('성공 — id 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({
      single: vi.fn()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { id: 'new-id' }, error: null }),
    })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await createGrantAssessment({ client_id: 'c-1', assessment_year: 2026 })
    expect(result.success).toBe(true)
    expect(result.id).toBe('new-id')
  })
})

describe('updateGrantAssessment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('성공', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    // .from().update().eq("id", id) — eq is terminal, resolved via chain.then
    const chain = makeChain()
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await updateGrantAssessment('a-1', { general_opinion: '검토 완료' })
    expect(result.success).toBe(true)
  })

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await updateGrantAssessment('a-1', {})
    expect(result.success).toBe(false)
  })
})

describe('deleteGrantAssessment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('성공', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    // .from().delete().eq("id", id) — eq is terminal, resolved via chain.then
    const chain = makeChain()
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await deleteGrantAssessment('a-1')
    expect(result.success).toBe(true)
  })
})

describe('submitGrantAssessment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('성공', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    // .from().update().eq("id", id).eq("status", "draft") — second eq is terminal
    const chain = makeChain()
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await submitGrantAssessment('a-1')
    expect(result.success).toBe(true)
  })
})
