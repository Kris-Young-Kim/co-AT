# Phase 13: Google Sheets 데이터 마이그레이션 & 실적 보고 자동화

**작성일:** 2026-05-07
**앱:** `apps/eval`
**상태:** 설계 확정

---

## 1. 배경 및 목표

기존 구글 스프레드시트(Google Drive)에 축적된 사례관리 데이터를 Supabase로 이전하고, 중앙보조기기센터 보고 양식 3종을 클릭 한 번으로 출력하는 자동화 파이프라인을 구축한다.

### 소스 파일 (Google Drive)
| 파일명 | 역할 | 데이터 규모 |
|---|---|---|
| `(2026) 콜센터 상담 일지_강원.xlsx` | 전화 상담 기록 | 2024~2026, ~560건 |
| `2. 지역보조기기센터 서비스 실적.xlsx` | 서비스 제공 기록 | 2026년 기준 591건 |

### 출력 타깃 (엑셀 보고 양식)
| 파일명 | 시트 수 | 설명 |
|---|---|---|
| `콜센터 상담 일지.xlsx` | 1 | 전화 상담 기록 원본 양식 출력 |
| `서비스 실적.xlsx` | 1 | 보조기기 서비스 상세 목록 |
| `사업 실적보고 양식.xlsx` | 7 | 전체 사업 실적, 체험, 교육, 홍보, 예산, 대여, 제작 집계 |

---

## 2. 전체 아키텍처

```
[마이그레이션 경로]
Google Drive (Service Account 인증)
  ├── 콜센터 상담 일지 Sheet
  └── 서비스 실적 Sheet
         │  googleapis (Server Action)
         ▼
  데이터 정제 레이어 (표준어 매핑 + 중복 체크)
         │
         ▼
     Supabase
   ├── call_logs              ← 콜센터 상담 기록 (기존 테이블 확장)
   └── eval_service_records   ← 서비스 실적 (신규 전용 테이블)

[엑셀 출력 경로]
     Supabase (집계 뷰)
         │  ExcelJS + 템플릿 주입
         ▼
  ① 콜센터 상담 일지.xlsx
  ② 서비스 실적.xlsx
  ③ 사업 실적보고 양식.xlsx (7시트)
```

---

## 3. DB 스키마 변경

### 3.1 `call_logs` 확장 (migration 041)

기존 테이블에 컬럼 2개 추가. 나머지 컬럼은 기존 구조와 완벽 매핑됨.

```sql
ALTER TABLE call_logs ADD COLUMN requester_name    TEXT;  -- 의뢰인/성명
ALTER TABLE call_logs ADD COLUMN requester_contact TEXT;  -- 의뢰인/연락처
```

**매핑 테이블 (콜센터 상담 일지 시트 → call_logs):**
| 시트 컬럼 | DB 컬럼 |
|---|---|
| 상담일 | `log_date` |
| 의뢰인/성명 | `requester_name` (신규) |
| 의뢰인/지역 또는 소속 | `requester_region` |
| 의뢰인/연락처 | `requester_contact` (신규) |
| 의뢰인/유형 | `requester_type` |
| 대상자/성명 | `target_name` |
| 대상자/성별 | `target_gender` |
| 대상자/장애유형 | `target_disability_type` |
| 대상자/장애정도 | `target_disability_severity` |
| 대상자/경제상황 | `target_economic_status` |
| 질문유형/공적급여 | `q_public_benefit` |
| 질문유형/민간급여 | `q_private_benefit` |
| 질문유형/보조기기 | `q_device` |
| 질문유형/사례연계 | `q_case_management` |
| 질문유형/기타 | `q_other` |
| 질문내용 | `question_content` |
| 답변 | `answer` |
| 상담자 | `staff_name` |

---

### 3.2 신규 `eval_service_records` 테이블 (migration 042)

