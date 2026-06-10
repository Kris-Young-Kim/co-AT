# AX-1: 대상자 360도 프로필 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대상자 한 명이 동시에 여러 서비스를 받는 현실을 반영하여, 클라이언트 상세 페이지에서 교부사업 평가·대여·맞춤제작·신청서 등 모든 진행 중 서비스를 한눈에 파악하는 360도 프로필 구현

**Architecture:** 신규 DB 테이블 없음. 기존 `eval_grant_assessments`, `rentals`, `custom_makes`, `applications` 테이블을 단일 `getClientActiveServices` 서버 액션으로 병렬 조회(Promise.all)하여 통합. 클라이언트 상세 페이지(`/clients/[clientId]`)를 "진행 중 서비스 + 신청 이력" 구조로 개편.

**Tech Stack:** Next.js 15 App Router · Server Actions · TypeScript · Tailwind · Supabase (createAdminClient) · Vitest

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `actions/client-actions.ts` | `ActiveService` 타입 + `getClientActiveServices` 추가 |
| `apps/eval/components/eval/ClientActiveServices.tsx` | 신규: 활성 서비스 카드 그리드 컴포넌트 |
| `apps/eval/app/clients/[clientId]/page.tsx` | 수정: 진행 중 서비스 섹션 추가 |
| `tests/actions/client-active-services.test.ts` | 신규: 서버 액션 단위 테스트 |

---

## 도메인 지식 (코드베이스)

### eval 앱 경로 별칭
- `@/*` → 모노레포 루트 (`../../*`)
- `@/eval/*` → `apps/eval/*`
- Supabase: `createAdminClient()` from `@/lib/supabase/admin`
- 권한: `hasAdminOrStaffPermission()` from `@/lib/utils/permissions`

### 활성 서비스 판단 기준
| 테이블 | `client_id` | 활성 상태 조건 |
|--------|-------------|--------------|
| `eval_grant_assessments` | ✅ | `status IN ('draft', 'submitted')` |
| `rentals` | ✅ | `status IN ('rented', 'overdue')` |
| `custom_makes` | ✅ | `progress_status NOT IN ('completed', 'cancelled')` |
| `applications` | ✅ | `status IN ('접수', '배정', '진행중')` |

### 기존 테스트 패턴 (vitest mock)
```ts
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
```

---

## Task 1: getClientActiveServices 서버 액션

**Files:**
- Modify: `actions/client-actions.ts` (파일 끝에 추가)
- Create: `tests/actions/client-active-services.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/actions/client-active-services.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getClientActiveServices } from '@/actions/client-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

function makeTerminal(data: unknown[]) {
  const c: Record<string, unknown> & { then?: unknown } = {}
  const chain: typeof c = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => Promise.resolve({ data, error: null })),
    not: vi.fn(() => Promise.resolve({ data, error: null })),
  }
  return chain
}

describe('getClientActiveServices', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 실패', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await getClientActiveServices('client-1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('권한이 없습니다')
  })

  it('활성 서비스 통합 반환 — 각 테이블 병렬 조회', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    const grantChain = makeTerminal([
      { id: 'g1', status: 'submitted', created_at: '2026-05-01T00:00:00Z', referral_org: '강릉시청' },
    ])
    const rentalChain = makeTerminal([
      { id: 'r1', status: 'rented', rental_start_date: '2026-04-01', inventory_id: 'i1' },
    ])
    const customChain = makeTerminal([])
    const appChain = makeTerminal([])

    const mockClient: Record<string, unknown> = {
      from: vi.fn()
        .mockReturnValueOnce(grantChain)   // eval_grant_assessments
        .mockReturnValueOnce(rentalChain)  // rentals
        .mockReturnValueOnce(customChain)  // custom_makes
        .mockReturnValueOnce(appChain),    // applications
    }
    vi.mocked(createAdminClient).mockReturnValueOnce(mockClient as ReturnType<typeof createAdminClient>)

    const result = await getClientActiveServices('client-1')
    expect(result.success).toBe(true)
    expect(result.services).toHaveLength(2)
    expect(result.services![0].service_type).toBe('grant_eval')
    expect(result.services![0].status_label).toBe('제출 완료')
    expect(result.services![1].service_type).toBe('rental')
  })

  it('서비스 없으면 빈 배열 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)

    const empty = makeTerminal([])
    const mockClient: Record<string, unknown> = {
      from: vi.fn()
        .mockReturnValueOnce(empty)
        .mockReturnValueOnce(empty)
        .mockReturnValueOnce(empty)
        .mockReturnValueOnce(empty),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce(mockClient as ReturnType<typeof createAdminClient>)

    const result = await getClientActiveServices('client-1')
    expect(result.success).toBe(true)
    expect(result.services).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
pnpm test -- tests/actions/client-active-services.test.ts
```
Expected: FAIL — `getClientActiveServices is not a function`

