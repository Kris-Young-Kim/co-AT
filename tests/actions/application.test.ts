import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApplication } from '@/actions/application-actions'
import { mockAuth } from '../../tests/setup'
import { createClient } from '@/lib/supabase/server'

// 신청서 접수 플로우 테스트
describe('신청서 접수 플로우', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('신청서 생성 - 성공', async () => {
    // Mock: 로그인된 사용자
    mockAuth.mockResolvedValueOnce({
      userId: 'test-user-id',
    } as any)

    // Mock: 프로필 조회 성공, 클라이언트 조회 성공, 신청서 생성 성공
    let callCount = 0
    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'profile-id' },
                    error: null,
                  })
                ),
              })),
            })),
          }
        }
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'profile-id' }, // profile-id를 client-id로 사용
                    error: null,
                  })
                ),
              })),
            })),
          }
        }
        if (table === 'applications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'application-id' },
                    error: null,
                  })
                ),
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

    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any)

    const formData = {
      category: 'consult',
      sub_category: 'phone',
      consult_type: 'phone',
      consult_purpose: '보조기기 상담이 필요합니다',
      contact: '010-1234-5678',
      desired_date: new Date(),
    }

    const result = await createApplication(formData as any)

    expect(result.success).toBe(true)
    expect(result.applicationId).toBe('application-id')
  })

  it('신청서 생성 - 로그인 필요', async () => {
    // Mock: 비로그인 사용자
    mockAuth.mockResolvedValueOnce({
      userId: null,
    } as any)

    const formData = {
      category: 'consult',
      sub_category: 'phone',
      consult_type: 'phone',
      consult_purpose: '보조기기 상담이 필요합니다',
      contact: '010-1234-5678',
    }

    const result = await createApplication(formData as any)

    expect(result.success).toBe(false)
    expect(result.error).toContain('로그인')
  })

  it('신청서 생성 - 프로필 없음', async () => {
    // Mock: 로그인된 사용자
    mockAuth.mockResolvedValueOnce({
      userId: 'test-user-id',
    } as any)

    // Mock: 프로필 조회 실패
    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'Profile not found' },
                  })
                ),
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

    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any)

    const formData = {
      category: 'consult',
      sub_category: 'phone',
      consult_type: 'phone',
      consult_purpose: '보조기기 상담이 필요합니다',
      contact: '010-1234-5678',
    }

    const result = await createApplication(formData as any)

    expect(result.success).toBe(false)
    expect(result.error).toContain('사용자 정보')
  })
})
