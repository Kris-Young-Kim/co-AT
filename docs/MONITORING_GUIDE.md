# 📊 모니터링 및 로깅 가이드

> **마지막 업데이트**: 2025. 02. 12

---

## 1. Sentry (에러 추적)

### 설정 방법

1. [sentry.io](https://sentry.io) 가입 후 프로젝트 생성 (Next.js)
2. `.env.local`에 DSN 추가:

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

3. (선택) Source Map 업로드용 CI 환경변수:
   - `SENTRY_ORG`: 조직 슬러그
   - `SENTRY_PROJECT`: 프로젝트 슬러그
   - `SENTRY_AUTH_TOKEN`: Auth Token

### 무료 한도

- 월 5,000 에러
- 1명 사용자
- **초과 시 과금 없음** (기록 중단만 됨)

---

## 2. 구조화된 로깅 (pino)

### 사용법

```typescript
import { logger } from "@/lib/utils/logger"

logger.info("사용자 로그인", { userId: "xxx" })
logger.warn("한도 임박", { limit: 10000, current: 9500 })
logger.error({ err: error }, "API 호출 실패")
```

### 로그 레벨

| 레벨 | 용도 |
|------|------|
| `trace` | 상세 디버깅 |
| `debug` | 개발 디버깅 |
| `info` | 일반 정보 |
| `warn` | 경고 |
| `error` | 에러 |
| `fatal` | 치명적 오류 |

### 환경변수

```env
LOG_LEVEL=info  # trace|debug|info|warn|error|fatal
```

- 미설정 시: 개발=`debug`, 프로덕션=`info`

---

## 3. Vercel Analytics & Speed Insights

### 자동 적용

- `@vercel/analytics`: 페이지 뷰, 이벤트 (Hobby: 월 50,000 이벤트)
- `@vercel/speed-insights`: Core Web Vitals (LCP, FID, CLS)

루트 레이아웃에 이미 포함되어 있으며 별도 설정 불필요.

### 무료 한도

- Hobby: 월 50,000 Web Analytics 이벤트
- **초과 시 과금 없음** (수집 일시 중지)

---

## 4. Supabase 모니터링

### Supabase Dashboard (무료)

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **Reports** 메뉴에서 확인:
   - CPU 사용률
   - 메모리 사용률
   - 디스크 IOPS
   - 연결 풀 상태

### 기간

- 무료 플랜: 최근 **24시간** 메트릭
- 7일+ 히스토리: Pro 플랜 필요

### 프로젝트 내 DB 모니터링

- **슬로우 쿼리 로깅**: `lib/utils/query-logger.ts` (1초 이상)
- **연결 풀 모니터링**: `/api/db/monitor`

---

## 요약

| 도구 | 용도 | 설정 |
|------|------|------|
| Sentry | 에러 추적 | `NEXT_PUBLIC_SENTRY_DSN` |
| pino | 구조화 로깅 | `LOG_LEVEL` (선택) |
| Vercel Analytics | 페이지 분석 | 자동 (레이아웃 포함) |
| Vercel Speed Insights | Core Web Vitals | 자동 |
| Supabase Dashboard | DB 성능 | Dashboard Reports |
