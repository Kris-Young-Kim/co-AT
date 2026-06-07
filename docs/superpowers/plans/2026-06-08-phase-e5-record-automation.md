# Phase E-5 기록 자동화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 상담·평가 세션을 Web Speech API로 실시간 텍스트 변환하고, Gemini AI로 요약·초안 생성하여 콜로그·서비스 기록 입력 시간을 건당 45분→10분으로 단축한다.

**Architecture:** `eval_session_transcripts` 테이블(Migration 076)이 모든 녹취 데이터의 단일 원천이 된다. 브라우저 `SttRecorder` 컴포넌트가 Web Speech API로 실시간 전사하고, `TranscriptPanel`에서 Gemini 요약 트리거 후 콜로그·서비스 기록 초안을 자동 생성한다. `ServiceRecordForm`은 서비스 구분 선택 시 스마트 템플릿 기본값을 자동 로드한다.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (admin client), Gemini 2.5 Flash (`@google/generative-ai`), Web Speech API (브라우저 빌트인), Vitest, Tailwind CSS

---

## File Structure

| 파일 | 작업 | 역할 |
|---|---|---|
| `migrations/076_eval_session_transcripts.sql` | Create | 세션 대화록 테이블 + RLS |
| `lib/utils/pii-mask.ts` | Create | 전화번호·주민번호 마스킹 |
| `tests/lib/pii-mask.test.ts` | Create | PII 마스킹 단위 테스트 |
| `actions/transcript-actions.ts` | Create | 세션 저장·조회·연결 서버 액션 |
| `tests/actions/transcript-actions.test.ts` | Create | 서버 액션 단위 테스트 |
| `actions/ai-actions.ts` | Modify | `summarizeTranscript()` + `generateCallLogDraftFromTranscript()` 추가 |
| `apps/eval/components/eval/SttRecorder.tsx` | Create | Web Speech API 실시간 녹취 컴포넌트 |
| `apps/eval/components/eval/TranscriptPanel.tsx` | Create | 대화록 표시 + AI 요약 + 초안 생성 UI |
| `apps/eval/components/eval/ServiceRecordForm.tsx` | Modify | 스마트 템플릿 기본값 자동 로드 |
| `apps/eval/app/call-logs/new/page.tsx` | Modify | "STT 녹취 상담" 탭 추가 |

---

## Task 1: DB Migration 076 — eval_session_transcripts

**Files:**
- Create: `migrations/076_eval_session_transcripts.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/076_eval_session_transcripts.sql
-- Phase E-5: 세션 대화록 (STT + AI 요약)

CREATE TABLE IF NOT EXISTS eval_session_transcripts (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 uuid REFERENCES clients(id) ON DELETE CASCADE,
  staff_id                  text NOT NULL,
  session_type              text NOT NULL
                            CHECK (session_type IN ('call', 'video', 'visit', 'meeting')),
  duration_sec              integer,
  raw_transcript            text,
  transcript                text,
  ai_summary                text,
  key_points                jsonb,
  consent_given             boolean DEFAULT false,
  linked_call_log_id        uuid,
  linked_service_record_id  uuid,
  session_date              date NOT NULL DEFAULT CURRENT_DATE,
  created_at                timestamptz DEFAULT now()
);

ALTER TABLE eval_session_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_transcripts"
  ON eval_session_transcripts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()::text
        AND profiles.role IN ('admin', 'manager', 'staff')
    )
  );

CREATE INDEX idx_session_transcripts_client_id
  ON eval_session_transcripts (client_id);
CREATE INDEX idx_session_transcripts_session_date
  ON eval_session_transcripts (session_date DESC);
CREATE INDEX idx_session_transcripts_linked_call_log
  ON eval_session_transcripts (linked_call_log_id)
  WHERE linked_call_log_id IS NOT NULL;
```

- [ ] **Step 2: Supabase MCP로 마이그레이션 적용**

