import { describe, it, expect, vi, beforeEach } from 'vitest'
import { upsertGrantItem, deleteGrantItem } from '@/actions/grant-item-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

function makeChain(overrides: Record<string, unknown> = {}) {
  const result = { data: null, error: null }
  const chain: any = {
    from: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: { id: 'item-1' }, error: null })),
    ...overrides,
  }
  // Make chain thenable so `await chain` (from .delete().eq().eq()) resolves
  chain.then = (resolve: (v: typeof result) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

describe('upsertGrantItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await upsertGrantItem('a-1', 1, { item_category: '전동휠체어' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('권한이 없습니다')
  })

  it('성공 — id 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    vi.mocked(createAdminClient).mockReturnValueOnce(makeChain() as any)
    const result = await upsertGrantItem('a-1', 1, { item_category: '전동휠체어' })
    expect(result.success).toBe(true)
    expect(result.id).toBe('item-1')
  })

  it('DB 오류면 실패', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({
      single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB 오류' } })),
    })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await upsertGrantItem('a-1', 1, { item_category: '전동휠체어' })
    expect(result.success).toBe(false)
  })
})

describe('deleteGrantItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await deleteGrantItem('a-1', 1)
    expect(result.success).toBe(false)
  })

  it('성공', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    // .from().delete().eq("assessment_id", ...).eq("item_order", ...) — second eq is terminal
    const chain = makeChain()
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await deleteGrantItem('a-1', 1)
    expect(result.success).toBe(true)
  })
})
