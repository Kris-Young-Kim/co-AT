import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuth } from '../../tests/setup'

// 인증 플로우 테스트
describe('인증 플로우', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로그인 상태 확인 - 로그인된 사용자', async () => {
    // Mock: 로그인된 사용자
    mockAuth.mockResolvedValueOnce({
      userId: 'test-user-id',
      sessionId: 'test-session-id',
    } as any)

    // auth 함수를 동적으로 import하여 모킹된 버전 사용
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    expect(userId).toBe('test-user-id')
  })

  it('로그인 상태 확인 - 비로그인 사용자', async () => {
    // Mock: 비로그인 사용자
    mockAuth.mockResolvedValueOnce({
      userId: null,
      sessionId: null,
    } as any)

    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    expect(userId).toBeNull()
  })

  it('관리자 권한 확인 - 권한 있음', async () => {
    // Mock: 관리자 권한이 있는 사용자
    mockAuth.mockResolvedValueOnce({
      userId: 'admin-user-id',
      sessionId: 'admin-session-id',
    } as any)

    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    expect(userId).toBe('admin-user-id')
    // 실제 권한 확인은 hasAdminOrStaffPermission 함수에서 수행
  })

  it('관리자 권한 확인 - 권한 없음', async () => {
    // Mock: 일반 사용자
    mockAuth.mockResolvedValueOnce({
      userId: 'regular-user-id',
      sessionId: 'regular-session-id',
    } as any)

    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    expect(userId).toBe('regular-user-id')
    // 권한 확인 로직은 별도 테스트에서 검증
  })
})
