# 전자결재 위임 결재 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MANAGER가 ADMIN에게 결재권을 위임(상시·임시)하면 수임자가 대신 결재하고 "대리 결재" 배지를 남긴다.

**Architecture:** `approval_delegations` 테이블에 위임 기록을 저장하고, `approval_steps.is_delegated` 컬럼으로 대리 결재 여부를 표시한다. 순수 함수 `isActiveDelegation`을 별도 파일로 분리해 Vitest로 테스트하고, 기존 서버 액션(`getPendingApprovals`, `approveStep`)을 수정해 위임을 반영한다. 위임 관리 UI는 `/settings/delegation` 신규 페이지로 추가한다.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (service_role), Clerk (clerkClient), Vitest, Tailwind CSS

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `migrations/085_create_approval_delegations.sql` | 신규 생성 |
| `packages/types/src/approval.types.ts` | 타입 3개 추가/수정 |
| `apps/approval/lib/delegation-utils.ts` | 신규 생성 (pure helper) |
| `tests/approval/delegation-utils.test.ts` | 신규 생성 (Vitest) |
| `apps/approval/actions/approval-actions.ts` | 함수 4개 추가, 2개 수정 |
| `apps/approval/app/settings/delegation/page.tsx` | 신규 생성 |
| `apps/approval/components/AppSidebar.tsx` | 메뉴 1개 추가 |
| `apps/approval/app/[id]/ApprovePanel.tsx` | `isDelegated` prop 추가 |
| `apps/approval/app/[id]/page.tsx` | 배지 + isDelegated 로직 추가 |
| `apps/approval/app/page.tsx` | `getPendingApprovals` 호출에 userId 추가 |

---

## Task 1: DB 마이그레이션

**Files:**
- Create: `migrations/085_create_approval_delegations.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- migrations/085_create_approval_delegations.sql

CREATE TABLE approval_delegations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_clerk_id  text NOT NULL,
  delegatee_clerk_id  text NOT NULL,
  start_date          date,
  end_date            date,
  is_active           boolean NOT NULL DEFAULT true,
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_delegation CHECK (delegator_clerk_id != delegatee_clerk_id)
);

CREATE INDEX approval_delegations_delegator_idx ON approval_delegations (delegator_clerk_id);
CREATE INDEX approval_delegations_delegatee_idx ON approval_delegations (delegatee_clerk_id);

ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_bypass" ON approval_delegations
  TO service_role USING (true) WITH CHECK (true);

ALTER TABLE approval_steps
  ADD COLUMN is_delegated boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Supabase 대시보드 또는 CLI로 적용**

```bash
# CLI 사용 시
supabase db push
```

확인: `approval_delegations` 테이블 생성 + `approval_steps`에 `is_delegated` 컬럼 추가.

- [ ] **Step 3: 타입 재생성**

```bash
pnpm gen:types
```

- [ ] **Step 4: 커밋**

```bash
git add migrations/085_create_approval_delegations.sql
git commit -m "feat(approval): add approval_delegations table and is_delegated column"
```

---

## Task 2: 타입 추가

**Files:**
- Modify: `packages/types/src/approval.types.ts`

- [ ] **Step 1: `ApprovalStep` 인터페이스에 `is_delegated` 추가**

기존:
```ts
export interface ApprovalStep {
  id: string
  document_id: string
  step: 1 | 2
  approver_role: ApprovalStepRole
  acted_by: string | null
  status: ApprovalStepStatus
  signature_url: string | null
  comment: string | null
  acted_at: string | null
}
```

수정 후 (마지막 줄 앞에 추가):
```ts
export interface ApprovalStep {
  id: string
  document_id: string
  step: 1 | 2
  approver_role: ApprovalStepRole
  acted_by: string | null
  status: ApprovalStepStatus
  signature_url: string | null
  comment: string | null
  acted_at: string | null
  is_delegated: boolean
}
```

- [ ] **Step 2: 파일 하단에 위임 관련 타입 추가**

`packages/types/src/approval.types.ts` 파일 맨 끝에 추가:

```ts
// ── Delegation ────────────────────────────────────────────

export interface ApprovalDelegation {
  id: string
  delegator_clerk_id: string
  delegatee_clerk_id: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  note: string | null
  created_at: string
}

