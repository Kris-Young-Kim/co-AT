🛠️ Co-AT: Technical Requirements Document (v3.0)
Technical Implementation & Architecture Guidelines
프로젝트 정보	내용
프로젝트명	GWATC 통합 케어 플랫폼 (Co-AT)
버전	v3.0 (Strict Typing & Next.js 15)
작성일	2025년 12월 06일
기술 스택	Next.js 15, Clerk, Supabase, Gemini Flash
상태	확정 (Locked)
1. 시스템 아키텍처 (System Architecture)
1.1. High-Level Diagram
Next.js 15 App Router를 중심으로, 인증(Clerk)과 데이터(Supabase), AI(Gemini)가 유기적으로 연결된 Serverless 아키텍처입니다.
code
Mermaid
graph TD
    User[Client / Staff] -->|HTTPS| CDN[Vercel Edge]
    
    subgraph Frontend [Next.js 15 App Router]
        CDN --> Middleware[Middleware (Clerk Auth)]
        Middleware --> Layout[Root Layout]
        Layout --> Page[Page Component]
        Page -->|Server Actions| Action[Data Mutation]
        Page -->|RSC Fetch| Data[Data Fetching]
    end
    
    subgraph Backend [Supabase Services]
        Action -->|PostgREST| DB[(PostgreSQL)]
        Data -->|PostgREST| DB
        DB -->|Trigger| Edge[Edge Functions]
    end
    
    subgraph AI [Google Cloud]
        Action -.->|Generative AI| Gemini[Gemini 1.5 Flash]
    end
2. 데이터베이스 및 타입 시스템 (Database & Typing)
2.1. Type Generation Workflow (핵심)
Supabase의 스키마를 TypeScript 타입으로 자동 변환하여 End-to-End Type Safety를 보장합니다.
설정 파일 (package.json):
요청하신 명령어를 scripts 섹션에 포함하여, DB 스키마 변경 시마다 즉시 타입을 업데이트합니다.
code
JSON
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "gen:types": "npx -y supabase gen types typescript --project-id \"SUPABASE_PROJECT_REF\" --schema public > types/database.types.ts"
  }
}
(참고: .env에 SUPABASE_PROJECT_REF가 있어도 명령어 실행 시에는 직접 ID를 넣거나 환경변수를 로드하는 방식이 필요할 수 있습니다. 위 스크립트는 터미널 실행 기준입니다.)
2.2. 타입 정의 및 사용
생성된 database.types.ts를 기반으로 전역 타입을 확장합니다.
code
TypeScript
// types/db.ts
import { Database } from './database.types';

// Supabase Client에 제네릭 주입
export type SupabaseClient = SupabaseClient<Database>;

// 자주 쓰는 Row 타입 추출 (Helper)
export type DbRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type Profile = DbRow<'profiles'>;
export type Application = DbRow<'applications'>;
2.3. RLS (Row Level Security) 정책
Clerk User ID와 Supabase 데이터를 연결하는 보안 규칙입니다.
code
SQL
-- profiles 테이블 정책 예시
create policy "Users can view own profile" 
on profiles for select 
using ( clerk_user_id = auth.jwt() ->> 'sub' ); -- Clerk Token의 sub 클레임 활용
3. 프론트엔드 아키텍처 (Frontend Implementation)
통합 개발 가이드라인을 준수하는 컴포넌트 및 로직 설계입니다.
3.1. 디렉토리 구조 (Feature-First)
도메인 주도 설계(DDD)에 따라 관련 파일(컴포넌트, 훅, 유틸)을 기능별로 응집시킵니다.
code
Text
app/
components/
├── common/                  # 전역 공통 (Button, Logo)
├── layout/                  # 헤더, 푸터, 사이드바
└── features/
    ├── auth/                # 인증 관련
    ├── landing/             # 랜딩 페이지 (Hero, QuickMenu, Calendar)
    ├── application/         # 서비스 신청 (Wizard, Forms)
    ├── dashboard/           # 대시보드 (KPI, Charts)
    ├── crm/                 # 대상자 관리 (Table, Detail)
    └── soap/                # AI 일지 (Editor, Recorder)
lib/
├── supabase/                # 클라이언트 설정
├── gemini/                  # AI 설정
└── utils.ts                 # cn, formatters
actions/                     # Server Actions (DB, AI 호출)
├── auth-actions.ts         # 유저 권한 체크
├── application-actions.ts   # 신청서 접수 (Insert)
├── schedule-actions.ts      # 일정 등록 및 공개 일정 조회
├── client-actions.ts        # 대상자 CRUD
├── inventory-actions.ts     # 재고 상태 변경
└── ai-actions.ts            # [핵심] Gemini API 호출 (SOAP 변환)
types/                       # database.types.ts 위치
3.2. 컴포넌트 개발 원칙 (Rules)
불필요한 추상화 금지: 단순 div 래퍼나 스타일링만을 위한 컴포넌트 생성 금지.
Spacing-First: margin 사용을 지양하고, 부모의 padding과 gap으로 레이아웃 제어.
code
Tsx
// ✅ Good Pattern
<div className="flex flex-col gap-4 p-6">
  <Header />
  <Content />
</div>
Naming: [Domain][Role][Variant] (예: ServiceRepairForm, AdminDashboardKpi).
3.3. Next.js 15 특화 구현
Async Params: 동적 라우트 파라미터 접근 시 반드시 await 사용.
code
Tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; 
  // ...
}
Server Actions: API Route 대신 Server Action을 사용하여 Form 처리 및 데이터 Mutation.
4. AI 기능 구현 (Gemini Integration)
4.1. Server Action 아키텍처
클라이언트에서 직접 AI를 호출하지 않고, 서버 사이드에서 처리하여 API Key를 보호합니다.
code
TypeScript
// actions/generate-soap.ts
'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateSoapNote(text: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Role: Assistive Technology Professional
    Task: Convert input to SOAP Note JSON
    Input: ${text}
    Output Format: { "S": "...", "O": "...", "A": "...", "P": "..." }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
5. 인프라 및 환경 설정 (Infrastructure)
5.1. 환경 변수 (.env.local)
code
Env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_PROJECT_REF=[PROJECT_ID] # gen:types 스크립트용

# Google AI
GEMINI_API_KEY=AIza...
5.2. 배포 파이프라인 (CI/CD)
Vercel: GitHub main 브랜치 Push 시 자동 배포.
Check: 배포 전 npm run lint 및 npm run build 통과 필수.
6. 개발 워크플로우 (Workflow)
가이드라인에 따른 Phase별 개발 순서입니다.
Phase 1: Setup & Typing
프로젝트 생성 (create-next-app).
Supabase Table 생성 (SQL 실행).
npm run gen:types 실행하여 Typescript Interface 확보.
Phase 2: Component & UI
shadcn/ui 초기화.
components/features 내 도메인별 컴포넌트 구현 (Tailwind Spacing 준수).
Phase 3: Logic & Integration
Zustand Store 생성 (신청 Wizard 상태 등).
Server Actions 작성 및 컴포넌트 연결.
AI 기능 연동.
✅ 최종 체크리스트 (Quality Assurance)
개발 완료 후 PR(Pull Request) 전 확인 사항입니다.

Type Safety: any 타입이 없는가? database.types.ts를 활용했는가?

Structure: DIR.md 구조를 준수했는가? (Feature-first)

Style: margin 대신 gap/padding을 사용했는가?

Next.js 15: await params 및 Server Actions를 올바르게 사용했는가?

DB Sync: Clerk 유저 생성 시 Supabase 프로필이 동기화되는가?