- [ ] **Step 3: 구현 — client-actions.ts 끝에 추가**

`actions/client-actions.ts` 파일 끝 `}` 이후에 아래 코드 추가:

```ts
export interface ActiveService {
  id: string
  service_type: 'grant_eval' | 'rental' | 'custom_make' | 'application'
  label: string
  status: string
  status_label: string
  started_at: string
  detail_url: string
  metadata?: Record<string, string>
}

export async function getClientActiveServices(clientId: string): Promise<{
  success: boolean
  services?: ActiveService[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()

    const [grantResult, rentalResult, customResult, appResult] = await Promise.all([
      (supabase as any)
        .from('eval_grant_assessments')
        .select('id, status, created_at, referral_org')
        .eq('client_id', clientId)
        .in('status', ['draft', 'submitted']),
      (supabase as any)
        .from('rentals')
        .select('id, status, rental_start_date, inventory_id')
        .eq('client_id', clientId)
        .in('status', ['rented', 'overdue']),
      (supabase as any)
        .from('custom_makes')
        .select('id, progress_status, created_at')
        .eq('client_id', clientId)
        .not('progress_status', 'in', '("completed","cancelled")'),
      (supabase as any)
        .from('applications')
        .select('id, category, sub_category, status, created_at')
        .eq('client_id', clientId)
        .in('status', ['접수', '배정', '진행중']),
    ])

    const services: ActiveService[] = []

    const GRANT_STATUS: Record<string, string> = { draft: '작성 중', submitted: '제출 완료' }
    ;(grantResult.data ?? []).forEach((r: any) => {
      services.push({
        id: r.id,
        service_type: 'grant_eval',
        label: '교부사업 적합성 평가',
        status: r.status,
        status_label: GRANT_STATUS[r.status] ?? r.status,
        started_at: r.created_at,
        detail_url: `/grant-eval/${r.id}`,
        metadata: r.referral_org ? { 의뢰기관: r.referral_org } : undefined,
      })
    })

    const RENTAL_STATUS: Record<string, string> = { rented: '대여 중', overdue: '연체' }
    ;(rentalResult.data ?? []).forEach((r: any) => {
      services.push({
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
      services.push({
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
      services.push({
        id: r.id,
        service_type: 'application',
        label: APP_CATEGORY[r.category] ?? r.category ?? '기타',
        status: r.status,
        status_label: r.status,
        started_at: r.created_at,
        detail_url: `/clients/${clientId}/applications/${r.id}`,
      })
    })

    services.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    return { success: true, services }
  } catch (e) {
    console.error('getClientActiveServices:', e)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}
```

- [ ] **Step 4: 테스트 실행 → PASS 확인**

```bash
pnpm test -- tests/actions/client-active-services.test.ts
```
Expected: 3/3 passed

- [ ] **Step 5: 커밋**

```bash
git add actions/client-actions.ts tests/actions/client-active-services.test.ts
git commit -m "feat(eval): add getClientActiveServices action for 360 profile"
```

---

## Task 2: ClientActiveServices 컴포넌트

