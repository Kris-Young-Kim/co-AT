# AX-1 타 서비스 배지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교부사업 평가·클라이언트 목록 페이지 각 행에 해당 대상자의 타 활성 서비스 배지를 표시한다.

**Architecture:** 새 배치 액션 `getActiveServiceBadgesByClientIds`가 client_id 배열을 받아 4개 테이블에 `.in()` 쿼리를 병렬 실행하고 `Record<clientId, ActiveService[]>` 맵을 반환한다. 순수 presentational 컴포넌트 `ClientServiceBadges`가 이 맵에서 꺼낸 서비스 배열을 색상 배지로 렌더한다. 두 목록 페이지는 기존 데이터 조회 후 2단계로 배지 맵을 추가 조회해 컴포넌트에 전달한다.

**Tech Stack:** Next.js 16 Server Components, TypeScript, Tailwind CSS, Vitest, Supabase

---

## 파일 구조

| 파일 | 변경 유형 | 역할 |
|------|-----------|------|
| `actions/client-actions.ts` | 함수 추가 | 배치 배지 조회 액션 |
| `tests/actions/client-badges.test.ts` | 신규 생성 | 배치 액션 단위 테스트 |
| `apps/eval/components/eval/ClientServiceBadges.tsx` | 신규 생성 | 배지 렌더 컴포넌트 |
| `apps/eval/app/grant-eval/page.tsx` | 수정 | 배지 맵 조회 + 컬럼 추가 |
| `apps/eval/app/clients/page.tsx` | 수정 | 배지 맵 조회 추가 |
| `apps/eval/components/eval/ClientListTable.tsx` | 수정 | badgeMap prop + 컬럼 추가 |

---

## Task 1: 배치 액션 테스트 작성

**Files:**
- Create: `tests/actions/client-badges.test.ts`

- [ ] **Step 1: 테스트 파일 생성**

```ts
// tests/actions/client-badges.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveServiceBadgesByClientIds } from '@/actions/client-actions'

// setup.ts가 전역 mock을 제공하지만 vi.mocked 사용을 위해 import 필요
vi.mock('@/lib/supabase/admin')

// 테이블별 데이터를 반환하는 mock supabase 클라이언트 생성
const makeMockClient = (tableMap: Record<string, any[]>) => ({
  from: (table: string) => {
    const data = tableMap[table] ?? []
    const chain: any = {
      select: vi.fn(() => chain),
      in:     vi.fn(() => chain),
      not:    vi.fn(() => chain),
      then:   (resolve: any) => Promise.resolve({ data, error: null }).then(resolve),
    }
    return chain
  },
})

describe('getActiveServiceBadgesByClientIds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('빈 배열 전달 시 DB 조회 없이 빈 맵 반환', async () => {
    const result = await getActiveServiceBadgesByClientIds([])
    expect(result).toEqual({ success: true, data: {} })
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('대여 중 서비스를 올바른 client_id 키에 그룹핑', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [],
        rentals: [
          { id: 'r-1', client_id: 'c-1', status: 'rented', rental_start_date: '2026-01-01' },
        ],
        custom_makes: [],
        applications: [],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1'])

    expect(result.success).toBe(true)
    expect(result.data?.['c-1']).toHaveLength(1)
    expect(result.data?.['c-1'][0].service_type).toBe('rental')
    expect(result.data?.['c-1'][0].status_label).toBe('대여 중')
    expect(result.data?.['c-1'][0].status).toBe('rented')
  })

  it('연체 상태 라벨 올바르게 설정', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [],
        rentals: [
          { id: 'r-2', client_id: 'c-1', status: 'overdue', rental_start_date: '2026-01-01' },
        ],
        custom_makes: [],
        applications: [],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1'])
    expect(result.data?.['c-1'][0].status_label).toBe('연체')
  })

  it('여러 클라이언트 각자의 키로 분리 저장', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [
          { id: 'g-1', client_id: 'c-1', status: 'draft',     created_at: '2026-01-01', referral_org: null },
          { id: 'g-2', client_id: 'c-2', status: 'submitted', created_at: '2026-01-02', referral_org: '기관A' },
        ],
        rentals: [],
        custom_makes: [],
        applications: [],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1', 'c-2'])

    expect(result.data?.['c-1']).toHaveLength(1)
    expect(result.data?.['c-2']).toHaveLength(1)
    expect(result.data?.['c-2'][0].metadata?.referral_org).toBe('기관A')
  })

  it('중복 client_id는 Set으로 제거 후 단일 조회', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [
          { id: 'g-1', client_id: 'c-1', status: 'draft', created_at: '2026-01-01', referral_org: null },
        ],
        rentals: [],
        custom_makes: [],
        applications: [],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1', 'c-1', 'c-1'])
    expect(result.success).toBe(true)
    expect(result.data?.['c-1']).toHaveLength(1)
  })

  it('맞춤제작·서비스신청 서비스 타입 정상 처리', async () => {
    vi.mocked(createAdminClient).mockReturnValueOnce(
      makeMockClient({
        eval_grant_assessments: [],
        rentals: [],
        custom_makes: [
          { id: 'cm-1', client_id: 'c-1', progress_status: 'manufacturing', created_at: '2026-01-01' },
        ],
        applications: [
          { id: 'ap-1', client_id: 'c-1', category: 'consult', status: '진행중', created_at: '2026-01-02' },
        ],
      }) as any
    )

    const result = await getActiveServiceBadgesByClientIds(['c-1'])

    expect(result.data?.['c-1']).toHaveLength(2)
    const types = result.data?.['c-1'].map(s => s.service_type)
    expect(types).toContain('custom_make')
    expect(types).toContain('application')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test tests/actions/client-badges.test.ts
```