서비스 실적 시트의 44컬럼 구조를 정규화하지 않고 전용 테이블로 수용.
기존 `service_logs`와 별개로 운영하며, 이름+생년월일로 `clients`와 soft 연결.

```sql
CREATE TABLE eval_service_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES clients(id),  -- 매칭 성공 시 연결

  -- 접수 정보
  received_at         DATE,
  application_year    INTEGER,
  application_no      INTEGER,
  is_re_application   BOOLEAN DEFAULT false,

  -- 대상자 정보 (시트 원본 보존)
  name                TEXT,
  birth_date          DATE,
  gender              TEXT,
  region              TEXT,       -- 거주지 시군구
  disability_type     TEXT,

  -- 서비스 분류
  service_category    TEXT,       -- 서비스 분류
  product_name        TEXT,       -- 제품명
  item_category       TEXT,       -- 품목고시
  service_content     TEXT,       -- 서비스 제공 내용
  service_area        TEXT,       -- 서비스 영역 (WC, ADL, S, SP 등)

  -- 보조기기센터 사업 (boolean 체크박스)
  is_consult          BOOLEAN DEFAULT false,  -- 상담
  is_assessment       BOOLEAN DEFAULT false,  -- 평가
  is_trial            BOOLEAN DEFAULT false,  -- 체험지원
  is_rental           BOOLEAN DEFAULT false,  -- 대여
  is_custom_make      BOOLEAN DEFAULT false,  -- 맞춤제작
  is_grant            BOOLEAN DEFAULT false,  -- 교부사업 맞춤형 평가
  is_education        BOOLEAN DEFAULT false,  -- 이용자 교육
  is_other_business   BOOLEAN DEFAULT false,  -- 기타사업
  is_info_provision   BOOLEAN DEFAULT false,  -- 정보제공/교육훈련

  -- 재원연계
  is_public_funding   BOOLEAN DEFAULT false,  -- 공적급여
  is_private_funding  BOOLEAN DEFAULT false,  -- 민간급여
  is_self_pay         BOOLEAN DEFAULT false,  -- 자부담
  is_funding_secured  BOOLEAN DEFAULT false,  -- 재원확보

  -- 사후관리
  is_repair           BOOLEAN DEFAULT false,  -- 점검 및 수리
  is_cleaning         BOOLEAN DEFAULT false,  -- 소독 및 세척
  is_reuse            BOOLEAN DEFAULT false,  -- 재사용
  is_monitoring       BOOLEAN DEFAULT false,  -- 모니터링

  -- 서비스 제공 방법
  referral_type       TEXT,                   -- 의뢰 구분
  is_phone            BOOLEAN DEFAULT false,  -- 유선
  is_visit_in         BOOLEAN DEFAULT false,  -- 내방
  is_visit_out        BOOLEAN DEFAULT false,  -- 방문(출장)

  is_closed           BOOLEAN DEFAULT false,  -- 종결여부
  staff_name          TEXT,                   -- 담당자

  -- 메타
  source              TEXT DEFAULT 'sheets',  -- 'sheets' | 'web'
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eval_service_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff can manage eval_service_records"
  ON eval_service_records FOR ALL USING (true) WITH CHECK (true);
```

---

### 3.3 `eval_sync_logs` 테이블 (migration 043)

동기화 실행 이력 추적.

```sql
CREATE TABLE eval_sync_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_type   TEXT NOT NULL,  -- 'call_log' | 'service_record'
  status       TEXT NOT NULL,  -- 'success' | 'error'
  rows_added   INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  error_msg    TEXT,
  synced_at    TIMESTAMPTZ DEFAULT now()
);
```

---

### 3.4 보고서 뷰 (migration 044)

