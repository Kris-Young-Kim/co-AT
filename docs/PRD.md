📝 Co-AT: Product Requirements Document (v3.0)
Refined with Unified Development Guidelines
프로젝트 정보 내용
프로젝트명 GWATC 통합 케어 플랫폼 (Co-AT)
버전 v3.0 (Boilerplate Applied)
작성일 2025년 12월 06일
기술 스택 Next.js 15, Clerk, Supabase, React Query, Zustand
스타일링 Tailwind CSS, Shadcn UI (Spacing-First)

1. 개요 (Overview)
   1.1. 목적
   GWATC의 5대 핵심 사업(상담, 체험, 맞춤형, 사후관리, 교육홍보)을 위한 O2O 통합 협업 플랫폼 구축.
   통합 개발 가이드라인을 준수하여 유지보수성, 확장성, 타입 안전성이 보장된 코드를 작성한다.
   1.2. 핵심 아키텍처 원칙
   SOLID & Declarative: 로직(Hook), 데이터 변환(Util), UI(Component)의 철저한 분리.
   Next.js 15 Native: App Router, Server Actions, await params 패턴 준수.
   Strict Typing: Database Schema부터 Zod Validation까지 End-to-End 타입 안전성 확보.
2. 기술 스택 및 라이브러리 (Tech Specification)
   가이드라인에 명시된 라이브러리를 확정하여 사용한다.
   분류 라이브러리 용도
   Framework Next.js 15 App Router, Server Components
   Auth Clerk 인증 및 세션 관리 (Middleware 연동)
   DB / Backend Supabase PostgreSQL, Realtime, Edge Functions
   Server State @tanstack/react-query 서버 데이터 캐싱 및 동기화
   Client State Zustand 전역 상태 (장바구니, 신청 마법사 단계 등)
   Form React Hook Form + Zod 폼 제어 및 스키마 검증
   Styling Tailwind CSS + clsx 유틸리티 스타일링 (Spacing-First 준수)
   UI Kit Shadcn UI 기본 UI 컴포넌트 (Button, Card, Dialog)
   Date date-fns 날짜 포맷팅 및 계산
3. 도메인별 컴포넌트 설계 (Component Architecture)
   네이밍 규칙: [Domain][Role][Variant] (PascalCase) 적용.
   3.1. Public Domain (대민 서비스)
   Landing Page:
   HomeHeroSection: 메인 비주얼 및 슬로건.
   HomeQuickMenuGrid: 5대 사업 바로가기 그리드 (gap-4 md:gap-6).
   HomeNoticeTabs: 공지사항/지원사업 탭 컴포넌트.
   HomePublicCalendar: 공개 캘린더 (견학 일정, 교육 일정 표시 및 예약).
   Service Application (신청):
   ServiceApplicationWizard: 신청 단계 관리 컨테이너.
   ServiceCategorySelector: 5대 사업 카테고리 선택 카드.
   ServiceRepairForm: 수리 신청 전용 폼 (react-hook-form).
   ServiceRentDatepicker: 대여 기간 선택 (date-fns 활용).
   3.2. Client Portal Domain (마이페이지)
   ClientTimelineList: 신청 이력 타임라인 리스트.
   ClientTimelineItem: 개별 이력 카드 (상태별 색상 분기 로직 포함).
   ClientRentStatus: 대여 중인 기기 반납 D-Day 표시.
   3.3. Staff Admin Domain (업무 시스템)
   Dashboard:
   AdminDashboardKpi: 오늘의 실적 요약 카드.
   AdminNewRequestList: 신규 접수 건 리스트.
   CRM (Client Relationship Management):
   ClientProfileCard: 대상자 기본 정보 표시.
   ClientHistoryTable: 서비스 이용 이력 테이블.
   AI Log:
   SoapNoteEditor: AI 결과 수정 및 저장 에디터.
   SoapAudioRecorder: 음성 녹음 컴포넌트.
