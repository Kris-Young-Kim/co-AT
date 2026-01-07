# 📋 Co-AT 프로젝트 개발 TODO

> **프로젝트**: GWATC 통합 관리 플랫폼 (Co-AT)  
> **비전**: "행정은 AI에게, 사람은 클라이언트에게"  
> **기술 스택**: Next.js 15, Clerk, Supabase, Gemini Flash  
> **작성일**: 2025. 12. 06
> **마지막 업데이트**: 2025. 01. 27

---

## 📚 목차

1. [완료된 Phase (1-11)](#완료된-phase-1-11)
2. [진행 중/미완료 작업](#진행-중미완료-작업)
3. [Phase 12+: 고도화 아이디어](#phase-12-고도화-아이디어)
4. [참고 자료](#참고-자료)

---

## ✅ 완료된 Phase (1-11)

### 🚀 Phase 1: 기반 구축 ✅

- [x] 프로젝트 초기 설정 (Next.js 15, TypeScript, Tailwind CSS, ESLint)
- [x] 인증 시스템 (Clerk 연동, Webhook 설정)
- [x] 데이터베이스 설정 (Supabase, 마이그레이션, RLS, 타입 생성)
- [x] UI 기반 설정 (shadcn/ui, Pretendard 폰트, Tailwind Config)
- [x] 레이아웃 컴포넌트 (Public/Admin/Portal 헤더, 사이드바, 모바일 네비게이션)
- [x] 공통 컴포넌트 (로고, 로딩 스피너, 상태 뱃지, 파일 업로더)

### 🎯 Phase 2: Public Zone (대민 서비스) ✅

- [x] 랜딩 페이지 (Hero, Quick Menu, 공지사항 탭, 갤러리, 공개 캘린더)
- [x] 서비스 신청 시스템 (8개 폼 컴포넌트, Wizard, Zustand Store, Zod 검증)
- [x] 마이페이지 (신청 이력 타임라인, 대여 상태)
- [x] 공지사항 (목록/상세, 관리자 CRUD, 공유 기능)

### 🏢 Phase 3: Admin Zone (업무 시스템) ✅

- [x] 통합 대시보드 (KPI, 신규 접수, 오늘 일정, React Query)
- [x] 대상자 CRM (검색, 상세 정보, 서비스 이력)
- [x] 상담 기록 시스템 (동적 양식 빌더, 템플릿 관리)
- [x] 평가 시스템 (9개 영역 평가, 결과 시각화)
- [x] 서비스 진행 기록 (통합 대시보드, 타임라인, 필터링, 엑스포트)

### 🤖 Phase 4: AI 기능 구현 ✅

- [x] AI SOAP 노트 생성 (Gemini 연동, 음성 녹음, STT)
- [x] RAG 챗봇 (규정 검색 AI)
  - [x] 문서 벡터화 (`regulations` 테이블, Gemini Embedding)
  - [x] 유사도 검색 및 답변 생성
  - [x] 챗봇 UI (`/admin/chatbot`)

### 📦 Phase 5: 재고 관리 시스템 ✅

- [x] 재고 관리 (CRUD, QR 코드 생성/스캔, 통계 대시보드)
- [x] 대여 관리 (대여/반납/연장, D-Day 계산, 알림)
- [x] 맞춤제작 관리 (프로젝트 생성, 진행도 추적, 장비 배정)
- [x] 장비 관리 (장비 CRUD, 상태 관리, 통계)

### 💼 Phase 6: 비즈니스 로직 구현 ✅

- [x] 한도 체크 로직
  - [x] 수리비 10만원 한도 체크
  - [x] 맞춤제작 연 2회 횟수 제한
  - [x] 맞춤제작비 10만원 한도 체크 (재료비 기준)
- [x] 개인정보 보유 기간 관리 (5년 만료 알림)

### 📅 Phase 7: 일정 관리 ✅

- [x] 캘린더 시스템 (월간/주간/일간 뷰, 일정 CRUD)

### 🎨 Phase 8: UI/UX 개선 및 반응형 ✅

- [x] 모바일 최적화 (반응형, 터치 최적화, Safe Area)
- [x] 접근성 (A11y) (접근성 툴바, 키보드 네비게이션, ARIA 레이블, 색상 대비)

### 🧪 Phase 9: 테스트 및 안정화 ✅

- [x] 기능 테스트 (Vitest, 22개 테스트 통과)
- [x] 성능 최적화 (이미지 최적화, 코드 스플리팅, React Query 캐싱)
- [x] 보안 점검 (RLS 정책, API Key 보안, XSS/CSRF 방어)

### 📊 Phase 10: 통계 및 보고서 ✅

- [x] 통계 대시보드 (5대 사업별 실적, 월별/연도별 통계, recharts)
- [x] Excel 내보내기 (사업 실적 보고서 자동 생성)

### 🚀 Phase 11: 배포 준비 ✅

- [x] 환경 설정 (Vercel, 환경 변수, 도메인)
- [x] CI/CD (GitHub Actions, 자동 배포, 템플릿)
- [x] 문서화 (사용자 매뉴얼, 관리자 가이드, API 문서)

---

## 🔄 진행 중/미완료 작업

### Phase 5: 맞춤제작 관리

- [x] 일정 관리 연동 ✅
  - [x] 제작 일정과 `schedules` 테이블 연동 ✅
  - [x] 캘린더에 제작 일정 표시 ✅
  - [x] 맞춤제작 프로젝트 생성/수정 시 일정 자동 생성 ✅
  - [x] `migrations/013_add_custom_make_schedule_type.sql` 마이그레이션 생성 ✅

### Phase 6: 비즈니스 로직

- [x] 수리비 입력 폼에 한도 체크 통합 (`service_logs` 생성 시) ✅
  - [x] `actions/service-log-actions.ts` 생성 (createServiceLog, updateServiceLog) ✅
  - [x] 수리비 한도 체크 통합 (checkRepairLimit) ✅
  - [x] 한도 초과 시 경고 정보 반환 (UI에서 경고 다이얼로그 표시 가능) ✅

### Phase 8: 접근성

- [ ] 스크린 리더 테스트 (NVDA, JAWS) - 수동 테스트 필요

---

## 🚀 Phase 12+: 고도화 아이디어

> **현재 상태**: Phase 1-11 완료, 기본 기능 구현 완료  
> **목표**: 사용자 경험 개선, 업무 효율성 향상, 데이터 활용 극대화

### 📊 우선순위별 정리

#### ⭐⭐⭐ 즉시 구현 권장 (High Priority)

**SaaS 안정화** (최우선):

1. **모니터링 및 로깅 시스템**

   - Sentry 통합 (에러 추적)
   - 구조화된 로깅 (JSON, 로그 레벨 관리)
   - Vercel Analytics (페이지 로딩, Core Web Vitals)
   - Supabase Monitoring (DB 쿼리 성능)

2. **에러 처리 및 복구 메커니즘**

   - React Error Boundary 강화
   - 자동 재시도 로직 (지수 백오프)
   - 에러 알림 시스템 (Slack/Discord 웹훅)

3. **헬스 체크 및 상태 페이지**

   - `/api/health` 엔드포인트 (서버, DB, Auth, AI 상태)
   - 공개 상태 페이지 (`status.co-at-gw.vercel.app`)
   - Uptime 모니터링 (UptimeRobot/Pingdom)

4. **Rate Limiting 및 DDoS 방어**

   - Vercel Edge Middleware (IP 기반 제한)
   - 사용자별 Rate Limit (Clerk ID 기반)
   - 엔드포인트별 제한 (AI 생성 API 등)

5. **데이터베이스 최적화 및 모니터링**

   - 슬로우 쿼리 로깅 (1초 이상)
   - 인덱스 최적화
   - 연결 풀 모니터링

6. **재해 복구 계획 (Disaster Recovery)**

   - RTO: 4시간, RPO: 1시간 목표
   - 다중 백업 (일일, 주간, 월간)
   - 분기별 복구 테스트

7. **보안 모니터링 및 위협 탐지**
   - 로그인 시도 추적
   - SQL Injection/XSS 공격 탐지
   - 크리티컬 보안 이벤트 알림

**기능 고도화**:

1. **실시간 알림 시스템**

   - Supabase Realtime 활용
   - 알림 센터 (모든 알림 통합 관리)
   - 대여 만료 알림 (D-Day 7일 전, 3일 전, 당일)

2. **워크플로우 자동화**

   - 상태 전환 자동화 (상담 완료 → 배정)
   - 일정 자동 생성 (신청 접수 시)
   - 리마인더 자동 발송

3. **감사 로그 (Audit Log)**

   - 모든 데이터 변경 이력 기록
   - 로그 조회 기능
   - 의심스러운 활동 알림

4. **고급 대시보드**
   - 실시간 KPI 모니터링
   - 전년 동기 대비 실적 비교
   - 팀별 성과 분석
   - 예산 집행 현황

#### ⭐⭐ 중기 구현 권장 (Medium Priority)

1. **AI 기기 추천 시스템** - 대상자 정보 분석 기반 맞춤형 추천
2. **예측 분석** - 수리 예측, 대여 패턴 분석, 대상자 니즈 예측
3. **스마트 일정 관리** - 자동 일정 제안, 충돌 방지, 최적 경로 계산
4. **모바일 앱 (PWA)** - 오프라인 지원, 홈 화면 추가, QR 코드 스캔 강화
5. **자동 보고서 생성** - AI 기반 보고서 초안 생성, 인사이트 추출
6. **데이터 시각화 강화** - 인터랙티브 차트, 지도 시각화, 타임라인 뷰, 히트맵
7. **검색 기능 강화** - 전문 검색 (PostgreSQL tsvector), 자동완성
8. **CI/CD 파이프라인 고도화** - E2E 테스트, 성능 테스트, Preview 배포
9. **사용자 지원 시스템** - 티켓 시스템, 피드백 수집, 지식 베이스

#### ⭐ 장기 구현 검토 (Low Priority)

1. **외부 시스템 연동** - 전자정부 시스템, 의료기관, 카카오톡 알림톡, SMS
2. **다국어 지원** - i18n 구현 (한국어, 영어, 중국어)
3. **음성 인터페이스** - 음성 명령, 음성 입력, 스크린 리더 연동
4. **API 공개 (Public API)** - RESTful API, API 키 관리, Swagger 문서화
5. **소셜 미디어 연동** - 유튜브 자동 연동, 인스타그램 피드
6. **캐싱 전략 고도화** - Redis 캐싱, CDN 활용
7. **대용량 데이터 처리** - 무한 스크롤, 배치 처리, 데이터 아카이빙
8. **SLO/SLI 모니터링** - 가용성 목표 99.5%, 응답 시간 목표 2초 이내
9. **성능 모니터링 및 최적화** - Core Web Vitals 모니터링, 리소스 최적화

---

## 📚 참고 자료

### 접근성 가이드

- **WCAG 2.1 AA 수준** 준수
- 구현된 기능: 화면 확대/축소, 고대비 모드, 음성 출력 (TTS), 키보드 스캔 모드
- 상세 가이드: `docs/ACCESSIBILITY_GUIDE.md`

### 데이터베이스 스키마

- **Supabase MCP**: `supabase-co-AT`
- **Project Ref**: `uyjbndiwyddjyjkdfuyi`
- **타입 생성**: `npm run gen:types`
- **마이그레이션 파일**: `migrations/002~012_create_*.sql`
- **주요 테이블**: profiles, clients, applications, inventory, schedules, notices, rentals, custom_makes, equipment, regulations

### 개발 컨벤션

- **Spacing-First 정책**: padding/gap 우선 사용
- **컴포넌트 네이밍**: `[Domain][Role][Variant]` 형식
- **타입 안전성**: `any` 타입 사용 금지, Zod 스키마 검증
- **Next.js 16 준수**: `await params`, Server Actions 우선, Server Components 우선
- **로깅**: 구조화된 로그 (118건 확인)

### 문서

- **MRD.md**: 시장 요구사항, 5대 사업 정의
- **PRD.md**: 기능 명세, UI/UX 가이드
- **TRD.md**: 기술 설계, 아키텍처
- **USER_MANUAL.md**: 사용자 매뉴얼
- **ADMIN_GUIDE.md**: 관리자 가이드
- **API_DOCUMENTATION.md**: API 문서
- **SECURITY_GUIDE.md**: 보안 가이드
- **보조기기센터사업안내.md**: 실제 업무 규정 및 양식

---

## ✅ 완료 기준 (Definition of Done)

각 Phase 완료 시 확인:

- [x] 기능이 요구사항대로 동작하는가? ✅
- [x] 타입 에러가 없는가? ⚠️ (일부 database types 관련 개선 필요)
- [x] 린트 에러가 없는가? ⚠️ (사용하지 않는 변수 정리 필요)
- [x] 모바일 반응형이 적용되었는가? ✅
- [x] 핵심 기능에 로그가 추가되었는가? ✅
- [x] Spacing-First 정책을 준수했는가? ✅

---

## 🔒 SaaS 안정화 체크리스트

### 필수 항목 (Must Have)

- [ ] 에러 추적 시스템 (Sentry)
- [ ] 헬스 체크 엔드포인트
- [ ] 상태 페이지
- [ ] Rate Limiting
- [ ] 데이터베이스 백업 자동화
- [ ] 재해 복구 계획 문서화
- [ ] 보안 모니터링 시스템

### 권장 항목 (Should Have)

- [ ] APM (Application Performance Monitoring)
- [ ] Uptime 모니터링
- [ ] 자동 재시도 로직
- [ ] 쿼리 성능 최적화
- [ ] CI/CD 파이프라인 고도화

### 선택 항목 (Nice to Have)

- [ ] SLO/SLI 모니터링
- [ ] 사용자 지원 티켓 시스템
- [ ] Core Web Vitals 모니터링
- [ ] Feature Flags

---

**마지막 업데이트**: 2025. 01. 27
