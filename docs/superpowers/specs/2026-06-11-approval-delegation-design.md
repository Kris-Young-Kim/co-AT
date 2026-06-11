# 전자결재 위임 결재 — 설계 스펙

**날짜**: 2026-06-11  
**범위**: approval 앱 — 위임 결재 생성·관리·적용  
**목표**: MANAGER가 상위 역할(ADMIN)에게 결재권을 위임하면, 수임자가 대신 결재하고 "대리 결재" 표시를 남김

---

## 배경

현재 결재 시스템은 MANAGER(1단계) → ADMIN(2단계) 고정 흐름으로 동작한다.
MANAGER가 출장·휴가 등으로 자리를 비울 때 결재가 막히는 문제를 해결하기 위해
위임 결재 기능을 추가한다.
위임은 임시(기간 지정)와 상시(기간 없음) 모두 지원하며, 수임자는 위임자보다
상위 역할(ADMIN)만 가능하다.

---

## 0. DB 마이그레이션 — `085_create_approval_delegations.sql`

```sql
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

ALTER TABLE approval_steps
  ADD COLUMN is_delegated boolean NOT NULL DEFAULT false;

ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_bypass" ON approval_delegations
  TO service_role USING (true) WITH CHECK (true);
```

**활성 위임 판단 조건:**
```sql
is_active = true
AND (start_date IS NULL OR start_date <= CURRENT_DATE)
AND (end_date   IS NULL OR end_date   >= CURRENT_DATE)
```

---

## 1. 타입 추가 — `packages/types/src/approval.types.ts`

```ts
export interface ApprovalDelegation {
  id: string
  delegator_clerk_id: string
  delegatee_clerk_id: string
  start_date: string | null   // 'YYYY-MM-DD'
  end_date:   string | null   // 'YYYY-MM-DD'
  is_active: boolean
  note: string | null
  created_at: string
}

export interface DelegationWithNames extends ApprovalDelegation {
  delegator_name: string
  delegatee_name: string
}
```

`ApprovalStep` 인터페이스에 필드 추가:
```ts
is_delegated: boolean
```

---

## 2. 서버 액션 — `apps/approval/actions/approval-actions.ts`

### 2-1. 신규 함수

#### `createDelegation`
```ts
export async function createDelegation(input: {
  delegatorClerkId: string
  delegateeClerkId: string
  startDate?: string | null
  endDate?: string | null
  note?: string | null
}): Promise<{ success: boolean; error?: string }>
```
- `delegatorClerkId === delegateeClerkId` 이면 즉시 에러 반환
- `approval_delegations` INSERT

#### `deactivateDelegation`
```ts
export async function deactivateDelegation(
  id: string,
  clerkUserId: string
): Promise<{ success: boolean; error?: string }>
```
- `delegator_clerk_id === clerkUserId` 검증 후 `is_active = false` UPDATE

#### `getMyDelegations`
```ts
export async function getMyDelegations(
  clerkUserId: string
): Promise<{ given: DelegationWithNames[]; received: DelegationWithNames[] }>
```
- `delegator_clerk_id = clerkUserId` → `given`
- `delegatee_clerk_id = clerkUserId` → `received`
- 이름은 Clerk `clerkClient().users.getUser(id)` 로 조회 (`firstName + lastName`)

#### `getActiveDelegatorsForUser`
```ts
export async function getActiveDelegatorsForUser(
  delegateeClerkId: string
): Promise<string[]>   // delegator clerk_user_id 목록
```
- 활성 위임 조건으로 `delegatee_clerk_id = delegateeClerkId` 조회
- `approveStep` 및 `getPendingApprovals` 내부에서 사용

### 2-2. 수정 함수

#### `getPendingApprovals(role, clerkUserId)`
```ts
export async function getPendingApprovals(
  role: ApprovalStepRole,
  clerkUserId: string
): Promise<ApprovalDocumentWithSteps[]>
```