4. 상세 기능 명세 (Functional Specifications)
   4.1. 인증 및 사용자 (Auth & User)
   Logic: useUserSync 훅을 통해 Clerk 로그인 시 Supabase profiles 테이블 동기화.
   Middleware: /admin/\* 라우트 접근 시 metadata.role 확인하여 리다이렉트.
   4.2. 서비스 신청 (Service Application)
   Validation (Zod):
   code
   TypeScript
   const serviceSchema = z.object({
   category: z.enum(['consult', 'repair', ...]),
   description: z.string().min(10, "10자 이상 입력해주세요"),
   images: z.array(z.string()).optional()
   });
   State: useServiceStore (Zustand)를 사용하여 Wizard 단계(Step) 상태 관리.
   4.3. 업무 시스템 (Staff Zone)
   AI SOAP Note:
   Action: Server Action generateSoapNote(text) 호출 -> Gemini API.
   UI: Streaming UI 패턴 적용 (로딩 중 Skeleton 표시).
   Inventory (재고):
   Query: useInventoryList (React Query)로 재고 상태 실시간 조회.
   Mutation: 대여 승인 시 useRentApprove 훅을 통해 inventory 상태 변경 트랜잭션 실행.
5. 데이터베이스 스키마 및 타입 (Database & Types)
   Strict Typing: DB 스키마와 1:1 매칭되는 TypeScript Interface 정의.
   code
   TypeScript
   // types/database.ts (Supabase Generated)
   export interface Database {
   public: {
   Tables: {
   profiles: {
   Row: {
   id: string;
   clerk_user_id: string;
   role: 'user' | 'staff' | 'manager';
   // ...
   }
   };
   applications: {
   Row: {
   id: string;
   category: 'consult' | 'repair' | 'rental' | 'custom' | 'edu';
   status: 'submitted' | 'assigned' | 'in_progress' | 'completed';
   // ...
   }
   };
   // ... inventory, logs tables
   }
   }
   }
6. UI/UX 및 스타일링 가이드 (Styling Policy)
   6.1. Spacing-First 정책 적용
   Container: div className="p-4 md:p-6" (외부 패딩)
   Stack: div className="flex flex-col gap-4" (내부 간격)
   Forbidden: m-4, mt-2 등 마진 사용 금지 (컴포넌트 독립성 보장).
   6.2. 디자인 시스템 토큰 (Tailwind Config)
   Colors:
   Primary: bg-blue-600 (GWATC Brand)
   Background: bg-slate-50 (Admin Base)
   Status: text-green-600 (완료), text-yellow-600 (접수)
   Typography:
   Heading: text-h2 font-bold
   Body: text-body-1 text-slate-700
   GNB, SNB, LNB, RNB, FNB, breadcrumbs 반영 극대화화
7. Next.js 15 구현 가이드 (Implementation Guide)
   7.1. 동적 라우트 처리 (await params)
   code
   TypeScript
   // app/(admin)/clients/[id]/page.tsx
   export default async function ClientDetailPage({
   params
   }: {
   params: Promise<{ id: string }>
   }) {
   const { id } = await params; // Next.js 15 필수
   const client = await getClientById(id);

return <ClientProfileCard client={client} />;
}
7.2. 이미지 최적화
next/image 필수 사용.
배경 이미지는 div 스타일 대신 <Image fill className="object-cover" /> 패턴 사용. 8. 개발 로드맵 (Sprints)
가이드라인의 "Phase 1: 설계 -> Phase 2: 구현" 프로세스 준수.
단계 기간 주요 작업 (Task)
Sprint 1 1주차 설계 및 기반 구축<br>- components/ui (Shadcn) 설치<br>- DB Schema 및 Type 정의<br>- CommonLayout 및 인증 설정
Sprint 2 2주차 Public Domain 구현<br>- Home 컴포넌트 개발 (QuickMenu, Tabs)<br>- ServiceApplication 폼 및 검증 로직 (Zod)
Sprint 3 3주차 Admin Domain 구현<br>- AdminDashboard, ClientCRM 개발<br>- 5대 사업별 상태 관리 로직 (useServiceMutation)
Sprint 4 4주차 AI 및 통합<br>- SoapNote AI 연동 (Server Actions)<br>- 반응형 QA 및 배포 9. 최종 체크리스트 (Definition of Done)

불필요한 추상화 제거: 단순 래퍼 컴포넌트 없이 Tailwind 클래스 직접 사용했는가?
Naming: 컴포넌트 이름이 [Domain][Role] 형식을 따르는가?
Spacing: Margin 대신 Padding과 Gap으로 레이아웃을 잡았는가?
Type Safety: any 타입 없이 Zod와 Interface로 엄격하게 관리되는가?
Next.js 15: 동적 파라미터에 await를 사용했는가?
