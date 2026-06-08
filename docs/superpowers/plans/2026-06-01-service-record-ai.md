# Service Record AI Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CRUD UI with AI draft generation to `eval_service_records`, integrated into the client/application flow and accessible via a standalone list page.

**Architecture:** Follows the existing `intake_records` pattern — a Server Action layer at root `actions/`, a `ServiceRecordForm` client component, a sub-route under `clients/[clientId]/applications/[appId]/service-record/`, and a standalone `/service-records` list page. AI draft pulls client + application + intake + assessment context automatically, with an optional memo field.

**Tech Stack:** Next.js 16 App Router, Server Actions, Supabase, Gemini (`gemini-2.5-flash`), Tailwind CSS, Vitest

---

## File Map

| 작업 | 경로 |
|---|---|
| Create | `actions/service-record-actions.ts` |
| Modify | `actions/ai-actions.ts` |
| Create | `apps/eval/components/eval/ServiceRecordForm.tsx` |
| Create | `apps/eval/app/clients/[clientId]/applications/[appId]/service-record/page.tsx` |
| Modify | `apps/eval/app/clients/[clientId]/applications/[appId]/page.tsx` |
| Create | `apps/eval/app/service-records/page.tsx` |
| Modify | `apps/eval/components/layout/EvalSidebar.tsx` |
| Create | `tests/actions/service-record.test.ts` |

---

## Task 1: `service-record-actions.ts` — CRUD Server Actions

**Files:**
- Create: `actions/service-record-actions.ts`
- Create: `tests/actions/service-record.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/actions/service-record.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd D:/AILeader1/project/valuewith/co-AT
pnpm test tests/actions/service-record.test.ts
```
Expected: FAIL — `@/actions/service-record-actions` not found

- [ ] **Step 3: Create `actions/service-record-actions.ts`**

```ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface ServiceRecordInput {
  application_id?: string | null
  client_id?: string | null
  received_at: string
  application_year?: number | null
  application_month?: number | null
  application_no?: number | null
  is_re_application?: boolean | null
  record_status?: string | null
  name?: string | null
  birth_date?: string | null
  gender?: string | null
  disability_type?: string | null
  disability_severity?: string | null
  economic_status?: string | null
  region?: string | null
  contact?: string | null
  address?: string | null
  service_major_category?: string | null
  service_sub_category?: string | null
  service_category?: string | null
  product_name?: string | null
  item_category?: string | null
  service_area?: string | null
  service_content?: string | null
  referral_type?: string | null
  consultation_date?: string | null
  performance_date?: string | null
  closed_at?: string | null
  monitoring_date?: string | null
  is_consult?: boolean | null
  is_assessment?: boolean | null
  is_trial?: boolean | null
  is_rental?: boolean | null
  is_custom_make?: boolean | null
  is_grant?: boolean | null
  is_education?: boolean | null
  is_info_provision?: boolean | null
  is_repair?: boolean | null
  is_cleaning?: boolean | null
  is_reuse?: boolean | null
  is_monitoring?: boolean | null
  is_other_business?: boolean | null
  is_phone?: boolean | null
  is_visit_in?: boolean | null
  is_visit_out?: boolean | null
  is_public_funding?: boolean | null
  is_private_funding?: boolean | null
  is_self_pay?: boolean | null
  is_funding_secured?: boolean | null
  is_closed?: boolean | null
  trial_device_count?: number | null
  info_provision_area?: string | null
  funding_source_detail?: string | null
  staff_name?: string | null
}

export interface ServiceRecord extends ServiceRecordInput {
  id: string
  created_at: string | null
  updated_at: string | null
}

export async function createServiceRecord(
  input: ServiceRecordInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eval_service_records')
    .insert(input)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  if (input.client_id && input.application_id) {
    revalidatePath(`/clients/${input.client_id}/applications/${input.application_id}`)
  }
  revalidatePath('/service-records')

  return { success: true, id: (data as { id: string }).id }
}

export async function updateServiceRecord(
  id: string,
  input: Partial<ServiceRecordInput>
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('eval_service_records')
    .update(input)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/service-records')
  return { success: true }
}

export async function getServiceRecordsByApplication(
  applicationId: string
): Promise<{ success: boolean; records?: ServiceRecord[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eval_service_records')
    .select('*')
    .eq('application_id', applicationId)
    .order('received_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, records: (data ?? []) as ServiceRecord[] }
}

export async function getServiceRecords(
  params: { year?: number; month?: number } = {}
): Promise<{ success: boolean; records?: ServiceRecord[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  let query = supabase
    .from('eval_service_records')
    .select('*')
    .order('received_at', { ascending: false })

  if (params.year) query = query.eq('application_year', params.year)
  if (params.month) query = query.eq('application_month', params.month)

  const { data, error } = await query.limit(500)
  if (error) return { success: false, error: error.message }
  return { success: true, records: (data ?? []) as ServiceRecord[] }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/actions/service-record.test.ts
```
Expected: PASS (3 describe blocks, all green)

