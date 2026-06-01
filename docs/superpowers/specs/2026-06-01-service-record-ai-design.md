# 서비스 기록 AI 생성 기능 설계

**날짜:** 2026-06-01  
**앱:** `apps/eval`  
**상태:** 승인

---

## 개요

`eval_service_records` 테이블에 직접 CRUD UI를 추가하고, Gemini 기반 AI 초안 생성을 통합한다. 기존 상담기록지(intake) 패턴을 그대로 따른다.

---

## 라우트 구조

```
apps/eval/app/
  clients/[clientId]/applications/[appId]/
    page.tsx                  ← 기존: "서비스 기록" 섹션 추가
    service-record/
      page.tsx                ← 신규: 작성 폼 페이지
  service-records/
    page.tsx                  ← 신규: 전체 목록 (연도/월 필터)
```

---

## 컴포넌트

### `ServiceRecordForm.tsx`
`apps/eval/components/eval/ServiceRecordForm.tsx`

- AI 초안 섹션 (메모 입력 + 생성 버튼) — IntakeForm 패턴 동일
- 4개 fieldset으로 구성된 폼
- 로딩 중 스켈레톤 애니메이션

---

## Server Actions

`actions/service-record-actions.ts` (신규)

```ts
createServiceRecord(input): Promise<{ success, id?, error? }>
updateServiceRecord(id, input): Promise<{ success, error? }>
getServiceRecordsByApplication(applicationId): Promise<{ success, records?, error? }>
getServiceRecords(params: { year?, month? }): Promise<{ success, records?, error? }>
```

---

## AI 함수

`actions/ai-actions.ts`에 `generateServiceRecordDraft()` 추가

### 입력
```ts
interface ServiceRecordDraftInput {
  applicationId: string
  clientId: string
  memo?: string
}
```

### 자동 수집 컨텍스트 (DB 조회)
| 소스 | 필드 |
|---|---|
| `clients` | name, birth_date, disability_type, disability_severity, economic_status, region |
| `applications` | referral_type, progress_type, category, sub_category, requested_item, service_area |
| `intake_records` (최신 1건) | consultation_content, main_activity_place, environment_limitations |
| `domain_assessments` | domain_type, evaluator_opinion (필터: evaluator_opinion IS NOT NULL) |

### 출력 (JSON)
```ts
interface ServiceRecordDraft {
  service_content: string            // 서술형 3~5문장
  service_major_category: string     // 공적급여 | 민간지원 | 기타 | 서비스지원
  service_sub_category: string
  service_category: string
  service_area: string               // WC | ADL | S | SP | EC | CA | L | AAC | AM
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
```

---

## 폼 필드 구성 (4 섹션)

### ① 기본 정보
접수일(`received_at`), 신청년도/월/번호, 재신청 여부(`is_re_application`), 기록상태(`record_status`), 성명, 생년월일, 성별, 장애유형, 장애정도, 경제상황, 지역, 연락처

클라이언트 연결 시(`client_id` 존재) 읽기 전용 표시.

### ② 서비스 내용 (AI 생성 핵심)
대분류(`service_major_category`), 소분류(`service_sub_category`), 서비스구분(`service_category`), 신청품목(`product_name`), 품목분류(`item_category`), 서비스영역(`service_area`), **서비스 내용**(`service_content` — textarea, AI 생성), 의뢰구분(`referral_type`), 상담일(`consultation_date`), 실적일(`performance_date`), 종결일(`closed_at`), 모니터링일(`monitoring_date`)

### ③ 서비스 유형 체크박스 (AI 추천)
**서비스 유형:** 상담 / 평가 / 체험 / 대여 / 맞춤제작 / 교부 / 교육 / 정보제공 / 수리 / 소독 / 재사용 / 모니터링 / 기타사업  
**연락 방식:** 유선 / 내방 / 방문(외)  
**재원:** 공적급여 / 민간지원 / 자부담 / 재원확보  
**기타:** 종결(`is_closed`)

### ④ 추가 정보
체험기기 수(`trial_device_count`), 정보제공 지역(`info_provision_area`), 재원 상세(`funding_source_detail`), 담당자(`staff_name`)

---

## 신청서 상세 페이지 변경

`/clients/[clientId]/applications/[appId]/page.tsx`에 섹션 추가:

```
── 서비스 기록 (첨부 XX) ──────────────────
  [N건]                    [작성하기 버튼]
  목록: 날짜 + service_content 미리보기
```

기존 상담기록지 섹션과 동일한 UI 패턴.

---

## 전체 목록 페이지 (`/service-records`)

- 연도/월 필터 (YearSelector 재사용)
- 테이블: 접수일, 성명, 서비스 대분류, 서비스 내용 미리보기, 담당자
- 각 행 클릭 → 해당 클라이언트 신청서 페이지로 이동 (client_id, application_id 있는 경우)
- 사이드바에 "서비스 기록" 메뉴 항목 추가

---

## DB 변경

없음. `eval_service_records` 기존 테이블 사용.

---

## 구현 순서

1. `service-record-actions.ts` 신규 (CRUD)
2. `generateServiceRecordDraft()` in `ai-actions.ts`
3. `ServiceRecordForm.tsx` 컴포넌트
4. `service-record/page.tsx` (작성 라우트)
5. 신청서 상세 페이지에 섹션 추가
6. `service-records/page.tsx` (전체 목록)
7. `EvalSidebar.tsx` 메뉴 항목 추가