Supabase MCP `apply_migration` 툴로 위 SQL을 적용한다.

Expected: `eval_session_transcripts` 테이블 생성 확인 (`list_tables`로 검증)

- [ ] **Step 3: Commit**

```bash
git add migrations/076_eval_session_transcripts.sql
git commit -m "feat(db): add eval_session_transcripts table — Migration 076"
```

---

## Task 2: PII 마스킹 유틸리티

**Files:**
- Create: `lib/utils/pii-mask.ts`
- Create: `tests/lib/pii-mask.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// tests/lib/pii-mask.test.ts
import { describe, it, expect } from 'vitest'
import { maskPii } from '@/lib/utils/pii-mask'

describe('maskPii', () => {
  it('전화번호 마스킹 — 010-xxxx-xxxx 형식', () => {
    expect(maskPii('전화번호는 010-1234-5678 입니다')).toBe('전화번호는 ***-****-**** 입니다')
  })

  it('전화번호 마스킹 — 공백 없는 형식', () => {
    expect(maskPii('01012345678로 연락주세요')).toBe('***********로 연락주세요')
  })

  it('주민등록번호 마스킹 — 앞 6자리-뒤 7자리', () => {
    expect(maskPii('주민번호 900101-1234567 입력')).toBe('주민번호 ******-******* 입력')
  })

  it('계좌번호 마스킹 — 숫자-숫자-숫자 패턴', () => {
    expect(maskPii('계좌 123-456-789012')).toBe('계좌 ***-***-******')
  })

  it('마스킹 대상 없으면 원문 그대로 반환', () => {
    const text = '안녕하세요, 오늘 방문 감사합니다.'
    expect(maskPii(text)).toBe(text)
  })

  it('null/undefined 입력 시 빈 문자열 반환', () => {
    expect(maskPii(null)).toBe('')
    expect(maskPii(undefined)).toBe('')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test tests/lib/pii-mask.test.ts
```

Expected: FAIL — `maskPii` not defined

- [ ] **Step 3: 최소 구현**

```typescript
// lib/utils/pii-mask.ts
const PHONE_DASHED = /(\d{2,3})-(\d{3,4})-(\d{4})/g
const PHONE_RAW = /\b(01[0-9]{9})\b/g
const RRN = /(\d{6})-(\d{7})/g
const ACCOUNT = /\b(\d{3,6})-(\d{3,6})-(\d{6,12})\b/g

export function maskPii(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(PHONE_DASHED, (_, a, b, c) => `${'*'.repeat(a.length)}-${'*'.repeat(b.length)}-${'*'.repeat(c.length)}`)
    .replace(PHONE_RAW, (m) => '*'.repeat(m.length))
    .replace(RRN, (_, a, b) => `${'*'.repeat(a.length)}-${'*'.repeat(b.length)}`)
    .replace(ACCOUNT, (_, a, b, c) => `${'*'.repeat(a.length)}-${'*'.repeat(b.length)}-${'*'.repeat(c.length)}`)
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
pnpm test tests/lib/pii-mask.test.ts
```

Expected: PASS (6/6)

- [ ] **Step 5: Commit**

```bash
git add lib/utils/pii-mask.ts tests/lib/pii-mask.test.ts
git commit -m "feat(lib): add PII masking utility for transcript data"
```

---

## Task 3: Transcript 서버 액션

