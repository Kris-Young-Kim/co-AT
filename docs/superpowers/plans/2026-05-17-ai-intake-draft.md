# AI 상담기록지 초안 생성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff types a short memo in IntakeForm → AI generates drafts for all 5 text fields (`consultation_content`, `main_activity_place`, `activity_posture`, `main_supporter`, `environment_limitations`) via Gemini 2.0 Flash.

**Architecture:** Add `generateIntakeDraft` server action to `actions/ai-actions.ts` following the existing `generateSoapNote` pattern (permission check → Supabase context fetch → Gemini JSON generation → parse). Modify `IntakeForm.tsx` to hold the 5 fields in controlled React state, add a memo textarea + AI button, and show skeleton loading while generating.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Gemini 2.0 Flash (`@google/generative-ai` from monorepo root), Supabase service role client, Tailwind CSS

---

## File Map

| File | Action |
|------|--------|
| `actions/ai-actions.ts` | Modify — add `IntakeDraftInput`, `IntakeDraft` interfaces and `generateIntakeDraft` function |
| `apps/eval/components/eval/IntakeForm.tsx` | Modify — 5 controlled fields + AI section (memo textarea, button, skeleton) |

No DB changes. No new packages. No new files.

---

### Task 1: Add `generateIntakeDraft` server action

**Files:**
- Modify: `actions/ai-actions.ts`

**Context:**
- The repo root is `D:\AILeader1\project\valuewith\co-AT`
- `actions/ai-actions.ts` is at monorepo root (NOT inside apps/eval)
- `@/` in this file maps to monorepo root (e.g., `@/lib/gemini/client`)
- Existing pattern: `generateSoapNote` → permission check → auth check → Gemini call → JSON parse → field validation
- `createSupabaseAdmin()` is the service role Supabase client, imported from `@/lib/supabase/admin`
- `clients` table columns: `id`, `name`, `birth_date`, `disability_type`
- `domain_assessments` table columns: `domain`, `evaluator_opinion`, `client_id`

- [ ] **Step 1: Read the current file**

```bash
cat actions/ai-actions.ts
```

Expected: file ends after `generateSoapNote` function (around line 144).

- [ ] **Step 2: Append new interfaces and function**

Add the following block at the **end** of `actions/ai-actions.ts` (after the closing brace of `generateSoapNote`):

```typescript
import { createSupabaseAdmin } from "@/lib/supabase/admin"
```

Wait — imports must be at the **top** of the file. Instead, add this import after the existing imports (after line 5):

```typescript
import { createSupabaseAdmin } from "@/lib/supabase/admin"
```

Then append these interfaces and function **at the end of the file**:

```typescript
export interface IntakeDraftInput {
  memo: string
  applicationId: string
  clientId: string
}

export interface IntakeDraft {
  consultation_content: string
  main_activity_place: string
  activity_posture: string
  main_supporter: string
  environment_limitations: string
}

const INTAKE_DRAFT_SYSTEM_PROMPT = `당신은 보조기기센터 전문가입니다. 아래 제공된 메모와 클라이언트 정보를 바탕으로 상담기록지 초안을 JSON 형식으로 생성해주세요.

다음 JSON 형식으로만 응답하세요. 다른 설명은 포함하지 마세요:
{
  "consultation_content": "상담 내용 요약 (3~5문장)",
  "main_activity_place": "주 활동 장소 (예: 자택, 직장)",
  "activity_posture": "주 활동 자세 (예: 앉기, 서기)",
  "main_supporter": "주 부양자 (예: 배우자, 부모)",
  "environment_limitations": "환경적 제한 사항 (예: 엘리베이터 없음)"
}`

export async function generateIntakeDraft(
  input: IntakeDraftInput
): Promise<{ success: boolean; draft?: IntakeDraft; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    if (!input.memo.trim()) return { success: false, error: "메모를 입력해주세요" }

    const supabase = createSupabaseAdmin()

    const [clientResult, assessmentResult] = await Promise.all([
      supabase
        .from('clients')
        .select('name, birth_date, disability_type')
        .eq('id', input.clientId)
        .single(),
      supabase
        .from('domain_assessments')
        .select('domain, evaluator_opinion')
        .eq('client_id', input.clientId),
    ])

    const client = clientResult.data
    const clientContext = client
      ? `이름: ${client.name}, 생년월일: ${client.birth_date ?? '미상'}, 장애유형: ${client.disability_type ?? '미상'}`
      : '클라이언트 정보 없음'

    const assessments = assessmentResult.data ?? []
    const assessmentContext =
      assessments.length > 0
        ? assessments
            .filter((a) => a.evaluator_opinion)
            .map((a) => `${a.domain}: ${a.evaluator_opinion}`)
            .join('\n')
        : '평가 정보 없음'

    const model = getGeminiModel("gemini-2.0-flash")
    const prompt = `${INTAKE_DRAFT_SYSTEM_PROMPT}

