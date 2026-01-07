import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  checkRepairLimit,
  checkCustomLimit,
  checkCustomMakeCostLimit,
} from '@/actions/business-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createClient } from '@/lib/supabase/server'

// 비즈니스 로직 한도 체크 테스트
describe('비즈니스 로직 한도 체크', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('수리비 한도 체크', () => {
    it('수리비 한도 체크 - 한도 내', async () => {
      // Mock: 권한 확인
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

      // Mock: 누적 수리비 50000원 (한도 100000원)
      const createQuery = () => {
        const query: any = {
          select: vi.fn(function (this: any) { return this }),
          eq: vi.fn(function (this: any) { return this }),
          gte: vi.fn(function (this: any) { return this }),
          lte: vi.fn(function (this: any) { 
            return Promise.resolve({
              data: [{ cost_total: 50000 }],
              error: null,
            })
          }),
        }
        return query
      }

      const mockSupabase = {
        from: vi.fn((table) => {
          if (table === 'service_logs') {
            return createQuery()
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          }
        }),
      }

      vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

      const result = await checkRepairLimit('client-1', 30000)

      expect(result.success).toBe(true)
      expect(result.currentTotal).toBe(50000)
      expect(result.newTotal).toBe(80000)
      expect(result.limit).toBe(100000)
      expect(result.isExceeded).toBe(false)
    })

    it('수리비 한도 체크 - 한도 초과', async () => {
      // Mock: 권한 확인
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

      // Mock: 누적 수리비 80000원 (한도 100000원)
      const createQuery = () => {
        const query: any = {
          select: vi.fn(function (this: any) { return this }),
          eq: vi.fn(function (this: any) { return this }),
          gte: vi.fn(function (this: any) { return this }),
          lte: vi.fn(function (this: any) { 
            return Promise.resolve({
              data: [{ cost_total: 80000 }],
              error: null,
            })
          }),
        }
        return query
      }

      const mockSupabase = {
        from: vi.fn((table) => {
          if (table === 'service_logs') {
            return createQuery()
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          }
        }),
      }

      vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

      const result = await checkRepairLimit('client-1', 50000)

      expect(result.success).toBe(true)
      expect(result.currentTotal).toBe(80000)
      expect(result.newTotal).toBe(130000)
      expect(result.limit).toBe(100000)
      expect(result.isExceeded).toBe(true)
    })
  })

  describe('맞춤제작 횟수 제한 체크', () => {
    it('맞춤제작 횟수 체크 - 한도 내', async () => {
      // Mock: 권한 확인
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

      // Mock: 올해 맞춤제작 1회 (한도 2회)
      const mockSupabase = {
        from: vi.fn((table) => {
          if (table === 'custom_makes') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => ({
                    gte: vi.fn(() => ({
                      lte: vi.fn(() =>
                        Promise.resolve({
                          count: 1,
                          error: null,
                        })
                      ),
                    })),
                  })),
                })),
              })),
            }
          }
          if (table === 'applications') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      gte: vi.fn(() => ({
                        lte: vi.fn(() =>
                          Promise.resolve({
                            count: 1,
                            error: null,
                          })
                        ),
                      })),
                    })),
                  })),
                })),
              })),
            }
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          }
        }),
      }

      vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

      const result = await checkCustomLimit('client-1')

      expect(result.success).toBe(true)
      expect(result.currentCount).toBe(1)
      expect(result.limit).toBe(2)
      expect(result.isExceeded).toBe(false)
    })

    it('맞춤제작 횟수 체크 - 한도 초과', async () => {
      // Mock: 권한 확인
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

      // Mock: 올해 맞춤제작 2회 (한도 2회)
      const mockSupabase = {
        from: vi.fn((table) => {
          if (table === 'custom_makes') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => ({
                    gte: vi.fn(() => ({
                      lte: vi.fn(() =>
                        Promise.resolve({
                          count: 2,
                          error: null,
                        })
                      ),
                    })),
                  })),
                })),
              })),
            }
          }
          if (table === 'applications') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      gte: vi.fn(() => ({
                        lte: vi.fn(() =>
                          Promise.resolve({
                            count: 2,
                            error: null,
                          })
                        ),
                      })),
                    })),
                  })),
                })),
              })),
            }
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          }
        }),
      }

      vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

      const result = await checkCustomLimit('client-1')

      expect(result.success).toBe(true)
      expect(result.currentCount).toBe(2)
      expect(result.limit).toBe(2)
      expect(result.isExceeded).toBe(true)
    })
  })

  describe('맞춤제작비 한도 체크', () => {
    it('맞춤제작비 한도 체크 - 한도 내', async () => {
      // Mock: 권한 확인
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

      // Mock: 누적 재료비 50000원 (한도 100000원)
      const mockSupabase = {
        from: vi.fn((table) => {
          if (table === 'custom_makes') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    lte: vi.fn(() =>
                      Promise.resolve({
                        data: [{ cost_materials: 50000, cost_total: 70000 }],
                        error: null,
                      })
                    ),
                  })),
                })),
              })),
            }
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          }
        }),
      }

      vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

      const result = await checkCustomMakeCostLimit('client-1', 30000)

      expect(result.success).toBe(true)
      expect(result.currentTotal).toBe(50000)
      expect(result.newTotal).toBe(80000)
      expect(result.limit).toBe(100000)
      expect(result.isExceeded).toBe(false)
    })

    it('맞춤제작비 한도 체크 - 한도 초과', async () => {
      // Mock: 권한 확인
      mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

      // Mock: 누적 재료비 80000원 (한도 100000원)
      const mockSupabase = {
        from: vi.fn((table) => {
          if (table === 'custom_makes') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    lte: vi.fn(() =>
                      Promise.resolve({
                        data: [{ cost_materials: 80000, cost_total: 100000 }],
                        error: null,
                      })
                    ),
                  })),
                })),
              })),
            }
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          }
        }),
      }

      vi.mocked(createClient).mockReturnValueOnce(mockSupabase as any)

      const result = await checkCustomMakeCostLimit('client-1', 50000)

      expect(result.success).toBe(true)
      expect(result.currentTotal).toBe(80000)
      expect(result.newTotal).toBe(130000)
      expect(result.limit).toBe(100000)
      expect(result.isExceeded).toBe(true)
    })
  })
})