**Files:**
- Create: `actions/transcript-actions.ts`
- Create: `tests/actions/transcript-actions.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// tests/actions/transcript-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveTranscript, getTranscriptsByClient } from '@/actions/transcript-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'

const mockChain: any = {
  from: vi.fn(),
  insert: vi.fn(() => mockChain),
  select: vi.fn(() => mockChain),
  update: vi.fn(() => mockChain),
  eq: vi.fn(() => mockChain),
  order: vi.fn(() => mockChain),
  limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
  single: vi.fn(() => Promise.resolve({ data: { id: 'tx-1' }, error: null })),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockChain,
}))

describe('saveTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain.from.mockReturnValue(mockChain)
    mockChain.insert.mockReturnValue(mockChain)
    mockChain.select.mockReturnValue(mockChain)
    mockChain.single.mockResolvedValue({ data: { id: 'tx-1' }, error: null })
  })

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
    const result = await saveTranscript({
      staff_id: 'user-1',
      session_type: 'call',
      session_date: '2026-06-08',
      transcript: '안녕하세요',
    })
    expect(result.success).toBe(true)
    expect(result.id).toBe('tx-1')
  })
})

describe('getTranscriptsByClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain.from.mockReturnValue(mockChain)
    mockChain.select.mockReturnValue(mockChain)
    mockChain.eq.mockReturnValue(mockChain)
    mockChain.order.mockReturnValue(mockChain)
    mockChain.limit.mockResolvedValue({
      data: [{ id: 'tx-1', session_type: 'call', session_date: '2026-06-08' }],
      error: null,
    })
  })

  it('클라이언트 대화록 목록 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const result = await getTranscriptsByClient('client-1')
    expect(result.success).toBe(true)
    expect(result.transcripts).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test tests/actions/transcript-actions.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: 서버 액션 구현**

```typescript
// actions/transcript-actions.ts
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { maskPii } from "@/lib/utils/pii-mask"
import { revalidatePath } from "next/cache"

export interface TranscriptInput {
  client_id?: string | null
  staff_id: string
  session_type: 'call' | 'video' | 'visit' | 'meeting'
  session_date: string
  duration_sec?: number | null
  raw_transcript?: string | null
  transcript: string
  ai_summary?: string | null
  key_points?: {
    chief_complaint?: string
    requested_device?: string
    agreed_action?: string
    next_step?: string
  } | null
  consent_given?: boolean
  linked_call_log_id?: string | null
  linked_service_record_id?: string | null
}

export interface SessionTranscript extends TranscriptInput {
  id: string
  created_at: string
}

