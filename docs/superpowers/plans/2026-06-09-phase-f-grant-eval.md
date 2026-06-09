# Phase F — 교부사업 적합성 평가 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/grant-eval` 모듈 구현 — 교부사업 적합성 평가 등록·조회·5탭 상세·인쇄·통계

**Architecture:** URL searchParam 기반 탭(`?tab=basic|items|suitability|opinion|result`). 서버 컴포넌트가 탭별 데이터 페치, 클라이언트 폼 컴포넌트가 Server Action 호출. 접수공문·통계는 별도 라우트.

**Tech Stack:** Next.js 16 App Router, Server Actions, Supabase(`createAdminClient`), Tailwind CSS, Vitest

---

## File Map

| 파일 | 역할 |
|------|------|
| `actions/grant-assessment-actions.ts` | CRUD + list (수정) |
| `actions/grant-item-actions.ts` | 품목 upsert/delete (신규) |
| `actions/checklist-template-actions.ts` | 체크리스트 템플릿 조회 (신규) |
| `actions/grant-referral-actions.ts` | 접수공문 CRUD (신규) |
| `tests/actions/grant-assessment-actions.test.ts` | 신규 |
| `tests/actions/grant-item-actions.test.ts` | 신규 |
| `apps/eval/components/grant-eval/ScoreSelector.tsx` | 점수 선택 버튼(2~10) |
| `apps/eval/components/grant-eval/ChecklistSection.tsx` | 동적 체크리스트 |
| `apps/eval/components/grant-eval/GrantAssessmentBasicForm.tsx` | 기본정보 탭 폼 |
| `apps/eval/components/grant-eval/GrantItemsForm.tsx` | 신청품목 탭 폼 |
| `apps/eval/components/grant-eval/GrantSuitabilityForm.tsx` | 적정성 탭 폼 |
| `apps/eval/components/grant-eval/GrantOpinionForm.tsx` | 종합의견 탭 폼 |
| `apps/eval/components/grant-eval/GrantResultForm.tsx` | 평가결과 탭 폼 |
| `apps/eval/app/grant-eval/page.tsx` | 목록 |
| `apps/eval/app/grant-eval/new/page.tsx` | 신규 등록 |
| `apps/eval/app/grant-eval/[id]/page.tsx` | 5탭 상세 |
| `apps/eval/app/grant-eval/referrals/page.tsx` | 접수공문 |
| `apps/eval/app/grant-eval/statistics/page.tsx` | 통계 |
| `apps/eval/app/print/grant-eval/[id]/page.tsx` | 인쇄 |

---

## Task 1: grant-assessment-actions.ts 완성

**Files:** Modify `actions/grant-assessment-actions.ts`

- [ ] **Step 1: gen:types 실행**

```bash
pnpm gen:types
```

- [ ] **Step 2: 파일 전체 교체**

```typescript
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface GrantAssessmentListItem {
  id: string
  client_id: string
  client_name: string
  birth_date: string | null
  disability_type: string | null
  disability_grade: string | null
  assessment_year: number
  assessment_month: number | null
  referral_org: string | null
  evaluation_date: string | null
  final_result: string | null
  status: string
  item_count: number
  item_categories: string[] | null
  created_at: string
}

export interface GrantAssessmentItem {
  id: string
  item_order: number
  item_category: string
  item_name: string | null
  use_plan: string | null
  use_location: string | null
  use_location_detail: string | null
  usage_experience: boolean | null
  self_usage_possible: boolean | null
  support_person: string | null
  score_env: number | null
  score_operation: number | null
  score_disability: number | null
  score_use_plan: number | null
  score_effectiveness: number | null
  total_score: number | null
  checklist_responses: Record<string, boolean> | null
  item_opinion: string | null
  item_result: string | null
  recommended_model: string | null
  vendor_name: string | null
  vendor_phone: string | null
  support_amount: number | null
  has_self_pay: boolean | null
  final_item_name: string | null
}

export interface GrantAssessmentDetail {
  id: string
  client_id: string
  application_id: string | null
  assessment_year: number
  assessment_month: number | null
  referral_org: string | null
  referral_doc_id: string | null
  evaluator_name: string | null
  evaluator_staff_id: string | null
  evaluation_date: string | null
  prior_grant_records: Array<{ year: number; agency: string; item: string }> | null
  general_opinion: string | null
  change_cancel_reason: string | null
  final_result: string | null
  status: string
  items: GrantAssessmentItem[]
}

export interface CreateGrantAssessmentInput {
  client_id: string
  application_id?: string | null
  assessment_year: number
  referral_org?: string | null
  referral_doc_id?: string | null
}

export interface UpdateGrantAssessmentInput {
  assessment_month?: number | null
  referral_org?: string | null
  referral_doc_id?: string | null
  evaluator_name?: string | null
  evaluator_staff_id?: string | null
  evaluation_date?: string | null
  prior_grant_records?: Array<{ year: number; agency: string; item: string }> | null
  general_opinion?: string | null
  change_cancel_reason?: string | null
  final_result?: string | null
  status?: string
}

export async function listGrantAssessments(options: {
  year?: number
  referralOrg?: string
  status?: string
} = {}): Promise<{ success: boolean; assessments?: GrantAssessmentListItem[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    let query = (supabase as any)
      .from("eval_grant_assessment_list")
      .select("*")
      .order("created_at", { ascending: false })

    if (options.year) query = query.eq("assessment_year", options.year)
    if (options.referralOrg) query = query.ilike("referral_org", `%${options.referralOrg}%`)
    if (options.status) query = query.eq("status", options.status)

    const { data, error } = await query
    if (error) return { success: false, error: "목록 조회에 실패했습니다" }
    return { success: true, assessments: (data ?? []) as GrantAssessmentListItem[] }
  } catch (e) {
    console.error("listGrantAssessments:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getGrantAssessmentById(id: string): Promise<{
  success: boolean
  assessment?: GrantAssessmentDetail
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()

    const { data: a, error: aErr } = await (supabase as any)
      .from("eval_grant_assessments")
      .select("id,client_id,application_id,assessment_year,assessment_month,referral_org,referral_doc_id,evaluator_name,evaluator_staff_id,evaluation_date,prior_grant_records,general_opinion,change_cancel_reason,final_result,status")
      .eq("id", id)
      .single()

    if (aErr || !a) return { success: false, error: "교부사업 평가를 찾을 수 없습니다" }

    const { data: items, error: iErr } = await (supabase as any)
      .from("eval_grant_items")
      .select("id,item_order,item_category,item_name,use_plan,use_location,use_location_detail,usage_experience,self_usage_possible,support_person,score_env,score_operation,score_disability,score_use_plan,score_effectiveness,total_score,checklist_responses,item_opinion,item_result,recommended_model,vendor_name,vendor_phone,support_amount,has_self_pay,final_item_name")
      .eq("assessment_id", id)
      .order("item_order", { ascending: true })

    if (iErr) return { success: false, error: "품목 조회에 실패했습니다" }

    return {
      success: true,
      assessment: { ...(a as Omit<GrantAssessmentDetail, "items">), items: (items ?? []) as GrantAssessmentItem[] },
    }
  } catch (e) {
    console.error("getGrantAssessmentById:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function createGrantAssessment(input: CreateGrantAssessmentInput): Promise<{
  success: boolean; id?: string; error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const supabase = createAdminClient()

    const { data: profile } = await (supabase as any)
      .from("profiles").select("name").eq("clerk_user_id", userId).single()

    const { data, error } = await (supabase as any)
      .from("eval_grant_assessments")
      .insert({
        client_id: input.client_id,
        application_id: input.application_id ?? null,
        assessment_year: input.assessment_year,
        referral_org: input.referral_org ?? null,
        referral_doc_id: input.referral_doc_id ?? null,
        evaluator_staff_id: userId,
        evaluator_name: profile ? (profile as { name: string }).name : null,
        status: "draft",
      })
      .select("id")
      .single()

    if (error || !data) return { success: false, error: "교부사업 평가 생성에 실패했습니다" }

    revalidatePath("/grant-eval")
    return { success: true, id: (data as { id: string }).id }
  } catch (e) {
    console.error("createGrantAssessment:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function updateGrantAssessment(
  id: string,
  input: UpdateGrantAssessmentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_assessments")
      .update(input)
      .eq("id", id)

    if (error) return { success: false, error: "수정에 실패했습니다" }

    revalidatePath("/grant-eval")
    revalidatePath(`/grant-eval/${id}`)
    return { success: true }
  } catch (e) {
    console.error("updateGrantAssessment:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function deleteGrantAssessment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_assessments").delete().eq("id", id)

    if (error) return { success: false, error: "삭제에 실패했습니다" }

    revalidatePath("/grant-eval")
    return { success: true }
  } catch (e) {
    console.error("deleteGrantAssessment:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function submitGrantAssessment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_assessments")
      .update({ status: "submitted" })
      .eq("id", id)
      .eq("status", "draft")

    if (error) return { success: false, error: "제출에 실패했습니다" }

    revalidatePath("/grant-eval")
    revalidatePath(`/grant-eval/${id}`)
    return { success: true }
  } catch (e) {
    console.error("submitGrantAssessment:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
```

