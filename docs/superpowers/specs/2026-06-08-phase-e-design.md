# Phase E 설계 문서 — 조직 혁신 플랫폼

> **작성일**: 2026-06-08  
> **대상 시스템**: co-AT 모노레포 (eval · web · automation · stats 앱)  
> **비전**: "행정은 AI에게, 사람은 클라이언트에게" — 직원 기록 시간을 서비스 준비 시간으로 전환  
> **참고 모델**: 호주 NDIS · 스웨덴 Hjälpmedel · 캐나다 AAACT · 미국 AT Network · 국립재활원 K-IPPA

---

## 목차

1. [전체 아키텍처](#1-전체-아키텍처)
2. [구현 순서 및 의존성](#2-구현-순서-및-의존성)
3. [E-1. 기능 성과 측정 (K-IPPA)](#3-e-1-기능-성과-측정-k-ippa)
4. [E-2. 당사자 가시성 (Client Portal)](#4-e-2-당사자-가시성-client-portal)
5. [E-3. 조직 지식 관리 (Knowledge Management)](#5-e-3-조직-지식-관리-knowledge-management)
6. [E-4. 유선 → 챗봇·온라인 전환](#6-e-4-유선--챗봇온라인-전환)
7. [E-5. 기록 자동화](#7-e-5-기록-자동화)
8. [E-6. 고객 관계 관리 (CRM)](#8-e-6-고객-관계-관리-crm)
9. [DB 마이그레이션 목록](#9-db-마이그레이션-목록)
10. [페이퍼리스 전환 범위](#10-페이퍼리스-전환-범위)

---

## 1. 전체 아키텍처

### Phase E 데이터 흐름

```
[대상자·보호자]                    [직원]                      [외부 기관]
    │                               │                              │
    ▼                               ▼                              ▼
[E-4 온라인 접수·챗봇]     [E-5 STT·AI 기록 자동화]    [E-6 의뢰처 CRM]
    │                               │                              │
    └───────────────┬───────────────┘                              │
                    ▼                                              │
            [eval 앱 — 핵심 허브]                                  │
            ├─ 대상자 관리 (E-6 CRM)  ◄────────────────────────────┘
            ├─ K-IPPA 성과 측정 (E-1)
            ├─ 사례노트·기록 (E-5)
            └─ 지식베이스 (E-3)
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
   [web 앱]              [stats 앱]
   대상자 포털 (E-2)     성과 대시보드
          │
          ▼
   [automation 앱]
   이메일·SMS 발송 (E-6)
```

### 앱별 담당 범위

| 앱 | Phase E 역할 |
|---|---|
| **eval** | E-1(K-IPPA), E-3(지식베이스), E-5(기록 자동화), E-6(CRM 허브) |
| **web** | E-2(대상자 포털), E-4(챗봇·온라인 접수) |
| **automation** | E-6(이메일·SMS 발송 엔진) |
| **stats** | E-1(성과 집계 대시보드), E-6(의뢰처 현황) |

---

## 2. 구현 순서 및 의존성

```
Phase E 권장 구현 순서

1단계 (기반)     E-5 기록 자동화 — STT·AI 요약 인프라 구축
                 └─ 이후 모든 단계의 입력 원천

2단계 (핵심)     E-1 K-IPPA — 성과 측정 도구
                 E-4 온라인 접수 — 챗봇·자가 접수 폼

3단계 (확장)     E-6 CRM — 대상자·의뢰처·알림 발송
                 E-3 지식 관리 — 데이터 축적 후 유의미

4단계 (완성)     E-2 대상자 포털 — 외부 노출, 가장 신중히
```

| Phase | 선행 조건 | 예상 규모 |
|---|---|---|
| E-5 | 없음 (독립 시작) | DB 1개 + eval 탭 + Whisper API |
| E-1 | 없음 (독립 시작) | DB 1개 + eval K-IPPA 탭 |
| E-4 | E-5 기반 STT | web 챗봇 + eval 콜로그 연동 |
| E-6 | E-4 채널 데이터 | eval CRM 확장 + automation 연동 |
| E-3 | E-1·E-5 데이터 축적 | eval 검색·추천 기능 |
| E-2 | E-6 알림 인프라 | web 포털 + 인증 확장 |

---

## 3. E-1. 기능 성과 측정 (K-IPPA)

### 배경

현재 성과 지표는 서비스 건수(건) 집계에 그침. 선진 AT 센터(호주 NDIS, 캐나다 AAACT)는 대상자의 **기능적 변화**를 측정해 보고함.

K-IPPA(Korean-Individually Prioritised Problem Assessment)는 국립재활원이 표준화한 AT 성과 도구로, 보조기기 지원 전·후 활동 수행 어려움을 당사자가 직접 평가함.

### 측정 방법

```
1. 문제 선정 (대상자 주도)
   └─ 3~5개 활동 문제 영역 직접 선정
      예) "혼자 외출하기", "식사 준비하기", "컴퓨터 사용하기"

2. 사전 측정 (보조기기 지원 전)
   └─ 각 문제별 어려움 정도: 0(없음) ~ 5(전혀 불가)

3. 보조기기 지원

4. 사후 측정 (지원 후 4~6주)
   └─ 동일 척도로 재측정

5. 성과 점수 계산
   └─ IPPA Score = Σ(사전점수 - 사후점수) / 문제 수
      양수 = 개선, 0 = 변화 없음, 음수 = 악화
```

### DB 설계

**Migration 075: `eval_ippa_assessments`**

```sql
CREATE TABLE eval_ippa_assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES clients(id) ON DELETE CASCADE,
  application_id  uuid,                          -- 연결된 신청서 (선택)
  service_record_id uuid,                        -- 연결된 서비스 기록 (선택)
  assessor_id     text NOT NULL,                 -- Clerk user ID
  phase           text NOT NULL                  -- 'pre' | 'post'
                  CHECK (phase IN ('pre', 'post')),

  -- 문제 영역 1~5 (대상자가 직접 기술)
  problem_1_desc  text,
  problem_1_score smallint CHECK (problem_1_score BETWEEN 0 AND 5),
  problem_2_desc  text,
  problem_2_score smallint CHECK (problem_2_score BETWEEN 0 AND 5),
  problem_3_desc  text,
  problem_3_score smallint CHECK (problem_3_score BETWEEN 0 AND 5),
  problem_4_desc  text,
  problem_4_score smallint CHECK (problem_4_score BETWEEN 0 AND 5),
  problem_5_desc  text,
  problem_5_score smallint CHECK (problem_5_score BETWEEN 0 AND 5),

  -- 연결 (사전-사후 쌍)
  pre_assessment_id uuid REFERENCES eval_ippa_assessments(id), -- post 시 사전 참조

  notes           text,
  assessed_at     date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 성과 점수 자동 계산 뷰
CREATE VIEW eval_ippa_scores AS
SELECT
  post.id,
  post.client_id,
  post.assessed_at AS post_date,
  pre.assessed_at  AS pre_date,
  ROUND(
    (
      COALESCE(pre.problem_1_score - post.problem_1_score, 0) +
      COALESCE(pre.problem_2_score - post.problem_2_score, 0) +
      COALESCE(pre.problem_3_score - post.problem_3_score, 0) +
      COALESCE(pre.problem_4_score - post.problem_4_score, 0) +
      COALESCE(pre.problem_5_score - post.problem_5_score, 0)
    )::numeric /
    NULLIF(
      (CASE WHEN post.problem_1_desc IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN post.problem_2_desc IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN post.problem_3_desc IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN post.problem_4_desc IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN post.problem_5_desc IS NOT NULL THEN 1 ELSE 0 END), 0
    ), 2
  ) AS ippa_score
FROM eval_ippa_assessments post
JOIN eval_ippa_assessments pre ON post.pre_assessment_id = pre.id
WHERE post.phase = 'post';
```

### UI 흐름

```
/clients/[id]
  └─ 탭: 기본정보 | 서비스이력 | K-IPPA | 사례노트

[K-IPPA 탭]
  ├─ 사전 측정 등록 버튼
  │   └─ 활동 문제 3~5개 입력 (자유 텍스트)
  │   └─ 각 문제 어려움 0~5점 선택
  │   └─ 저장 → phase: 'pre'
  │
  ├─ 보조기기 지원 후 4주/12주 팔로업 알림 (Cron → 담당자 이메일)
  │
  └─ 사후 측정 등록 버튼 (사전 측정 있을 때 활성화)
      └─ 같은 문제 항목 표시 (수정 불가)
      └─ 사후 점수만 입력
      └─ 저장 → 성과 점수 자동 계산 + 차트 표시
          └─ 레이더 차트: 문제별 사전·사후 비교
          └─ IPPA Score 배지 표시
```

### stats 앱 연동

- 기관 전체 IPPA Score 평균 (월별·분기별)
- 서비스 구분별 성과 비교 (대여 vs 맞춤제작 vs 교부평가)
- 팔로업 완료율 추적

---

## 4. E-2. 당사자 가시성 (Client Portal)

### 배경

현재 대상자는 서비스 진행 상황을 전화로만 확인 가능. 스웨덴 Hjälpmedel처럼 대상자가 본인 서비스 이력·기기 현황을 온라인에서 직접 확인할 수 있어야 함.

### 접근 방식

web 앱의 기존 마이페이지(`/my-*`)를 확장. Clerk 인증으로 대상자 본인 확인 후 `clients` 테이블과 연결.

### UI 구조

```
gwatc.cloud/my-services       ← 서비스 이력 전체
gwatc.cloud/my-devices        ← 대여 중인 기기 현황
gwatc.cloud/my-appointments   ← 예약·일정
gwatc.cloud/my-surveys        ← K-IPPA 사후 측정 셀프 제출
```

### 핵심 기능

| 기능 | 구현 방식 |
|---|---|
| 서비스 이력 조회 | `eval_service_records` where `client_id = 본인` |
| 대여 현황·반납일 | `rentals` where `client_id = 본인` |
| 진행 상태 표시 | `record_status` 배지 (접수→검토→지원→완료) |
| 상담 예약 신청 | `schedules` 에 pending 행 생성 → 직원 확정 |
| K-IPPA 셀프 제출 | 링크 토큰 발급 → 대상자 직접 응답 → `eval_ippa_assessments` 저장 |

### 보안 설계

- 대상자 Clerk 계정과 `clients.clerk_user_id` 매핑
- 본인 데이터만 조회 가능 (RLS 정책으로 강제)
- K-IPPA 셀프 제출: 1회용 서명 토큰 (24시간 유효)

---

## 5. E-3. 조직 지식 관리 (Knowledge Management)

### 배경

숙련 직원 퇴사 시 임상 노하우가 함께 사라지는 문제. 캐나다 AAACT·RESNA처럼 지식이 시스템에 축적되어야 함.

### 유사 케이스 추천

```
입력: 장애유형 + 주요 활동 제한 + 요청 기기 영역
  └─ SQL: eval_service_records + eval_ippa_assessments 조인
  └─ 조건: 동일 장애유형, IPPA 문제 유사, 서비스 완료
  └─ 출력: 유사 케이스 상위 5건
           ├─ 지원 기기명
           ├─ 서비스 구분
           ├─ IPPA Score (성과)
           └─ 담당자 (익명 처리 옵션)
```

### 보조기기별 성과 이력

```sql
-- 보조기기별 평균 IPPA Score 뷰
CREATE VIEW device_outcome_summary AS
SELECT
  sr.product_name,
  sr.service_category,
  COUNT(*)           AS case_count,
  AVG(s.ippa_score)  AS avg_ippa_score,
  AVG(sr.satisfaction_score) AS avg_satisfaction
FROM eval_service_records sr
JOIN eval_ippa_scores s ON s.client_id = sr.client_id
GROUP BY sr.product_name, sr.service_category;
```

### 인수인계 자동화

- 담당자 변경 시: 대상자 기본정보 + 서비스 이력 + K-IPPA + 사례노트 + 미완료 태스크 → 신규 담당자 이메일 발송
- 담당자 필드 변경 이벤트 → Supabase Realtime or DB Trigger

### 케이스 노트 표준화

```
SOAP 구조 (Gemini 초안 자동 생성)
  S (Subjective):  대상자 호소 내용 (STT 요약에서 추출)
  O (Objective):   평가 결과, 사용 기기, 기능 상태
  A (Assessment):  직원 임상 판단
  P (Plan):        다음 단계, 팔로업 일정
```

---

## 6. E-4. 유선 → 챗봇·온라인 전환

### 배경

현재 모든 접수가 유선 전화로 이루어짐. 직원 1명이 전화 응대·기록 입력에 소요하는 시간을 단축하고, 24시간 접수 채널을 확보.

### 3단계 전환 로드맵

#### 단계 1 — 온라인 자가 접수 폼 (web 앱)

```
gwatc.cloud/apply (기존) 확장
  └─ 자가 진단 설문 추가 (5~7문항)
     ├─ 주요 장애 유형
     ├─ 주요 활동 제한 영역
     ├─ 필요 기기 종류 (대략)
     └─ 희망 서비스 (상담/체험/평가/대여 등)
  └─ 제출 → eval 대기 접수 자동 생성 (status: 'pending')
  └─ SMS 자동 발송: "접수 완료, 담당자 배정 후 연락드리겠습니다"
  └─ 중복 체크: 이름+생년월일로 기존 대상자 매칭
```

#### 단계 2 — AI 챗봇 (web 앱)

```
기술 스택:
  └─ Gemini (기존 agent-chat 인프라 재활용)
  └─ 공개 포털 플로팅 챗봇 버튼

챗봇 대화 흐름:
  사용자: "전동휠체어 빌릴 수 있나요?"
  챗봇:   "네, 보조기기 대여 서비스를 제공하고 있습니다.
           장애 유형과 거주 지역을 알려주시면 신청 가능 여부를 안내해 드릴게요."
  ...
  챗봇:   "신청하시겠어요?" → [신청하기] 버튼 → 온라인 폼 연결

대화 내용 저장:
  └─ eval_call_logs에 channel: 'chatbot'으로 자동 저장
  └─ 담당자가 eval 앱에서 확인 후 처리
```

#### 단계 3 — eval 자동 연동

| 이벤트 | 자동 처리 |
|---|---|
| 온라인 접수 완료 | eval_call_logs 생성 (channel: 'web') |
| 챗봇 상담 종료 | eval_call_logs 생성 (channel: 'chatbot'), AI 요약 첨부 |
| 담당자 배정 | 대상자 SMS + 담당자 알림 |
| 접수 → 완료 | stats 채널별 집계 자동 반영 |

---

## 7. E-5. 기록 자동화

### 배경

직원 1인 기준 상담·평가·사례관리 기록에 건당 45~90분 소요. 이 시간을 10분 이내로 단축하는 것이 목표.

### [기반] 화상·음성 → 텍스트 변환 + AI 요약

#### DB 설계

**Migration 076: `eval_session_transcripts`**

```sql
CREATE TABLE eval_session_transcripts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid REFERENCES clients(id) ON DELETE CASCADE,
  staff_id      text NOT NULL,                  -- Clerk user ID
  session_type  text NOT NULL                   -- 'call' | 'video' | 'visit' | 'meeting'
                CHECK (session_type IN ('call', 'video', 'visit', 'meeting')),
  duration_sec  integer,
  raw_transcript text,                          -- STT 원문 (개인정보 마스킹 전)
  transcript    text,                           -- 마스킹 처리된 최종 텍스트
  ai_summary    text,                           -- Gemini 요약
  key_points    jsonb,                          -- { chief_complaint, requested_device, agreed_action, next_step }
  consent_given boolean DEFAULT false,          -- 녹취 동의 여부
  linked_call_log_id uuid,                      -- eval_call_logs 연결
  linked_service_record_id uuid,               -- eval_service_records 연결
  session_date  date NOT NULL DEFAULT CURRENT_DATE,
  created_at    timestamptz DEFAULT now()
);
```

#### 처리 파이프라인

```
[화상·음성 입력]
    │
    ▼
[STT 변환]
    ├─ 브라우저: Web Speech API (실시간, 무료)
    └─ 서버: OpenAI Whisper API (정확도 높음, 유료)
    │
    ▼
[개인정보 마스킹]
    └─ 정규식: 전화번호·주민번호·계좌번호 → "***" 치환
    │
    ▼
[Gemini AI 요약]
    └─ 프롬프트: "다음 상담 대화에서 주요 호소, 요청 기기,
                  합의 사항, 다음 단계를 JSON으로 추출해줘"
    │
    ▼
[key_points 저장] → eval_session_transcripts
    │
    ▼
[콜로그·서비스 기록 초안 자동 생성] (직원 확인 후 확정)
```

#### 녹취 동의 플로우

```
상담 시작 전:
  1. 화면에 안내 표시: "이 상담은 서비스 개선을 위해 녹취될 수 있습니다"
  2. 대상자 동의 버튼 클릭 → consent_given: true 기록
  3. 미동의 시 STT 미실행 (수동 입력만)
```

### 중복 입력 제거 — 원천 데이터 단일화

```
현재 흐름 (3회 입력):
  상담 → 콜로그 입력 (eval)
       → 서비스 기록 입력 (eval)
       → 보고서 수작업 (Excel)

개선 흐름 (1회 입력):
  상담 → STT + AI 요약
       → 콜로그 자동 생성 ──┐
       → 서비스 기록 초안 ──┤ 직원 확인·수정 후 확정
       → 보고서 자동 집계 ──┘
```

### AI 보고서 초안 생성

| 트리거 | AI 출력 | 앱 위치 |
|---|---|---|
| 9개 영역 평가 완료 + K-IPPA 사전 측정 | 평가 보고서 초안 (A4 PDF) | eval 평가 상세 |
| 서비스 완료 상태 변경 | 서비스 완료 노트 | eval 서비스 기록 |
| 팔로업 방문 기록 | 모니터링 보고서 초안 | eval 사례노트 |
| 상담 세션 transcript | 사례관리 일지 초안 | eval 사례노트 |

**Gemini 프롬프트 전략**

```
시스템 프롬프트:
  "당신은 보조공학센터 전문 기록사입니다. 다음 정보를 바탕으로
   [보고서 유형]을 작성해주세요. 전문 용어를 사용하고,
   객관적 사실과 임상 판단을 구분해서 기술해주세요."

입력 컨텍스트:
  - 대상자 기본 정보 (장애유형, 연령, 거주지)
  - 평가 점수 데이터
  - 세션 transcript 요약
  - 이전 서비스 이력

출력 형식: JSON (필드별 구조화) → PDF 렌더링
```

### 스마트 템플릿

| 서비스 구분 선택 시 자동 로드 | |
|---|---|
| 교부사업 맞춤형 평가 | 9개 영역 체크리스트 + 교부 기준 안내 |
| 대여 | 반납일 자동 계산 (6개월) + 소독 일정 + D-7 Cron 등록 |
| 맞춤 제작 지원 | 제작 의뢰서 양식 + 제조사 연락처 |
| 정보제공 | FAQ 링크 + 유사 케이스 추천 |
| 재사용 | 기기 상태 점검 체크리스트 |

---

## 8. E-6. 고객 관계 관리 (CRM)

### 대상자 CRM — eval `/clients` 확장

#### 생애주기 상태 머신

```
[접수 대기] → [활성 서비스 중] → [서비스 완료] → [모니터링] → [종결]
                                                                    │
                                                              [재접수] ──┐
                                                                         └→ [활성 서비스 중]
```

`clients.lifecycle_status` 컬럼 추가 (migration 077)

#### 장기 미접촉 감지 Cron

```typescript
// Vercel Cron — 매주 월요일 09:00 KST
// 마지막 서비스 기록일로부터 180일 이상 경과한 활성 대상자 감지
SELECT c.id, c.name, c.staff_name, MAX(sr.received_at) AS last_service
FROM clients c
LEFT JOIN eval_service_records sr ON sr.client_id = c.id  -- 실제는 client_id 기반
WHERE c.lifecycle_status = 'active'
GROUP BY c.id
HAVING MAX(sr.received_at) < NOW() - INTERVAL '180 days'
   OR MAX(sr.received_at) IS NULL;
-- → 담당자 이메일 알림 발송
```

#### 대상자 세그먼트·태그

```sql
-- Migration 077 추가 컬럼
ALTER TABLE clients ADD COLUMN lifecycle_status text DEFAULT 'active'
  CHECK (lifecycle_status IN ('pending','active','completed','monitoring','closed'));
ALTER TABLE clients ADD COLUMN referral_source text;  -- 'hospital' | 'welfare_center' | 'school' | 'self' | 'web' | 'chatbot'
ALTER TABLE clients ADD COLUMN tags text[];            -- ['우선지원', '모니터링필요']
ALTER TABLE clients ADD COLUMN referrer_id uuid;       -- eval_referrers 외래키
```

### 의뢰처·파트너 CRM — eval `/referrers` 신규

#### DB 설계

**Migration 078: `eval_referrers`, `eval_referrer_contacts`, `eval_referrer_activities`**

```sql
CREATE TABLE eval_referrers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name    text NOT NULL,
  org_type    text NOT NULL  -- 'hospital' | 'welfare_center' | 'school' | 'local_gov' | 'other'
              CHECK (org_type IN ('hospital','welfare_center','school','local_gov','other')),
  address     text,
  phone       text,
  fax         text,
  website     text,
  notes       text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE eval_referrer_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid NOT NULL REFERENCES eval_referrers(id) ON DELETE CASCADE,
  name         text NOT NULL,
  position     text,           -- "사회복지사", "팀장" 등
  phone        text,
  email        text,
  is_primary   boolean DEFAULT false,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE eval_referrer_activities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid NOT NULL REFERENCES eval_referrers(id) ON DELETE CASCADE,
  activity_type text NOT NULL  -- 'mou' | 'education' | 'consultation' | 'visit' | 'report'
                CHECK (activity_type IN ('mou','education','consultation','visit','report')),
  activity_date date NOT NULL,
  title         text,
  description   text,
  staff_id      text,          -- Clerk user ID
  created_at    timestamptz DEFAULT now()
);

-- 의뢰처별 의뢰 건수 집계 뷰
CREATE VIEW referrer_stats AS
SELECT
  r.id,
  r.org_name,
  COUNT(c.id)                          AS total_referrals,
  COUNT(c.id) FILTER (
    WHERE sr.record_status = '완료')   AS completed,
  ROUND(
    COUNT(c.id) FILTER (WHERE sr.record_status = '완료')::numeric
    / NULLIF(COUNT(c.id), 0) * 100, 1
  )                                    AS completion_rate,
  MAX(c.created_at)                    AS last_referral_date
FROM eval_referrers r
LEFT JOIN clients c ON c.referrer_id = r.id
LEFT JOIN eval_service_records sr ON sr.client_id = c.id -- 실제 client_id 기반
GROUP BY r.id, r.org_name;
```

### 이메일·문자 발송 CRM

#### 발송 채널

| 채널 | 서비스 | 용도 |
|---|---|---|
| 이메일 | Resend (or SendGrid) | 보고서, 뉴스레터, 상세 안내 |
| 문자 (SMS) | NHN Cloud SMS or 알리고 | 접수 확인, 반납 알림, 안부 |
| 카카오 알림톡 | 카카오 비즈니스 | 서비스 상태 변경 (선택) |

#### 자동 발송 시나리오

```
트리거 → 발송 내용 → 수신자

서비스 상태 변경
  접수 완료      → "접수가 확인되었습니다. 담당: {직원명}"   → 대상자·보호자
  담당자 배정    → "{직원명}이 담당합니다. 연락처: {전화}"   → 대상자·보호자
  서비스 완료    → "서비스가 완료되었습니다. 만족도 조사 링크" → 대상자

정기 알림
  대여 반납 D-7  → "반납일 7일 전입니다. 반납일: {날짜}"    → 대상자·보호자
  대여 반납 D-3  → "반납일 3일 전입니다."                   → 대상자·보호자
  대여 반납 D-0  → "오늘이 반납일입니다."                   → 대상자·보호자
  K-IPPA +4주   → "보조기기 사용 4주 후 평가 요청"          → 대상자 (E-1 연동)
  K-IPPA +12주  → "3개월 후 평가 요청"                     → 대상자
  장기 미접촉   → "안부 인사 문자" (담당자 검토 후 발송)    → 대상자

의뢰처
  분기 리포트    → 기관별 의뢰 건수·완료율·성과 요약 PDF   → 의뢰처 담당자
```

#### DB 설계

**Migration 079: `crm_notifications`**

```sql
CREATE TABLE crm_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid REFERENCES clients(id),
  referrer_id   uuid REFERENCES eval_referrers(id),  -- 의뢰처 발송 시
  channel       text NOT NULL CHECK (channel IN ('email','sms','kakao')),
  type          text NOT NULL,    -- 'intake_confirm' | 'rental_reminder' | 'ippa_followup' | ...
  recipient     text NOT NULL,    -- 이메일 주소 또는 전화번호
  subject       text,
  body          text NOT NULL,
  sent_at       timestamptz,
  status        text DEFAULT 'pending'
                CHECK (status IN ('pending','sent','failed','bounced')),
  error_message text,
  opened_at     timestamptz,      -- 이메일 열람 시
  created_at    timestamptz DEFAULT now()
);

-- 수신 거부 테이블 (개인정보보호법 준수)
CREATE TABLE crm_unsubscribes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id),
  channel     text NOT NULL,
  reason      text,
  created_at  timestamptz DEFAULT now()
);
```

---

## 9. DB 마이그레이션 목록

| Migration | 파일명 | 내용 | Phase |
|---|---|---|---|
| 075 | `075_eval_ippa_assessments.sql` | K-IPPA 평가 테이블 + 성과 점수 뷰 | E-1 |
| 076 | `076_eval_session_transcripts.sql` | 화상·음성 세션 대화록 테이블 | E-5 |
| 077 | `077_clients_crm_fields.sql` | `lifecycle_status`, `referral_source`, `tags`, `referrer_id` | E-6 |
| 078 | `078_eval_referrers.sql` | 의뢰처·담당자·활동 이력·집계 뷰 | E-6 |
| 079 | `079_crm_notifications.sql` | 발송 이력·수신 거부 테이블 | E-6 |

---

## 10. 페이퍼리스 전환 범위

### 완전 디지털 전환 가능 (Phase E 완성 시)

| 현재 종이·파일 작업 | 전환 방식 |
|---|---|
| 수기 상담일지 | E-5 STT + AI 자동 생성 |
| 평가 기록지 | eval 앱 9개 영역 + K-IPPA 탭 |
| 사례관리 일지 | E-5 AI 초안 + 직원 서명 |
| 만족도 조사지 | E-2 온라인 셀프 제출 |
| 대상자 안내 우편 | E-6 이메일·SMS 자동 발송 |
| 직원 간 인수인계 노트 | E-3 자동 승계 + 이메일 발송 |
| 내부 성과 보고서 | stats 앱 자동 집계 |

### PDF 자동 생성으로 처리 (직원이 직접 만들지 않음)

| 외부 요구 서류 | 처리 방식 |
|---|---|
| 중앙보조기기센터 보고 양식 | 시스템 → ExcelJS 자동 생성 후 다운로드 |
| 지자체 사업 실적 보고 | stats 앱 → PDF 자동 생성 |
| 평가 보고서 (외부 제출용) | E-5 AI 초안 → 직원 검토 → PDF 출력 |
| 의뢰처 분기 리포트 | E-6 자동 생성 → 이메일 첨부 발송 |

### 여전히 종이·원본 필요

| 항목 | 이유 |
|---|---|
| 서비스 동의서 (법적 서명) | 전자서명법상 공인전자서명 또는 자필 서명 필요 |
| 고령·중증 장애 대상자 접수 | 디지털 기기 접근성 한계 → 종이 병행 유지 |

---

*문서 끝 — Phase E 구현 시작 전 팀 검토 권장*