클라이언트 정보:
${clientContext}

영역별 평가 의견:
${assessmentContext}

직원 메모:
${input.memo}`

    const result = await model.generateContent(prompt)
    const generatedText = result.response.text()

    const cleanedText = generatedText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    const draft = JSON.parse(cleanedText) as IntakeDraft

    if (
      !draft.consultation_content ||
      !draft.main_activity_place ||
      !draft.activity_posture ||
      !draft.main_supporter ||
      !draft.environment_limitations
    ) {
      throw new Error("초안 필수 필드가 누락되었습니다")
    }

    return { success: true, draft }
  } catch (error) {
    console.error("[AI Actions] 초안 생성 오류:", error)
    if (error instanceof Error) {
      if (error.message.includes("GOOGLE_AI_API_KEY")) {
        return { success: false, error: "Google AI API 키가 설정되지 않았습니다" }
      }
      return { success: false, error: `AI 생성 중 오류가 발생했습니다: ${error.message}` }
    }
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from the monorepo root:
```bash
pnpm --filter eval exec tsc --noEmit
```

Expected: No errors. If you see "Cannot find module '@/lib/supabase/admin'", check the actual path with `ls lib/supabase/` and adjust the import accordingly.

- [ ] **Step 4: Commit**

```bash
git add actions/ai-actions.ts
git commit -m "feat(eval): add generateIntakeDraft AI server action"
```

---

### Task 2: Rewrite IntakeForm with controlled state and AI section

**Files:**
- Modify: `apps/eval/components/eval/IntakeForm.tsx`

**Context:**
- `@/` in eval app components maps to monorepo root → `@/actions/ai-actions` resolves to `actions/ai-actions.ts`
- `@/eval/` maps to `apps/eval/` — not needed here
- Current form uses uncontrolled FormData for 5 fields; `consult_date` stays uncontrolled (stays as `name="consult_date"`)
- `createIntakeRecord` is imported from `@/actions/intake-actions` (keep this import)
- The `generateIntakeDraft` function was added in Task 1

- [ ] **Step 1: Replace the entire file content**

Replace `apps/eval/components/eval/IntakeForm.tsx` with:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createIntakeRecord } from '@/actions/intake-actions'
import { generateIntakeDraft } from '@/actions/ai-actions'

interface IntakeFormProps {
  clientId: string
  applicationId: string
}

export function IntakeForm({ clientId, applicationId }: IntakeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [memo, setMemo] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [consultationContent, setConsultationContent] = useState('')
  const [mainActivityPlace, setMainActivityPlace] = useState('')
  const [activityPosture, setActivityPosture] = useState('')
  const [mainSupporter, setMainSupporter] = useState('')
  const [environmentLimitations, setEnvironmentLimitations] = useState('')

  async function handleAiGenerate() {
    setAiLoading(true)
    setAiError(null)
    const result = await generateIntakeDraft({ memo, applicationId, clientId })
    setAiLoading(false)
    if (!result.success || !result.draft) {
      setAiError(result.error ?? 'AI 초안 생성에 실패했습니다')
      return
    }
    const { draft } = result
    setConsultationContent(draft.consultation_content)
    setMainActivityPlace(draft.main_activity_place)
    setActivityPosture(draft.activity_posture)
    setMainSupporter(draft.main_supporter)
    setEnvironmentLimitations(draft.environment_limitations)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    const result = await createIntakeRecord({
      application_id: applicationId,
      client_id: clientId,
      consult_date: fd.get('consult_date') as string,
      consultation_content: consultationContent || undefined,
      main_activity_place: mainActivityPlace || undefined,
      activity_posture: activityPosture || undefined,
      main_supporter: mainSupporter || undefined,
      environment_limitations: environmentLimitations || undefined,
    })

    if (!result.success) {
      setError(result.error ?? '저장에 실패했습니다')
      setIsSubmitting(false)
      return
    }

    router.push(`/clients/${clientId}/applications/${applicationId}`)
  }

  const inputClass =
    'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const skeletonClass = 'w-full rounded-md bg-gray-200 animate-pulse'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">기본 정보</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상담일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="consult_date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="border rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </section>

      <section className="border rounded-lg p-6 bg-white space-y-3">
        <h3 className="font-semibold text-gray-900">AI 초안 생성</h3>
        <p className="text-xs text-gray-500">
          짧은 메모를 입력하면 AI가 아래 5개 필드의 초안을 자동으로 생성합니다.
        </p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="예) 40대 남성, 지체장애 3급, 전동휠체어 사용 중. 자택 생활, 혼자 외출 가능."
          className={inputClass}
        />
        {aiError && <p className="text-sm text-red-600">{aiError}</p>}
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiLoading || !memo.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          {aiLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              생성 중...
            </>
          ) : (
            'AI 초안 생성'
          )}
        </button>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">상담 내용</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상담 내용</label>
          {aiLoading ? (
            <div className={`${skeletonClass} h-24`} />
          ) : (
            <textarea
              value={consultationContent}
              onChange={(e) => setConsultationContent(e.target.value)}
              rows={5}
              placeholder="상담 내용을 입력하세요"
              className={inputClass}
            />
          )}
        </div>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">활동 및 환경 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 활동 장소</label>
            {aiLoading ? (
              <div className={`${skeletonClass} h-9`} />
            ) : (
              <input
                type="text"
                value={mainActivityPlace}
                onChange={(e) => setMainActivityPlace(e.target.value)}
                placeholder="예) 자택, 직장, 학교"
                className={inputClass}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 활동 자세</label>
            {aiLoading ? (
              <div className={`${skeletonClass} h-9`} />
            ) : (
              <input
                type="text"
                value={activityPosture}
                onChange={(e) => setActivityPosture(e.target.value)}
                placeholder="예) 앉기, 서기, 눕기"
                className={inputClass}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 부양자</label>
            {aiLoading ? (
              <div className={`${skeletonClass} h-9`} />
            ) : (
              <input
                type="text"
                value={mainSupporter}
                onChange={(e) => setMainSupporter(e.target.value)}
                placeholder="예) 배우자, 부모, 자녀"
                className={inputClass}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">환경적 제한 사항</label>
            {aiLoading ? (
              <div className={`${skeletonClass} h-9`} />
            ) : (
              <input
                type="text"
                value={environmentLimitations}
                onChange={(e) => setEnvironmentLimitations(e.target.value)}
                placeholder="예) 엘리베이터 없음, 문턱 있음"
                className={inputClass}
              />
            )}
          </div>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm --filter eval exec tsc --noEmit
```

Expected: No errors. Common issues:
- "generateIntakeDraft not exported" → Task 1 wasn't completed; check `actions/ai-actions.ts`
- "IntakeDraft not exported" → export the interface in `actions/ai-actions.ts`

- [ ] **Step 3: Commit**

```bash
git add apps/eval/components/eval/IntakeForm.tsx
git commit -m "feat(eval): AI-assisted intake form draft generation"
```

- [ ] **Step 4: Smoke test in browser**

Start the eval dev server:
```bash
pnpm --filter eval dev
```

Navigate to any pending client → application → "상담기록지 작성" page.

Verify:
1. AI 초안 생성 섹션이 기본 정보 아래에 표시됨
2. 메모 없을 때 "AI 초안 생성" 버튼이 비활성화(opacity-50)됨
3. 메모 입력 후 버튼 활성화됨
4. 버튼 클릭 시 스피너 + "생성 중..." 텍스트, 5개 필드에 skeleton 표시
5. AI 완료 후 5개 필드에 내용 채워짐
6. 채워진 내용 수동 수정 가능
7. 저장 버튼 클릭 시 정상 저장됨
