# AX-1 타 서비스 배지 — 설계 스펙

**날짜**: 2026-06-11  
**범위**: eval 앱 — 교부사업 평가 목록 + 클라이언트 목록  
**목표**: 대상자가 현재 받고 있는 타 서비스를 목록 뷰에서 한눈에 파악

---

## 배경

대상자 한 명이 교부사업 평가·대여·맞춤제작·서비스신청을 동시에 받는 경우가 많다.
현재 각 목록 페이지는 해당 사업 정보만 보여줘 타 서비스 진행 여부를 파악하려면 대상자 상세 페이지로 이동해야 한다.
배지를 목록 행에 표시하면 이동 없이 맥락을 파악할 수 있다.

---

## 데이터 소스

기존 `getClientActiveServices` 의 쿼리 조건을 그대로 재사용:

| 테이블 | 활성 조건 |
|--------|-----------|
| `eval_grant_assessments` | `status IN ('draft', 'submitted')` |
| `rentals` | `status IN ('rented', 'overdue')` |
| `custom_makes` | `progress_status NOT IN ('completed', 'cancelled')` |
| `applications` | `status IN ('접수', '배정', '진행중')` |

---

## 1. 새 배치 액션

**파일**: `actions/client-actions.ts` (하단 추가)

```ts
export async function getActiveServiceBadgesByClientIds(
  clientIds: string[]
): Promise<{ success: boolean; data?: Record<string, ActiveService[]>; error?: string }>
```

- `clientIds`를 `Set`으로 중복 제거
- `clientIds.length === 0`이면 즉시 `{ success: true, data: {} }` 반환 (빈 `.in()` 방지)
- 4개 테이블에 `.in('client_id', uniqueIds)` 쿼리를 `Promise.all`로 병렬 실행
- `ActiveService` 생성 로직은 기존 `getClientActiveServices` 내부와 동일하게 적용
- 반환: `Record<string, ActiveService[]>` — key는 `client_id`

---

## 2. 새 컴포넌트

**파일**: `apps/eval/components/eval/ClientServiceBadges.tsx`

```tsx
interface Props {
  services: ActiveService[]
  excludeType?: ActiveService['service_type']
}
```

- `excludeType` 필터 후 남은 서비스만 렌더
- 0개면 `null` 반환
- Server Component (상태 없음)

### 배지 스타일

| service_type | 표시 텍스트 | 스타일 |
|---|---|---|
| `rental` (rented) | 대여 중 | `border border-blue-300 text-blue-700 bg-blue-50` |
| `rental` (overdue) | 연체 | `border border-red-300 text-red-700 bg-red-50` |
| `custom_make` | 맞춤제작 | `border border-purple-300 text-purple-700 bg-purple-50` |
| `application` | 서비스신청 | `border border-gray-300 text-gray-600 bg-gray-50` |
| `grant_eval` | 교부평가 | `border border-green-300 text-green-700 bg-green-50` |

기존 신청품목 배지(`bg-blue-50 text-blue-700`, 테두리 없음)와 구분되도록 테두리 적용.

---

## 3. 적용 페이지

### A. `/grant-eval/page.tsx`

`listGrantAssessments` 결과에서 client ID를 추출해야 하므로 순차 2단계:

```ts
// 1단계: 평가 목록 조회
const result = await listGrantAssessments({ year, referralOrg: org, status })
const assessments = result.success ? result.assessments ?? [] : []

// 2단계: client ID 배열로 배지 일괄 조회
const badgeResult = await getActiveServiceBadgesByClientIds(
  assessments.map(a => a.client_id)
)
const badgeMap = badgeResult.success ? badgeResult.data ?? {} : {}
```

- `badgeResult` 실패 시 빈 맵(`{}`)으로 폴백 — 배지 없음으로 조용히 처리
- `assessments`가 빈 배열이면 `getActiveServiceBadgesByClientIds`가 즉시 `{}` 반환
- 테이블 "상태" 컬럼 오른쪽에 "진행 중 서비스" 컬럼 추가
- `<ClientServiceBadges services={badgeMap[a.client_id] ?? []} excludeType="grant_eval" />`

### B. `/clients/page.tsx` + `ClientListTable.tsx`

**clients/page.tsx**

`searchClients` 결과에서 client ID를 추출해야 하므로 순차 2단계:

```ts
// 1단계: 클라이언트 목록 + 미등록 카운트 병렬 조회
const [result, pendingCount] = await Promise.all([
  searchClients({ query: q, limit: 30 }),
  getPendingCount(),
])
const clients = result.success ? result.clients ?? [] : []

// 2단계: client ID 배열로 배지 일괄 조회
const badgeResult = await getActiveServiceBadgesByClientIds(
  clients.map(c => c.id)
)
const badgeMap = badgeResult.success ? badgeResult.data ?? {} : {}
```

**ClientListTable.tsx**
- `badgeMap?: Record<string, ActiveService[]>` prop 추가
- "등록일" 컬럼 앞에 "진행 중 서비스" 컬럼 추가
- `excludeType` 없이 모든 활성 서비스 표시

---

## 범위 밖

- `/service-records/page.tsx` — 완료 기록 목적, 배지 불필요
- 인쇄 페이지들 — 출력물에 배지 불필요
- 칸반 보드(`GrantEvalKanban`) — 이번 스코프 제외 (카드 UI 별도 검토)

---

## 파일 변경 목록

| 파일 | 변경 유형 |
|------|-----------|
| `actions/client-actions.ts` | 함수 추가 (`getActiveServiceBadgesByClientIds`) |
| `apps/eval/components/eval/ClientServiceBadges.tsx` | 신규 생성 |
| `apps/eval/app/grant-eval/page.tsx` | 배치 호출 + 컬럼 추가 |
| `apps/eval/app/clients/page.tsx` | 배치 호출 추가 |
| `apps/eval/components/eval/ClientListTable.tsx` | prop 추가 + 컬럼 추가 |