예상 출력: `getActiveServiceBadgesByClientIds is not a function` 또는 import 에러

---

## Task 2: 배치 액션 구현

**Files:**
- Modify: `actions/client-actions.ts` (파일 끝에 추가)

- [ ] **Step 1: `getActiveServiceBadgesByClientIds` 함수 추가**

`actions/client-actions.ts` 파일 맨 마지막 줄(현재 856번째 빈 줄) 뒤에 추가:

```ts
export async function getActiveServiceBadgesByClientIds(
  clientIds: string[]
): Promise<{ success: boolean; data?: Record<string, ActiveService[]>; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const uniqueIds = [...new Set(clientIds)]
    if (uniqueIds.length === 0) return { success: true, data: {} }

    const supabase = createAdminClient()

    const [grantResult, rentalResult, customResult, appResult] = await Promise.all([
      (supabase as any)
        .from('eval_grant_assessments')
        .select('id, client_id, status, created_at, referral_org')
        .in('client_id', uniqueIds)
        .in('status', ['draft', 'submitted']),
      (supabase as any)
        .from('rentals')
        .select('id, client_id, status, rental_start_date')
        .in('client_id', uniqueIds)
        .in('status', ['rented', 'overdue']),
      (supabase as any)
        .from('custom_makes')
        .select('id, client_id, progress_status, created_at')
        .in('client_id', uniqueIds)
        .not('progress_status', 'in', '("completed","cancelled")'),
      (supabase as any)
        .from('applications')
        .select('id, client_id, category, status, created_at')
        .in('client_id', uniqueIds)
        .in('status', ['접수', '배정', '진행중']),
    ])

    const data: Record<string, ActiveService[]> = {}

    const add = (clientId: string, service: ActiveService) => {
      if (!data[clientId]) data[clientId] = []
      data[clientId].push(service)
    }

    const GRANT_STATUS: Record<string, string> = { draft: '작성 중', submitted: '제출 완료' }
    ;(grantResult.data ?? []).forEach((r: any) => {
      add(r.client_id, {
        id: r.id,
        service_type: 'grant_eval',
        label: '교부사업 적합성 평가',
        status: r.status,
        status_label: GRANT_STATUS[r.status] ?? r.status,
        started_at: r.created_at,
        detail_url: `/grant-eval/${r.id}`,
        metadata: r.referral_org ? { referral_org: r.referral_org } : undefined,
      })
    })

    const RENTAL_STATUS: Record<string, string> = { rented: '대여 중', overdue: '연체' }
    ;(rentalResult.data ?? []).forEach((r: any) => {
      add(r.client_id, {
        id: r.id,
        service_type: 'rental',
        label: '대여',
        status: r.status,
        status_label: RENTAL_STATUS[r.status] ?? r.status,
        started_at: r.rental_start_date,
        detail_url: `/rentals/${r.id}`,
      })
    })

    const CUSTOM_STATUS: Record<string, string> = {
      design: '설계', manufacturing: '제작', inspection: '검수', delivery: '납품',
    }
    ;(customResult.data ?? []).forEach((r: any) => {
      add(r.client_id, {
        id: r.id,
        service_type: 'custom_make',
        label: '맞춤제작',
        status: r.progress_status,
        status_label: CUSTOM_STATUS[r.progress_status] ?? r.progress_status,
        started_at: r.created_at,
        detail_url: `/custom-makes/${r.id}`,
      })
    })

    const APP_CATEGORY: Record<string, string> = {
      consult: '상담', experience: '체험', custom: '맞춤형',
      aftercare: '사후관리', education: '교육/홍보',
    }
    ;(appResult.data ?? []).forEach((r: any) => {
      add(r.client_id, {
        id: r.id,
        service_type: 'application',
        label: APP_CATEGORY[r.category] ?? r.category ?? '기타',
        status: r.status,
        status_label: r.status,
        started_at: r.created_at,
        detail_url: `/clients/${r.client_id}/applications/${r.id}`,
      })
    })

    return { success: true, data }
  } catch (e) {
    console.error('getActiveServiceBadgesByClientIds:', e)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}
```