- [ ] **Step 3: 타입 체크**

```bash
pnpm --filter eval tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add actions/grant-assessment-actions.ts types/database.types.ts
git commit -m "feat(eval): complete grant-assessment-actions CRUD"
```

---

## Task 2: grant-item-actions.ts + checklist-template-actions.ts

**Files:**
- Create: `actions/grant-item-actions.ts`
- Create: `actions/checklist-template-actions.ts`

- [ ] **Step 1: grant-item-actions.ts 작성**

```typescript
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface GrantItemInput {
  item_category: string
  item_name?: string | null
  use_plan?: string | null
  use_location?: string | null
  use_location_detail?: string | null
  usage_experience?: boolean | null
  self_usage_possible?: boolean | null
  support_person?: string | null
  score_env?: number | null
  score_operation?: number | null
  score_disability?: number | null
  score_use_plan?: number | null
  score_effectiveness?: number | null
  checklist_responses?: Record<string, boolean> | null
  item_opinion?: string | null
  item_result?: string | null
  recommended_model?: string | null
  vendor_name?: string | null
  vendor_phone?: string | null
  support_amount?: number | null
  has_self_pay?: boolean | null
  final_item_name?: string | null
}

export async function upsertGrantItem(
  assessmentId: string,
  itemOrder: number,
  input: GrantItemInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()

    const { data, error } = await (supabase as any)
      .from("eval_grant_items")
      .upsert(
        { assessment_id: assessmentId, item_order: itemOrder, ...input },
        { onConflict: "assessment_id,item_order" }
      )
      .select("id")
      .single()

    if (error) {
      console.error("upsertGrantItem:", error)
      return { success: false, error: error.message ?? "품목 저장에 실패했습니다" }
    }

    revalidatePath(`/grant-eval/${assessmentId}`)
    return { success: true, id: (data as { id: string }).id }
  } catch (e) {
    console.error("upsertGrantItem unexpected:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function deleteGrantItem(
  assessmentId: string,
  itemOrder: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_items")
      .delete()
      .eq("assessment_id", assessmentId)
      .eq("item_order", itemOrder)

    if (error) return { success: false, error: "품목 삭제에 실패했습니다" }

    revalidatePath(`/grant-eval/${assessmentId}`)
    return { success: true }
  } catch (e) {
    console.error("deleteGrantItem:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
```

- [ ] **Step 2: checklist-template-actions.ts 작성**

```typescript
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

export interface ChecklistTemplate {
  question_id: string
  question_text: string
  question_order: number
  hint_text: string | null
}

export async function getChecklistTemplates(
  itemCategory: string
): Promise<{ success: boolean; templates?: ChecklistTemplate[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from("eval_item_checklist_templates")
      .select("question_id, question_text, question_order, hint_text")
      .eq("item_category", itemCategory)
      .eq("is_active", true)
      .order("question_order", { ascending: true })

    if (error) return { success: false, error: "체크리스트 조회에 실패했습니다" }
    return { success: true, templates: (data ?? []) as ChecklistTemplate[] }
  } catch (e) {
    console.error("getChecklistTemplates:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add actions/grant-item-actions.ts actions/checklist-template-actions.ts
git commit -m "feat(eval): add grant-item and checklist-template actions"
```

---

## Task 3: grant-referral-actions.ts

**Files:** Create `actions/grant-referral-actions.ts`

- [ ] **Step 1: 파일 작성**

```typescript
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface GrantReferralDoc {
  id: string
  doc_year: number
  doc_number: string | null
  sending_org: string
  doc_date: string | null
  receive_date: string | null
  referral_round: number | null
  referral_count: number
  assessment_count: number
  assessment_items_count: number
  cancel_count: number
  result_send_date: string | null
  note: string | null
  created_at: string
}

export interface GrantReferralDocInput {
  doc_year: number
  doc_number?: string | null
  sending_org: string
  doc_date?: string | null
  receive_date?: string | null
  referral_round?: number | null
  referral_count?: number
  result_send_date?: string | null
  note?: string | null
}

export async function listGrantReferralDocs(
  year?: number
): Promise<{ success: boolean; docs?: GrantReferralDoc[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    let query = (supabase as any)
      .from("eval_grant_referral_docs")
      .select("*")
      .order("doc_year", { ascending: false })
      .order("created_at", { ascending: false })

    if (year) query = query.eq("doc_year", year)

    const { data, error } = await query
    if (error) return { success: false, error: "접수공문 목록 조회에 실패했습니다" }
    return { success: true, docs: (data ?? []) as GrantReferralDoc[] }
  } catch (e) {
    console.error("listGrantReferralDocs:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function createGrantReferralDoc(
  input: GrantReferralDocInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from("eval_grant_referral_docs")
      .insert({ ...input, created_by: userId })
      .select("id")
      .single()

    if (error || !data) return { success: false, error: "접수공문 생성에 실패했습니다" }

    revalidatePath("/grant-eval/referrals")
    return { success: true, id: (data as { id: string }).id }
  } catch (e) {
    console.error("createGrantReferralDoc:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function updateGrantReferralDoc(
  id: string,
  input: Partial<GrantReferralDocInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_referral_docs")
      .update(input)
      .eq("id", id)

    if (error) return { success: false, error: "접수공문 수정에 실패했습니다" }

    revalidatePath("/grant-eval/referrals")
    return { success: true }
  } catch (e) {
    console.error("updateGrantReferralDoc:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function deleteGrantReferralDoc(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_referral_docs")
      .delete()
      .eq("id", id)

    if (error) return { success: false, error: "접수공문 삭제에 실패했습니다" }

    revalidatePath("/grant-eval/referrals")
    return { success: true }
  } catch (e) {
    console.error("deleteGrantReferralDoc:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/grant-referral-actions.ts
git commit -m "feat(eval): add grant-referral-actions CRUD"
```

