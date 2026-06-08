import { describe, it, expect, vi, beforeEach } from 'vitest'
import { summarizeTranscript, generateCallLogDraftFromTranscript } from '@/actions/ai-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { getGeminiModel } from '@/lib/gemini/client'

vi.mock('@/lib/gemini/client', () => ({
  getGeminiModel: vi.fn(() => ({
    generateContent: vi.fn(() => Promise.resolve({
      response: {
        text: () => JSON.stringify({
          chief_complaint: '전동휠체어 신청',
          requested_device: '전동휠체어',
          agreed_action: '교부사업 신청 진행',
          next_step: '담당자 배정 후 평가 일정 안내',
        }),
      },
    })),
  })),
}))

describe('summarizeTranscript', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await summarizeTranscript('대화 내용')
    expect(result.success).toBe(false)
  })

  it('key_points JSON 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const result = await summarizeTranscript('전동휠체어 신청 상담')
    expect(result.success).toBe(true)
    expect(result.keyPoints?.chief_complaint).toBe('전동휠체어 신청')
    expect(result.keyPoints?.requested_device).toBe('전동휠체어')
  })
})

describe('generateCallLogDraftFromTranscript', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await generateCallLogDraftFromTranscript({ transcript: '내용', sessionDate: '2026-06-08' })
    expect(result.success).toBe(false)
  })

  it('콜로그 초안 반환', async () => {
    vi.mocked(getGeminiModel).mockReturnValueOnce({
      generateContent: vi.fn(() => Promise.resolve({
        response: {
          text: () => JSON.stringify({
            question_content: '전동휠체어 신청 문의',
            answer: '교부사업 안내 및 신청서 안내',
            requester_type: '장애 당사자',
            q_public_benefit: false,
            q_private_benefit: false,
            q_device: true,
            q_case_management: false,
            q_other: false,
          }),
        },
      })),
    } as any)
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const result = await generateCallLogDraftFromTranscript({
      transcript: '전동휠체어 신청 상담',
      sessionDate: '2026-06-08',
    })
    expect(result.success).toBe(true)
    expect(result.draft?.question_content).toBeTruthy()
  })
})