- [ ] **Step 5: Commit**

```bash
git add actions/service-record-actions.ts tests/actions/service-record.test.ts
git commit -m "feat(eval): add service-record-actions CRUD server actions"
```

---

## Task 2: `generateServiceRecordDraft()` — AI Action

**Files:**
- Modify: `actions/ai-actions.ts` (append at end of file)
- Create: `tests/actions/service-record-ai.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/actions/service-record-ai.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateServiceRecordDraft } from '@/actions/ai-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { getGeminiModel } from '@/lib/gemini/client'
import { createAdminClient } from '@/lib/supabase/admin'

const MOCK_DRAFT = {
  service_content: '전동휠체어 관련 공적급여 상담을 진행하였습니다.',
  service_major_category: '공적급여',
  service_sub_category: '건강보험 급여',
  service_category: '상담',
  service_area: 'WC',
  product_name: '전동휠체어',
  referral_type: '유선',
  is_consult: true,
  is_assessment: false,
  is_trial: false,
  is_rental: false,
  is_custom_make: false,
  is_grant: false,
  is_education: false,
  is_info_provision: false,
  is_repair: false,
}

describe('generateServiceRecordDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('성공 — 초안 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    const mockChain: any = {
      select: vi.fn(() => mockChain),
      eq: vi.fn(() => mockChain),
      not: vi.fn(() => mockChain),
      order: vi.fn(() => mockChain),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({
        data: {
          client_id: 'client-1',
          referral_type: '유선',
          progress_type: '신규',
          category: '보조기기 교부사업',
          sub_category: '상담',
          requested_item: '전동휠체어',
          service_area: 'WC',
        },
        error: null,
      })),
    }
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => mockChain) } as any)

    vi.mocked(getGeminiModel).mockReturnValueOnce({
      generateContent: vi.fn(() => Promise.resolve({
        response: { text: () => JSON.stringify(MOCK_DRAFT) },
      })),
    } as any)

    const result = await generateServiceRecordDraft({
      applicationId: 'app-1',
      clientId: 'client-1',
    })

    expect(result.success).toBe(true)
    expect(result.draft?.service_content).toBeDefined()
    expect(result.draft?.service_major_category).toBe('공적급여')
    expect(result.draft?.is_consult).toBe(true)
  })

  it('권한 없음 — 실패', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await generateServiceRecordDraft({ applicationId: 'app-1', clientId: 'c-1' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('권한')
  })

  it('application이 client 소유가 아님 — 실패', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const mockChain: any = {
      select: vi.fn(() => mockChain),
      eq: vi.fn(() => mockChain),
      single: vi.fn(() => Promise.resolve({
        data: { client_id: 'other-client' },
        error: null,
      })),
    }
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => mockChain) } as any)

    const result = await generateServiceRecordDraft({ applicationId: 'app-1', clientId: 'client-1' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('접근 권한')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/actions/service-record-ai.test.ts
```
Expected: FAIL — `generateServiceRecordDraft` not exported

- [ ] **Step 3: Append to `actions/ai-actions.ts`**

```ts
export interface ServiceRecordDraftInput {
  applicationId: string
  clientId: string
  memo?: string
}

export interface ServiceRecordDraft {
  service_content: string
  service_major_category: string
  service_sub_category: string
  service_category: string
  service_area: string
  product_name: string
  referral_type: string
  is_consult: boolean
  is_assessment: boolean
  is_trial: boolean
  is_rental: boolean
  is_custom_make: boolean
  is_grant: boolean
  is_education: boolean
  is_info_provision: boolean
  is_repair: boolean
}

const SERVICE_RECORD_DRAFT_PROMPT = `당신은 보조기기센터 전문가입니다. 클라이언트 정보와 상담 내역을 바탕으로 서비스 기록 초안을 JSON 형식으로 생성해주세요.

