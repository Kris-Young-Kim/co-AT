# Co-AT 모노레포 개발 TODO

> **프로젝트**: GWATC 통합 관리 플랫폼 (Co-AT)
> **비전**: "행정은 AI에게, 사람은 클라이언트에게"
> **아키텍처**: Turborepo 모노레포 — 앱별 독립 배포
> **마지막 업데이트**: 2026-06-03

---

## 목차

1. [플랫폼 인프라](#플랫폼-인프라)
2. [도메인 전환 계획 (gwatc.or.kr)](#도메인-전환-계획-gwatcorkr)
3. [apps/web — 공개 포털](#appsweb--공개-포털-gwatccloud)
4. [apps/admin — 권한 관리](#appsadmin--권한-관리-admingwatccloud)
5. [apps/eval — 상담·평가 (Phase 1)](#appseval--상담평가-evalgwatccloud)
6. [apps/inventory — 자산·재고 (Phase 2)](#appsinventory--자산재고-inventorygwatccloud)
7. [apps/stats — 성과 대시보드 (Phase 3)](#appsstats--성과-대시보드-statsgwatccloud)
8. [apps/automation — 자동화·알림 (Phase 4)](#appsautomation--자동화알림-automationgwatccloud)
9. [apps/hr — 인사관리 (Phase 5)](#appshr--인사관리-hrgwatccloud)
10. [apps/approval — 전자결재 (Phase 6)](#appsapproval--전자결재-approvalgwatccloud)
11. [apps/finance — 예산·재무 (Phase 7)](#appsfinance--예산재무-financegwatccloud)
12. [packages — 공유 패키지](#packages--공유-패키지)
13. [DB 마이그레이션](#db-마이그레이션)
14. [고도화 백로그](#고도화-백로그)

---

## 플랫폼 인프라

### CI/CD · 빌드

| 항목 | 상태 |
|------|------|
| Turborepo + pnpm workspaces 설정 | ✅ |
| GitHub Actions (install → lint/test → build) | ✅ |
| Node.js 24 (`.nvmrc`, `engines`) | ✅ |
| pnpm 락파일 동기화 | ✅ |
| Vercel 앱별 독립 프로젝트 배포 | ✅ |
| E2E 테스트 (Playwright) | ⬜ |

### 인증 (Clerk 멀티도메인)

| 항목 | 상태 |
|------|------|
| gwatc.cloud — Primary 도메인 (isSatellite 없음) | ✅ |
| 위성 앱 — `isSatellite` 제거, Clerk 허용 서브도메인 방식으로 전환 | ✅ |
| middleware: 빈 문자열 fallback 제거 (`?? ''` 삭제) | ✅ |
| Vercel 각 위성 앱에 `NEXT_PUBLIC_CLERK_DOMAIN` 설정 | ✅ |
| `@co-at/auth` 공유 미들웨어 (`createAppMiddleware`) | ✅ |
| ClerkProvider에서 `isSatellite` 완전 제거 (eval/inventory/stats/admin) | ✅ |

### 보안

| 항목 | 상태 |
|------|------|
| `.claude/settings.local.json` git 추적 해제 | ✅ |
| `repomix-output.*` git 추적 해제 | ✅ |
| Supabase PAT 유출 대응 (폐기 + git 히스토리 삭제) | ✅ |
| GitHub secret scanning 알림 해소 | ✅ |

---

## 도메인 전환 계획 (gwatc.or.kr)

> **목표**: 공공기관 신뢰도 향상을 위해 `gwatc.cloud` → `gwatc.or.kr` 전환
> **우선순위**: 안정화 후 진행 — 1차 앱(web·admin·eval·inventory·stats) 완성 이후

### 전환 도메인 매핑

| 현재 (gwatc.cloud) | 전환 후 (gwatc.or.kr) |
|---|---|
| gwatc.cloud | gwatc.or.kr |
| admin.gwatc.cloud | admin.gwatc.or.kr |
| eval.gwatc.cloud | eval.gwatc.or.kr |
| inventory.gwatc.cloud | inventory.gwatc.or.kr |
| stats.gwatc.cloud | stats.gwatc.or.kr |
| automation.gwatc.cloud | automation.gwatc.or.kr |
| hr.gwatc.cloud | hr.gwatc.or.kr |
| approval.gwatc.cloud | approval.gwatc.or.kr |
| finance.gwatc.cloud | finance.gwatc.or.kr |

### 단계별 체크리스트

#### 1단계 — 도메인 등록 및 DNS 설정
- [ ] `gwatc.or.kr` 도메인 등록 (KISA 또는 공인 등록 대행사)
- [ ] Cloudflare에 `gwatc.or.kr` 존 추가 (또는 기존 Cloudflare 계정에 연결)
- [ ] Cloudflare DNS: 각 서브도메인 CNAME 레코드 추가 (Proxy ON — 주황 구름)
  - `@` → Vercel 할당 A/CNAME
  - `admin`, `eval`, `inventory`, `stats`, `automation`, `hr`, `approval`, `finance` → 각 Vercel CNAME
- [ ] SSL/TLS: Cloudflare Full (Strict) 모드 유지 확인

#### 2단계 — Vercel 도메인 추가
- [ ] Vercel 각 프로젝트에 `*.gwatc.or.kr` 도메인 추가
  - `web` → gwatc.or.kr
  - `admin` → admin.gwatc.or.kr
  - `eval` → eval.gwatc.or.kr
  - `inventory` → inventory.gwatc.or.kr
  - `stats` → stats.gwatc.or.kr
- [ ] Vercel 도메인 DNS 검증 완료 확인 (각 프로젝트 Settings > Domains)
- [ ] 기존 `gwatc.cloud` 도메인은 유지 (리다이렉트 소스로 활용)

#### 3단계 — Clerk 인증 도메인 마이그레이션
- [ ] Clerk Dashboard — 기존 Primary 도메인(`gwatc.cloud`) 변경 불가이므로 **새 Clerk 앱** 생성 또는 Clerk 지원팀 문의 (도메인 변경 정책 확인)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` 새 키로 교체
- [ ] `NEXT_PUBLIC_CLERK_DOMAIN` 환경변수 전체 앱 업데이트 (`gwatc.cloud` → `gwatc.or.kr`)
- [ ] Clerk allowed origins에 `*.gwatc.or.kr` 추가
- [ ] Clerk 사용자 데이터 마이그레이션 방안 확인 (기존 계정 유지)

#### 4단계 — 환경변수 업데이트 (Vercel)
- [ ] `NEXT_PUBLIC_INVENTORY_URL` → `https://inventory.gwatc.or.kr`
- [ ] `NEXT_PUBLIC_APP_URL` (각 앱) → 해당 `gwatc.or.kr` URL
- [ ] `NEXT_PUBLIC_CLERK_DOMAIN` → `gwatc.or.kr`
- [ ] Supabase Auth Redirect URLs에 `*.gwatc.or.kr` 추가
- [ ] Sentry 프로젝트 설정 — allowed domains 업데이트

#### 5단계 — 코드 변경
- [ ] `apps/web/app/sitemap.ts` — `baseUrl` → `https://gwatc.or.kr`
- [ ] `apps/web/app/robots.ts` — Sitemap URL 업데이트
- [ ] OG 태그 `metadataBase` → `https://gwatc.or.kr`
- [ ] `QrLabelPrint.tsx` `NEXT_PUBLIC_INVENTORY_URL` fallback URL 업데이트
- [ ] `docs/` 내 URL 참조 일괄 업데이트
- [ ] `CLAUDE.md` 도메인 매핑 업데이트

#### 6단계 — 리다이렉트 설정 (기존 도메인 유지)
- [ ] Cloudflare `gwatc.cloud` → `gwatc.or.kr` 301 Redirect Rule 설정
  - `gwatc.cloud/*` → `https://gwatc.or.kr/$1` (301 Permanent)
  - `*.gwatc.cloud/*` → `https://<subdomain>.gwatc.or.kr/$1` (301 Permanent)
- [ ] Vercel 각 프로젝트 `next.config.mjs` — 서브도메인 리다이렉트 추가 (옵션)
- [ ] 기존 `gwatc.cloud` 도메인 최소 1년 유지 (리다이렉트 및 SEO 안전)

#### 7단계 — SEO 업데이트
- [ ] Google Search Console — `gwatc.or.kr` 속성 추가 + 도메인 변경 신고
- [ ] Naver Search Advisor — `gwatc.or.kr` 등록
- [ ] 새 Sitemap 제출 (`https://gwatc.or.kr/sitemap.xml`)
- [ ] 기존 `gwatc.cloud` 속성에서 변경 주소 제출 도구 사용

#### 8단계 — 전환 후 검증
- [ ] 전체 5개 앱 로그인/로그아웃 플로우 테스트 (새 도메인)
- [ ] Clerk SSO 쿠키 서브도메인 공유 동작 확인
- [ ] QR 코드 생성 URL 확인 (`inventory.gwatc.or.kr/scan/...`)
- [ ] Cron Job URL 확인 (Vercel Cron — 절대 URL 없이 상대 경로 사용이므로 자동)
- [ ] Sentry 에러 수집 정상 동작 확인
- [ ] Cloudflare Analytics 새 도메인 트래픽 확인
- [ ] 리다이렉트 체인 테스트 (`gwatc.cloud` → `gwatc.or.kr` 301)

---

## apps/web — 공개 포털 (gwatc.cloud)

**포트**: 3000 | **Clerk**: Primary (no satellite)

### Public Zone

| 기능 | 상태 |
|------|------|
| 랜딩 페이지 (Hero, Quick Menu, 공지사항, 갤러리) | ✅ |
| 서비스 신청 시스템 (8개 폼, Wizard, Zod 검증) | ✅ |
| 공지사항 목록/상세 | ✅ |
| 보조기기 정보 페이지 | ✅ |
| 마이페이지 (신청 이력, 대여 상태) | ✅ |
| SEO (sitemap, robots.txt, OG 태그, Schema.org) | ✅ |
| OG 이미지 실제 파일 생성 (`public/og-image.jpg`) | ⬜ 수동 |
| Google Search Console 등록 | ⬜ 수동 |
| Naver Search Advisor 등록 | ⬜ 수동 |

### Portal Zone (로그인 후)

| 기능 | 상태 |
|------|------|
| 대시보드 (KPI, 오늘 일정) | ✅ |
| 신청 이력 타임라인 | ✅ |
| Vercel Analytics + Speed Insights | ✅ |

---

## apps/admin — 권한 관리 (admin.gwatc.cloud)

**포트**: 3001 | **Clerk**: Satellite

### 사용자·권한 관리

| 기능 | 상태 |
|------|------|
| 사용자 목록 조회 | ✅ |
| 역할 부여 (`ADMIN` / `MANAGER` / `STAFF`) | ✅ |
| 앱 접근 권한 설정 (`publicMetadata.apps[]`) | ✅ |
| Security logs 기록 | ✅ |
| 권한 없는 사용자 `/unauthorized` 리다이렉트 | ✅ |
| 신규 직원 온보딩 UI (앱 접근권한 일괄 부여) | ✅ |

### 일정 관리 (`/schedule`)

| 기능 | 상태 |
|------|------|
| 월간/주간/일간 캘린더 뷰 (`CalendarView`) | ✅ |
| 일정 목록 + 검색 + 필터 | ✅ |
| 일정 등록/수정/삭제 폼 (`ScheduleForm`) | ✅ |
| 카테고리 색상 관리 (`CategoryManager`) | ✅ |
| 캘린더 날짜 색상 도트 렌더링 (`DayContentWithDots`) | ✅ |
| 역할 분담 (`EventRoleModal`) | ✅ |
| 회의록 (`MeetingMinutesModal`) | ✅ |
| 공개 가시성 토글 (`is_web_visible`) | ✅ |
| /schedule 500 버그 수정 (`'use server'` 배열 export → local const) | ✅ |
| Vercel Turbopack 캐시 — 캐시 없이 재배포 완료 | ✅ |

### AI 업무 도우미 (`/agent-chat`)

| 기능 | 상태 |
|------|------|
| Gemini 연동 AI 채팅 (`/api/agents/chat`) | ✅ |
| 업무 지식 기반 응답 (agent-chat page) | ✅ |

---

## apps/eval — 상담·평가 (eval.gwatc.cloud)

**포트**: 3002 | **Clerk**: Satellite | **DB 네임스페이스**: `eval_*`

### 구현 완료

| 기능 | 상태 |
|------|------|
| 대상자 목록/검색/상세 | ✅ |
| 콜센터 상담일지 (call-logs) | ✅ |
| 서비스 기록 (service records) | ✅ |
| 보고서 뷰 + 인쇄 출력 | ✅ |
| 데이터 마이그레이션 페이지 | ✅ |

### 미구현 / 진행 중

| 기능 | 상태 |
|------|------|
| 9개 영역 평가 시스템 (첨부 21 기반) | ✅ |
| 평가 결과 시각화 (허브 그리드 + 도메인 요약) | ✅ |
| Google Sheets → Supabase 데이터 마이그레이션 (File import) | ✅ |
| 중앙보조기기센터 보고 양식 엑셀 출력 (ExcelJS) | ✅ |
| AI 상담기록 생성 (Gemini) | ✅ |
| 음성 녹음 → STT 연동 | ✅ |

---

## apps/inventory — 자산·재고 (inventory.gwatc.cloud)

**포트**: 3003 | **Clerk**: Satellite | **DB 네임스페이스**: `inventory_*`

### 구현 완료

| 기능 | 상태 |
|------|------|
| 기기 CRUD + QR/바코드 생성·스캔 | ✅ |
| 이미지 업로드 (`image_url` DB + types 동기화) | ✅ |
| 대여 관리 (대여/반납/연장, D-Day) | ✅ |
| 맞춤제작 관리 (custom-orders) | ✅ |
| 제작 장비 관리 (fab-equipment) | ✅ |
| 유지보수 로그 (maintenance) | ✅ |
| 재사용 배포 관리 (reuse/dispatch) | ✅ |
| 보고서 | ✅ |

### 미구현

| 기능 | 상태 |
|------|------|
| 대여 만료 알림 (D-7/3/0 Vercel Cron) | ✅ |
| 강원도 18개 시군 대여 현황 코로플레스 맵 (`/map`) | ✅ |
| 재고 부족 알림 | ⬜ |

---

## apps/stats — 성과 대시보드 (stats.gwatc.cloud)

**포트**: 3004 | **Clerk**: Satellite

### 구현 완료

| 기능 | 상태 |
|------|------|
| 5대 사업별 실적 (business) | ✅ |
| 월별/연도별 통계 (monthly/yearly) | ✅ |
| 목표 대비 실적 (targets) | ✅ |
| Excel 내보내기 (export) | ✅ |

### 미구현

| 기능 | 상태 |
|------|------|
| 전년 동기 대비 비교 차트 | ✅ |
| stats-actions 재작성 — `eval_service_records` boolean 플래그 기반 9개 사업 개별 집계 | ✅ |
| EvalScoreWidget — 2026 정량평가 사업수행실적(40점) 자동 계산기 | ✅ |
| Excel 내보내기 수정 — 9개 사업 개별 컬럼 (대여/맞춤제작/교부평가 등 분리) | ✅ |
| 예측 분석 (대여 패턴, 수리 예측) | ⬜ |

---

## apps/automation — 자동화·알림 (automation.gwatc.cloud)

**포트**: 3005 | **Clerk**: Satellite

### 구현 완료

| 기능 | 상태 |
|------|------|
| 알림 채널 관리 (channels) | ✅ |
| 메시지 발송 (send) | ✅ |
| 발송 로그 (logs) | ✅ |

### 미구현

| 기능 | 상태 |
|------|------|
| Supabase Realtime 알림 센터 연동 | ⬜ |
| 카카오톡 알림톡 채널 연동 | ⬜ |
| 일정 리마인더 Cron (매일 09:00 UTC) | ⬜ |

---

## apps/hr — 인사관리 (hr.gwatc.cloud)

**포트**: 3006 | **Clerk**: Satellite | **DB 네임스페이스**: `hr_*`

### 구현 완료

| 기능 | 상태 |
|------|------|
| 직원 목록/상세 (employees) | ✅ |
| 근태 관리 (attendance) | ✅ |
| 휴가 관리 (leave) | ✅ |
| 급여 관리 (salary) | ✅ |
| 증명서 발급 (certificates) | ✅ |
| 일용직 임금 (daily-wages) | ✅ |
| 채용 관리 (careers) | ✅ |

### 미구현

| 기능 | 상태 |
|------|------|
| 근태 자동 집계 (월말 정산) | ⬜ |
| 급여 명세서 PDF 출력 | ⬜ |

---

## apps/approval — 전자결재 (approval.gwatc.cloud)

**포트**: 3007 | **Clerk**: Satellite | **DB 네임스페이스**: `approval_*`

### 구현 완료

| 기능 | 상태 |
|------|------|
| 결재 문서 생성 (new) | ✅ |
| 문서 상세/결재선 (id) | ✅ |
| 문서 보관함 (archive) | ✅ |
| 결재 양식 설정 (settings) | ✅ |

### 미구현

| 기능 | 상태 |
|------|------|
| 결재 승인/반려 워크플로우 (2단계: manager→admin) | ✅ |
| 전자서명 (결재선 순차 처리) | ✅ |
| PDF 출력 (`@react-pdf/renderer`) | ✅ |
| 위임 결재 | ⬜ |
| notifications 타입 버그 (`'approval'` CHECK 제약 미등록) | ✅ |

---

## apps/finance — 예산·재무 (finance.gwatc.cloud)

**포트**: 3008 | **Clerk**: Satellite | **DB 네임스페이스**: `finance_*`

### 구현 완료

| 기능 | 상태 |
|------|------|
| 예산 계획 (budget) | ✅ |
| 항목 분류 (categories) | ✅ |
| 지출 기록 (expenditures) | ✅ |
| 재무 보고서 (reports) | ✅ |

### 미구현

| 기능 | 상태 |
|------|------|
| 예산 집행률 시각화 (recharts) | ⬜ |
| 분기별 예산 vs 실적 비교 | ⬜ |
| 국비·도비·자부담 항목 구분 | ⬜ |

---

## packages — 공유 패키지

### @co-at/ui (`packages/ui`)

| 항목 | 상태 |
|------|------|
| shadcn/ui 기반 공유 컴포넌트 | ✅ |
| Storybook 문서화 | ⬜ |

### @co-at/lib (`packages/lib`)

| 항목 | 상태 |
|------|------|
| Supabase client (server/client/admin) | ✅ |
| DB 타입 (`types/database.types.ts`) | ✅ |
| `gen:types` 스크립트 (3개 파일 동기화) | ✅ |

### @co-at/auth (`packages/auth`)

| 항목 | 상태 |
|------|------|
| `createAppMiddleware(appKey)` | ✅ |
| 역할 상수 (`ADMIN`, `MANAGER`, `STAFF`) | ✅ |
| 앱 키 타입 (`AppKey` in `@co-at/types`) | ✅ |

### @co-at/types (`packages/types`)

| 항목 | 상태 |
|------|------|
| DB Row/Insert/Update 타입 | ✅ |
| `AppKey` 유니온 타입 | ✅ |
| `hr.types.ts`, `finance.types.ts`, `approval.types.ts` | ✅ |

---

## DB 마이그레이션

> 파일 위치: `migrations/NNN_<description>.sql`
> 실행 명령: Supabase 대시보드 또는 `supabase db push`

### 완료된 마이그레이션 (002 ~ 051)

- `002–018`: 기반 테이블 (applications, inventory, service_logs, schedules, notices, rentals, custom_makes, regulations, audit_logs 등)
- `019`: inventory `image_url` 컬럼 추가
- `020`: 채팅 테이블
- `021–027`: 일정 상태, 공지 읽음, VOC, 회의록, 업무 태스크, 이벤트 역할
- `028, 030`: budgets, resources
- `045`: approval 테이블
- `046`: finance 테이블
- `047*`: inventory Phase 2 (QR 토큰, 대여 확장, 맞춤제작, 재사용, 제작장비, 유지보수, 배포 요약 뷰)
- `048*`: 보안 강화
- `049–051`: vector extension, eval 서비스 기록 확장

### 완료된 마이그레이션 (052 ~ 057)

| 파일명 | 내용 | 상태 |
|--------|------|------|
| `052_extend_eval_sync_logs.sql` | eval 동기화 로그 확장 | ✅ |
| `053_add_contact_address_to_service_records.sql` | 서비스 기록 연락처·주소 컬럼 추가 | ✅ |
| `054_notifications_add_approval_type.sql` | notifications 테이블 `approval` 타입 허용 | ✅ |
| `055_clients_registration_workflow.sql` | 클라이언트 등록 워크플로우 | ✅ |
| `056_add_is_web_visible_to_schedules.sql` | schedules 테이블 `is_web_visible` 컬럼 추가 | ✅ |
| `057_create_schedule_categories.sql` | schedule_categories 테이블 생성 (색상·이름) | ✅ |

### 미실행 / 예정 마이그레이션

| 파일명 (예정) | 내용 |
|---------------|------|
| `058_eval_ai_soap.sql` | AI SOAP 노트 저장 테이블 |

---

## 고도화 백로그

> **개발 집중 앱**: web · admin · eval · inventory · stats
> **개발 보류 앱**: hr · approval · automation (1차 앱 안정화 이후)

### 1차 집중 — 높은 우선순위

- [x] **eval** — Google Sheets → Supabase 마이그레이션 (File import 완료)
- [x] **eval** — 중앙보조기기센터 보고 양식 엑셀 출력 (ExcelJS 완료)
- [x] **eval** — 9개 영역 평가 시스템 + 결과 시각화 완료
- [x] **eval** — AI 상담기록 생성 (상담기록 형식 확정, SOAP 노트 코드 삭제)
- [ ] **web** — OG 이미지 파일 생성, Google/Naver Search Console 등록
- [x] **모든 앱** — Sentry DSN 환경변수 설정 (코드는 이미 준비됨)

### 1차 집중 — 중간 우선순위

- [x] **inventory** — 대여 만료 Vercel Cron 알림 (D-7/3/0)
- [x] **stats** — 전년 동기 대비 차트

### 1차 집중 — 낮은 우선순위

- [ ] **web** — PWA 오프라인 지원
- [ ] 외부 시스템 연동 (전자정부, 의료기관)
- [ ] Redis 캐싱 전략
- [ ] SLO/SLI 모니터링 (가용성 99.5% 목표)

### 2차 개발 보류 (hr · approval · automation)

- [ ] **hr** — 급여 명세서 PDF, 근태 자동 집계
- [ ] **approval** — 위임 결재
- [ ] **automation** — Supabase Realtime 알림 센터 연동
- [ ] **automation** — 카카오톡 알림톡 채널 연동
- [ ] **automation** — 일정 리마인더 Cron
- [ ] **finance** — 예산 집행률 시각화, 분기별 비교, 국비·도비·자부담 구분

### 완료 이력

- [x] **eval** — 9개 영역 평가 시스템 + 결과 시각화
- [x] **eval** — Google Sheets 마이그레이션 (File import)
- [x] **eval** — 엑셀 출력 (ExcelJS)
- [x] **admin** — 신규 직원 온보딩 UI
- [x] **approval** — 결재 승인/반려 워크플로우 + 전자서명 + PDF 출력
- [x] **approval** — notifications 타입 버그 수정 (`'approval'` CHECK 제약)
- [x] **admin** — 일정 캘린더 (월/주/일) + 카테고리 색상 관리 + 역할분담 + 회의록
- [x] **admin** — `is_web_visible` 토글 (일정 공개 가시성)
- [x] **admin** — AI 업무 도우미 (agent-chat, Gemini 연동)
- [x] **auth** — `isSatellite` 완전 제거 (모든 앱 ClerkProvider + 공유 미들웨어)

---

## 개발 명령어 참조

```bash
pnpm dev          # 전체 개발 서버 (Turbo)
pnpm build        # 전체 빌드
pnpm lint         # 전체 린트
pnpm test         # 전체 테스트
pnpm gen:types    # Supabase 타입 재생성 (3개 파일 동기화)

# 특정 앱만
pnpm --filter @co-at/inventory dev
pnpm --filter @co-at/eval build
```

## 신규 앱 생성

```
/new-app  # 표준 보일러플레이트 자동 생성
```

## DB 마이그레이션 생성

```
/db-migrate  # 파일 생성 + RLS 검증
```

---

**Supabase Project**: `uyjbndiwyddjyjkdfuyi`
**GitHub**: `https://github.com/Kris-Young-Kim/co-AT`
**설계 스펙**: `docs/superpowers/specs/2026-05-01-gwatc-monorepo-design.md`
