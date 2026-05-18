# Co-AT 모노레포 개발 TODO

> **프로젝트**: GWATC 통합 관리 플랫폼 (Co-AT)
> **비전**: "행정은 AI에게, 사람은 클라이언트에게"
> **아키텍처**: Turborepo 모노레포 — 앱별 독립 배포
> **마지막 업데이트**: 2026-05-17

---

## 목차

1. [플랫폼 인프라](#플랫폼-인프라)
2. [apps/web — 공개 포털](#appsweb--공개-포털-gwatccloud)
3. [apps/admin — 권한 관리](#appsadmin--권한-관리-admingwatccloud)
4. [apps/eval — 상담·평가 (Phase 1)](#appseval--상담평가-evalgwatccloud)
5. [apps/inventory — 자산·재고 (Phase 2)](#appsinventory--자산재고-inventorygwatccloud)
6. [apps/stats — 성과 대시보드 (Phase 3)](#appsstats--성과-대시보드-statsgwatccloud)
7. [apps/automation — 자동화·알림 (Phase 4)](#appsautomation--자동화알림-automationgwatccloud)
8. [apps/hr — 인사관리 (Phase 5)](#appshr--인사관리-hrgwatccloud)
9. [apps/approval — 전자결재 (Phase 6)](#appsapproval--전자결재-approvalgwatccloud)
10. [apps/finance — 예산·재무 (Phase 7)](#appsfinance--예산재무-financegwatccloud)
11. [packages — 공유 패키지](#packages--공유-패키지)
12. [DB 마이그레이션](#db-마이그레이션)
13. [고도화 백로그](#고도화-백로그)

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
| 위성 앱 — `isSatellite: true` + `domain` 문자열 | ✅ |
| middleware: 빈 문자열 fallback 제거 (`?? ''` 삭제) | ✅ |
| Vercel 각 위성 앱에 `NEXT_PUBLIC_CLERK_DOMAIN` 설정 | ✅ |
| `@co-at/auth` 공유 미들웨어 (`createAppMiddleware`) | ✅ |

### 보안

| 항목 | 상태 |
|------|------|
| `.claude/settings.local.json` git 추적 해제 | ✅ |
| `repomix-output.*` git 추적 해제 | ✅ |
| Supabase PAT 유출 대응 (폐기 + git 히스토리 삭제) | ✅ |
| GitHub secret scanning 알림 해소 | ✅ |

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
| AI 상담기록 생성 (Gemini) | ⬜ 형식 미결정 |
| 음성 녹음 → STT 연동 | ⬜ |

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
| 대여 만료 알림 (D-7/3/0 Vercel Cron) | ⬜ |
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
| 전년 동기 대비 비교 차트 | ⬜ |
| 팀별 성과 분석 | ⬜ |
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

### 미실행 / 예정 마이그레이션

| 파일명 (예정) | 내용 |
|---------------|------|
| `052_eval_ai_soap.sql` | AI SOAP 노트 저장 테이블 |
| `053_hr_payroll.sql` | 급여 명세서 테이블 |
| `054_approval_workflow.sql` | 결재선 순차 처리 상태 |
| `055_finance_quarters.sql` | 분기 예산 집계 뷰 |

---

## 고도화 백로그

> **개발 집중 앱**: web · admin · eval · inventory · stats
> **개발 보류 앱**: hr · approval · automation (1차 앱 안정화 이후)

### 1차 집중 — 높은 우선순위

- [x] **eval** — Google Sheets → Supabase 마이그레이션 (File import 완료)
- [x] **eval** — 중앙보조기기센터 보고 양식 엑셀 출력 (ExcelJS 완료)
- [x] **eval** — 9개 영역 평가 시스템 + 결과 시각화 완료
- [ ] **eval** — AI 상담기록 생성 (형식 미결정: SOAP 노트 vs 상담기록)
- [ ] **web** — OG 이미지 파일 생성, Google/Naver Search Console 등록
- [x] **모든 앱** — Sentry DSN 환경변수 설정 (코드는 이미 준비됨)

### 1차 집중 — 중간 우선순위

- [ ] **inventory** — 대여 만료 Vercel Cron 알림 (D-7/3/0)
- [ ] **stats** — 전년 동기 대비 차트
- [ ] **stats** — 팀별 성과 분석
- [ ] **packages/ui** — Storybook 문서화
- [ ] **CI** — E2E 테스트 (Playwright)

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