export interface DelegationWithNames extends ApprovalDelegation {
  delegator_name: string
  delegatee_name: string
}
```

- [ ] **Step 3: TypeScript 에러 없는지 확인**

```bash
pnpm --filter @co-at/types tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add packages/types/src/approval.types.ts
git commit -m "feat(types): add ApprovalDelegation types and is_delegated to ApprovalStep"
```

---

## Task 3: 순수 헬퍼 + 테스트

**Files:**
- Create: `apps/approval/lib/delegation-utils.ts`
- Create: `tests/approval/delegation-utils.test.ts`

- [ ] **Step 1: 테스트 파일 먼저 작성 (failing)**

`tests/approval/delegation-utils.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isActiveDelegation } from '../../apps/approval/lib/delegation-utils'

const TODAY = '2026-06-11'

describe('isActiveDelegation', () => {
  it('returns true for always-active delegation (no dates)', () => {
    expect(isActiveDelegation({ is_active: true, start_date: null, end_date: null }, TODAY)).toBe(true)
  })

  it('returns false when is_active is false', () => {
    expect(isActiveDelegation({ is_active: false, start_date: null, end_date: null }, TODAY)).toBe(false)
  })

  it('returns false when start_date is in the future', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-12', end_date: null }, TODAY)).toBe(false)
  })

  it('returns true when start_date is today', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-11', end_date: null }, TODAY)).toBe(true)
  })

  it('returns true when start_date is in the past', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-01', end_date: null }, TODAY)).toBe(true)
  })

  it('returns false when end_date has passed', () => {
    expect(isActiveDelegation({ is_active: true, start_date: null, end_date: '2026-06-10' }, TODAY)).toBe(false)
  })

  it('returns true when end_date is today', () => {
    expect(isActiveDelegation({ is_active: true, start_date: null, end_date: '2026-06-11' }, TODAY)).toBe(true)
  })

  it('returns true when within date range', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-01', end_date: '2026-06-30' }, TODAY)).toBe(true)
  })

  it('returns false when before date range', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-15', end_date: '2026-06-30' }, TODAY)).toBe(false)
  })

  it('returns false when after date range', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-01', end_date: '2026-06-05' }, TODAY)).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm test -- tests/approval/delegation-utils.test.ts
```

Expected: FAIL — `isActiveDelegation` not found.

- [ ] **Step 3: 구현**

`apps/approval/lib/delegation-utils.ts`:
```ts
interface DelegationDateRange {
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

export function isActiveDelegation(delegation: DelegationDateRange, today: string): boolean {
  if (!delegation.is_active) return false
  if (delegation.start_date !== null && delegation.start_date > today) return false
  if (delegation.end_date !== null && delegation.end_date < today) return false
  return true
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test -- tests/approval/delegation-utils.test.ts
```

Expected: PASS (10/10).

- [ ] **Step 5: 커밋**

```bash
git add apps/approval/lib/delegation-utils.ts tests/approval/delegation-utils.test.ts
git commit -m "feat(approval): add isActiveDelegation pure helper with tests"
```

---

## Task 4: 위임 관련 신규 서버 액션

**Files:**
- Modify: `apps/approval/actions/approval-actions.ts`

이 Task에서는 기존 파일에 4개 함수를 추가한다. 기존 함수는 수정하지 않는다.

- [ ] **Step 1: import에 `isActiveDelegation` 추가**

파일 상단 import 블록에 추가:
```ts
import { isActiveDelegation } from '@/lib/delegation-utils'
import type { ApprovalDelegation, DelegationWithNames } from '@co-at/types'
```

기존 import는 그대로 유지.

- [ ] **Step 2: `getActiveDelegatorsForUser` 함수 추가**

`// ── Queries ───` 섹션 바로 위에 추가:

```ts
// ── Delegation ────────────────────────────────────────────

export async function getActiveDelegatorsForUser(
  delegateeClerkId: string
): Promise<string[]> {
  const supabase = createSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('approval_delegations')
    .select('delegator_clerk_id, start_date, end_date, is_active')
    .eq('delegatee_clerk_id', delegateeClerkId)
    .eq('is_active', true)
  if (error || !data) return []
  return data
    .filter(d => isActiveDelegation(d, today))
    .map(d => d.delegator_clerk_id)
}

export async function createDelegation(input: {
  delegatorClerkId: string
  delegateeClerkId: string
  startDate?: string | null
  endDate?: string | null
  note?: string | null
}): Promise<{ success: boolean; error?: string }> {
  if (input.delegatorClerkId === input.delegateeClerkId) {
    return { success: false, error: '자기 자신에게 위임할 수 없습니다.' }
  }
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('approval_delegations')
    .insert({
      delegator_clerk_id: input.delegatorClerkId,
      delegatee_clerk_id: input.delegateeClerkId,
      start_date:         input.startDate ?? null,
      end_date:           input.endDate ?? null,
      note:               input.note ?? null,
    })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deactivateDelegation(
  id: string,
  clerkUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseAdmin()
  const { data: existing } = await supabase
    .from('approval_delegations')
    .select('delegator_clerk_id')
    .eq('id', id)
    .single()
  if (!existing || existing.delegator_clerk_id !== clerkUserId) {
    return { success: false, error: '권한이 없습니다.' }
  }
  const { error } = await supabase
    .from('approval_delegations')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getMyDelegations(
  clerkUserId: string
): Promise<{ given: DelegationWithNames[]; received: DelegationWithNames[] }> {
  const supabase = createSupabaseAdmin()
  const clerk = await clerkClient()

  const [givenRes, receivedRes] = await Promise.all([
    supabase
      .from('approval_delegations')
      .select('*')
      .eq('delegator_clerk_id', clerkUserId)
      .order('created_at', { ascending: false }),
    supabase
      .from('approval_delegations')
      .select('*')
      .eq('delegatee_clerk_id', clerkUserId)
      .order('created_at', { ascending: false }),
  ])

  const allRows = [
    ...(givenRes.data ?? []),
    ...(receivedRes.data ?? []),
  ] as ApprovalDelegation[]

  const uniqueIds = [...new Set(allRows.flatMap(r => [r.delegator_clerk_id, r.delegatee_clerk_id]))]
  const nameMap: Record<string, string> = {}
  await Promise.all(
    uniqueIds.map(async id => {
      try {
        const u = await clerk.users.getUser(id)
        nameMap[id] = [u.firstName, u.lastName].filter(Boolean).join(' ') || id
      } catch {
        nameMap[id] = id
      }
    })
  )

  const enrich = (rows: ApprovalDelegation[]): DelegationWithNames[] =>
    rows.map(r => ({
      ...r,
      delegator_name: nameMap[r.delegator_clerk_id] ?? r.delegator_clerk_id,
      delegatee_name: nameMap[r.delegatee_clerk_id] ?? r.delegatee_clerk_id,
    }))

  return {
    given:    enrich(givenRes.data    as ApprovalDelegation[] ?? []),
    received: enrich(receivedRes.data as ApprovalDelegation[] ?? []),
  }
}
```

- [ ] **Step 3: TypeScript 에러 확인**

```bash
pnpm --filter @co-at/approval tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add apps/approval/actions/approval-actions.ts
git commit -m "feat(approval): add delegation CRUD actions"
```

---

## Task 5: 기존 액션 수정 (getPendingApprovals, approveStep)

**Files:**
- Modify: `apps/approval/actions/approval-actions.ts`
- Modify: `apps/approval/app/page.tsx` (dashboard — `getPendingApprovals` 호출에 userId 추가)

- [ ] **Step 1: `getPendingApprovals` 수정**

기존:
```ts
export async function getPendingApprovals(role: ApprovalStepRole): Promise<ApprovalDocumentWithSteps[]> {
  const supabase = createSupabaseAdmin()
  const stepNum = role === 'manager' ? 1 : 2
  const { data, error } = await supabase
    .from('approval_documents')
    .select('*, approval_steps!inner(*)')
    .eq('status', 'pending')
    .eq('approval_steps.step', stepNum)
    .eq('approval_steps.status', 'pending')
    .order('created_at', { ascending: false })
  if (error) { console.error('[getPendingApprovals]', error); return [] }
  return (data ?? []) as ApprovalDocumentWithSteps[]
}
```

수정 후:
```ts
export async function getPendingApprovals(
  role: ApprovalStepRole,
  clerkUserId: string
): Promise<ApprovalDocumentWithSteps[]> {
  const supabase = createSupabaseAdmin()
  const stepNum = role === 'manager' ? 1 : 2

  const [ownRes, delegatorIds] = await Promise.all([
    supabase
      .from('approval_documents')
      .select('*, approval_steps!inner(*)')
      .eq('status', 'pending')
      .eq('approval_steps.step', stepNum)
      .eq('approval_steps.status', 'pending')
      .order('created_at', { ascending: false }),
    getActiveDelegatorsForUser(clerkUserId),
  ])

  if (ownRes.error) { console.error('[getPendingApprovals]', ownRes.error); return [] }
  const own = (ownRes.data ?? []) as ApprovalDocumentWithSteps[]

  if (delegatorIds.length === 0) return own

  // 위임자의 manager 단계 문서도 포함 (step 1 pending)
  const { data: delegatedData, error: delegatedError } = await supabase
    .from('approval_documents')
    .select('*, approval_steps!inner(*)')
    .eq('status', 'pending')
    .eq('approval_steps.step', 1)
    .eq('approval_steps.status', 'pending')
    .order('created_at', { ascending: false })
  if (delegatedError) { console.error('[getPendingApprovals delegated]', delegatedError) }

  const delegated = (delegatedData ?? []) as ApprovalDocumentWithSteps[]
  const ownIds = new Set(own.map(d => d.id))
  const merged = [...own, ...delegated.filter(d => !ownIds.has(d.id))]
  return merged
}
```

- [ ] **Step 2: `approveStep` 수정 — `isDelegated` 파라미터 추가**

기존 시그니처:
```ts
export async function approveStep(
  stepId: string,
  actorClerkUserId: string,
  signatureUrl: string | null
): Promise<boolean>
```

수정 후 시그니처 + UPDATE 부분:
```ts
export async function approveStep(
  stepId: string,
  actorClerkUserId: string,
  signatureUrl: string | null,
  isDelegated?: boolean
): Promise<boolean> {
```

그리고 내부 UPDATE 쿼리:
```ts
  // Update step
  const { error } = await supabase
    .from('approval_steps')
    .update({
      status:        'approved',
      acted_by:      actorClerkUserId,
      signature_url: signatureUrl,
      acted_at:      new Date().toISOString(),
      is_delegated:  isDelegated ?? false,
    })
    .eq('id', stepId)
```

(나머지 로직은 그대로 유지)

- [ ] **Step 3: 대시보드 `app/page.tsx` 수정 — userId 전달**

기존:
```ts
const pendingApprovals = stepRole ? await getPendingApprovals(stepRole) : []
```

수정 후:
```ts
const pendingApprovals = stepRole ? await getPendingApprovals(stepRole, userId) : []
```

- [ ] **Step 4: TypeScript 에러 확인**

```bash
pnpm --filter @co-at/approval tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add apps/approval/actions/approval-actions.ts apps/approval/app/page.tsx
git commit -m "feat(approval): wire delegation into getPendingApprovals and approveStep"
```

---

## Task 6: 위임 관리 페이지 + 사이드바 메뉴

**Files:**
- Create: `apps/approval/app/settings/delegation/page.tsx`
- Modify: `apps/approval/components/AppSidebar.tsx`

- [ ] **Step 1: 위임 관리 페이지 생성**

`apps/approval/app/settings/delegation/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCurrentRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import {
  getMyDelegations,
  createDelegation,
  deactivateDelegation,
} from '@/actions/approval-actions'
import type { DelegationWithNames } from '@co-at/types'
import { revalidatePath } from 'next/cache'

// ── Server Actions ────────────────────────────────────────

async function createAction(formData: FormData) {
  'use server'
  const { userId } = await auth()
  if (!userId) return
  const delegateeClerkId = formData.get('delegateeClerkId') as string
  const startDate        = (formData.get('startDate') as string) || null
  const endDate          = (formData.get('endDate') as string) || null
  const note             = (formData.get('note') as string) || null
  if (!delegateeClerkId) return
  await createDelegation({ delegatorClerkId: userId, delegateeClerkId, startDate, endDate, note })
  revalidatePath('/settings/delegation')
}

async function deactivateAction(formData: FormData) {
  'use server'
  const { userId } = await auth()
  if (!userId) return
  const id = formData.get('id') as string
  if (!id) return
  await deactivateDelegation(id, userId)
  revalidatePath('/settings/delegation')
}

// ── Helpers ───────────────────────────────────────────────

function formatDateRange(d: DelegationWithNames): string {
  if (!d.start_date && !d.end_date) return '상시'
  if (!d.start_date) return `~ ${d.end_date}`
  if (!d.end_date)   return `${d.start_date} ~`
  return `${d.start_date} ~ ${d.end_date}`
}

// ── Page ──────────────────────────────────────────────────

export default async function DelegationPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getCurrentRole()
  const isManager = role === ROLES.MANAGER

  const { given, received } = await getMyDelegations(userId)

  // Fetch upper-role users for delegate selector (ADMIN only)
  let adminUsers: { id: string; name: string }[] = []
  if (isManager) {
    const clerk = await clerkClient()
    const res = await clerk.users.getUserList({ limit: 200 })
    adminUsers = res.data
      .filter(u => (u.publicMetadata as { role?: string }).role === ROLES.ADMIN)
      .map(u => ({
        id:   u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.id,
      }))
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold">위임 결재 관리</h1>

      {/* 내가 위임한 결재 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">내가 위임한 결재</h2>

        {isManager && adminUsers.length > 0 && (
          <form action={createAction} className="bg-white border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">새 위임 추가</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">수임자 *</label>
                <select
                  name="delegateeClerkId"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">선택하세요</option>
                  {adminUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">사유</label>
                <input
                  name="note"
                  type="text"
                  placeholder="예: 출장 6/15~20"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작일 (빈칸=즉시)</label>
                <input name="startDate" type="date" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료일 (빈칸=상시)</label>
                <input name="endDate" type="date" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              위임 추가
            </button>
          </form>
        )}

        {!isManager && (
          <p className="text-sm text-gray-400">MANAGER 역할만 위임을 생성할 수 있습니다.</p>
        )}

        {given.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['수임자', '기간', '사유', '상태', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {given.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.delegatee_name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateRange(d)}</td>
                    <td className="px-4 py-3 text-gray-500">{d.note ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {d.is_active ? '활성' : '해제됨'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.is_active && (
                        <form action={deactivateAction}>
                          <input type="hidden" name="id" value={d.id} />
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:text-red-700 hover:underline"
                          >
                            해제
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">위임한 결재가 없습니다.</p>
        )}
      </section>

      {/* 내가 위임받은 결재 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">내가 위임받은 결재</h2>
        {received.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['위임자', '기간', '사유', '상태'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {received.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.delegator_name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateRange(d)}</td>
                    <td className="px-4 py-3 text-gray-500">{d.note ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {d.is_active ? '활성' : '해제됨'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">위임받은 결재가 없습니다.</p>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: `AppSidebar.tsx`에 위임 결재 메뉴 추가**

기존:
```ts
import {
  LayoutDashboard,
  FilePlus,
  Archive,
  Stamp,
} from 'lucide-react'
```

수정 후:
```ts
import {
  LayoutDashboard,
  FilePlus,
  Archive,
  Stamp,
  UserCheck,
} from 'lucide-react'
```

기존 NAV_ITEMS:
```ts
const NAV_ITEMS = [
  { href: '/',                    label: '결재함',    icon: LayoutDashboard },
  { href: '/new',                 label: '기안하기',  icon: FilePlus        },
  { href: '/archive',             label: '보관함',    icon: Archive         },
  { href: '/settings/signature',  label: '서명 등록', icon: Stamp           },
]
```

수정 후:
```ts
const NAV_ITEMS = [
  { href: '/',                       label: '결재함',    icon: LayoutDashboard },
  { href: '/new',                    label: '기안하기',  icon: FilePlus        },
  { href: '/archive',                label: '보관함',    icon: Archive         },
  { href: '/settings/signature',     label: '서명 등록', icon: Stamp           },
  { href: '/settings/delegation',    label: '위임 결재', icon: UserCheck       },
]
```

- [ ] **Step 3: TypeScript 에러 확인**

```bash
pnpm --filter @co-at/approval tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add apps/approval/app/settings/delegation/page.tsx apps/approval/components/AppSidebar.tsx
git commit -m "feat(approval): add delegation settings page and sidebar menu"
```

---

## Task 7: ApprovePanel + 결재 상세 페이지 배지

**Files:**
- Modify: `apps/approval/app/[id]/ApprovePanel.tsx`
- Modify: `apps/approval/app/[id]/page.tsx`

- [ ] **Step 1: `ApprovePanel.tsx` 수정 — `isDelegated` prop 추가**

기존:
```ts
interface Props {
  step: ApprovalStep
}

export function ApprovePanel({ step }: Props) {
```

수정 후:
```ts
interface Props {
  step: ApprovalStep
  isDelegated: boolean
}

export function ApprovePanel({ step, isDelegated }: Props) {
```

`handleApprove` 함수 수정:
```ts
  async function handleApprove() {
    if (!user?.id) return
    setSubmitting(true)
    setError(null)
    const ok = await approveStep(step.id, user.id, signatureUrl, isDelegated)
    if (ok) {
      router.refresh()
    } else {
      setError('결재 처리 실패. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }
```

- [ ] **Step 2: `page.tsx` 수정 — isDelegated 판단 + 배지 + ApprovePanel prop 전달**

**import 추가** (기존 import 블록에):
```ts
import { getActiveDelegatorsForUser } from '@/actions/approval-actions'
```

**`StepRow` 컴포넌트 수정** — 대리 결재 배지 추가:

기존:
```ts
function StepRow({ step, label }: { step: ApprovalStep; label: string }) {
  const { label: statusLabel, className } = STEP_STATUS_STYLES[step.status] ?? { label: step.status, className: 'text-gray-500' }
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="w-20 shrink-0 text-sm font-medium text-gray-600">{label}</div>
      <div className="flex-1">
        <span className={`text-sm font-semibold ${className}`}>{statusLabel}</span>
        {step.acted_at && (
          <span className="text-xs text-gray-400 ml-2">{new Date(step.acted_at).toLocaleString('ko-KR')}</span>
        )}
```

수정 후:
```ts
function StepRow({ step, label }: { step: ApprovalStep; label: string }) {
  const { label: statusLabel, className } = STEP_STATUS_STYLES[step.status] ?? { label: step.status, className: 'text-gray-500' }
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="w-20 shrink-0 text-sm font-medium text-gray-600">{label}</div>
      <div className="flex-1">
        <span className={`text-sm font-semibold ${className}`}>{statusLabel}</span>
        {step.is_delegated && (
          <span className="ml-2 text-xs border border-amber-300 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
            대리 결재
          </span>
        )}
        {step.acted_at && (
          <span className="text-xs text-gray-400 ml-2">{new Date(step.acted_at).toLocaleString('ko-KR')}</span>
        )}
```

**페이지 로직 수정** — `actionableStep` 판단 부분과 `ApprovePanel` 렌더:

기존 (페이지 데이터 로드 섹션):
```ts
  const role = await getCurrentRole()
  const isManager = await requireRole(ROLES.MANAGER)
  const isAdmin   = await requireRole(ROLES.ADMIN)

  const step1 = doc.approval_steps.find(s => s.step === 1)
  const step2 = doc.approval_steps.find(s => s.step === 2)

  // Determine which pending step the current user can act on
  let actionableStep: ApprovalStep | null = null
  if (step1?.status === 'pending' && isManager) {
    actionableStep = step1
  } else if (step1?.status === 'approved' && step2?.status === 'pending' && isAdmin) {
    actionableStep = step2
  }
```

수정 후:
```ts
  const role = await getCurrentRole()
  const isManager = await requireRole(ROLES.MANAGER)
  const isAdmin   = await requireRole(ROLES.ADMIN)

  const step1 = doc.approval_steps.find(s => s.step === 1)
  const step2 = doc.approval_steps.find(s => s.step === 2)

  // Check if current user is an active delegatee
  const delegatorIds = await getActiveDelegatorsForUser(userId)
  const isDelegated = delegatorIds.length > 0

  // Determine which pending step the current user can act on
  let actionableStep: ApprovalStep | null = null
  if (step1?.status === 'pending' && (isManager || isDelegated)) {
    actionableStep = step1
  } else if (step1?.status === 'approved' && step2?.status === 'pending' && isAdmin) {
    actionableStep = step2
  }
```

기존 `ApprovePanel` 렌더:
```tsx
      {actionableStep && doc.status === 'pending' && (
        <ApprovePanel step={actionableStep} />
      )}
```

수정 후:
```tsx
      {actionableStep && doc.status === 'pending' && (
        <ApprovePanel step={actionableStep} isDelegated={isDelegated && actionableStep.step === 1} />
      )}
```

- [ ] **Step 3: TypeScript 에러 확인**

```bash
pnpm --filter @co-at/approval tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음.

- [ ] **Step 4: 전체 테스트**

```bash
pnpm test -- tests/approval/
```

Expected: 10/10 PASS.

- [ ] **Step 5: 커밋**

```bash
git add apps/approval/app/[id]/ApprovePanel.tsx apps/approval/app/[id]/page.tsx
git commit -m "feat(approval): add delegation badge and isDelegated prop to ApprovePanel"
```

- [ ] **Step 6: docs/TODO.md 업데이트**

`docs/TODO.md`에서:
```
| 위임 결재 | ⬜ |
```
→
```
| 위임 결재 | ✅ |
```

```bash
git add docs/TODO.md
git commit -m "docs(todo): mark approval delegation as complete"
```