변경 로직:
1. 기존: role 기준 대기 문서 조회
2. 추가: `getActiveDelegatorsForUser(clerkUserId)` 호출
3. 위임자가 있으면, 위임자의 역할(`manager`)에 해당하는 대기 문서도 포함

```ts
const delegatorIds = await getActiveDelegatorsForUser(clerkUserId)
// delegatorIds가 있으면 step.approver_role='manager' 문서도 결과에 합산
```

#### `approveStep(stepId, actorClerkUserId, signatureUrl, isDelegated?)`
```ts
export async function approveStep(
  stepId: string,
  actorClerkUserId: string,
  signatureUrl: string | null,
  isDelegated?: boolean
): Promise<boolean>
```

변경: `approval_steps` UPDATE 시 `is_delegated: isDelegated ?? false` 포함

---

## 3. 위임 관리 페이지 — `apps/approval/app/settings/delegation/page.tsx`

Server Component (인증 필요).

### 레이아웃

```
위임 결재 관리
  ┌─────────────────────────────────────────┐
  │ 내가 위임한 결재                          │
  │ [수임자 선택 ▼] [시작일] [종료일] [사유]  │
  │ [위임 추가]                              │
  │                                         │
  │ 수임자 | 기간 | 사유 | 상태 | 비활성화   │
  │ 홍길동 | 상시 | 출장 | 활성 | [해제]    │
  └─────────────────────────────────────────┘

  ┌─────────────────────────────────────────┐
  │ 내가 위임받은 결재 (읽기 전용)            │
  │ 위임자 | 기간 | 사유 | 상태             │
  │ 김철수 | ~6/20 | 휴가 | 활성           │
  └─────────────────────────────────────────┘
```

- 수임자 선택 목록: `getUsersByRole(ROLES.ADMIN)` — 현재 사용자보다 상위 역할만
- 시작일/종료일 미입력 시 상시 위임
- 위임 추가는 Server Action `createDelegation` 호출
- "해제" 버튼 → `deactivateDelegation` 호출

---

## 4. ApprovePanel 수정 — `apps/approval/app/[id]/ApprovePanel.tsx`

`page.tsx`에서 `getActiveDelegatorsForUser(currentUserId)` 호출 후 결과를 prop으로 전달:

```ts
interface ApprovePanelProps {
  step: ApprovalStep
  documentId: string
  isDelegated: boolean   // 추가
}
```

`approveStep` 호출 시 `isDelegated` 전달.

---

## 5. 결재 상세 페이지 수정 — `apps/approval/app/[id]/page.tsx`

`step.is_delegated === true` 인 경우 결재자 이름 옆에 배지 표시:

```tsx
{step.is_delegated && (
  <span className="text-xs border border-amber-300 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
    대리 결재
  </span>
)}
```

---

## 6. 사이드바 수정 — `apps/approval/components/AppSidebar.tsx`

"설정" 카테고리(기존 `/settings/signature`) 아래 "위임 결재" 메뉴 추가:
```
설정
  └─ 서명 관리      /settings/signature
  └─ 위임 결재      /settings/delegation
```

---

## 파일 변경 목록

| 파일 | 변경 유형 |
|------|-----------|
| `migrations/085_create_approval_delegations.sql` | 신규 생성 |
| `packages/types/src/approval.types.ts` | `ApprovalDelegation`, `DelegationWithNames` 타입 추가, `ApprovalStep.is_delegated` 추가 |
| `apps/approval/actions/approval-actions.ts` | 함수 3개 추가, 2개 수정 |
| `apps/approval/app/settings/delegation/page.tsx` | 신규 생성 |
| `apps/approval/components/AppSidebar.tsx` | 위임 결재 메뉴 추가 |
| `apps/approval/app/[id]/ApprovePanel.tsx` | `isDelegated` prop 추가 및 처리 |
| `apps/approval/app/[id]/page.tsx` | 대리 결재 배지 추가, `isDelegated` prop 전달 |
