# hr 앱 컨텍스트 (hr.gwatc.cloud)

## 경로 별칭
- `@/*` → `apps/hr/*` (로컬 전용)
- 루트 monorepo 접근 없음 — 모든 액션·lib은 앱 내부에 있음

## DB 패턴
```ts
import { createSupabaseAdmin } from '@/lib/supabase-admin'
const supabase = createSupabaseAdmin()
// 테이블 네임스페이스: hr_*
```

## 라우트 구조
- `employees/` — 직원 정보
- `attendance/` — 출퇴근·근태
- `salary/` — 급여
- `salary-steps/` — 호봉 체계
- `salary-step-promotions/` — 호봉 승급
- `daily-wages/` — 일급 근로자
- `leave/` — 연차·휴가
- `business-trip/` — 출장
- `contracts/` — 근로계약서
- `careers/` — 경력 이력
- `certificates/` — 증명서 발급
- `departments/` — 부서
- `positions/` — 직위
- `performance/` — 인사평가
- `training/` — 교육훈련
- `severance/` — 퇴직금 정산
- `hr-stats/` — HR 통계

## 주요 특징
- 로컬 액션: `actions/` 내 대량 (attendance, salary, leave, contract 등)
- `lib/salary-calculator.ts` — 급여 계산 로직
- `lib/leave-calculator.ts` — 연차 계산 로직
- `api/` — 출퇴근 QR, Cron 월말집계 전용