---

## Task 4: 액션 테스트

**Files:**
- Create: `tests/actions/grant-assessment-actions.test.ts`
- Create: `tests/actions/grant-item-actions.test.ts`

- [ ] **Step 1: grant-assessment-actions.test.ts 작성**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listGrantAssessments,
  createGrantAssessment,
  updateGrantAssessment,
  deleteGrantAssessment,
} from '@/actions/grant-assessment-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

function makeChain(terminal: Record<string, unknown> = {}) {
  const chain: any = {
    from: vi.fn(() => chain),
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    ...terminal,
  }
  return chain
}

describe('listGrantAssessments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await listGrantAssessments()
    expect(result.success).toBe(false)
    expect(result.error).toBe('권한이 없습니다')
  })

  it('성공 — 목록 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({
      order: vi.fn(() => Promise.resolve({ data: [{ id: 'a-1', client_name: '홍길동' }], error: null })),
    })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await listGrantAssessments()
    expect(result.success).toBe(true)
    expect(result.assessments).toHaveLength(1)
  })
})

describe('createGrantAssessment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await createGrantAssessment({ client_id: 'c-1', assessment_year: 2026 })
    expect(result.success).toBe(false)
  })

  it('성공 — id 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({
      single: vi.fn()
        .mockResolvedValueOnce({ data: null, error: null })   // profiles select
        .mockResolvedValueOnce({ data: { id: 'new-id' }, error: null }), // insert
    })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await createGrantAssessment({ client_id: 'c-1', assessment_year: 2026 })
    expect(result.success).toBe(true)
    expect(result.id).toBe('new-id')
  })
})

describe('updateGrantAssessment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('성공', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({ eq: vi.fn(() => Promise.resolve({ error: null })) })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await updateGrantAssessment('a-1', { general_opinion: '검토 완료' })
    expect(result.success).toBe(true)
  })
})

describe('deleteGrantAssessment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('성공', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({ eq: vi.fn(() => Promise.resolve({ error: null })) })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await deleteGrantAssessment('a-1')
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: grant-item-actions.test.ts 작성**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { upsertGrantItem, deleteGrantItem } from '@/actions/grant-item-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

function makeChain(terminal: Record<string, unknown> = {}) {
  const chain: any = {
    from: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: { id: 'item-1' }, error: null })),
    ...terminal,
  }
  return chain
}

describe('upsertGrantItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 오류', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await upsertGrantItem('a-1', 1, { item_category: '전동휠체어' })
    expect(result.success).toBe(false)
  })

  it('성공 — id 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    vi.mocked(createAdminClient).mockReturnValueOnce(makeChain() as any)
    const result = await upsertGrantItem('a-1', 1, { item_category: '전동휠체어' })
    expect(result.success).toBe(true)
    expect(result.id).toBe('item-1')
  })
})