- [ ] **Step 2: 테스트 재실행 — 통과 확인**

```bash
pnpm test tests/actions/client-badges.test.ts
```

예상 출력: 모든 테스트 PASS (6개)

- [ ] **Step 3: 커밋**

```bash
git add actions/client-actions.ts tests/actions/client-badges.test.ts
git commit -m "feat(eval): add getActiveServiceBadgesByClientIds batch action"
```

---

## Task 3: ClientServiceBadges 컴포넌트 생성

**Files:**
- Create: `apps/eval/components/eval/ClientServiceBadges.tsx`

- [ ] **Step 1: 컴포넌트 파일 생성**

```tsx
// apps/eval/components/eval/ClientServiceBadges.tsx
import type { ActiveService } from '@/actions/client-actions'

interface Props {
  services: ActiveService[]
  excludeType?: ActiveService['service_type']
}

function getBadgeClass(service: ActiveService): string {
  if (service.service_type === 'rental') {
    return service.status === 'overdue'
      ? 'border border-red-300 text-red-700 bg-red-50'
      : 'border border-blue-300 text-blue-700 bg-blue-50'
  }
  if (service.service_type === 'custom_make') return 'border border-purple-300 text-purple-700 bg-purple-50'
  if (service.service_type === 'application') return 'border border-gray-300 text-gray-600 bg-gray-50'
  if (service.service_type === 'grant_eval')  return 'border border-green-300 text-green-700 bg-green-50'
  return 'border border-gray-300 text-gray-600 bg-gray-50'
}

function getBadgeText(service: ActiveService): string {
  if (service.service_type === 'rental')      return service.status_label
  if (service.service_type === 'custom_make') return '맞춤제작'
  if (service.service_type === 'application') return '서비스신청'
  if (service.service_type === 'grant_eval')  return '교부평가'
  return service.label
}

export function ClientServiceBadges({ services, excludeType }: Props) {
  const visible = excludeType ? services.filter(s => s.service_type !== excludeType) : services
  if (visible.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(service => (
        <span
          key={service.id}
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getBadgeClass(service)}`}
        >
          {getBadgeText(service)}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/eval/components/eval/ClientServiceBadges.tsx
git commit -m "feat(eval): add ClientServiceBadges component"
```

---

## Task 4: 교부사업 평가 목록 페이지 적용

**Files:**
- Modify: `apps/eval/app/grant-eval/page.tsx`

- [ ] **Step 1: import 추가**

파일 상단 import 블록에 추가:

```ts
import { getActiveServiceBadgesByClientIds } from '@/actions/client-actions'
import { ClientServiceBadges } from '@/eval/components/eval/ClientServiceBadges'
```

- [ ] **Step 2: 데이터 조회 로직 교체**

기존 코드:
```ts
const result = await listGrantAssessments({ year, referralOrg: org, status })
const assessments = result.success ? result.assessments ?? [] : []
```

교체 후:
```ts
const result = await listGrantAssessments({ year, referralOrg: org, status })
const assessments = result.success ? result.assessments ?? [] : []

