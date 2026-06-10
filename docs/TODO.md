# Co-AT 모노레포 개발 TODO

> **프로젝트**: GWATC 통합 관리 플랫폼 (Co-AT)
> **비전**: "행정은 AI에게, 사람은 클라이언트에게"
> **아키텍처**: Turborepo 모노레포 — 앱별 독립 배포
> **마지막 업데이트**: 2026-06-10  
**완료**: Phase B (eval 만족도·교육이력, inventory 소독세척, stats 서비스효과성 연동) — 배포 완료 2026-06-03  
**완료**: Phase C (1차 앱 마무리 + 안정화) — 배포 완료 2026-06-03  
**완료**: Phase D-1 (HR 인사관리 기초)  
**완료**: Phase D-2 (HR 급여관리 고도화)  
**완료**: Phase D-3 (HR 근태관리 고도화 — 시간외근무·QR출퇴근·연차잔여)  
**완료**: Phase D-4 (HR 근무현황·휴가캘린더·출장관리·퇴직금정산·월말집계Cron)  
**완료**: Phase D-5 (HR 인사평가·교육훈련·근로계약서·HR통계보고서)

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
14. [Phase E — 조직 혁신](#phase-e--조직-혁신-선진국-보조공학-서비스-참고)
    - E-1. 기능 성과 측정 (K-IPPA)
    - E-2. 당사자 가시성 (Client Portal)
    - E-3. 조직 지식 관리 (Knowledge Management)
    - E-4. 유선 접수 → 챗봇·온라인 설문 전환
    - E-5. 기록 자동화 (화상·음성 → 텍스트·요약, 중복 입력 제거, AI 보고서 초안)
    - E-6. CRM (대상자 생애주기·세그먼트, 의뢰처 B2B, 이메일·문자 자동 발송)
15. [고도화 백로그](#고도화-백로그)

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
| GitHub Actions Node.js 24 opt-in (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`) | ✅ |
| CI build filter에 inventory 추가 | ✅ |
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

### 구현 완료 (추가)

| 기능 | 상태 |
|------|------|
| 9개 영역 평가 시스템 (첨부 21 기반) | ✅ |
| 서비스 만족도 수집 (`satisfaction_score` 1-5점) | ✅ |
| 이용자 교육 이력 페이지 (`/education`, 도메인별 집계) | ✅ |
| 평가 결과 시각화 (허브 그리드 + 도메인 요약) | ✅ |
| Google Sheets → Supabase 데이터 마이그레이션 (File import) | ✅ |
| 중앙보조기기센터 보고 양식 엑셀 출력 (ExcelJS) | ✅ |
| AI 상담기록 생성 (Gemini) | ✅ |
| 음성 녹음 → STT 연동 | ✅ |

### Phase F — 교부사업 적합성 평가 (`/grant-eval`)

> **배경**: 기존 Google Sheets 16개 탭 분산 관리 → 통합 시스템으로 일목요연하게 정리  
> **대상**: 장애인 보조기기 교부사업 대상자 적합성 평가 관리 (1인 연 최대 3품목)  
> **DB 네임스페이스**: `eval_grant_*`, `eval_item_*`

#### DB 마이그레이션

| 파일 | 내용 | 상태 |
|------|------|------|
| `077_create_grant_eval_tables.sql` | `eval_grant_assessments`, `eval_grant_items`, `eval_grant_referral_docs`, `eval_item_checklist_templates` 4개 테이블 + 뷰 + 파이프라인 트리거 | ✅ |

#### F-1. 기반 구축

| 기능 | 상태 |
|------|------|
| DB 마이그레이션 077 적용 + `pnpm gen:types` | ✅ |
| Server Actions — `grant-assessment-actions.ts` (CRUD) | ✅ |
| Server Actions — `grant-item-actions.ts` (CRUD, 최대 3품목 검증) | ✅ |
| Server Actions — `checklist-template-actions.ts` (품목별 체크리스트 로드) | ✅ |
| Server Actions — `grant-referral-actions.ts` (접수공문 CRUD) | ✅ |

#### F-2. 공통 컴포넌트

| 기능 | 파일 | 상태 |
|------|------|------|
| 점수 선택 UI (2/4/6/8/10점 라디오) | `ScoreSelector.tsx` | ✅ |
| 품목별 체크리스트 동적 렌더링 | `ChecklistSection.tsx` | ✅ |
| 품목 1개 카드 (점수 + 체크리스트 + 의견) | `GrantItemCard.tsx` | ✅ |

#### F-3. 평가 상세 탭 (5단계 URL searchParam 방식)

| 탭 | URL | 기능 | 상태 |
|----|-----|------|------|
| 기본정보 | `?tab=basic` | 클라이언트 정보(자동 로드), 기교부 실적, 평가자 정보 | ✅ |
| 신청품목/사용자실태 | `?tab=items` | 1~3개 품목 입력 (카테고리·활용계획·사용환경·사용경험) | ✅ |
| 적정성 평가 | `?tab=suitability` | 품목별 5개 항목 점수(2~10), 총점 자동계산 | ✅ |
| 종합의견 | `?tab=opinion` | 품목별 기본확인사항(체크리스트) + 종합의견 + 변경/취소 사유 | ✅ |
| 평가결과 | `?tab=result` | 최종 결과, 지원금액, PDF 출력 버튼 | ✅ |

#### F-4. 라우트 페이지

| 라우트 | 기능 | 상태 |
|--------|------|------|
| `/grant-eval` | 목록 (연도·기관 필터, 결과 현황) | ✅ |
| `/grant-eval/new` | 새 평가 등록 (클라이언트 검색 → 기본정보 입력) | ✅ |
| `/grant-eval/[id]?tab=...` | 평가 상세 (5탭) | ✅ |
| `/grant-eval/referrals` | 접수공문 목록·등록 | ✅ |
| `/grant-eval/statistics` | 의뢰현황통계 대시보드 (기관별·결과별 집계) | ✅ |
| `/print/grant-eval/[id]` | 평가기록지 PDF 출력 | ✅ |

#### F-5. 연동

| 기능 | 상태 |
|------|------|
| EvalSidebar에 "교부사업 평가" 메뉴 추가 | ✅ |
| stats 앱 — `eval_service_records.is_grant` 트리거 자동 반영 | ✅ |
| 품목별 체크리스트 초기 데이터 SEED (12개 품목 카테고리) | ✅ |

---

## Phase AX — AX 트랜스포메이션 (eval 고도화)

> **배경**: 상담·맞춤형 지원 업무의 AX 전환 — "데이터는 있는데 연결이 없다"는 문제 해결  
> **핵심**: 대상자 한 명이 여러 서비스를 동시에 받는 현실 반영, 케이스 중심 통합 관리  
> **상세 계획**: `docs/superpowers/plans/2026-06-10-ax-phase1-client360.md`

| Phase | 기능 | 우선순위 | 상태 |
|-------|------|---------|------|
| AX-1 | 대상자 360도 프로필 — 진행 중 서비스 통합 뷰 (신규 DB 불필요) | ★★★★ | ✅ |
| AX-2 | 다중 서비스 케이스 구조 (N:M) — `cases` 테이블 + 사업별 칸반 뷰 | ★★★ | ✅ |
| AX-3 | 케이스 타임라인 뷰 — 한 케이스의 모든 활동 연결 | ★★★ | ✅ |
| AX-4 | 진행상황 칸반 보드 — 서비스 유형별 단계 관리 | ★★★ | ✅ |
| AX-5 | 현장 인터뷰 음성 → 양식 자동 채우기 (STT + AI) | ★★★★★ | ✅ |

### AX-1 체크리스트 (Phase 1 — 대상자 360도 프로필)

| 기능 | 상태 |
|------|------|
| `getClientActiveServices` 서버 액션 (grant_eval·rental·custom_make·application 통합 조회) | ✅ |
| `ClientActiveServices` 컴포넌트 (활성 서비스 카드 그리드) | ✅ |
| 클라이언트 상세 페이지 개편 (진행 중 서비스 섹션 추가) | ✅ |
| 사업별 뷰에서 타 서비스 배지 표시 (교부사업 평가 목록 등) | ⬜ |

---

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
| 소독·세척 전용 페이지 (`/cleaning`) — 기기별 마지막 세척일 + 일괄 기록 | ✅ |
| 재고 부족 알림 Cron (`/api/cron/stock-alert`, 매일 09:00 KST) | ✅ |

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
| EvalScoreWidget 서비스효과성(5점) — 만족도 평균 연동 | ✅ |
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

### Phase D-1 — 인사관리 기초

| 기능 | 상태 |
|------|------|
| DB Migration 067 (hr_departments, hr_positions, hr_salary_steps, hr_salary_step_history) | ✅ |
| 사이드바 카테고리 토글 재구성 | ✅ |
| 부서등록 페이지 (`/departments`) | ✅ |
| 직급등록 페이지 (`/positions`) | ✅ |
| 호봉등록 페이지 (`/salary-steps`) | ✅ |
| 호봉승급 페이지 (`/salary-step-promotions`) | ✅ |
| 인사정보현황 페이지 (`/employees/status`) | ✅ |

### Phase D-5 (인사개발)

| 기능 | 상태 |
|------|------|
| DB migration 072 (hr_evaluations) | ✅ |
| DB migration 073 (hr_trainings, hr_training_attendees) | ✅ |
| DB migration 074 (hr_contracts) | ✅ |
| 인사평가 시스템 (`/performance`) — 중간·연말 평가, 등급/점수, 확정 워크플로우 | ✅ |
| 교육훈련 관리 (`/training`) — 의무·자율·외부 교육, 참석자 관리 | ✅ |
| 근로계약서 관리 (`/contracts`) — 최초·갱신·변경, 만료 30일 알림 | ✅ |
| HR 통계·보고서 (`/hr-stats`) — 부서별 인원·고용형태·입퇴사 추이·근속연수 차트 | ✅ |
| 사이드바 인사개발 카테고리 추가 | ✅ |

### Phase D-2 ~ D-4 (예정)

| 기능 | 상태 |
|------|------|
| `@react-pdf/renderer` 설치 + 장기요양보험 계산 추가 | ✅ |
| DB migration 068 (bank_account, hr_pay_items, hr_pay_groups) | ✅ |
| 사이드바 급여관리 카테고리 확장 | ✅ |
| 지급공제항목 등록 페이지 (`/salary/pay-items`) | ✅ |
| 급상여생성 페이지 (`/salary/generate`) | ✅ |
| 급여대장 페이지 (`/salary/ledger`) | ✅ |
| 사원별 급여명세서 (`/salary/slips`) | ✅ |
| 급여명세서 PDF (`SalarySlipPDF` + 다운로드) | ✅ |
| 급여지급현황 (`/salary/payment-status`) | ✅ |
| 급여계좌이체명세서 (`/salary/transfer-list`) | ✅ |
| 근로소득원천징수부 (`/salary/withholding-tax`) | ✅ |
| 시간외근무 등록/관리/수당처리, 주52시간 체크 | ✅ |
| 연차 자동 생성 (입사일 기준), 출근부, 근무통계 | ✅ |
| QR 모바일 출퇴근 (지문인식기 연동 준비) | ✅ |
| 사용자별 근무현황, 휴가캘린더, 출장관리 | ✅ |
| 퇴직급정산, 퇴직정산현황 | ✅ |
| 근태 자동 집계 (월말 정산) | ✅ |

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

### 완료된 마이그레이션 (058 ~ 082)

| 파일명 | 내용 | 상태 |
|--------|------|------|
| `066_add_satisfaction_score.sql` | `eval_service_records`에 `satisfaction_score` (1-5), `satisfaction_comment` 추가 | ✅ |
| `077_create_grant_eval_tables.sql` | `eval_grant_assessments`, `eval_grant_items`, `eval_grant_referral_docs`, `eval_item_checklist_templates` + 뷰 + 트리거 | ✅ |
| `081_create_eval_cases.sql` | `eval_cases` 테이블 (AX-2 다중 서비스 케이스 구조) | ✅ |
| `082_sync_grant_eval_to_service_records.sql` | `eval_grant_assessments` → `eval_service_records` 자동 동기화 트리거 (`is_grant=true`) | ✅ |
| `083_create_eval_ippa_assessments.sql` | `eval_ippa_assessments` 테이블 (K-IPPA 기능 성과 측정) + RLS + updated_at 트리거 | ✅ |

### 미실행 / 예정 마이그레이션

| 파일명 (예정) | 내용 |
|---------------|------|
| `058_eval_ai_soap.sql` | AI SOAP 노트 저장 테이블 |

---

## Phase E — 조직 혁신 (선진국 보조공학 서비스 참고)

> **비전**: "서비스 건수 집계" → "대상자 삶의 변화 측정" + "당사자 주도 서비스" + "조직 지식 축적"
> **참고 모델**: 호주 NDIS · 스웨덴 Hjälpmedel · 캐나다 AAACT · 미국 AT Network · 국립재활원 K-IPPA

---

### E-1. 기능 성과 측정 (Functional Outcome) — eval 앱 고도화

> **핵심 전환**: "대여 47건" → "외출 자립도 향상 82%" — 지자체·복지부 보고의 차별화 무기

#### K-IPPA (한국판 개별 우선 문제 평가 / Korean-IPPA)

> 네덜란드 Wessels 등이 개발한 IPPA의 한국판. 국립재활원 표준 AT 성과 도구.
> 대상자가 보조기기 지원 전·후 활동 수행 어려움을 자가 보고하는 당사자 중심 평가.
>
> **측정 방법**
> 1. 3~5개 활동 문제 영역 선정 (대상자 직접 선정)
> 2. 5점 척도 사전 측정 (0 = 어려움 없음, 5 = 전혀 할 수 없음)
> 3. 보조기기 지원 후 4~6주 경과 → 동일 척도 사후 측정
> 4. 성과 점수 = Σ(사전점수 − 사후점수) / 문제 수  *(양수일수록 개선)*
> 5. 집단 비교 시 t-검정 또는 Wilcoxon 부호 순위 검정 활용

| 기능 | 상태 |
|------|------|
| DB migration 083: `eval_ippa_assessments` 테이블 + RLS + 트리거 | ✅ |
| K-IPPA 평가 폼 — 활동 문제 3~5개 선정 + 5점 척도 입력 | ✅ |
| 사전(Pre) 측정 → 보조기기 지원 → 사후(Post) 측정 워크플로우 | ✅ |
| K-IPPA 성과 점수 자동 계산 (Σ(pre-post)/n) | ✅ |
| `/clients/[id]` 상세 페이지 → K-IPPA 섹션 추가 | ✅ |
| 시각화 (레이더 차트 — 순수 SVG, 사전/사후 비교) | ✅ |
| 팔로업 알림 Cron — 지원일 +4주/+12주/+24주 자동 안내 | ⬜ |
| 기관 전체 K-IPPA 집계 → stats 앱 대시보드 연동 | ⬜ |

#### 보완 성과 도구 (선택 적용)

| 도구 | 설명 | 상태 |
|------|------|------|
| GAS (Goal Attainment Scaling) | 개인 목표 설정 + 달성도 -2~+2 척도 | ⬜ |
| COPM (캐나다 작업 수행 측정) | 수행도·만족도 10점 척도, 재활 분야 국제 표준 | ⬜ |
| 기존 만족도(1~5점) → K-IPPA와 통합 집계 | 현행 satisfaction_score 유지·연계 | ⬜ |

---

### E-2. 당사자 가시성 (Client Visibility) — web 앱 확장

> **참고**: 스웨덴 Hjälpmedel — 대상자가 온라인으로 대여 현황·반납일·수리 요청 직접 조회·신청
> **효과**: 직원 전화 안내 시간 절감 + 대상자 자립성·신뢰도 향상

| 기능 | 상태 |
|------|------|
| 대상자 마이페이지 — 본인 서비스 이력 전체 조회 (web 앱 `/my-services`) | ⬜ |
| 보조기기 대여 현황 + 반납일 안내 + 연장 신청 | ⬜ |
| 서비스 진행 상황 실시간 상태 표시 (접수→검토→지원→완료) | ⬜ |
| 상담 예약 셀프 신청 (일정 선택 → 직원 확정) | ⬜ |
| K-IPPA 사후 측정 셀프 제출 (링크 발송 → 대상자 직접 응답) | ⬜ |
| SMS/카카오 알림 — 서비스 상태 변경 시 자동 발송 (automation 앱 연동) | ⬜ |

---

### E-3. 조직 지식 관리 (Knowledge Management) — eval 앱 고도화

> **참고**: 캐나다 AAACT · RESNA — 임상 지식이 직원 노트가 아닌 시스템에 축적
> **효과**: 숙련 직원 퇴사 후에도 기관 노하우 보존 + 신규 직원 온보딩 가속

| 기능 | 상태 |
|------|------|
| 유사 케이스 추천 — 장애유형 + 주요 활동 제한 기준 유사 대상자 이력 조회 | ⬜ |
| 보조기기별 지원 결과 이력 — "이 제품, 이 장애유형에서 성과점수 평균" | ⬜ |
| 담당자 변경 시 인수인계 자동화 — 이력·K-IPPA·메모 자동 승계 | ⬜ |
| 케이스 노트 표준화 — SOAP/DAP 구조화 템플릿 (AI 초안 생성) | ⬜ |
| 품목별 지식베이스 — 적용 사례·주의사항·제조사 연락처 DB | ⬜ |

---

### E-4. 유선 접수 → 챗봇·온라인 설문 전환 — web 앱 + eval 앱 연동

> **현재**: 대상자가 전화로 문의 → 직원이 수기 상담일지 작성 → eval 앱에 수동 입력
> **목표**: 대상자가 챗봇·온라인 폼으로 자가 접수 → eval 앱 콜로그·서비스 기록 자동 생성
> **효과**: 직원 유선 응대 시간 절감 + 24시간 접수 가능 + 데이터 정합성 향상

#### 단계 1 — 온라인 설문·자가 접수 폼 (web 앱)

| 기능 | 상태 |
|------|------|
| 보조기기 필요 자가 진단 설문 (장애유형·주요 활동 제한·필요 기기 영역) | ⬜ |
| 서비스 신청 폼 → eval 앱 대기 접수(`status: pending`) 자동 생성 | ⬜ |
| 접수 완료 SMS/이메일 자동 발송 + 담당자 배정 알림 | ⬜ |
| 중복 접수 방지 (이름+생년월일 기준 기존 대상자 매칭) | ⬜ |

#### 단계 2 — AI 챗봇 상담 채널 (web 앱)

| 기능 | 상태 |
|------|------|
| 공개 포털 챗봇 — 보조기기 종류·신청 자격·절차 FAQ 자동 응답 | ⬜ |
| 챗봇 대화 중 "신청하기" 전환 → 온라인 폼 연결 | ⬜ |
| 챗봇 대화 내용 → eval 앱 콜로그(`call_logs`) 자동 저장 | ⬜ |
| 야간·주말 챗봇 응대 → 익일 담당자 배정 큐 | ⬜ |
| 챗봇 엔진: Gemini 기반 (기존 agent-chat 인프라 재활용) | ⬜ |

#### 단계 3 — eval 앱 자동 연동

| 기능 | 상태 |
|------|------|
| 온라인 접수 → eval 콜로그 자동 생성 (채널: `web`, `chatbot`) | ⬜ |
| 설문 응답 → 대상자 기본 정보 사전 입력 (직원 확인 후 확정) | ⬜ |
| 접수 → 배정 → 상담 → 서비스 진행 상태 대시보드 (eval 앱) | ⬜ |
| 유선/온라인/챗봇 채널별 접수 현황 통계 (stats 앱 연동) | ⬜ |

---

### E-5. 기록 자동화 — 직원 행정 시간 → 서비스 준비 시간으로 전환

> **목표**: 건당 45~90분 소요 기록 작업을 10분 이내로 단축
> **원칙**: 직원은 확인·서명만, 생성·분류·요약은 AI가

#### [기반 기술] 화상·음성 대화 → 텍스트 변환 + AI 요약

> 모든 E-5 자동화의 입력 원천. 이 기반 위에서 아래 기능들이 동작함.
> **활용 범위**: 유선 상담·화상 평가·방문 상담·팀 회의록·외부 기관 협의

| 기능 | 상태 |
|------|------|
| 화상 상담 녹화 → 자동 STT 변환 (Whisper API 또는 Google STT) | ⬜ |
| 음성 통화 녹음 → 텍스트 저장 (`eval_session_transcripts` 테이블) | ⬜ |
| AI 요약 자동 생성 — 주요 호소·요청 기기·합의 사항·다음 단계 추출 | ⬜ |
| 요약본 → 콜로그·서비스 기록·사례노트 자동 연결 (직원 확인 후 확정) | ⬜ |
| 대화록 전문 보관 + 검색 (대상자별 히스토리 조회) | ⬜ |
| 개인정보 마스킹 자동 처리 (주민번호·연락처 → `***`) | ⬜ |
| 녹취 동의 수집 플로우 (상담 시작 전 안내 + 동의 기록) | ⬜ |

#### 중복 입력 제거 — 원천 데이터 단일화

> 상담 1회 입력 → 콜로그·서비스 기록·보고서 자동 파생. 현재 동일 데이터 3회 입력

| 기능 | 상태 |
|------|------|
| 콜로그 저장 → 서비스 기록 초안 자동 생성 (서비스 구분·제품명 연동) | ⬜ |
| 서비스 기록 확정 → 중앙보조기기센터 보고 양식 자동 집계 | ⬜ |
| 상담 → 평가 → 지원 → 모니터링 단계별 데이터 자동 승계 | ⬜ |

#### AI 사례노트·평가 보고서 초안 자동 생성

> 구조화된 데이터 + 대화 요약 → AI 초안 → 직원 검토·서명

| 기능 | 상태 |
|------|------|
| 9개 영역 평가 점수 + K-IPPA → 평가 보고서 초안 (Gemini) | ⬜ |
| 상담 메모 + 서비스 구분 → 사례관리 일지 초안 | ⬜ |
| 서비스 완료 상태 변경 → 서비스 완료 노트 자동 생성 | ⬜ |
| 팔로업 방문 기록 → 모니터링 보고서 초안 | ⬜ |
| AI 초안 → PDF 출력 (직원 서명란 포함) | ⬜ |

#### 스마트 템플릿 — 컨텍스트 기반 자동 로드

> 조건 선택 시 해당 맥락에 맞는 기본값·체크리스트·담당자 자동 설정

| 기능 | 상태 |
|------|------|
| 서비스 구분 선택 → 관련 체크리스트·문서 양식 자동 표시 | ⬜ |
| 장애유형 선택 → 전문 담당자 자동 배정 추천 | ⬜ |
| "대여" 선택 → 반납일 자동 계산 + 소독 일정 + D-7 Cron 자동 등록 | ⬜ |
| 유사 케이스 기반 보조기기 추천 후보 자동 표시 (E-3 지식베이스 연동) | ⬜ |

---

### E-6. 고객 관계 관리 (CRM) — eval 앱 확장

> **대상**: 대상자·보호자(내부 CRM) + 의뢰처·협력 기관(외부 B2B CRM)
> **위치**: eval 앱 `/clients` 고도화 + `/referrers` 신규 섹션
> **연동**: automation 앱 (이메일·SMS 발송 채널)

#### 대상자 CRM 고도화 (eval `/clients` 확장)

> 현재 eval 앱에 목록·기록이 있으나 관계 관리 관점의 기능 부재

| 기능 | 상태 |
|------|------|
| 생애주기 상태 관리 — 접수 → 활성 → 종결 → 재접수 전환 추적 | ⬜ |
| 장기 미접촉 대상자 자동 감지 — 6개월 이상 연락 없음 알림 (Cron) | ⬜ |
| 의뢰 경로 추적 — 병원·복지관·자가 접수·챗봇 등 유입 경로 기록 | ⬜ |
| 대상자 세그먼트 — 장애유형·지역·서비스 유형별 그룹핑 + 필터 | ⬜ |
| 보호자·가족 다중 연락처 — 대상자 1명에 복수 연락처 체계적 관리 | ⬜ |
| 대상자 태그 시스템 — 자유 태그 부여 (예: 우선지원, 모니터링필요, VIP) | ⬜ |
| 서비스 이용 이력 타임라인 — 상담·평가·지원·모니터링 전체 흐름 한눈에 | ⬜ |

#### 의뢰처·파트너 CRM (eval `/referrers` 신규)

> 병원·복지관·학교·지자체 등 외부 의뢰 기관 관계 관리 — 현재 전무

| 기능 | 상태 |
|------|------|
| 의뢰 기관 등록 — 기관명·유형·주소·대표 연락처 | ⬜ |
| 기관 담당자 관리 — 사회복지사·담당자 다중 등록, 이직 시 인수인계 | ⬜ |
| 기관별 의뢰 건수·성과 추적 — "A병원 올해 23건 의뢰, 완료율 87%" | ⬜ |
| 협력 활동 이력 — MOU·합동 교육·자문·방문 기록 | ⬜ |
| 분기별 성과 리포트 자동 생성 → 의뢰처 이메일 자동 발송 | ⬜ |
| 의뢰처별 대기 현황 공유 — 현재 대기 건수·예상 소요 기간 안내 | ⬜ |

#### 이메일·문자 발송 CRM (automation 앱 연동)

> 대상자·보호자에게 서비스 단계별 알림을 자동 발송
> **발송 채널**: 이메일(SendGrid/Resend) + 문자(알리고/NHN Cloud) + 카카오 알림톡

| 기능 | 상태 |
|------|------|
| 서비스 상태 변경 시 자동 알림 — 접수확인·배정·지원완료·모니터링 예정 | ⬜ |
| 대여 반납 D-7·D-3·D-0 문자 자동 발송 (대상자·보호자 동시) | ⬜ |
| K-IPPA 사후 측정 안내 — 지원 후 4주·12주·24주 자동 발송 (E-1 연동) | ⬜ |
| 장기 미접촉 대상자 안부 문자 — 6개월 미접촉 시 자동 발송 | ⬜ |
| 정기 뉴스레터 — 신규 보조기기 정보·교육 일정 이메일 발송 | ⬜ |
| 의뢰처 분기 리포트 이메일 자동 발송 (위 B2B CRM 연동) | ⬜ |
| 발송 이력 관리 — 수신 확인·열람률·클릭률 추적 | ⬜ |
| 수신 거부 관리 — 옵트아웃 처리 + 개인정보보호법 준수 | ⬜ |

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
- [x] **모든 앱** — Sentry DSN 환경변수 설정 (`NEXT_PUBLIC_SENTRY_DSN` Vercel 환경변수에 설정 완료)

### 1차 집중 — 중간 우선순위

- [x] **inventory** — 대여 만료 Vercel Cron 알림 (D-7/3/0)
- [x] **stats** — 전년 동기 대비 차트

### DB 정리 (기술 부채)

> 2026-06-10 분석 완료. 아래 항목은 기능 개발 여유 시 정리.

#### 레거시 테이블 삭제 검토 (0행 + 기능 대체됨)

| 테이블 | 대체 테이블 | 비고 |
|--------|-------------|------|
| `service_logs` | `eval_service_records` | applications 기반 구버전 |
| `applications` | `clients` | 0행, 설계 전환 후 미사용 |
| `equipment` | `inventory` | 0행, 용도 불명 |
| `custom_makes` | `inventory_custom_orders` | 동일 기능 재구현됨 |
| `custom_make_progress` | `inventory_custom_orders` | 동일 |
| `rentals` | inventory 앱에서 재구현 예정 | 0행 |
| `schedules` | — | 0행 (schedule_categories만 18행 존재) |
| `regulations` | — | 0행, 활용 계획 없음 |
| `client_voc` | — | 0행 |
| `meeting_minutes` | — | 0행 |
| `resources` | — | 0행 |
| `notice_reads` | — | 0행 |

> ⚠️ `applications`는 `intake_records`, `domain_assessments`, `process_logs`가 FK로 참조 중 — 삭제 전 해당 3개 테이블도 함께 정리 필요

#### 마이그레이션 역추출 완료 (078)
- `intake_records`, `domain_assessments`, `process_logs` — applications 기반 평가 워크플로우 (0행)
- `supplies`, `supply_transactions` — 소모품 재고 관리 (0행)

---

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
