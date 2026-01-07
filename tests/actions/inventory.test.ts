import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getInventoryList,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/actions/inventory-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createClient } from '@/lib/supabase/server'

// 재고 관리 플로우 테스트
describe('재고 관리 플로우', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('재고 목록 조회 - 성공', async () => {
    // Mock: 권한 확인
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    // Mock: 재고 목록 조회
    const mockItems = [
      {
        id: 'item-1',
        name: '휠체어',
        status: '보관',
        category: '이동보조기',
      },
      {
        id: 'item-2',
        name: '목발',
        status: '대여중',
        category: '이동보조기',
      },
    ]

    const mockQuery = {
      select: vi.fn(function (this: any) { return this }),
      eq: vi.fn(function (this: any) { return this }),
      order: vi.fn(function (this: any) { return this }),
      range: vi.fn(() => Promise.resolve({
        data: mockItems,
        count: mockItems.length,
        error: null,
      })),
    }
    mockQuery.select.count = 'exact'

    const mockSupabase = {
      from: vi.fn(() => mockQuery),
    }

    vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

    const result = await getInventoryList({})

    expect(result.success).toBe(true)
    expect(result.items).toBeDefined()
    expect(result.items?.length).toBe(2)
  })

  it('재고 등록 - 성공', async () => {
    // Mock: 권한 확인
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    // Mock: 재고 등록
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { id: 'new-item-id', name: '새 기기' },
                error: null,
              })
            ),
          })),
        })),
      })),
    }

    vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

    const result = await createInventoryItem({
      name: '새 기기',
      category: '이동보조기',
      status: '보관',
    })

    expect(result.success).toBe(true)
    expect(result.item).toBeDefined()
    expect(result.item?.id).toBe('new-item-id')
  })

  it('재고 수정 - 성공', async () => {
    // Mock: 권한 확인
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    // Mock: 재고 수정
    const mockSupabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: 'item-1', name: '수정된 기기', status: '수리중' },
                  error: null,
                })
              ),
            })),
          })),
        })),
      })),
    }

    vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

    const result = await updateInventoryItem('item-1', {
      name: '수정된 기기',
      status: '수리중',
    })

    expect(result.success).toBe(true)
    expect(result.item).toBeDefined()
    expect(result.item?.name).toBe('수정된 기기')
  })

  it('재고 삭제 - 성공', async () => {
    // Mock: 권한 확인
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    // Mock: 재고 삭제
    const mockSupabase = {
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              error: null,
            })
          ),
        })),
      })),
    }

    vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

    const result = await deleteInventoryItem('item-1')

    expect(result.success).toBe(true)
  })

  it('재고 목록 조회 - 권한 없음', async () => {
    // Mock: 권한 없음
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)

    const result = await getInventoryList({})

    expect(result.success).toBe(false)
    expect(result.error).toContain('권한')
  })
})