다음 JSON 형식으로만 응답하세요. 다른 설명은 포함하지 마세요:
{
  "service_content": "서비스 내용 서술 (3~5문장, 구체적으로)",
  "service_major_category": "공적급여 | 민간지원 | 기타 | 서비스지원 중 하나",
  "service_sub_category": "소분류 (예: 건강보험 급여, 복지용구 등)",
  "service_category": "서비스구분 (예: 상담, 평가, 교부 등)",
  "service_area": "WC | ADL | S | SP | EC | CA | L | AAC | AM 중 하나, 해당없으면 빈 문자열",
  "product_name": "신청 품목명",
  "referral_type": "내방 | 유선 | 인터넷신청 | 기관연계 | 기타 중 하나",
  "is_consult": true/false,
  "is_assessment": true/false,
  "is_trial": true/false,
  "is_rental": true/false,
  "is_custom_make": true/false,
  "is_grant": true/false,
  "is_education": true/false,
  "is_info_provision": true/false,
  "is_repair": true/false
}`

export async function generateServiceRecordDraft(
  input: ServiceRecordDraftInput
): Promise<{ success: boolean; draft?: ServiceRecordDraft; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const { userId } = await auth()
    if (!userId) return { success: false, error: '로그인이 필요합니다' }

    const supabase = createAdminClient()

    const { data: appRow } = await supabase
      .from('applications')
      .select('client_id, referral_type, progress_type, category, sub_category, requested_item, service_area')
      .eq('id', input.applicationId)
      .single()

    if (!appRow || appRow.client_id !== input.clientId) {
      return { success: false, error: '접근 권한이 없습니다' }
    }

    const [clientResult, intakeResult, assessmentResult] = await Promise.all([
      supabase
        .from('clients')
        .select('name, birth_date, disability_type, disability_severity, economic_status, region')
        .eq('id', input.clientId)
        .single(),
      supabase
        .from('intake_records')
        .select('consultation_content, main_activity_place, environment_limitations')
        .eq('application_id', input.applicationId)
        .order('consult_date', { ascending: false })
        .limit(1),
      supabase
        .from('domain_assessments')
        .select('domain_type, evaluator_opinion')
        .eq('application_id', input.applicationId)
        .not('evaluator_opinion', 'is', null),
    ])

    const client = clientResult.data
    const latestIntake = (intakeResult.data ?? [])[0]
    const assessments = assessmentResult.data ?? []

    const clientCtx = client
      ? `이름: ${client.name}, 생년월일: ${client.birth_date ?? '미상'}, 장애유형: ${client.disability_type ?? '미상'}, 장애정도: ${client.disability_severity ?? '미상'}, 경제상황: ${client.economic_status ?? '미상'}, 지역: ${client.region ?? '미상'}`
      : '클라이언트 정보 없음'

    const appCtx = `의뢰구분: ${appRow.referral_type ?? '미상'}, 진행분류: ${appRow.progress_type ?? '미상'}, 사업분류: ${appRow.category ?? '미상'}, 서비스분류: ${appRow.sub_category ?? '미상'}, 신청품목: ${appRow.requested_item ?? '미상'}, 서비스영역: ${appRow.service_area ?? '미상'}`

    const intakeCtx = latestIntake
      ? `상담내용: ${latestIntake.consultation_content ?? '없음'}, 주활동장소: ${latestIntake.main_activity_place ?? '없음'}, 환경제한: ${latestIntake.environment_limitations ?? '없음'}`
      : '상담기록지 없음'

    const assessmentCtx = assessments.length > 0
      ? assessments.map((a: { domain_type: string; evaluator_opinion: string }) => `${a.domain_type}: ${a.evaluator_opinion}`).join('\n')
      : '평가 정보 없음'

    const memoCtx = input.memo?.trim() ? `\n추가 메모:\n${input.memo.trim()}` : ''

    const model = getGeminiModel('gemini-2.5-flash')
    const prompt = `${SERVICE_RECORD_DRAFT_PROMPT}\n\n클라이언트 정보:\n${clientCtx}\n\n신청서 정보:\n${appCtx}\n\n상담기록지:\n${intakeCtx}\n\n영역별 평가:\n${assessmentCtx}${memoCtx}`

    const result = await model.generateContent(prompt)
    const generatedText = result.response.text()

    const cleanedText = generatedText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    const draft = JSON.parse(cleanedText) as ServiceRecordDraft

    if (!draft.service_content) throw new Error('service_content 누락')

    return { success: true, draft }
  } catch (error) {
    console.error('[AI Actions] 서비스 기록 초안 생성 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? `AI 생성 오류: ${error.message}` : '예상치 못한 오류가 발생했습니다',
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/actions/service-record-ai.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add actions/ai-actions.ts tests/actions/service-record-ai.test.ts
git commit -m "feat(eval): add generateServiceRecordDraft AI action"
```

---

## Task 3: `ServiceRecordForm.tsx` — 폼 컴포넌트

**Files:**
- Create: `apps/eval/components/eval/ServiceRecordForm.tsx`

- [ ] **Step 1: Create the component**