export async function saveTranscript(
  input: TranscriptInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const maskedTranscript = maskPii(input.transcript)
  const payload = {
    ...input,
    transcript: maskedTranscript,
    raw_transcript: input.raw_transcript ?? null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('eval_session_transcripts')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/call-logs')
  return { success: true, id: (data as { id: string }).id }
}

export async function updateTranscript(
  id: string,
  updates: Partial<Pick<TranscriptInput, 'ai_summary' | 'key_points' | 'linked_call_log_id' | 'linked_service_record_id'>>
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from('eval_session_transcripts')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getTranscriptsByClient(
  clientId: string
): Promise<{ success: boolean; transcripts?: SessionTranscript[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('eval_session_transcripts')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { success: false, error: error.message }
  return { success: true, transcripts: (data ?? []) as SessionTranscript[] }
}

export async function getRecentTranscripts(
  limit = 20
): Promise<{ success: boolean; transcripts?: SessionTranscript[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('eval_session_transcripts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { success: false, error: error.message }
  return { success: true, transcripts: (data ?? []) as SessionTranscript[] }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
pnpm test tests/actions/transcript-actions.test.ts
```

Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add actions/transcript-actions.ts tests/actions/transcript-actions.test.ts
git commit -m "feat(actions): add transcript CRUD server actions"
```

---

## Task 4: Gemini 요약 + 콜로그 초안 액션

**Files:**
- Modify: `actions/ai-actions.ts` (끝에 두 함수 추가)

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// tests/actions/transcript-ai.test.ts
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
            q_device: true,
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test tests/actions/transcript-ai.test.ts
```

Expected: FAIL — `summarizeTranscript` not exported

- [ ] **Step 3: ai-actions.ts 끝에 두 함수 추가**

`actions/ai-actions.ts` 마지막 줄 뒤에 다음을 추가한다:

```typescript
// ────────────────────────────────────────────
// E-5: 세션 대화록 AI 요약
// ────────────────────────────────────────────

export interface TranscriptKeyPoints {
  chief_complaint?: string
  requested_device?: string
  agreed_action?: string
  next_step?: string
}

const TRANSCRIPT_SUMMARY_PROMPT = `당신은 보조공학센터 전문 기록사입니다.
아래 상담 대화 내용에서 핵심 정보를 JSON으로 추출해주세요.
다른 설명 없이 JSON만 반환하세요:
{
  "chief_complaint": "주요 호소 내용 (1~2문장)",
  "requested_device": "요청 보조기기명 (없으면 빈 문자열)",
  "agreed_action": "합의된 조치 사항",
  "next_step": "다음 단계 또는 팔로업"
}`

export async function summarizeTranscript(
  transcript: string
): Promise<{ success: boolean; keyPoints?: TranscriptKeyPoints; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  if (!transcript.trim()) return { success: false, error: '대화 내용이 없습니다' }

  try {
    const model = getGeminiModel('gemini-2.5-flash')
    const result = await model.generateContent(
      `${TRANSCRIPT_SUMMARY_PROMPT}\n\n대화 내용:\n${transcript}`
    )
    const raw = result.response.text()
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    const keyPoints = JSON.parse(raw) as TranscriptKeyPoints
    return { success: true, keyPoints }
  } catch (error) {
    console.error('[AI Actions] 대화록 요약 오류:', error)
    return { success: false, error: 'AI 요약 중 오류가 발생했습니다' }
  }
}

export interface CallLogDraftFromTranscriptInput {
  transcript: string
  sessionDate: string
  clientName?: string | null
  disabilityType?: string | null
}

export interface CallLogDraftFromTranscript {
  question_content: string
  answer: string
  requester_type: string
  q_public_benefit: boolean
  q_private_benefit: boolean
  q_device: boolean
  q_case_management: boolean
  q_other: boolean
}

const CALL_LOG_FROM_TRANSCRIPT_PROMPT = `당신은 보조공학센터 전문 기록사입니다.
상담 대화 내용을 바탕으로 콜센터 상담일지를 JSON으로 작성해주세요.
다른 설명 없이 JSON만 반환하세요:
{
  "question_content": "질문 내용 요약 (2~4문장)",
  "answer": "답변 및 조치 내용 (2~4문장)",
  "requester_type": "장애 당사자 | 보호자 및 지인 | 유관기관 종사자 | 시군구(및 읍면동) 담당자 | 교육기관 종사자 | 기타 중 하나",
  "q_public_benefit": true/false,
  "q_private_benefit": true/false,
  "q_device": true/false,
  "q_case_management": true/false,
  "q_other": true/false
}`

export async function generateCallLogDraftFromTranscript(
  input: CallLogDraftFromTranscriptInput
): Promise<{ success: boolean; draft?: CallLogDraftFromTranscript; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  if (!input.transcript.trim()) return { success: false, error: '대화 내용이 없습니다' }

  try {
    const contextLines = [
      input.clientName && `대상자: ${input.clientName}`,
      input.disabilityType && `장애유형: ${input.disabilityType}`,
      `상담일: ${input.sessionDate}`,
    ].filter(Boolean).join('\n')

    const model = getGeminiModel('gemini-2.5-flash')
    const prompt = `${CALL_LOG_FROM_TRANSCRIPT_PROMPT}\n\n${contextLines}\n\n대화 내용:\n${input.transcript}`
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    const draft = JSON.parse(raw) as CallLogDraftFromTranscript
    if (!draft.question_content) throw new Error('question_content 누락')
    return { success: true, draft }
  } catch (error) {
    console.error('[AI Actions] 콜로그 초안 생성 오류:', error)
    return { success: false, error: 'AI 콜로그 초안 생성 중 오류가 발생했습니다' }
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
pnpm test tests/actions/transcript-ai.test.ts
```

Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add actions/ai-actions.ts tests/actions/transcript-ai.test.ts
git commit -m "feat(ai): add transcript summarization and call-log draft generation"
```

---

## Task 5: SttRecorder 컴포넌트

**Files:**
- Create: `apps/eval/components/eval/SttRecorder.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// apps/eval/components/eval/SttRecorder.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'

interface SpeechRecognitionAPI {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [i: number]: { isFinal: boolean; [i: number]: { transcript: string } }
  }
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionAPI
    webkitSpeechRecognition?: new () => SpeechRecognitionAPI
  }
}

interface SttRecorderProps {
  onTranscriptChange: (text: string) => void
  onRecordingStop?: (durationSec: number) => void
  disabled?: boolean
}

export function SttRecorder({ onTranscriptChange, onRecordingStop, disabled }: SttRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported] = useState(() =>
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const recognitionRef = useRef<SpeechRecognitionAPI | null>(null)
  const fullTextRef = useRef('')
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition!
    const recognition = new SpeechRecognition()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          final += text + ' '
        } else {
          interim += text
        }
      }
      if (final) {
        fullTextRef.current += final
      }
      onTranscriptChange(fullTextRef.current + interim)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000)
      onRecordingStop?.(durationSec)
    }

    recognitionRef.current = recognition
    fullTextRef.current = ''
    startTimeRef.current = Date.now()
    recognition.start()
    setIsRecording(true)
  }, [isSupported, onTranscriptChange, onRecordingStop])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  if (!isSupported) {
    return (
      <p className="text-xs text-gray-400">
        이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
        >
          <Square className="h-4 w-4" />
          녹음 중지
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Mic className="h-4 w-4" />
          녹음 시작
        </button>
      )}
      {isRecording && (
        <span className="flex items-center gap-1 text-sm text-red-600">
          <MicOff className="h-3 w-3 animate-pulse" />
          녹취 중
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
cd apps/eval && npx tsc --noEmit
```

Expected: 에러 없음 (또는 기존 에러만)

- [ ] **Step 3: Commit**

```bash
git add apps/eval/components/eval/SttRecorder.tsx
git commit -m "feat(eval): add SttRecorder component using Web Speech API"
```

---

## Task 6: TranscriptPanel 컴포넌트

**Files:**
- Create: `apps/eval/components/eval/TranscriptPanel.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// apps/eval/components/eval/TranscriptPanel.tsx
'use client'

import { useState } from 'react'
import { SttRecorder } from './SttRecorder'
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { saveTranscript, type TranscriptInput } from '@/actions/transcript-actions'
import { summarizeTranscript, generateCallLogDraftFromTranscript, type CallLogDraftFromTranscript, type TranscriptKeyPoints } from '@/actions/ai-actions'

interface TranscriptPanelProps {
  clientId?: string | null
  clientName?: string | null
  disabilityType?: string | null
  sessionDate: string
  staffId: string
  onCallLogDraft?: (draft: CallLogDraftFromTranscript) => void
  onTranscriptSaved?: (transcriptId: string) => void
}

type Step = 'consent' | 'recording' | 'review' | 'done'

export function TranscriptPanel({
  clientId,
  clientName,
  disabilityType,
  sessionDate,
  staffId,
  onCallLogDraft,
  onTranscriptSaved,
}: TranscriptPanelProps) {
  const [step, setStep] = useState<Step>('consent')
  const [consentGiven, setConsentGiven] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [durationSec, setDurationSec] = useState(0)
  const [keyPoints, setKeyPoints] = useState<TranscriptKeyPoints | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  const handleConsent = (given: boolean) => {
    setConsentGiven(given)
    setStep('recording')
  }

  const handleRecordingStop = (sec: number) => {
    setDurationSec(sec)
    if (transcript.trim()) setStep('review')
  }

  const handleSummarize = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await summarizeTranscript(transcript)
      if (result.success && result.keyPoints) {
        setKeyPoints(result.keyPoints)
      } else {
        setError(result.error ?? 'AI 요약 실패')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndDraft = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    setError(null)
    try {
      const input: TranscriptInput = {
        client_id: clientId ?? null,
        staff_id: staffId,
        session_type: 'call',
        session_date: sessionDate,
        duration_sec: durationSec || null,
        transcript,
        ai_summary: keyPoints
          ? `주요 호소: ${keyPoints.chief_complaint ?? ''} / 요청 기기: ${keyPoints.requested_device ?? ''}`
          : null,
        key_points: keyPoints,
        consent_given: consentGiven,
      }

      const saveResult = await saveTranscript(input)
      if (!saveResult.success) throw new Error(saveResult.error)
      setSavedId(saveResult.id!)
      onTranscriptSaved?.(saveResult.id!)

      const draftResult = await generateCallLogDraftFromTranscript({
        transcript,
        sessionDate,
        clientName,
        disabilityType,
      })
      if (draftResult.success && draftResult.draft) {
        onCallLogDraft?.(draftResult.draft)
      }

      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'consent') {
    return (
      <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
        <p className="text-sm text-blue-800 font-medium">녹취 동의 안내</p>
        <p className="text-xs text-blue-700">
          이 상담은 서비스 개선을 위해 AI가 내용을 요약할 수 있습니다.
          대화 내용은 개인정보 마스킹 후 저장됩니다.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleConsent(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            동의합니다
          </button>
          <button
            type="button"
            onClick={() => handleConsent(false)}
            className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50"
          >
            동의하지 않음 (수동 입력)
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="border rounded-lg p-4 bg-green-50 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm text-green-800 font-medium">녹취 저장 완료</p>
          <p className="text-xs text-green-700">콜로그 초안이 자동 입력되었습니다. 검토 후 저장하세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {consentGiven ? 'STT 녹취 상담' : '수동 입력 모드'}
        </p>
        {consentGiven && (
          <SttRecorder
            onTranscriptChange={setTranscript}
            onRecordingStop={handleRecordingStop}
          />
        )}
      </div>

      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="상담 대화 내용이 여기에 표시됩니다. 직접 수정도 가능합니다."
        className="w-full min-h-[120px] text-sm border rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {keyPoints && (
        <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
          <p className="font-medium text-gray-700">AI 요약</p>
          {keyPoints.chief_complaint && <p className="text-gray-600">주요 호소: {keyPoints.chief_complaint}</p>}
          {keyPoints.requested_device && <p className="text-gray-600">요청 기기: {keyPoints.requested_device}</p>}
          {keyPoints.agreed_action && <p className="text-gray-600">합의 사항: {keyPoints.agreed_action}</p>}
          {keyPoints.next_step && <p className="text-gray-600">다음 단계: {keyPoints.next_step}</p>}
        </div>
      )}

      <div className="flex gap-2">
        {!keyPoints && (
          <button
            type="button"
            onClick={handleSummarize}
            disabled={!transcript.trim() || loading}
            className="flex items-center gap-1 px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI 요약
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveAndDraft}
          disabled={!transcript.trim() || loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          저장 + 콜로그 초안 생성
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
cd apps/eval && npx tsc --noEmit
```

Expected: 에러 없음 (또는 기존 에러만)

- [ ] **Step 3: Commit**

```bash
git add apps/eval/components/eval/TranscriptPanel.tsx
git commit -m "feat(eval): add TranscriptPanel with STT + AI summary + draft generation"
```

---

## Task 7: 스마트 템플릿 — ServiceRecordForm 업데이트

서비스 구분 선택 시 관련 체크박스와 기본값을 자동 로드한다.

**Files:**
- Modify: `apps/eval/components/eval/ServiceRecordForm.tsx`

- [ ] **Step 1: ServiceRecordForm.tsx 읽기**

```bash
# 현재 파일의 서비스 구분 관련 상태와 핸들러 위치 파악
```

- [ ] **Step 2: 스마트 템플릿 로직 추가**

`ServiceRecordForm.tsx`의 `import` 아래에 스마트 템플릿 맵 추가:

```typescript
// apps/eval/components/eval/ServiceRecordForm.tsx — 기존 REFERRAL_TYPES 상수 아래에 추가

const SMART_DEFAULTS: Record<string, Partial<ServiceRecordFormState>> = {
  '교부사업(맞춤형평가)': {
    is_assessment: true,
    is_consult: true,
    service_content: '9개 영역 기능 평가 및 맞춤형 보조기기 교부사업 신청 지원을 위한 상담을 진행하였습니다.',
  },
  '대여': {
    is_rental: true,
    is_consult: true,
    service_content: '보조기기 대여 서비스 상담 및 대여 신청을 진행하였습니다.',
  },
  '맞춤제작': {
    is_custom_make: true,
    is_assessment: true,
    is_consult: true,
    service_content: '맞춤형 보조기기 제작 지원을 위한 상담 및 평가를 진행하였습니다.',
  },
  '정보제공': {
    is_info_provision: true,
    is_consult: true,
    service_content: '보조기기 관련 정보 제공 및 자원 연계 안내를 진행하였습니다.',
  },
  '재사용': {
    is_reuse: true,
    is_consult: true,
    service_content: '재사용 보조기기 배분 서비스 상담 및 기기 상태 확인을 진행하였습니다.',
  },
  '수리': {
    is_repair: true,
    service_content: '보조기기 수리 서비스 접수 및 상태 확인을 진행하였습니다.',
  },
}
```

그리고 `service_category` 변경 핸들러에 스마트 기본값 적용:

```typescript
// ServiceRecordForm 컴포넌트 내부 — service_category <select> onChange 핸들러

const handleServiceCategoryChange = (value: string) => {
  const defaults = SMART_DEFAULTS[value] ?? {}
  setFormState((prev) => ({
    ...prev,
    service_category: value,
    ...defaults,
  }))
}
```

ServiceRecordForm의 service_category select 태그에서:
```tsx
// 기존 onChange를 교체
onChange={(e) => handleServiceCategoryChange(e.target.value)}
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd apps/eval && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/eval/components/eval/ServiceRecordForm.tsx
git commit -m "feat(eval): smart template defaults on service_category change"
```

---

## Task 8: 콜로그 신규 등록 — STT 패널 연동

콜로그 신규 등록 페이지에 `TranscriptPanel`을 추가하고, AI 초안을 폼에 자동 주입한다.

**Files:**
- Modify: `apps/eval/app/call-logs/new/page.tsx`
- Create: `apps/eval/components/eval/CallLogNewWithStt.tsx` (Client 컴포넌트 래퍼)

- [ ] **Step 1: CallLogNewWithStt 클라이언트 래퍼 작성**

```typescript
// apps/eval/components/eval/CallLogNewWithStt.tsx
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { TranscriptPanel } from './TranscriptPanel'
import { CallLogForm } from './CallLogForm'
import { createCallLog } from '@/actions/call-log-actions'
import type { CreateCallLogInput } from '@/actions/call-log-actions'
import type { CallLogDraftFromTranscript } from '@/actions/ai-actions'

interface CallLogNewWithSttProps {
  defaultDate: string
}

export function CallLogNewWithStt({ defaultDate }: CallLogNewWithSttProps) {
  const { user } = useUser()
  const staffId = user?.id ?? ''
  const [draftValues, setDraftValues] = useState<Partial<CreateCallLogInput>>({})
  const [showTranscript, setShowTranscript] = useState(false)

  const handleCallLogDraft = (draft: CallLogDraftFromTranscript) => {
    setDraftValues({
      question_content: draft.question_content,
      answer: draft.answer,
      requester_type: draft.requester_type,
      q_public_benefit: draft.q_public_benefit,
      q_private_benefit: draft.q_private_benefit,
      q_device: draft.q_device,
      q_case_management: draft.q_case_management,
      q_other: draft.q_other,
    })
    setShowTranscript(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50"
        >
          {showTranscript ? '녹취 패널 닫기' : '🎙 STT 녹취 상담'}
        </button>
        {Object.keys(draftValues).length > 0 && (
          <span className="text-xs text-green-600">AI 초안 적용됨 — 아래 폼을 확인 후 저장하세요</span>
        )}
      </div>

      {showTranscript && (
        <TranscriptPanel
          sessionDate={defaultDate}
          staffId={staffId}
          onCallLogDraft={handleCallLogDraft}
        />
      )}

      <CallLogForm
        defaultValues={draftValues}
        onSubmit={createCallLog}
        submitLabel="등록"
      />
    </div>
  )
}
```

- [ ] **Step 2: call-logs/new/page.tsx 업데이트**

```typescript
// apps/eval/app/call-logs/new/page.tsx
import { CallLogNewWithStt } from '@/eval/components/eval/CallLogNewWithStt'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CallLogNewPage() {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/call-logs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">콜센터 상담 등록</h1>
      </div>
      <CallLogNewWithStt defaultDate={today} />
    </div>
  )
}
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd apps/eval && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/eval/components/eval/CallLogNewWithStt.tsx apps/eval/app/call-logs/new/page.tsx
git commit -m "feat(eval): integrate TranscriptPanel into call-log new page"
```

---

## Task 9: 전체 테스트 + 수동 E2E 검증

- [ ] **Step 1: 전체 테스트 실행**

```bash
pnpm test
```

Expected: 기존 테스트 + Task 2, 3, 4 신규 테스트 모두 PASS

- [ ] **Step 2: TypeScript 전체 린트**

```bash
pnpm lint
```

Expected: 에러 없음 (또는 기존 경고만)

- [ ] **Step 3: 로컬 개발 서버로 E2E 수동 테스트**

```bash
cd apps/eval && pnpm dev
```

테스트 시나리오:
1. `/call-logs/new` 접속
2. "STT 녹취 상담" 버튼 클릭 → 녹취 동의 패널 표시 확인
3. "동의합니다" → "녹음 시작" → 한국어로 말하기 → "녹음 중지"
4. 대화 내용이 textarea에 표시되는지 확인
5. "저장 + 콜로그 초안 생성" 클릭
6. 콜로그 폼의 "질문 내용", "답변" 필드가 자동 채워지는지 확인
7. `/service-records/new`에서 서비스 구분 선택 시 체크박스 자동 변경 확인

- [ ] **Step 4: Supabase에서 데이터 확인**

```sql
-- eval_session_transcripts에 레코드가 생성되었는지 확인
SELECT id, session_type, session_date, consent_given,
       LEFT(transcript, 100) AS transcript_preview,
       key_points
FROM eval_session_transcripts
ORDER BY created_at DESC
LIMIT 5;
```

- [ ] **Step 5: 최종 Commit**

```bash
git add -A
git commit -m "feat(eval): Phase E-5 기록 자동화 — STT + AI 요약 + 스마트 템플릿 완성"
```

---

## 구현 완료 후 확인 항목

| 항목 | 확인 방법 |
|---|---|
| `eval_session_transcripts` 테이블 존재 | Supabase `list_tables` |
| Web Speech API 녹음 → textarea 표시 | Chrome에서 수동 테스트 |
| PII 마스킹 (전화번호 등) | 단위 테스트 통과 |
| Gemini 요약 → key_points JSON | `summarizeTranscript` 테스트 통과 |
| 콜로그 초안 자동 주입 | `/call-logs/new` 수동 테스트 |
| 스마트 템플릿 체크박스 자동 선택 | 서비스 구분 변경 후 UI 확인 |
| RLS 정책 적용 (staff만 접근) | 권한 없는 요청 시 403 |
