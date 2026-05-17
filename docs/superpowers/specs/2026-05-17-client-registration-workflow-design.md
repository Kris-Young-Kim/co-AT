# 클라이언트 등록 워크플로우 설계

**날짜:** 2026-05-17  
**앱:** `apps/eval` + `apps/web`  
**상태:** 승인됨

---

## 개요

클라이언트 데이터를 임시(pending) → 정식 등록(registered) 두 단계로 관리한다.
포털 신청(apps/web)과 직원 직접 입력(apps/eval) 모두 pending으로 시작하며,
직원이 "신규 접수 대기" 페이지에서 검토 후 정식 등록 처리한다.
등록 시 등록코드(`GW{year}{seq4}`)가 자동 발급되고 담당자가 지정된다.

---

## 1. DB 변경

### 1-1. `clients` 테이블 컬럼 추가

```sql
ALTER TABLE clients
  ADD COLUMN status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'registered')),
  ADD COLUMN assigned_staff_id TEXT,    -- Clerk user ID
  ADD COLUMN source TEXT DEFAULT 'staff'
    CHECK (source IN ('portal', 'staff'));

-- 기존 마이그레이션 데이터는 registered로 일괄 처리
UPDATE clients
  SET status = 'registered'
  WHERE registration_number IS NOT NULL;
```

### 1-2. 등록코드 형식

- 형식: `GW{year4}{seq4}` (예: `GW20260001`)
- `registration_number` 컬럼 재사용 (이미 존재)
- 연도별 MAX 조회 후 +1, 4자리 zero-padding

### 1-3. 마이그레이션 파일

`migrations/055_clients_registration_workflow.sql`

---

## 2. 페이지 & 컴포넌트

### 2-1. 신규 페이지

| 경로 | 설명 |
|------|------|
| `/clients/pending` | 신규 접수 대기 목록 |
| `/clients/new` | 직원 직접 pending 클라이언트 생성 |
| `/clients/[clientId]/register` | 등록 처리 2단계 Wizard |

#### `/clients/pending`
- pending 클라이언트 테이블: 이름, 생년월일, 연락처, 출처 배지(포털신청 \| 직원입력), 접수일
- 행마다 [등록 처리] 버튼 → `/clients/[clientId]/register`

#### `/clients/new`
- 직원이 첫 상담 시 임시 클라이언트 생성 폼
- 필드: 이름(필수), 생년월일, 성별, 연락처, 보호자 연락처, 장애유형
- 저장: `status = 'pending'`, `source = 'staff'`

#### `/clients/[clientId]/register` (2단계 Wizard)
- **Step 1:** 등록코드 자동 생성 확인 (`GW20260001`)
- **Step 2:** 담당자 지정 (Clerk 직원 목록 드롭다운)
- 완료 → `/clients/[clientId]` 이동

### 2-2. 기존 페이지 수정

#### `/clients` (클라이언트 목록)
- `status = 'registered'` 필터 추가 (현재는 전체 표시)
- 상단에 "신규 접수 대기 N건" 배너 → `/clients/pending` 링크

#### `/clients/[clientId]` (클라이언트 상세)
- 완료 배지 추가: 장애정보 / 상담기록지 / 영역별 평가 각 섹션에 완료 ✓ / 미완료 ● 표시
- `pending` 상태일 경우 상단 경고 배너: "미등록 클라이언트 — 등록 처리 후 CRUD 활성화"

---

## 3. Server Actions

### 3-1. `apps/eval/actions/client-actions.ts`

```typescript
// 신규
createPendingClient(input: CreatePendingClientInput)
  // → clients INSERT (status='pending', source='staff')

registerClient(clientId: string, assignedStaffId: string)
  // → registration_number 발급
  // → clients UPDATE (status='registered', assigned_staff_id, registration_number)

getPendingClients()
  // → clients SELECT WHERE status = 'pending'

// 수정
searchClients()   // WHERE status = 'registered' 필터 추가
```

### 3-2. `apps/web/actions/apply-actions.ts`

```typescript
// 서비스 신청 Wizard 완료 시
createApplicationWithPendingClient(input)
  // 1. clients INSERT (status='pending', source='portal', name/birth_date/contact)
  // 2. applications INSERT (client_id 연결)
```

### 3-3. 등록코드 생성 (내부 헬퍼)

```typescript
async function generateRegistrationCode(year: number): Promise<string> {
  const { data } = await supabase
    .from('clients')
    .select('registration_number')
    .like('registration_number', `GW${year}%`)
    .order('registration_number', { ascending: false })
    .limit(1)

  const last = data?.[0]?.registration_number
  const seq = last ? Number(last.slice(6)) + 1 : 1
  return `GW${year}${String(seq).padStart(4, '0')}`
}
```

---

## 4. 변경 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `migrations/055_clients_registration_workflow.sql` | 신규 |
| `apps/eval/actions/client-actions.ts` | 수정 (함수 추가) |
| `apps/eval/app/clients/page.tsx` | 수정 (registered 필터 + 배너) |
| `apps/eval/app/clients/pending/page.tsx` | 신규 |
| `apps/eval/app/clients/new/page.tsx` | 신규 |
| `apps/eval/app/clients/[clientId]/register/page.tsx` | 신규 |
| `apps/eval/app/clients/[clientId]/page.tsx` | 수정 (완료 배지) |
| `apps/eval/components/eval/ClientListTable.tsx` | 수정 (배너) |
| `apps/eval/components/eval/PendingClientTable.tsx` | 신규 |
| `apps/eval/components/eval/RegisterWizard.tsx` | 신규 |
| `apps/web/actions/apply-actions.ts` | 수정 (pending client 생성) |

---

## 5. 구현 순서

1. DB 마이그레이션 (055) 적용
2. `client-actions.ts` 서버 액션 추가
3. `/clients/pending` 페이지
4. `/clients/new` 페이지
5. `/clients/[clientId]/register` Wizard
6. 기존 `/clients`, `/clients/[clientId]` 수정
7. `apps/web` 포털 신청 연동

---

## 6. 미포함 (후속 작업)

- 클라이언트 정보 수정 폼 (장애정보 섹션 인라인 편집)
- 담당자 변경 이력 로그
- pending → registered 알림 (automation 앱 연동)