Create `apps/eval/components/eval/ServiceRecordForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createServiceRecord } from '@/actions/service-record-actions'
import { generateServiceRecordDraft } from '@/actions/ai-actions'
import type { ServiceRecordDraft } from '@/actions/ai-actions'

const INPUT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const SELECT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const SKELETON = 'w-full rounded-md bg-gray-200 animate-pulse'
const READONLY = 'w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed'

const MAJOR_CATEGORIES = ['공적급여', '민간지원', '기타', '서비스지원']
const SERVICE_AREAS = [
  { value: 'WC', label: 'WC (휠체어 및 이동)' },
  { value: 'ADL', label: 'ADL (일상생활동작)' },
  { value: 'S', label: 'S (감각)' },
  { value: 'SP', label: 'SP (앉기 및 자세)' },
  { value: 'EC', label: 'EC (주택 및 환경개조)' },
  { value: 'CA', label: 'CA (컴퓨터접근)' },
  { value: 'L', label: 'L (레저)' },
  { value: 'AAC', label: 'AAC (보완대체의사소통)' },
  { value: 'AM', label: 'AM (자동차개조)' },
]
const REFERRAL_TYPES = ['내방', '유선', '인터넷신청', '기관연계', '기타']
const RECORD_STATUSES = ['접수', '진행중', '완료', '보류']

interface ClientData {
  name: string
  birth_date: string | null
  gender: string | null
  disability_type: string | null
  disability_severity: string | null
  economic_status: string | null
  region: string | null
  contact: string | null
}

interface ServiceRecordFormProps {
  clientId: string
  applicationId: string
  clientData?: ClientData
  redirectTo: string
}

type CheckKey =
  | 'is_consult' | 'is_assessment' | 'is_trial' | 'is_rental' | 'is_custom_make'
  | 'is_grant' | 'is_education' | 'is_info_provision' | 'is_repair' | 'is_cleaning'
  | 'is_reuse' | 'is_monitoring' | 'is_other_business' | 'is_phone' | 'is_visit_in'
  | 'is_visit_out' | 'is_public_funding' | 'is_private_funding' | 'is_self_pay'
  | 'is_funding_secured' | 'is_closed'

const INITIAL_CHECKS: Record<CheckKey, boolean> = {
  is_consult: false, is_assessment: false, is_trial: false, is_rental: false,
  is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false,
  is_repair: false, is_cleaning: false, is_reuse: false, is_monitoring: false,
  is_other_business: false, is_phone: false, is_visit_in: false, is_visit_out: false,
  is_public_funding: false, is_private_funding: false, is_self_pay: false,
  is_funding_secured: false, is_closed: false,
}

export function ServiceRecordForm({
  clientId,
  applicationId,
  clientData,
  redirectTo,
}: ServiceRecordFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [memo, setMemo] = useState('')

  // AI-filled fields
  const [serviceContent, setServiceContent] = useState('')
  const [majorCategory, setMajorCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [productName, setProductName] = useState('')
  const [referralType, setReferralType] = useState('')
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>(INITIAL_CHECKS)

  function toggleCheck(key: CheckKey) {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleAiGenerate() {
    const hasContent = serviceContent || majorCategory || productName
    if (hasContent && !window.confirm('기존 내용이 덮어씌워집니다. 계속하시겠습니까?')) return

    setAiLoading(true)
    setAiError(null)
    try {
      const result = await generateServiceRecordDraft({ applicationId, clientId, memo: memo || undefined })
      if (!result.success || !result.draft) {
        setAiError(result.error ?? 'AI 초안 생성에 실패했습니다')
        return
      }
      applyDraft(result.draft)
    } catch {
      setAiError('AI 초안 생성에 실패했습니다')
    } finally {
      setAiLoading(false)
    }
  }

  function applyDraft(draft: ServiceRecordDraft) {
    setServiceContent(draft.service_content ?? '')
    setMajorCategory(draft.service_major_category ?? '')
    setSubCategory(draft.service_sub_category ?? '')
    setServiceCategory(draft.service_category ?? '')
    setServiceArea(draft.service_area ?? '')
    setProductName(draft.product_name ?? '')
    setReferralType(draft.referral_type ?? '')
    setChecks(prev => ({
      ...prev,
      is_consult: draft.is_consult ?? false,
      is_assessment: draft.is_assessment ?? false,
      is_trial: draft.is_trial ?? false,
      is_rental: draft.is_rental ?? false,
      is_custom_make: draft.is_custom_make ?? false,
      is_grant: draft.is_grant ?? false,
      is_education: draft.is_education ?? false,
      is_info_provision: draft.is_info_provision ?? false,
      is_repair: draft.is_repair ?? false,
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const str = (k: string) => (fd.get(k) as string) || null
    const num = (k: string) => { const v = fd.get(k) as string; return v ? parseInt(v) : null }
    const bool = (k: string) => fd.get(k) === 'true'

    const result = await createServiceRecord({
      application_id: applicationId,
      client_id: clientId,
      received_at: str('received_at') ?? new Date().toISOString().split('T')[0],
      application_year: num('application_year'),
      application_month: num('application_month'),
      application_no: num('application_no'),
      is_re_application: bool('is_re_application'),
      record_status: str('record_status'),
      name: clientData?.name ?? str('name'),
      birth_date: clientData?.birth_date ?? str('birth_date'),
      gender: clientData?.gender ?? str('gender'),
      disability_type: clientData?.disability_type ?? str('disability_type'),
      disability_severity: clientData?.disability_severity ?? str('disability_severity'),
      economic_status: clientData?.economic_status ?? str('economic_status'),
      region: clientData?.region ?? str('region'),
      contact: clientData?.contact ?? str('contact'),
      address: str('address'),
      service_major_category: majorCategory || null,
      service_sub_category: subCategory || null,
      service_category: serviceCategory || null,
      product_name: productName || null,
      item_category: str('item_category'),
      service_area: serviceArea || null,
      service_content: serviceContent || null,
      referral_type: referralType || null,
      consultation_date: str('consultation_date'),
      performance_date: str('performance_date'),
      closed_at: str('closed_at'),
      monitoring_date: str('monitoring_date'),
      ...checks,
      trial_device_count: num('trial_device_count'),
      info_provision_area: str('info_provision_area'),
      funding_source_detail: str('funding_source_detail'),
      staff_name: str('staff_name'),
    })

    setSaving(false)
    if (!result.success) { setError(result.error ?? '저장 실패'); return }
    router.push(redirectTo)
    router.refresh()
  }

  function CheckBox({ k, label }: { k: CheckKey; label: string }) {
    return (
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={checks[k]}
          onChange={() => toggleCheck(k)}
          className="rounded border-gray-300"
        />
        <span className="text-sm">{label}</span>
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* AI 초안 */}
      <section className="border rounded-lg p-6 bg-white space-y-3">
        <h3 className="font-semibold text-gray-900">AI 초안 생성</h3>
        <p className="text-xs text-gray-500">버튼을 누르면 클라이언트 정보·상담기록지·평가 결과를 자동으로 읽어 초안을 생성합니다. 메모를 추가하면 더 정확해집니다.</p>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          rows={2}
          placeholder="예) 전동휠체어 공적급여 상담, 건강보험 급여 신청 안내 완료"
          disabled={aiLoading}
          className={INPUT}
        />
        {aiError && <p className="text-sm text-red-600">{aiError}</p>}
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {aiLoading ? (
            <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />생성 중...</>
          ) : (
            <><Sparkles className="w-4 h-4" />AI 초안 생성</>
          )}
        </button>
      </section>

      {/* ① 기본 정보 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold text-gray-900">① 기본 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">접수일 <span className="text-red-500">*</span></label>
            <input name="received_at" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">기록상태</label>
            <select name="record_status" defaultValue="" className={SELECT}>
              <option value="">선택</option>
              {RECORD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">신청년도</label>
            <input name="application_year" type="number" defaultValue={new Date().getFullYear()} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">신청월</label>
            <input name="application_month" type="number" min="1" max="12" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">신청번호</label>
            <input name="application_no" type="number" className={INPUT} />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input name="is_re_application" type="checkbox" value="true" className="rounded border-gray-300" />
            <label className="text-sm text-gray-700">재신청</label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {clientData ? (
            <>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">성명</label><div className={READONLY}>{clientData.name}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label><div className={READONLY}>{clientData.birth_date ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">성별</label><div className={READONLY}>{clientData.gender ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">장애유형</label><div className={READONLY}>{clientData.disability_type ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">장애정도</label><div className={READONLY}>{clientData.disability_severity ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">경제상황</label><div className={READONLY}>{clientData.economic_status ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">지역</label><div className={READONLY}>{clientData.region ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">연락처</label><div className={READONLY}>{clientData.contact ?? '—'}</div></div>
            </>
          ) : (
            <>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">성명</label><input name="name" type="text" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label><input name="birth_date" type="text" placeholder="YYYY-MM-DD" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">성별</label>
                <select name="gender" defaultValue="" className={SELECT}>
                  <option value="">선택</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">장애유형</label><input name="disability_type" type="text" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">장애정도</label>
                <select name="disability_severity" defaultValue="" className={SELECT}>
                  <option value="">선택</option>
                  <option value="심한">심한</option>
                  <option value="심하지 않은">심하지 않은</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">경제상황</label><input name="economic_status" type="text" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">지역</label><input name="region" type="text" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">연락처</label><input name="contact" type="text" className={INPUT} /></div>
            </>
          )}
        </div>
      </section>

      {/* ② 서비스 내용 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold text-gray-900">② 서비스 내용</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">대분류</label>
            {aiLoading ? <div className={`${SKELETON} h-9`} /> : (
              <select value={majorCategory} onChange={e => setMajorCategory(e.target.value)} className={SELECT}>
                <option value="">선택</option>
                {MAJOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">소분류</label>
            {aiLoading ? <div className={`${SKELETON} h-9`} /> : (
              <input value={subCategory} onChange={e => setSubCategory(e.target.value)} type="text" className={INPUT} />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">서비스구분</label>
            {aiLoading ? <div className={`${SKELETON} h-9`} /> : (
              <input value={serviceCategory} onChange={e => setServiceCategory(e.target.value)} type="text" className={INPUT} />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">신청품목</label>
            {aiLoading ? <div className={`${SKELETON} h-9`} /> : (
              <input value={productName} onChange={e => setProductName(e.target.value)} type="text" className={INPUT} />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">품목분류</label>
            <input name="item_category" type="text" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">서비스영역</label>
            {aiLoading ? <div className={`${SKELETON} h-9`} /> : (
              <select value={serviceArea} onChange={e => setServiceArea(e.target.value)} className={SELECT}>
                <option value="">선택</option>
                {SERVICE_AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">의뢰구분</label>
            {aiLoading ? <div className={`${SKELETON} h-9`} /> : (
              <select value={referralType} onChange={e => setReferralType(e.target.value)} className={SELECT}>
                <option value="">선택</option>
                {REFERRAL_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">서비스 내용</label>
          {aiLoading ? <div className={`${SKELETON} h-24`} /> : (
            <textarea value={serviceContent} onChange={e => setServiceContent(e.target.value)} rows={5} className={INPUT} placeholder="서비스 내용을 입력하세요" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">상담일</label><input name="consultation_date" type="date" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">실적일</label><input name="performance_date" type="date" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">종결일</label><input name="closed_at" type="date" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">모니터링일</label><input name="monitoring_date" type="date" className={INPUT} /></div>
        </div>
      </section>

      {/* ③ 서비스 유형 체크박스 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold text-gray-900">③ 서비스 유형</h3>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">서비스 유형</p>
          <div className="flex flex-wrap gap-3">
            <CheckBox k="is_consult" label="상담" />
            <CheckBox k="is_assessment" label="평가" />
            <CheckBox k="is_trial" label="체험" />
            <CheckBox k="is_rental" label="대여" />
            <CheckBox k="is_custom_make" label="맞춤제작" />
            <CheckBox k="is_grant" label="교부" />
            <CheckBox k="is_education" label="교육" />
            <CheckBox k="is_info_provision" label="정보제공" />
            <CheckBox k="is_repair" label="수리" />
            <CheckBox k="is_cleaning" label="소독" />
            <CheckBox k="is_reuse" label="재사용" />
            <CheckBox k="is_monitoring" label="모니터링" />
            <CheckBox k="is_other_business" label="기타사업" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">연락 방식</p>
          <div className="flex flex-wrap gap-3">
            <CheckBox k="is_phone" label="유선" />
            <CheckBox k="is_visit_in" label="내방" />
            <CheckBox k="is_visit_out" label="방문(외)" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">재원</p>
          <div className="flex flex-wrap gap-3">
            <CheckBox k="is_public_funding" label="공적급여" />
            <CheckBox k="is_private_funding" label="민간지원" />
            <CheckBox k="is_self_pay" label="자부담" />
            <CheckBox k="is_funding_secured" label="재원확보" />
          </div>
        </div>
        <div className="flex items-center">
          <CheckBox k="is_closed" label="종결" />
        </div>
      </section>

      {/* ④ 추가 정보 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold text-gray-900">④ 추가 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">체험기기 수</label><input name="trial_device_count" type="number" min="0" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">정보제공 지역</label><input name="info_provision_area" type="text" className={INPUT} /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">재원 상세</label><input name="funding_source_detail" type="text" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">담당자</label><input name="staff_name" type="text" className={INPUT} /></div>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
        <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/eval/components/eval/ServiceRecordForm.tsx
git commit -m "feat(eval): add ServiceRecordForm component with AI draft generation"
```