describe('deleteGrantItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('성공', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain = makeChain({ eq: vi.fn(() => Promise.resolve({ error: null })) })
    vi.mocked(createAdminClient).mockReturnValueOnce(chain as any)
    const result = await deleteGrantItem('a-1', 1)
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 3: 테스트 실행**

```bash
pnpm test tests/actions/grant-assessment-actions.test.ts tests/actions/grant-item-actions.test.ts
```

Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add tests/actions/grant-assessment-actions.test.ts tests/actions/grant-item-actions.test.ts
git commit -m "test(eval): add grant-assessment and grant-item action tests"
```

---

## Task 5: UI 공통 컴포넌트

**Files:**
- Create: `apps/eval/components/grant-eval/ScoreSelector.tsx`
- Create: `apps/eval/components/grant-eval/ChecklistSection.tsx`

- [ ] **Step 1: ScoreSelector.tsx**

```tsx
'use client'

const SCORES = [2, 4, 6, 8, 10] as const

interface Props {
  label: string
  value: number | null
  onChange: (v: number) => void
  disabled?: boolean
}

export function ScoreSelector({ label, value, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex gap-1">
        {SCORES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={[
              'w-10 h-9 rounded text-sm font-medium border transition-colors',
              value === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
              disabled ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {s}
          </button>
        ))}
      </div>
      {value !== null && (
        <span className="text-sm font-semibold text-blue-700">{value}점</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: ChecklistSection.tsx**

```tsx
'use client'

export interface ChecklistItem {
  question_id: string
  question_text: string
  hint_text: string | null
}

interface Props {
  items: ChecklistItem[]
  responses: Record<string, boolean>
  onChange: (id: string, value: boolean) => void
  disabled?: boolean
}

export function ChecklistSection({ items, responses, onChange, disabled }: Props) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <label key={item.question_id} className="flex gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 shrink-0"
            checked={responses[item.question_id] ?? false}
            disabled={disabled}
            onChange={(e) => onChange(item.question_id, e.target.checked)}
          />
          <div>
            <p className="text-sm text-gray-800">{item.question_text}</p>
            {item.hint_text && (
              <p className="text-xs text-gray-400 mt-0.5">{item.hint_text}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/eval/components/grant-eval/
git commit -m "feat(eval): add ScoreSelector and ChecklistSection components"
```

---

## Task 6: /grant-eval 목록 페이지

**Files:**
- Create: `apps/eval/app/grant-eval/page.tsx`

- [ ] **Step 1: 파일 작성**

```tsx
import { listGrantAssessments } from '@/actions/grant-assessment-actions'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Props {
  searchParams: Promise<{ year?: string; org?: string; status?: string }>
}

const RESULT_COLOR: Record<string, string> = {
  '적합': 'bg-green-100 text-green-700',
  '부적합': 'bg-red-100 text-red-700',
  '조건부적합': 'bg-yellow-100 text-yellow-700',
  '보류': 'bg-gray-100 text-gray-600',
  '취소': 'bg-gray-100 text-gray-400',
}

const STATUS_LABEL: Record<string, string> = {
  draft: '작성중',
  submitted: '제출됨',
  completed: '완료',
}

export default async function GrantEvalListPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()
  const org = params.org
  const status = params.status

  const result = await listGrantAssessments({ year, referralOrg: org, status })
  const assessments = result.success ? result.assessments ?? [] : []

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">교부사업 적합성 평가</h1>
          <p className="text-sm text-gray-500 mt-1">총 {assessments.length}건</p>
        </div>
        <Link
          href="/grant-eval/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          새 평가 등록
        </Link>
      </div>

      {/* 필터 */}
      <form method="GET" className="flex gap-3 mb-6 flex-wrap">
        <select
          name="year"
          defaultValue={year}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <input
          name="org"
          defaultValue={org}
          placeholder="의뢰기관 검색"
          className="px-3 py-2 border rounded-md text-sm focus:outline-none w-48"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="">전체 상태</option>
          <option value="draft">작성중</option>
          <option value="submitted">제출됨</option>
          <option value="completed">완료</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">
          검색
        </button>
      </form>

      {/* 목록 */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">대상자</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">생년월일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">의뢰기관</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">평가일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">신청품목</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">결과</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assessments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {year}년 교부사업 평가 내역이 없습니다
                </td>
              </tr>
            ) : (
              assessments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/grant-eval/${a.id}`} className="font-medium text-blue-700 hover:underline">
                      {a.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.birth_date ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.referral_org ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.evaluation_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(a.item_categories ?? []).map((cat, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {cat}
                        </span>
                      ))}
                      {a.item_count === 0 && <span className="text-gray-400 text-xs">미입력</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.final_result ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${RESULT_COLOR[a.final_result] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.final_result}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">미결정</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{STATUS_LABEL[a.status] ?? a.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/eval/app/grant-eval/page.tsx
git commit -m "feat(eval): add grant-eval list page"
```

---

## Task 7: /grant-eval/new 페이지

**Files:**
- Create: `apps/eval/app/grant-eval/new/page.tsx`
- Create: `apps/eval/components/grant-eval/NewGrantAssessmentForm.tsx`

- [ ] **Step 1: NewGrantAssessmentForm.tsx 작성**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGrantAssessment } from '@/actions/grant-assessment-actions'
import { searchClients } from '@/actions/client-actions'

interface ClientSearchResult {
  id: string
  name: string
  birth_date: string | null
  disability_type: string | null
}

export function NewGrantAssessmentForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [referralOrg, setReferralOrg] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    if (!query.trim()) return
    const result = await searchClients(query)
    if (result.success) setSearchResults((result.clients ?? []) as ClientSearchResult[])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient) { setError('클라이언트를 선택해주세요'); return }

    startTransition(async () => {
      const result = await createGrantAssessment({
        client_id: selectedClient.id,
        assessment_year: year,
        referral_org: referralOrg || null,
      })
      if (result.success && result.id) {
        router.push(`/grant-eval/${result.id}?tab=basic`)
      } else {
        setError(result.error ?? '생성에 실패했습니다')
      }
    })
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* 클라이언트 검색 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          대상자 검색 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            placeholder="이름으로 검색"
            className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
          >
            검색
          </button>
        </div>
        {searchResults.length > 0 && !selectedClient && (
          <ul className="mt-2 border rounded-md divide-y bg-white shadow-sm">
            {searchResults.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { setSelectedClient(c); setSearchResults([]) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gray-400 ml-2">{c.birth_date} / {c.disability_type ?? '장애유형 없음'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedClient && (
          <div className="mt-2 flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm font-medium text-blue-800">
              {selectedClient.name} ({selectedClient.birth_date})
            </span>
            <button
              type="button"
              onClick={() => setSelectedClient(null)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              변경
            </button>
          </div>
        )}
      </div>

      {/* 평가연도 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">평가연도</label>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none w-32"
        >
          {years.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* 의뢰기관 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">의뢰기관</label>
        <input
          value={referralOrg}
          onChange={(e) => setReferralOrg(e.target.value)}
          placeholder="예: 국민건강보험공단 OO지사"
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !selectedClient}
        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? '생성 중...' : '평가 생성 및 입력 시작'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: new/page.tsx 작성**

```tsx
import { NewGrantAssessmentForm } from '@/eval/components/grant-eval/NewGrantAssessmentForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewGrantEvalPage() {
  return (
    <div className="p-8">
      <Link href="/grant-eval" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">새 교부사업 평가 등록</h1>
        <p className="text-sm text-gray-500 mt-1">대상자 검색 후 평가를 시작합니다</p>
      </div>
      <NewGrantAssessmentForm />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/eval/app/grant-eval/new/ apps/eval/components/grant-eval/NewGrantAssessmentForm.tsx
git commit -m "feat(eval): add grant-eval new assessment page"
```

---

## Task 8: /grant-eval/[id] 상세 페이지 — 5탭 구조 + basic/items 탭

**Files:**
- Create: `apps/eval/app/grant-eval/[id]/page.tsx`
- Create: `apps/eval/components/grant-eval/GrantAssessmentBasicForm.tsx`
- Create: `apps/eval/components/grant-eval/GrantItemsForm.tsx`

- [ ] **Step 1: [id]/page.tsx 작성**

```tsx
import { getGrantAssessmentById } from '@/actions/grant-assessment-actions'
import { getClientById } from '@/actions/client-actions'
import { getChecklistTemplates } from '@/actions/checklist-template-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { GrantAssessmentBasicForm } from '@/eval/components/grant-eval/GrantAssessmentBasicForm'
import { GrantItemsForm } from '@/eval/components/grant-eval/GrantItemsForm'
import { GrantSuitabilityForm } from '@/eval/components/grant-eval/GrantSuitabilityForm'
import { GrantOpinionForm } from '@/eval/components/grant-eval/GrantOpinionForm'
import { GrantResultForm } from '@/eval/components/grant-eval/GrantResultForm'

const TABS = [
  { key: 'basic', label: '기본정보' },
  { key: 'items', label: '신청품목' },
  { key: 'suitability', label: '적정성 평가' },
  { key: 'opinion', label: '종합의견' },
  { key: 'result', label: '평가결과' },
] as const

type TabKey = typeof TABS[number]['key']

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}
const STATUS_LABEL: Record<string, string> = { draft: '작성중', submitted: '제출됨', completed: '완료' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function GrantAssessmentDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const tab: TabKey = (TABS.find((t) => t.key === sp.tab)?.key ?? 'basic') as TabKey

  const result = await getGrantAssessmentById(id)
  if (!result.success || !result.assessment) notFound()

  const assessment = result.assessment
  const clientResult = await getClientById(assessment.client_id)
  const client = clientResult.success ? clientResult.client : null

  // For opinion tab: load checklist templates for each item category
  let checklistMap: Record<string, Awaited<ReturnType<typeof getChecklistTemplates>>['templates']> = {}
  if (tab === 'opinion') {
    await Promise.all(
      assessment.items.map(async (item) => {
        const r = await getChecklistTemplates(item.item_category)
        checklistMap[item.item_category] = r.templates ?? []
      })
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/grant-eval" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
        <Link
          href={`/print/grant-eval/${id}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border rounded-md hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" />
          인쇄
        </Link>
      </div>

      {/* 헤더 */}
      <div className="border rounded-lg p-5 mb-6 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {client?.name ?? '—'} · {assessment.assessment_year}년 교부사업 평가
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {client?.birth_date} · {client?.disability_type ?? '장애유형 없음'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[assessment.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[assessment.status] ?? assessment.status}
          </span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/grant-eval/${id}?tab=${t.key}`}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'basic' && (
        <GrantAssessmentBasicForm assessmentId={id} assessment={assessment} />
      )}
      {tab === 'items' && (
        <GrantItemsForm assessmentId={id} items={assessment.items} />
      )}
      {tab === 'suitability' && (
        <GrantSuitabilityForm assessmentId={id} items={assessment.items} />
      )}
      {tab === 'opinion' && (
        <GrantOpinionForm
          assessmentId={id}
          assessment={assessment}
          checklistMap={checklistMap}
        />
      )}
      {tab === 'result' && (
        <GrantResultForm assessmentId={id} assessment={assessment} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: GrantAssessmentBasicForm.tsx 작성**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { updateGrantAssessment, type GrantAssessmentDetail } from '@/actions/grant-assessment-actions'

interface Props {
  assessmentId: string
  assessment: GrantAssessmentDetail
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export function GrantAssessmentBasicForm({ assessmentId, assessment }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    evaluation_date: assessment.evaluation_date ?? '',
    assessment_month: assessment.assessment_month ?? '',
    referral_org: assessment.referral_org ?? '',
    evaluator_name: assessment.evaluator_name ?? '',
    prior_grant_records: JSON.stringify(assessment.prior_grant_records ?? [], null, 2),
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      let prior: Array<{ year: number; agency: string; item: string }> | null = null
      try { prior = JSON.parse(form.prior_grant_records) } catch { prior = null }

      const result = await updateGrantAssessment(assessmentId, {
        evaluation_date: form.evaluation_date || null,
        assessment_month: form.assessment_month ? parseInt(String(form.assessment_month)) : null,
        referral_org: form.referral_org || null,
        evaluator_name: form.evaluator_name || null,
        prior_grant_records: prior,
      })

      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장에 실패했습니다')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">평가일</label>
          <input
            type="date"
            value={form.evaluation_date}
            onChange={(e) => set('evaluation_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">평가월</label>
          <select
            value={form.assessment_month}
            onChange={(e) => set('assessment_month', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
          >
            <option value="">선택</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">의뢰기관</label>
        <input
          value={form.referral_org}
          onChange={(e) => set('referral_org', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">평가자</label>
        <input
          value={form.evaluator_name}
          onChange={(e) => set('evaluator_name', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">기교부 실적 (JSON)</label>
        <textarea
          rows={4}
          value={form.prior_grant_records}
          onChange={(e) => set('prior_grant_records', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='[{"year": 2024, "agency": "공단", "item": "전동휠체어"}]'
        />
        <p className="text-xs text-gray-400 mt-1">year, agency, item 키를 가진 배열 형식</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">저장되었습니다</p>}

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: GrantItemsForm.tsx 작성**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertGrantItem, deleteGrantItem, type GrantItemInput } from '@/actions/grant-item-actions'
import type { GrantAssessmentItem } from '@/actions/grant-assessment-actions'

const ITEM_CATEGORIES = [
  '전동휠체어', '수동휠체어', '전동침대', '목욕의자', '보행차',
  '이동변기', '소변수집장치', '욕창방지방석', '욕창방지매트리스',
  '보청기', '시각보조기기', '의사소통보조기기',
]
const USE_LOCATIONS = ['가정', '직장', '학교', '기타'] as const

interface ItemFormState {
  item_category: string
  item_name: string
  use_plan: string
  use_location: string
  use_location_detail: string
  usage_experience: boolean | null
  self_usage_possible: boolean | null
  support_person: string
}

function toFormState(item?: GrantAssessmentItem): ItemFormState {
  return {
    item_category: item?.item_category ?? '',
    item_name: item?.item_name ?? '',
    use_plan: item?.use_plan ?? '',
    use_location: item?.use_location ?? '',
    use_location_detail: item?.use_location_detail ?? '',
    usage_experience: item?.usage_experience ?? null,
    self_usage_possible: item?.self_usage_possible ?? null,
    support_person: item?.support_person ?? '',
  }
}

interface ItemCardProps {
  assessmentId: string
  order: number
  initial?: GrantAssessmentItem
  onDelete: () => void
}

function ItemCard({ assessmentId, order, initial, onDelete }: ItemCardProps) {
  const [form, setForm] = useState<ItemFormState>(toFormState(initial))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof ItemFormState, value: string | boolean | null) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const input: GrantItemInput = {
        item_category: form.item_category,
        item_name: form.item_name || null,
        use_plan: form.use_plan || null,
        use_location: form.use_location || null,
        use_location_detail: form.use_location_detail || null,
        usage_experience: form.usage_experience,
        self_usage_possible: form.self_usage_possible,
        support_person: form.support_person || null,
      }
      const result = await upsertGrantItem(assessmentId, order, input)
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGrantItem(assessmentId, order)
      if (result.success) onDelete()
      else setError(result.error ?? '삭제 실패')
    })
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">품목 {order}</h3>
        <button type="button" onClick={handleDelete} disabled={isPending}
          className="text-xs text-red-500 hover:text-red-700">삭제</button>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">품목 분류 *</label>
            <select
              required
              value={form.item_category}
              onChange={(e) => set('item_category', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            >
              <option value="">선택</option>
              {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">품목명 (모델)</label>
            <input
              value={form.item_name}
              onChange={(e) => set('item_name', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">활용 계획</label>
          <textarea
            rows={2}
            value={form.use_plan}
            onChange={(e) => set('use_plan', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 환경</label>
            <select
              value={form.use_location}
              onChange={(e) => set('use_location', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            >
              <option value="">선택</option>
              {USE_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 환경 상세</label>
            <input
              value={form.use_location_detail}
              onChange={(e) => set('use_location_detail', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">사용 경험</label>
            <div className="flex gap-3">
              {[true, false].map((v) => (
                <label key={String(v)} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" checked={form.usage_experience === v}
                    onChange={() => set('usage_experience', v)} />
                  {v ? '있음' : '없음'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">자가 사용 가능</label>
            <div className="flex gap-3">
              {[true, false].map((v) => (
                <label key={String(v)} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" checked={form.self_usage_possible === v}
                    onChange={() => set('self_usage_possible', v)} />
                  {v ? '가능' : '불가'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">보조인</label>
            <input
              value={form.support_person}
              onChange={(e) => set('support_person', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">저장됨</p>}
        <button type="submit" disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '품목 저장'}
        </button>
      </form>
    </div>
  )
}

interface Props {
  assessmentId: string
  items: GrantAssessmentItem[]
}

export function GrantItemsForm({ assessmentId, items }: Props) {
  const [localItems, setLocalItems] = useState(items)

  const usedOrders = new Set(localItems.map((i) => i.item_order))
  const nextOrder = ([1, 2, 3] as const).find((o) => !usedOrders.has(o))

  return (
    <div className="space-y-4">
      {localItems.map((item) => (
        <ItemCard
          key={item.item_order}
          assessmentId={assessmentId}
          order={item.item_order}
          initial={item}
          onDelete={() => setLocalItems((prev) => prev.filter((i) => i.item_order !== item.item_order))}
        />
      ))}

      {nextOrder && (
        <button
          type="button"
          onClick={() => setLocalItems((prev) => [...prev, { item_order: nextOrder, item_category: '' } as GrantAssessmentItem])}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
        >
          + 품목 추가 (최대 3개)
        </button>
      )}

      {localItems.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">품목을 추가해주세요</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/eval/app/grant-eval/[id]/ apps/eval/components/grant-eval/
git commit -m "feat(eval): add grant-eval detail page with basic and items tabs"
```

---

## Task 9: suitability · opinion · result 탭 폼

**Files:**
- Create: `apps/eval/components/grant-eval/GrantSuitabilityForm.tsx`
- Create: `apps/eval/components/grant-eval/GrantOpinionForm.tsx`
- Create: `apps/eval/components/grant-eval/GrantResultForm.tsx`

- [ ] **Step 1: GrantSuitabilityForm.tsx 작성**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertGrantItem } from '@/actions/grant-item-actions'
import { ScoreSelector } from './ScoreSelector'
import type { GrantAssessmentItem } from '@/actions/grant-assessment-actions'

interface ScoreState {
  score_env: number | null
  score_operation: number | null
  score_disability: number | null
  score_use_plan: number | null
  score_effectiveness: number | null
}

function toScoreState(item: GrantAssessmentItem): ScoreState {
  return {
    score_env: item.score_env,
    score_operation: item.score_operation,
    score_disability: item.score_disability,
    score_use_plan: item.score_use_plan,
    score_effectiveness: item.score_effectiveness,
  }
}

const SCORE_LABELS = [
  { key: 'score_env', label: '환경 적합성' },
  { key: 'score_operation', label: '조작 능력' },
  { key: 'score_disability', label: '장애 특성' },
  { key: 'score_use_plan', label: '활용 계획' },
  { key: 'score_effectiveness', label: '기대 효과' },
] as const

function ItemSuitabilityCard({ assessmentId, item }: { assessmentId: string; item: GrantAssessmentItem }) {
  const [scores, setScores] = useState<ScoreState>(toScoreState(item))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = Object.values(scores).reduce<number>((sum, v) => sum + (v ?? 0), 0)

  function handleSave() {
    startTransition(async () => {
      const result = await upsertGrantItem(assessmentId, item.item_order, scores)
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <h3 className="font-semibold text-gray-800 mb-4">
        품목 {item.item_order} — {item.item_category}
      </h3>
      <div className="space-y-3 mb-4">
        {SCORE_LABELS.map(({ key, label }) => (
          <ScoreSelector
            key={key}
            label={label}
            value={scores[key]}
            onChange={(v) => { setScores((prev) => ({ ...prev, [key]: v })); setSaved(false) }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          합계: <span className={total >= 40 ? 'text-green-700' : total >= 30 ? 'text-yellow-700' : 'text-red-700'}>{total}점 / 50점</span>
        </span>
        <button onClick={handleSave} disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '저장'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {saved && <p className="text-sm text-green-600 mt-2">저장됨</p>}
    </div>
  )
}

export function GrantSuitabilityForm({ assessmentId, items }: { assessmentId: string; items: GrantAssessmentItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 py-4">먼저 신청품목 탭에서 품목을 등록하세요</p>
  }
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ItemSuitabilityCard key={item.item_order} assessmentId={assessmentId} item={item} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: GrantOpinionForm.tsx 작성**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertGrantItem } from '@/actions/grant-item-actions'
import { updateGrantAssessment, type GrantAssessmentDetail, type GrantAssessmentItem } from '@/actions/grant-assessment-actions'
import { ChecklistSection, type ChecklistItem } from './ChecklistSection'

const ITEM_RESULTS = ['적합', '부적합', '조건부적합', '보류'] as const

function ItemOpinionCard({
  assessmentId, item, templates,
}: {
  assessmentId: string
  item: GrantAssessmentItem
  templates: ChecklistItem[]
}) {
  const [responses, setResponses] = useState<Record<string, boolean>>(item.checklist_responses ?? {})
  const [opinion, setOpinion] = useState(item.item_opinion ?? '')
  const [itemResult, setItemResult] = useState(item.item_result ?? '')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    startTransition(async () => {
      const result = await upsertGrantItem(assessmentId, item.item_order, {
        checklist_responses: responses,
        item_opinion: opinion || null,
        item_result: itemResult || null,
      })
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <h3 className="font-semibold text-gray-800 mb-4">
        품목 {item.item_order} — {item.item_category}
      </h3>

      {templates.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">기본 확인 사항</p>
          <ChecklistSection
            items={templates}
            responses={responses}
            onChange={(id, v) => { setResponses((prev) => ({ ...prev, [id]: v })); setSaved(false) }}
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">품목별 의견</label>
        <textarea
          rows={3}
          value={opinion}
          onChange={(e) => { setOpinion(e.target.value); setSaved(false) }}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">품목 결과</label>
        <select
          value={itemResult}
          onChange={(e) => { setItemResult(e.target.value); setSaved(false) }}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="">선택</option>
          {ITEM_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '저장'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">저장됨</p>}
      </div>
    </div>
  )
}

interface Props {
  assessmentId: string
  assessment: GrantAssessmentDetail
  checklistMap: Record<string, ChecklistItem[] | undefined>
}

export function GrantOpinionForm({ assessmentId, assessment, checklistMap }: Props) {
  const [generalOpinion, setGeneralOpinion] = useState(assessment.general_opinion ?? '')
  const [cancelReason, setCancelReason] = useState(assessment.change_cancel_reason ?? '')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSaveGeneral() {
    startTransition(async () => {
      const result = await updateGrantAssessment(assessmentId, {
        general_opinion: generalOpinion || null,
        change_cancel_reason: cancelReason || null,
      })
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  return (
    <div className="space-y-4">
      {assessment.items.map((item) => (
        <ItemOpinionCard
          key={item.item_order}
          assessmentId={assessmentId}
          item={item}
          templates={checklistMap[item.item_category] ?? []}
        />
      ))}

      <div className="border rounded-lg p-5 bg-white">
        <h3 className="font-semibold text-gray-800 mb-4">종합 의견</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">종합 의견</label>
          <textarea rows={4} value={generalOpinion}
            onChange={(e) => { setGeneralOpinion(e.target.value); setSaved(false) }}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">변경/취소 사유</label>
          <textarea rows={2} value={cancelReason}
            onChange={(e) => { setCancelReason(e.target.value); setSaved(false) }}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleSaveGeneral} disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isPending ? '저장 중...' : '저장'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">저장됨</p>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: GrantResultForm.tsx 작성**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertGrantItem } from '@/actions/grant-item-actions'
import { updateGrantAssessment, submitGrantAssessment, type GrantAssessmentDetail, type GrantAssessmentItem } from '@/actions/grant-assessment-actions'
import { useRouter } from 'next/navigation'

const FINAL_RESULTS = ['적합', '부적합', '조건부적합', '보류', '취소'] as const

function ItemResultCard({ assessmentId, item }: { assessmentId: string; item: GrantAssessmentItem }) {
  const [form, setForm] = useState({
    item_result: item.item_result ?? '',
    recommended_model: item.recommended_model ?? '',
    vendor_name: item.vendor_name ?? '',
    vendor_phone: item.vendor_phone ?? '',
    support_amount: item.support_amount ? String(item.support_amount) : '',
    has_self_pay: item.has_self_pay ?? false,
    final_item_name: item.final_item_name ?? '',
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertGrantItem(assessmentId, item.item_order, {
        item_result: form.item_result || null,
        recommended_model: form.recommended_model || null,
        vendor_name: form.vendor_name || null,
        vendor_phone: form.vendor_phone || null,
        support_amount: form.support_amount ? parseInt(form.support_amount) : null,
        has_self_pay: form.has_self_pay,
        final_item_name: form.final_item_name || null,
      })
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <h3 className="font-semibold text-gray-800 mb-4">품목 {item.item_order} — {item.item_category}</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">품목 결과</label>
          <select value={form.item_result} onChange={(e) => set('item_result', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none">
            <option value="">선택</option>
            {['적합', '부적합', '조건부적합', '보류'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">최종 품목명</label>
          <input value={form.final_item_name} onChange={(e) => set('final_item_name', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">추천 모델</label>
          <input value={form.recommended_model} onChange={(e) => set('recommended_model', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">지원 금액 (원)</label>
          <input type="number" value={form.support_amount} onChange={(e) => set('support_amount', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">공급업체</label>
          <input value={form.vendor_name} onChange={(e) => set('vendor_name', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">업체 연락처</label>
          <input value={form.vendor_phone} onChange={(e) => set('vendor_phone', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={form.has_self_pay}
          onChange={(e) => set('has_self_pay', e.target.checked)} />
        자부담 있음
      </label>
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '저장'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">저장됨</p>}
      </div>
    </div>
  )
}

export function GrantResultForm({ assessmentId, assessment }: { assessmentId: string; assessment: GrantAssessmentDetail }) {
  const router = useRouter()
  const [finalResult, setFinalResult] = useState(assessment.final_result ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSaveFinal() {
    startTransition(async () => {
      const result = await updateGrantAssessment(assessmentId, {
        final_result: finalResult || null,
        status: 'completed',
      })
      if (!result.success) setError(result.error ?? '저장 실패')
    })
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitGrantAssessment(assessmentId)
      if (result.success) router.refresh()
      else setError(result.error ?? '제출 실패')
    })
  }

  return (
    <div className="space-y-4">
      {assessment.items.map((item) => (
        <ItemResultCard key={item.item_order} assessmentId={assessmentId} item={item} />
      ))}

      <div className="border rounded-lg p-5 bg-white">
        <h3 className="font-semibold text-gray-800 mb-4">최종 결과</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">최종 결과</label>
          <select value={finalResult} onChange={(e) => setFinalResult(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none">
            <option value="">선택</option>
            {FINAL_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleSaveFinal} disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            완료 처리
          </button>
          {assessment.status === 'draft' && (
            <button onClick={handleSubmit} disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
              제출
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/eval/components/grant-eval/
git commit -m "feat(eval): add suitability, opinion, result tab form components"
```

---

## Task 10: /grant-eval/referrals + /grant-eval/statistics

**Files:**
- Create: `apps/eval/app/grant-eval/referrals/page.tsx`
- Create: `apps/eval/components/grant-eval/ReferralDocForm.tsx`
- Create: `apps/eval/app/grant-eval/statistics/page.tsx`

- [ ] **Step 1: ReferralDocForm.tsx (인라인 생성 폼)**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { createGrantReferralDoc } from '@/actions/grant-referral-actions'

export function ReferralDocForm({ onCreated }: { onCreated: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    doc_year: new Date().getFullYear(),
    doc_number: '',
    sending_org: '',
    doc_date: '',
    receive_date: '',
    referral_round: '',
    referral_count: '',
    note: '',
  })

  function set(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createGrantReferralDoc({
        doc_year: form.doc_year,
        doc_number: form.doc_number || null,
        sending_org: form.sending_org,
        doc_date: form.doc_date || null,
        receive_date: form.receive_date || null,
        referral_round: form.referral_round ? parseInt(form.referral_round) : null,
        referral_count: form.referral_count ? parseInt(form.referral_count) : 0,
      })
      if (result.success) { onCreated(); setForm((p) => ({ ...p, doc_number: '', sending_org: '', doc_date: '', receive_date: '', referral_round: '', referral_count: '' })) }
      else setError(result.error ?? '생성 실패')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-5 bg-white mb-6 space-y-4">
      <h3 className="font-semibold text-gray-800">새 접수공문 등록</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">연도</label>
          <input type="number" value={form.doc_year} onChange={(e) => set('doc_year', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">공문번호</label>
          <input value={form.doc_number} onChange={(e) => set('doc_number', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">발송기관 *</label>
          <input required value={form.sending_org} onChange={(e) => set('sending_org', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">공문일</label>
          <input type="date" value={form.doc_date} onChange={(e) => set('doc_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">접수일</label>
          <input type="date" value={form.receive_date} onChange={(e) => set('receive_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">의뢰 건수</label>
          <input type="number" value={form.referral_count} onChange={(e) => set('referral_count', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {isPending ? '등록 중...' : '등록'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: referrals/page.tsx 작성**

```tsx
import { listGrantReferralDocs } from '@/actions/grant-referral-actions'
import { ReferralDocForm } from '@/eval/components/grant-eval/ReferralDocForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function ReferralDocsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()

  const result = await listGrantReferralDocs(year)
  const docs = result.success ? result.docs ?? [] : []

  return (
    <div className="p-8">
      <Link href="/grant-eval" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        교부사업 평가 목록
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">접수공문 관리</h1>

      <ReferralDocForm onCreated={() => {}} />

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">공문번호</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">발송기관</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">접수일</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">의뢰 건수</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">평가 건수</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">취소</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">결과 발송일</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">접수공문이 없습니다</td></tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{doc.doc_number ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{doc.sending_org}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.receive_date ?? '—'}</td>
                  <td className="px-4 py-3 text-center">{doc.referral_count}</td>
                  <td className="px-4 py-3 text-center">{doc.assessment_count}</td>
                  <td className="px-4 py-3 text-center">{doc.cancel_count}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.result_send_date ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: statistics/page.tsx 작성**

```tsx
import { listGrantAssessments } from '@/actions/grant-assessment-actions'

interface Props {
  searchParams: Promise<{ year?: string }>
}

const RESULT_COLORS: Record<string, string> = {
  '적합': 'bg-green-100 text-green-700',
  '부적합': 'bg-red-100 text-red-700',
  '조건부적합': 'bg-yellow-100 text-yellow-700',
  '보류': 'bg-gray-100 text-gray-600',
  '취소': 'bg-gray-100 text-gray-400',
}

export default async function GrantEvalStatisticsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()

  const result = await listGrantAssessments({ year })
  const assessments = result.success ? result.assessments ?? [] : []

  const byResult = assessments.reduce<Record<string, number>>((acc, a) => {
    const key = a.final_result ?? '미결정'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const byOrg = assessments.reduce<Record<string, number>>((acc, a) => {
    const key = a.referral_org ?? '(미입력)'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const total = assessments.length
  const completed = assessments.filter((a) => a.status === 'completed').length

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">교부사업 통계 — {year}년</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500">전체 평가</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500">완료</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{completed}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500">적합</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{byResult['적합'] ?? 0}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500">부적합</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{byResult['부적합'] ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-gray-800 mb-4">결과별 현황</h2>
          <div className="space-y-2">
            {Object.entries(byResult).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${RESULT_COLORS[k] ?? 'bg-gray-100 text-gray-600'}`}>{k}</span>
                <span className="text-sm font-semibold">{v}건</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-gray-800 mb-4">의뢰기관별 현황</h2>
          <div className="space-y-2">
            {Object.entries(byOrg).sort((a, b) => b[1] - a[1]).map(([org, count]) => (
              <div key={org} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{org}</span>
                <span className="text-sm font-semibold">{count}건</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: EvalSidebar에 접수공문·통계 링크 추가**

`apps/eval/components/layout/EvalSidebar.tsx`에서 `NAV_ITEMS`에 아래 두 항목 추가:

```typescript
{ href: '/grant-eval/referrals', label: '접수공문 관리', icon: FileText },
{ href: '/grant-eval/statistics', label: '교부사업 통계', icon: BarChart2 },
```

`import`에 `FileText, BarChart2` 추가.

- [ ] **Step 5: Commit**

```bash
git add apps/eval/app/grant-eval/referrals/ apps/eval/app/grant-eval/statistics/ apps/eval/components/grant-eval/ReferralDocForm.tsx apps/eval/components/layout/EvalSidebar.tsx
git commit -m "feat(eval): add referrals page, statistics page"
```

---

## Task 11: /print/grant-eval/[id] 인쇄 페이지

**Files:**
- Create: `apps/eval/app/print/grant-eval/[id]/page.tsx`

- [ ] **Step 1: 인쇄 페이지 작성**

```tsx
import { getGrantAssessmentById } from '@/actions/grant-assessment-actions'
import { getClientById } from '@/actions/client-actions'
import { getChecklistTemplates, type ChecklistTemplate } from '@/actions/checklist-template-actions'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

const SCORE_LABELS = ['환경 적합성', '조작 능력', '장애 특성', '활용 계획', '기대 효과']

export default async function PrintGrantEvalPage({ params }: Props) {
  const { id } = await params

  const result = await getGrantAssessmentById(id)
  if (!result.success || !result.assessment) notFound()

  const assessment = result.assessment
  const clientResult = await getClientById(assessment.client_id)
  const client = clientResult.success ? clientResult.client : null

  const checklistMap: Record<string, ChecklistTemplate[]> = {}
  await Promise.all(
    assessment.items.map(async (item) => {
      const r = await getChecklistTemplates(item.item_category)
      checklistMap[item.item_category] = r.templates ?? []
    })
  )

  return (
    <div className="max-w-3xl mx-auto p-10 text-sm print:p-4">
      <h1 className="text-xl font-bold text-center mb-2">보조기기 교부사업 적합성 평가 기록지</h1>
      <p className="text-center text-gray-500 mb-8">{assessment.assessment_year}년</p>

      {/* 대상자 정보 */}
      <section className="mb-6">
        <h2 className="font-bold border-b pb-1 mb-3">대상자 정보</h2>
        <div className="grid grid-cols-3 gap-2">
          <div><span className="text-gray-500">성명:</span> {client?.name ?? '—'}</div>
          <div><span className="text-gray-500">생년월일:</span> {client?.birth_date ?? '—'}</div>
          <div><span className="text-gray-500">장애유형:</span> {client?.disability_type ?? '—'}</div>
          <div><span className="text-gray-500">의뢰기관:</span> {assessment.referral_org ?? '—'}</div>
          <div><span className="text-gray-500">평가일:</span> {assessment.evaluation_date ?? '—'}</div>
          <div><span className="text-gray-500">평가자:</span> {assessment.evaluator_name ?? '—'}</div>
        </div>
      </section>

      {/* 품목별 */}
      {assessment.items.map((item) => {
        const templates = checklistMap[item.item_category] ?? []
        const scores = [item.score_env, item.score_operation, item.score_disability, item.score_use_plan, item.score_effectiveness]

        return (
          <section key={item.item_order} className="mb-8 border rounded p-4">
            <h2 className="font-bold mb-3">품목 {item.item_order} — {item.item_category}</h2>

            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div><span className="text-gray-500">품목명:</span> {item.item_name ?? '—'}</div>
              <div><span className="text-gray-500">사용 환경:</span> {item.use_location ?? '—'} {item.use_location_detail}</div>
              <div><span className="text-gray-500">사용 경험:</span> {item.usage_experience === null ? '—' : item.usage_experience ? '있음' : '없음'}</div>
              <div><span className="text-gray-500">자가 사용:</span> {item.self_usage_possible === null ? '—' : item.self_usage_possible ? '가능' : '불가'}</div>
            </div>

            <div className="mb-3">
              <p className="font-medium text-xs mb-1">활용 계획</p>
              <p className="text-gray-700 text-xs">{item.use_plan ?? '—'}</p>
            </div>

            {/* 점수 */}
            <div className="mb-3">
              <p className="font-medium text-xs mb-2">적정성 평가</p>
              <div className="grid grid-cols-5 gap-1 text-xs text-center">
                {SCORE_LABELS.map((label, i) => (
                  <div key={i} className="border rounded p-1">
                    <p className="text-gray-500">{label}</p>
                    <p className="font-bold">{scores[i] ?? '—'}</p>
                  </div>
                ))}
              </div>
              <p className="text-right text-xs font-bold mt-1">합계: {item.total_score ?? 0}점</p>
            </div>

            {/* 체크리스트 */}
            {templates.length > 0 && (
              <div className="mb-3">
                <p className="font-medium text-xs mb-1">기본 확인 사항</p>
                <div className="space-y-1">
                  {templates.map((t) => (
                    <div key={t.question_id} className="flex items-start gap-2 text-xs">
                      <span>{item.checklist_responses?.[t.question_id] ? '☑' : '☐'}</span>
                      <span>{t.question_text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-2">
              <p className="font-medium text-xs mb-1">품목 의견</p>
              <p className="text-gray-700 text-xs">{item.item_opinion ?? '—'}</p>
            </div>

            <div className="flex gap-4 text-xs">
              <div><span className="text-gray-500">품목 결과:</span> <strong>{item.item_result ?? '—'}</strong></div>
              <div><span className="text-gray-500">추천 모델:</span> {item.recommended_model ?? '—'}</div>
              <div><span className="text-gray-500">지원금액:</span> {item.support_amount ? `${item.support_amount.toLocaleString()}원` : '—'}</div>
            </div>
          </section>
        )
      })}

      {/* 종합 의견 */}
      <section className="mb-6">
        <h2 className="font-bold border-b pb-1 mb-3">종합 의견</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{assessment.general_opinion ?? '—'}</p>
      </section>

      <section>
        <h2 className="font-bold border-b pb-1 mb-2">최종 결과</h2>
        <p className="text-lg font-bold">{assessment.final_result ?? '미결정'}</p>
      </section>

      <div className="mt-10 text-center text-xs text-gray-400 print:mt-6">
        인쇄일: {new Date().toLocaleDateString('ko-KR')}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/eval/app/print/grant-eval/
git commit -m "feat(eval): add grant-eval print page"
```

---

## Task 12: 빌드 확인 + TODO 업데이트

- [ ] **Step 1: 타입 체크**

```bash
pnpm --filter eval tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 2: 테스트 전체 실행**

```bash
pnpm test 2>&1 | tail -20
```

- [ ] **Step 3: TODO.md Phase F 항목 ✅ 처리**

`docs/TODO.md`에서 Phase F 모든 항목을 `⬜` → `✅`로 변경.

- [ ] **Step 4: Final commit**

```bash
git add docs/TODO.md
git commit -m "docs: mark Phase F grant-eval as complete"
git push
```