const badgeResult = await getActiveServiceBadgesByClientIds(assessments.map(a => a.client_id))
const badgeMap = badgeResult.success ? badgeResult.data ?? {} : {}
```

- [ ] **Step 3: 테이블 헤더에 컬럼 추가**

기존 `<th>상태</th>` 뒤에 추가:
```tsx
<th className="px-4 py-3 text-left font-medium text-gray-600">진행 중 서비스</th>
```

- [ ] **Step 4: 테이블 행에 배지 셀 추가**

기존 상태 `<td>` 뒤에 추가:
```tsx
<td className="px-4 py-3">
  <ClientServiceBadges
    services={badgeMap[a.client_id] ?? []}
    excludeType="grant_eval"
  />
</td>
```

- [ ] **Step 5: 커밋**

```bash
git add apps/eval/app/grant-eval/page.tsx
git commit -m "feat(eval): show other-service badges on grant-eval list"
```

---

## Task 5: 클라이언트 목록 페이지 + 테이블 적용

**Files:**
- Modify: `apps/eval/app/clients/page.tsx`
- Modify: `apps/eval/components/eval/ClientListTable.tsx`

### 5-A. clients/page.tsx

- [ ] **Step 1: import 추가**

파일 상단에 추가:
```ts
import { getActiveServiceBadgesByClientIds } from '@/actions/client-actions'
```

- [ ] **Step 2: 데이터 조회 로직 교체**

기존 코드:
```ts
const [result, pendingCount] = await Promise.all([
  searchClients({ query: q, limit: 30 }),
  getPendingCount(),
])
const clients = result.success ? result.clients ?? [] : []
const total = result.success ? result.total ?? 0 : 0
```

교체 후:
```ts
const [result, pendingCount] = await Promise.all([
  searchClients({ query: q, limit: 30 }),
  getPendingCount(),
])
const clients = result.success ? result.clients ?? [] : []
const total = result.success ? result.total ?? 0 : 0

const badgeResult = await getActiveServiceBadgesByClientIds(clients.map(c => c.id))
const badgeMap = badgeResult.success ? badgeResult.data ?? {} : {}
```

- [ ] **Step 3: ClientListTable에 badgeMap 전달**

기존:
```tsx
<ClientListTable clients={clients} total={total} />
```

교체 후:
```tsx
<ClientListTable clients={clients} total={total} badgeMap={badgeMap} />
```

### 5-B. ClientListTable.tsx

- [ ] **Step 4: Props 타입 및 import 수정**

파일 상단에 import 추가:
```ts
import type { ActiveService } from '@/actions/client-actions'
import { ClientServiceBadges } from './ClientServiceBadges'
```

Props 인터페이스 수정:
```ts
interface ClientListTableProps {
  clients: ClientWithStats[]
  total: number
  badgeMap?: Record<string, ActiveService[]>
}
```

함수 시그니처 수정:
```ts
export function ClientListTable({ clients, total, badgeMap = {} }: ClientListTableProps) {
```

- [ ] **Step 5: 테이블 헤더에 컬럼 추가**

기존 `<th>등록일</th>` 앞에 삽입:
```tsx
<th className="text-left px-4 py-3 font-medium text-gray-700">진행 중 서비스</th>
```

- [ ] **Step 6: 테이블 행에 배지 셀 추가**

기존 등록일 `<td>` 앞에 삽입:
```tsx
<td className="px-4 py-3">
  <ClientServiceBadges services={badgeMap[client.id] ?? []} />
</td>
```

- [ ] **Step 7: 전체 테스트 실행**

```bash
pnpm test
```

예상 출력: 모든 테스트 PASS

- [ ] **Step 8: 커밋**

```bash
git add apps/eval/app/clients/page.tsx apps/eval/components/eval/ClientListTable.tsx
git commit -m "feat(eval): show active-service badges on client list"
```

---

## Task 6: TODO.md 업데이트

**Files:**
- Modify: `docs/TODO.md`

- [ ] **Step 1: AX-1 체크리스트 마지막 항목 완료 처리**

`docs/TODO.md`에서:

```
| 사업별 뷰에서 타 서비스 배지 표시 (교부사업 평가 목록 등) | ⬜ |
```

를 다음으로 변경:
```
| 사업별 뷰에서 타 서비스 배지 표시 (교부사업 평가 목록 등) | ✅ |
```

- [ ] **Step 2: 최종 커밋**

```bash
git add docs/TODO.md
git commit -m "docs: mark AX-1 service badges complete"
```