---

## Task 4: `service-record/page.tsx` — 작성 라우트

**Files:**
- Create: `apps/eval/app/clients/[clientId]/applications/[appId]/service-record/page.tsx`

- [ ] **Step 1: Create the page**

Create `apps/eval/app/clients/[clientId]/applications/[appId]/service-record/page.tsx`:

```tsx
import { getClientById } from '@/actions/client-actions'
import { ServiceRecordForm } from '@/eval/components/eval/ServiceRecordForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ clientId: string; appId: string }>
}

export default async function ServiceRecordPage({ params }: Props) {
  const { clientId, appId } = await params

  const clientResult = await getClientById(clientId)
  if (!clientResult.success || !clientResult.client) notFound()

  const client = clientResult.client
  const clientData = {
    name: client.name,
    birth_date: (client as { birth_date?: string | null }).birth_date ?? null,
    gender: (client as { gender?: string | null }).gender ?? null,
    disability_type: (client as { disability_type?: string | null }).disability_type ?? null,
    disability_severity: (client as { disability_severity?: string | null }).disability_severity ?? null,
    economic_status: (client as { economic_status?: string | null }).economic_status ?? null,
    region: (client as { region?: string | null }).region ?? null,
    contact: (client as { contact?: string | null }).contact ?? null,
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href={`/clients/${clientId}/applications/${appId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        신청서로
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">서비스 기록 작성</h1>
      <ServiceRecordForm
        clientId={clientId}
        applicationId={appId}
        clientData={clientData}
        redirectTo={`/clients/${clientId}/applications/${appId}`}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/eval/app/clients/[clientId]/applications/[appId]/service-record/page.tsx
git commit -m "feat(eval): add service-record create page route"
```

---

## Task 5: 신청서 상세 페이지에 서비스 기록 섹션 추가

**Files:**
- Modify: `apps/eval/app/clients/[clientId]/applications/[appId]/page.tsx`

- [ ] **Step 1: Add service record section to application detail page**

Open `apps/eval/app/clients/[clientId]/applications/[appId]/page.tsx`.

Add import at the top (after existing imports):

```tsx
import { getServiceRecordsByApplication } from '@/actions/service-record-actions'
import { ClipboardEdit } from 'lucide-react'
```

Add to the `Promise.all` array in the page body:

```tsx
const [intakeResult, assessmentResult, clientResult, appsResult, serviceRecordResult] = await Promise.all([
  getIntakeRecordsByApplication(appId),
  getDomainAssessments(appId),
  getClientById(clientId),
  getApplicationsByClientId(clientId),
  getServiceRecordsByApplication(appId),
])
```

Add variable after existing variable declarations:

```tsx
const serviceRecords = serviceRecordResult.success ? (serviceRecordResult.records ?? []) : []
```

Add the following section JSX **after** the existing "상담 기록지" section and **before** the "영역별 평가" section:

```tsx
{/* ── 서비스 기록 ── */}
<section className="mb-8">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <ClipboardEdit className="h-5 w-5 text-orange-600" />
      <h2 className="font-semibold text-gray-900">서비스 기록</h2>
      <span className="text-xs text-gray-400">{serviceRecords.length}건</span>
    </div>
    <Link
      href={`/clients/${clientId}/applications/${appId}/service-record`}
      className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
    >
      <Plus className="h-3.5 w-3.5" />
      작성하기
    </Link>
  </div>
  {serviceRecords.length > 0 ? (
    <div className="border rounded-lg divide-y bg-white">
      {serviceRecords.map((r) => (
        <div key={r.id} className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-gray-700">{r.received_at} 기록</span>
          {r.service_content && (
            <span className="text-xs text-gray-400 truncate max-w-xs ml-4">{r.service_content}</span>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="border rounded-lg px-4 py-6 text-center text-sm text-gray-400 bg-gray-50">
      아직 작성된 서비스 기록이 없습니다
    </div>
  )}
</section>
```

- [ ] **Step 2: Verify the page compiles — start dev server and open the application detail page**

```bash
cd D:/AILeader1/project/valuewith/co-AT
pnpm --filter @co-at/eval dev
```

Open `http://localhost:3002/clients/[any-client-id]/applications/[any-app-id]` and verify the "서비스 기록" section appears between the intake and assessment sections.

- [ ] **Step 3: Commit**

```bash
git add apps/eval/app/clients/[clientId]/applications/[appId]/page.tsx
git commit -m "feat(eval): add service record section to application detail page"
```

---

## Task 6: `/service-records` 전체 목록 페이지

**Files:**
- Create: `apps/eval/app/service-records/page.tsx`

- [ ] **Step 1: Create the list page**

Create `apps/eval/app/service-records/page.tsx`:

```tsx
import { getServiceRecords } from '@/actions/service-record-actions'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function ServiceRecordsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()
  const month = params.month ? parseInt(params.month) : undefined

  const result = await getServiceRecords({ year, month })
  const records = result.success ? result.records ?? [] : []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">서비스 기록</h1>
        <p className="text-sm text-gray-500 mt-1">총 {records.length}건</p>
      </div>

      {/* 필터 */}
      <form method="GET" className="flex gap-3 mb-6">
        <select
          name="year"
          defaultValue={year}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          {[2026, 2025, 2024, 2023].map(y => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <select
          name="month"
          defaultValue={month ?? ''}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
        >
          조회
        </button>
      </form>

      {records.length === 0 ? (
        <div className="border rounded-lg px-4 py-12 text-center text-sm text-gray-400 bg-gray-50">
          해당 기간에 서비스 기록이 없습니다
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">접수일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">성명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">서비스 대분류</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">서비스 내용</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">담당자</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {records.map(r => (
                <tr
                  key={r.id}
                  className={r.client_id && r.application_id ? 'hover:bg-gray-50 cursor-pointer' : ''}
                >
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {r.client_id && r.application_id ? (
                      <Link
                        href={`/clients/${r.client_id}/applications/${r.application_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {r.received_at ?? '—'}
                      </Link>
                    ) : (
                      r.received_at ?? '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.service_major_category ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{r.service_content ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.staff_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/eval/app/service-records/page.tsx
git commit -m "feat(eval): add service-records list page with year/month filter"
```

---

## Task 7: 사이드바 메뉴 + 최종 커밋

**Files:**
- Modify: `apps/eval/components/layout/EvalSidebar.tsx`

- [ ] **Step 1: Add "서비스 기록" nav item and import icon**

Open `apps/eval/components/layout/EvalSidebar.tsx`.

Change the import line:

```tsx
import { Users, BarChart3, LogOut, Phone, RefreshCw, Clock, FileEdit } from 'lucide-react'
```

Add to `NAV_ITEMS` array (after `call-logs` entry, before `migration`):

```tsx
{ href: '/service-records', label: '서비스 기록', icon: FileEdit },
```

Full updated `NAV_ITEMS`:

```tsx
const NAV_ITEMS = [
  { href: '/', label: '대시보드', icon: BarChart3 },
  { href: '/clients', label: '클라이언트', icon: Users },
  { href: '/clients/pending', label: '신규 접수 대기', icon: Clock },
  { href: '/call-logs', label: '콜센터 상담', icon: Phone },
  { href: '/service-records', label: '서비스 기록', icon: FileEdit },
  { href: '/migration', label: 'Sheets 동기화', icon: RefreshCw },
] as const
```

- [ ] **Step 2: Verify full flow in browser**

```bash
pnpm --filter @co-at/eval dev
```

체크리스트:
1. `http://localhost:3002/service-records` — 목록 페이지 접근, 연도/월 필터 작동
2. 사이드바에 "서비스 기록" 메뉴 표시 확인
3. 클라이언트 → 신청서 → "서비스 기록" 섹션 표시 확인
4. "작성하기" 버튼 → `/service-record` 폼 페이지 이동 확인
5. AI 초안 생성 버튼 클릭 → Gemini 응답으로 필드 자동 채움 확인
6. 저장 후 신청서 페이지로 리다이렉트, 서비스 기록 섹션에 새 항목 표시 확인

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```
Expected: 모든 기존 테스트 + 신규 2개 파일 PASS

- [ ] **Step 4: Final commit**

```bash
git add apps/eval/components/layout/EvalSidebar.tsx
git commit -m "feat(eval): add service-records sidebar nav item"
git push
```

---

## 구현 완료 체크리스트

- [ ] `actions/service-record-actions.ts` — CRUD 4개 함수
- [ ] `actions/ai-actions.ts` — `generateServiceRecordDraft` 추가
- [ ] `apps/eval/components/eval/ServiceRecordForm.tsx` — AI 초안 + 4섹션 폼
- [ ] `apps/eval/app/clients/[clientId]/applications/[appId]/service-record/page.tsx` — 작성 라우트
- [ ] `apps/eval/app/clients/[clientId]/applications/[appId]/page.tsx` — 서비스 기록 섹션 추가
- [ ] `apps/eval/app/service-records/page.tsx` — 목록 페이지
- [ ] `apps/eval/components/layout/EvalSidebar.tsx` — 메뉴 추가
- [ ] `tests/actions/service-record.test.ts` — CRUD 테스트
- [ ] `tests/actions/service-record-ai.test.ts` — AI 함수 테스트