```sql
-- 콜센터 보고용 뷰 (시트 컬럼 순서 일치)
CREATE VIEW v_call_log_report AS
SELECT
  log_date, requester_name, requester_region, requester_contact,
  requester_type, target_name, target_gender, target_disability_type,
  target_disability_severity, target_economic_status,
  q_public_benefit, q_private_benefit, q_device, q_case_management, q_other,
  question_content, answer, staff_name
FROM call_logs ORDER BY log_date;

-- 서비스 실적 보고용 뷰
CREATE VIEW v_service_record_report AS
SELECT
  received_at, application_year, application_no,
  name, birth_date, gender, region, disability_type,
  service_category, product_name, item_category,
  service_content, service_area,
  is_consult, is_assessment, is_trial, is_rental, is_custom_make,
  is_grant, is_education, is_other_business, is_info_provision,
  is_public_funding, is_private_funding, is_self_pay, is_funding_secured,
  is_repair, is_cleaning, is_reuse, is_monitoring,
  referral_type, is_phone, is_visit_in, is_visit_out,
  is_closed, staff_name
FROM eval_service_records ORDER BY received_at;
```

---

## 4. 신규 파일 구조

```
apps/eval/
  app/
    migration/
      page.tsx              ← 동기화 현황 페이지 (Server Component)
    reports/
      page.tsx              ← 보고서 출력 페이지
      actions.ts            ← 엑셀 생성 Server Action
  actions/
    migration-actions.ts    ← Google Sheets API → Supabase upsert
  lib/
    google-sheets.ts        ← googleapis 클라이언트 초기화

public/
  templates/
    call_log_template.xlsx         ← 콜센터 상담 일지 원본 양식
    service_record_template.xlsx   ← 서비스 실적 원본 양식
    business_report_template.xlsx  ← 사업 실적보고 양식 원본

migrations/
  041_extend_call_logs.sql
  042_create_eval_service_records.sql
  043_create_sync_logs.sql
  044_create_report_views.sql
```

---

## 5. 주요 로직

### 5.1 Google Sheets 동기화 (`migration-actions.ts`)

```typescript
// 중복 체크 기준
// call_logs: log_date + staff_name + question_content (3개 조합)
// eval_service_records: received_at + name + birth_date (3개 조합)

// 흐름
// 1. googleapis로 시트 전체 읽기 (A:AZ 범위)
// 2. 헤더 행(Row 5-6) 파싱으로 컬럼 인덱스 확정
// 3. Row 9부터 데이터 행 순회
// 4. 중복 체크 → 신규만 INSERT
// 5. sync_logs에 결과 기록
```

### 5.2 엑셀 출력 (`reports/actions.ts`)

```typescript
// 흐름
// 1. 기간 파라미터 수신 (startDate, endDate, reportType)
// 2. Supabase 뷰에서 해당 기간 데이터 조회
// 3. ExcelJS로 템플릿 로드
// 4. 데이터 시작 행부터 row-by-row 주입
// 5. Buffer → Response (Content-Disposition: attachment)
```

---

## 6. 환경변수

```bash
GOOGLE_SERVICE_ACCOUNT_JSON   # Service Account 키 전체 JSON
GOOGLE_CALL_LOG_SHEET_ID      # 콜센터 상담 일지 스프레드시트 ID
GOOGLE_SERVICE_RECORD_SHEET_ID # 서비스 실적 스프레드시트 ID
```

**Service Account 설정:**
1. Google Cloud Console → 서비스 계정 생성
2. Google Sheets API + Google Drive API 활성화
3. 서비스 계정 이메일을 각 스프레드시트에 **뷰어**로 공유

---

## 7. 사이드바 네비게이션 추가

`apps/eval/components/layout/EvalSidebar.tsx`에 두 메뉴 항목 추가:
- `/migration` — Google Sheets 동기화
- `/reports` — 보고서 출력

---

## 8. 패키지 의존성

```json
"googleapis": "^144.0.0",
"exceljs": "^4.4.0"
```

---

## 9. 기대 효과

- 분기 보고서 작성 시간: 수 시간 → 1분 이내
- 기존 2024~2026 데이터 완전 이전
- 향후 신규 데이터는 웹 입력 후 동일한 보고서 출력 체계 활용
