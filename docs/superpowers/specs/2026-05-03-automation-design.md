# GWATC Phase 4 — 업무 자동화 앱 설계

**작성일:** 2026-05-03
**앱:** `apps/automation` → `automation.gwatc.cloud`
**대상 사용자:** 관리자 (ADMIN)

---

## 1. 목표

- `apps/admin`에 분산된 cron 자동화 로직을 `apps/automation`으로 완전 이전
- 관리자가 자동화 실행 내역을 대시보드에서 확인하고 수동 알림 발송 가능
- 이메일(Resend) 외부 알림 채널 연동, 이후 카카오 알림톡 단계적 추가

---

## 2. 마이그레이션 범위

### Admin에서 이전할 항목

| 항목 | 현재 위치 | 이전 위치 |
|---|---|---|
| 대여 만료 알림 cron | `apps/admin/app/api/cron/rental-expiry-notifications/route.ts` | `apps/automation/app/api/cron/rental-expiry/route.ts` |
| 일정 리마인더 cron | `apps/admin/app/api/cron/schedule-reminders/route.ts` | `apps/automation/app/api/cron/schedule-reminders/route.ts` |

### Admin에 유지할 항목

- `apps/admin/app/api/webhooks/clerk/route.ts` — 사용자 관련 webhook은 admin 유지

---

## 3. 디렉토리 구조

```
apps/automation/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # 대시보드
│   ├── logs/
│   │   └── page.tsx                      # 자동화 로그 목록
│   ├── channels/
│   │   └── page.tsx                      # 알림 채널 설정
│   ├── send/
│   │   └── page.tsx                      # 수동 알림 발송
│   └── api/
│       ├── cron/
│       │   ├── rental-expiry/route.ts
│       │   └── schedule-reminders/route.ts
│       ├── notify/
│       │   └── send/route.ts             # 수동 발송 API
│       └── health/route.ts
├── actions/
│   ├── log-actions.ts                    # automation_logs CRUD
│   ├── channel-actions.ts                # automation_channels CRUD
│   └── notify-actions.ts                 # 외부 알림 발송
├── components/
│   ├── dashboard/
│   ├── logs/
│   ├── channels/
│   └── send/
├── lib/
│   └── resend.ts                         # Resend 클라이언트
├── emails/                               # React Email 템플릿
│   ├── RentalExpiryEmail.tsx
│   └── ScheduleReminderEmail.tsx
└── middleware.ts                         # ADMIN only
```

---

## 4. 데이터 모델

### `automation_logs` 테이블

```sql
CREATE TABLE automation_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name      text NOT NULL,       -- 'rental-expiry' | 'schedule-reminders' | 'manual-send'
  triggered_by  text NOT NULL,       -- 'cron' | 'manual'
  status        text NOT NULL,       -- 'success' | 'partial' | 'failed'
  total_sent    int NOT NULL DEFAULT 0,
  success_count int NOT NULL DEFAULT 0,
  fail_count    int NOT NULL DEFAULT 0,
  channel       text NOT NULL,       -- 'in-app' | 'email' | 'kakao'
  error_message text,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

### `automation_channels` 테이블

```sql
CREATE TABLE automation_channels (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type   text NOT NULL UNIQUE,  -- 'email' | 'kakao'
  is_enabled     boolean NOT NULL DEFAULT false,
  config         jsonb,                  -- API 키 등 (암호화 고려)
  last_tested_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
```

두 테이블 모두 RLS 활성화, ADMIN 역할만 읽기/쓰기 허용.

---

## 5. 알림 발송 흐름

```
cron 실행 또는 수동 발송 요청
        ↓
1. Supabase notifications 테이블에 in-app 알림 기록
        ↓
2. automation_channels에서 활성 외부 채널 확인
        ↓
3. 이메일(Resend) 발송 (활성화된 경우)
        ↓
4. automation_logs에 실행 결과 기록 (성공/실패 카운트)
```

---

## 6. UI 페이지 구성

### 대시보드 (`/`)
- 오늘 실행 요약 카드 (job별 성공/실패 건수)
- 최근 실행 내역 테이블 (job명, 채널, 상태, 발송 수, 시각)
- 채널 상태 뱃지 (이메일 활성/비활성, 카카오 준비 중)
- 수동 발송 빠른 접근 버튼

### 로그 (`/logs`)
- 전체 실행 이력 테이블
- 필터: job명, 상태(success/partial/failed), 날짜 범위
- 행 클릭 → 상세 모달 (metadata JSON, 오류 메시지)

### 채널 설정 (`/channels`)
- 이메일(Resend) 카드 — API 키 입력, 발신자 이메일, 테스트 발송 버튼
- 카카오 알림톡 카드 — "준비 중" 상태, 비활성 UI만 표시
- 채널별 활성/비활성 토글

### 수동 발송 (`/send`)
- 대상 선택: 전체 직원 / 특정 직원 / 특정 클라이언트
- 알림 유형: 일정 리마인더 / 반납 알림 / 커스텀 메시지
- 채널 선택: in-app / 이메일
- 발송 미리보기 → 확인 → 발송 → 결과 표시

---

## 7. 외부 알림 채널

### Phase 4-1: 이메일 (Resend)

- 패키지: `resend`
- 템플릿 엔진: `@react-email/components`
- 발신자 도메인: `gwatc.cloud` (Cloudflare DNS에서 DKIM/SPF 설정 필요)
- 환경변수: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- 템플릿:
  - `RentalExpiryEmail` — 대여 만료 D-7/D-3/D-0 안내
  - `ScheduleReminderEmail` — 내일 일정 리마인더

### Phase 4-2: 카카오 알림톡 (후속)

- 카카오 비즈니스 채널 심사 후 구현
- `automation_channels`에 kakao 행 추가, UI 카드는 Phase 4-1부터 표시

---

## 8. Vercel Cron 설정

`apps/automation/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/rental-expiry",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/schedule-reminders",
      "schedule": "0 0 * * *"
    }
  ]
}
```

보안: `CRON_SECRET` 환경변수로 인증 헤더 검증.

---

## 9. 마이그레이션 순서

1. `automation_logs`, `automation_channels` DB 마이그레이션 생성 및 적용
2. automation 앱에 cron route 구현 (기존 로직 이전 + Resend 연동)
3. React Email 템플릿 작성
4. UI 페이지 구현 (대시보드 → 로그 → 채널 설정 → 수동 발송)
5. `apps/automation/vercel.json` cron 설정
6. Vercel 환경변수 추가 (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`)
7. automation 배포 & cron 동작 확인
8. admin의 cron route 2개 삭제

---

## 10. 권한

- `middleware.ts`: `ADMIN` 역할만 접근 허용
- Supabase RLS: `automation_*` 테이블은 ADMIN만 읽기/쓰기
- Cron API: `CRON_SECRET` 헤더 검증
