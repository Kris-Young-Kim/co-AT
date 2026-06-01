import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceRecord, getServiceRecordsByApplication, getServiceRecords } from '@/actions/service-record-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

describe('service-record-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createServiceRecord', () => {
    it('성공 — id 반환', async () => {
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: 'sr-1' }, error: null })),
            })),
          })),
        })),
      }
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any)
      const result = await createServiceRecord({ received_at: '2026-06-01' })
      expect(result.success).toBe(true)
      expect(result.id).toBe('sr-1')
    })

    it('권한 없음 — 실패', async () => {
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
      const result = await createServiceRecord({ received_at: '2026-06-01' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('권한')
    })
  })

  describe('getServiceRecordsByApplication', () => {
    it('applicationId로 기록 조회', async () => {
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
      const records = [{ id: 'sr-1', application_id: 'app-1', received_at: '2026-06-01' }]
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: records, error: null })),
            })),
          })),
        })),
      }
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any)
      const result = await getServiceRecordsByApplication('app-1')
      expect(result.success).toBe(true)
      expect(result.records).toHaveLength(1)
    })
  })

  describe('getServiceRecords', () => {
    it('연도 필터 적용 조회', async () => {
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
      const records = [{ id: 'sr-1', application_year: 2026 }]
      const chain: any = {
        select: vi.fn(() => chain),
        order: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        limit: vi.fn(() => Promise.resolve({ data: records, error: null })),
      }
      vi.mocked(createAdminClient).mockReturnValueOnce({ from: vi.fn(() => chain) } as any)
      const result = await getServiceRecords({ year: 2026 })
      expect(result.success).toBe(true)
      expect(result.records).toHaveLength(1)
    })
  })
})