**Files:**
- Create: `apps/eval/components/eval/ClientActiveServices.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// apps/eval/components/eval/ClientActiveServices.tsx
import Link from 'next/link'
import { GitBranch, Package, Wrench, ClipboardList } from 'lucide-react'
import type { ActiveService } from '@/actions/client-actions'

interface Props {
  services: ActiveService[]
}

const SERVICE_ICONS = {
  grant_eval: GitBranch,
  rental: Package,
  custom_make: Wrench,
  application: ClipboardList,
} as const

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  rented: 'bg-indigo-100 text-indigo-700',
  overdue: 'bg-red-100 text-red-700',
  design: 'bg-yellow-100 text-yellow-700',
  manufacturing: 'bg-orange-100 text-orange-700',
  inspection: 'bg-purple-100 text-purple-700',
  delivery: 'bg-teal-100 text-teal-700',
  '접수': 'bg-gray-100 text-gray-600',
  '배정': 'bg-blue-100 text-blue-700',
  '진행중': 'bg-yellow-100 text-yellow-700',
}

export function ClientActiveServices({ services }: Props) {
  if (services.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400 border rounded-lg bg-gray-50">
        현재 진행 중인 서비스가 없습니다
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((svc) => {
        const Icon = SERVICE_ICONS[svc.service_type]
        const colorClass = STATUS_COLORS[svc.status] ?? 'bg-gray-100 text-gray-600'
        return (
          <Link
            key={svc.id}
            href={svc.detail_url}
            className="flex items-start gap-3 border rounded-lg p-4 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-colors group"
          >
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
              <Icon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">{svc.label}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                  {svc.status_label}
                </span>
              </div>
              {svc.metadata && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {Object.entries(svc.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                </p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">
                {new Date(svc.started_at).toLocaleDateString('ko-KR')} 시작
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 오류 없는지 확인**

```bash
pnpm --filter eval tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/eval/components/eval/ClientActiveServices.tsx
git commit -m "feat(eval): add ClientActiveServices component for 360 profile"
```

---

## Task 3: 클라이언트 상세 페이지 개편

**Files:**
- Modify: `apps/eval/app/clients/[clientId]/page.tsx`

현재 페이지는 기본 정보 카드 + 신청서 목록만 표시. 여기에 "진행 중 서비스" 섹션을 상단에 추가.

- [ ] **Step 1: 페이지 수정**

`apps/eval/app/clients/[clientId]/page.tsx` 전체를 아래 코드로 교체:

```tsx
import { getClientById, getClientActiveServices } from '@/actions/client-actions'
import { getApplicationsByClientId } from '@/actions/application-actions'
import { ApplicationListCard } from '@/eval/components/eval/ApplicationListCard'
import { ClientActiveServices } from '@/eval/components/eval/ClientActiveServices'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params

  const [clientResult, appsResult, activeResult] = await Promise.all([
    getClientById(clientId),
    getApplicationsByClientId(clientId),
    getClientActiveServices(clientId),
  ])

  if (!clientResult.success || !clientResult.client) notFound()

  const client = clientResult.client
  const applications = appsResult.success ? appsResult.applications ?? [] : []
  const activeServices = activeResult.success ? activeResult.services ?? [] : []

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {client.status === 'pending' && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-orange-50 border border-orange-200">
          <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">미등록 클라이언트</p>
            <p className="text-sm text-orange-700">등록 처리 후 정보 수정 및 서비스 신청이 가능합니다</p>
          </div>
          <Link
            href={`/clients/${clientId}/register`}
            className="px-3 py-1.5 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 whitespace-nowrap"
          >
            등록 처리
          </Link>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="border rounded-lg p-6 mb-6 bg-white">
        <h1 className="text-xl font-bold text-gray-900 mb-4">{client.name}</h1>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">생년월일</dt>
            <dd className="font-medium mt-0.5">{client.birth_date ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">연락처</dt>
            <dd className="font-medium mt-0.5">{client.contact ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">장애유형</dt>
            <dd className="font-medium mt-0.5">{client.disability_type ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">등록일</dt>
            <dd className="font-medium mt-0.5">
              {client.created_at ? new Date(client.created_at).toLocaleDateString('ko-KR') : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* 진행 중 서비스 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            진행 중 서비스
            {activeServices.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {activeServices.length}
              </span>
            )}
          </h2>
        </div>
        <ClientActiveServices services={activeServices} />
      </div>

      {/* 신청 이력 */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          신청 이력 ({applications.length}건)
        </h2>
        <ApplicationListCard applications={applications} clientId={clientId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
pnpm --filter eval tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: 브라우저에서 확인**

`pnpm dev` 후 `http://localhost:3002/clients/[임의 clientId]` 접속.
- 기본 정보 카드 표시 ✓
- "진행 중 서비스" 섹션 표시 (없으면 "현재 진행 중인 서비스가 없습니다") ✓
- 서비스 카드 클릭 시 해당 서비스 상세로 이동 ✓

- [ ] **Step 4: 커밋**

```bash
git add apps/eval/app/clients/[clientId]/page.tsx
git commit -m "feat(eval): 대상자 상세 페이지에 진행 중 서비스 360도 뷰 추가"
```

---

## Self-Review 체크리스트

- [x] **spec 커버리지**: 대상자 1명 × 다중 서비스 표시 → Task 3에서 구현
- [x] **spec 커버리지**: 신규 DB 불필요 → 기존 4개 테이블 직접 조회
- [x] **spec 커버리지**: 사업별로 확인 가능 → 서비스 카드 클릭 시 해당 사업 상세로 이동
- [x] **플레이스홀더 없음**: 모든 코드 블록 완성
- [x] **타입 일관성**: `ActiveService` 타입이 action·component·page 전체에서 동일하게 사용됨
- [x] **테스트 패턴**: 기존 `makeChain`/`mockReturnValueOnce` 패턴 준수

---

## 다음 Phase (AX-2)

- `cases` 테이블 도입 (client_id + service_type + status + staff_id)
- 사업별 목록 뷰(교부사업, 대여, 맞춤제작)에서 해당 대상자의 타 서비스 배지 표시
- 상세 계획: `docs/superpowers/plans/2026-06-10-ax-phase2-cases.md` (작성 예정)
