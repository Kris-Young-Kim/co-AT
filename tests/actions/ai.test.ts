import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSoapNote } from '@/actions/ai-actions'
import { getGeminiModel } from '@/lib/gemini/client'
import { mockHasAdminOrStaffPermission, mockAuth } from '../../tests/setup'

// AI SOAP 노트 생성 테스트
describe('AI SOAP 노트 생성', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('SOAP 노트 생성 - 성공', async () => {
    // Mock: 권한 확인
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    mockAuth.mockResolvedValueOnce({
      userId: 'test-user-id',
    } as any)

    // Mock: Gemini API 응답
    const mockModel = {
      generateContent: vi.fn(() =>
        Promise.resolve({
          response: {
            text: () =>
              JSON.stringify({
                subjective: '내담자가 휠체어 수리가 필요하다고 말씀하셨습니다',
                objective: '휠체어 좌석 부분이 손상되어 있음',
                assessment: '수리가 필요한 상태로 판단됨',
                plan: '수리 센터로 방문 예약 필요',
              }),
          },
        })
      ),
    }

    vi.mocked(getGeminiModel).mockReturnValueOnce(mockModel as any)

    const result = await generateSoapNote(
      '휠체어 수리가 필요합니다. 좌석 부분이 손상되었어요.'
    )

    expect(result.success).toBe(true)
    expect(result.soapNote).toBeDefined()
    expect(result.soapNote?.subjective).toBeDefined()
    expect(result.soapNote?.objective).toBeDefined()
    expect(result.soapNote?.assessment).toBeDefined()
    expect(result.soapNote?.plan).toBeDefined()
  })

  it('SOAP 노트 생성 - 권한 없음', async () => {
    // Mock: 권한 없음
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)

    const result = await generateSoapNote('상담 내용')

    expect(result.success).toBe(false)
    expect(result.error).toContain('권한')
  })

  it('SOAP 노트 생성 - 빈 텍스트', async () => {
    // Mock: 권한 확인
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    mockAuth.mockResolvedValueOnce({
      userId: 'test-user-id',
    } as any)

    const result = await generateSoapNote('')

    expect(result.success).toBe(false)
    expect(result.error).toContain('비어있습니다')
  })

  it('SOAP 노트 생성 - JSON 파싱 실패', async () => {
    // Mock: 권한 확인
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    mockAuth.mockResolvedValueOnce({
      userId: 'test-user-id',
    } as any)

    // Mock: 잘못된 JSON 응답
    const mockModel = {
      generateContent: vi.fn(() =>
        Promise.resolve({
          response: {
            text: () => 'Invalid JSON response',
          },
        })
      ),
    }

    vi.mocked(getGeminiModel).mockReturnValueOnce(mockModel as any)

    const result = await generateSoapNote('상담 내용')

    expect(result.success).toBe(false)
    expect(result.error).toContain('파싱')
  })
})
