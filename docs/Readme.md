🧥 Co-AT (Collaboration for Assistive Technology)
![alt text](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)

![alt text](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)

![alt text](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk)

![alt text](https://img.shields.io/badge/AI-Gemini_1.5_Flash-blue?style=for-the-badge&logo=google)

![alt text](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)
"행정은 AI에게, 사람은 클라이언트에게"
강원특별자치도 보조기기센터(GWATC) 통합 업무 협업 플랫폼
📖 프로젝트 개요 (Overview)
Co-AT는 GWATC의 5대 핵심 사업(상담, 체험, 맞춤형, 사후관리, 교육홍보)을 디지털로 전환하는 O2O 통합 플랫폼입니다.
기존의 파편화된 업무 방식(엑셀, 수기, 카카오톡)을 혁신하여, 대민 서비스 접근성을 높이고 직원의 행정 업무 부담을 획기적으로 줄이는 것을 목표로 합니다.
🚀 핵심 목표
원스톱 서비스: 로그인 한 번으로 상담 신청부터 결과 조회, 이력 관리까지 통합.
AI 업무 자동화: Gemini AI를 활용한 상담 일지(SOAP Note) 자동 생성 및 규정 검색.
데이터 기반 운영: 모든 서비스 이력을 DB화하여 재고 관리 및 실적 통계 자동화.
✨ 주요 기능 (Key Features)
🌏 Public Zone (대민 서비스)
동적 랜딩 페이지: 최신 보조기기 유튜브 영상 갤러리 및 센터 소식.
공개 캘린더: 견학 일정, 교육 일정 표시 및 예약 기능.
통합 서비스 신청 (Wizard): 5대 사업(상담, 체험, 대여, 수리, 교육) 간편 신청.
마이페이지 (Portal): 서비스 진행 단계(접수-배정-방문-완료) 타임라인 조회.
🏢 Staff Zone (업무 시스템)
통합 대시보드: 신규 접수 알림, 오늘의 방문 일정, KPI 실적 현황판.
대상자 CRM: 이름/생년월일 기반 통합 검색, 전 생애주기 서비스 이력 관리.
AI 스마트 워크:
AI SOAP Note: 현장 음성/메모를 전문 의무기록 형태로 자동 변환.
RAG 챗봇: 운영 지침 문서를 학습한 AI가 규정 및 지원 한도 답변.
재고/자산 관리: QR코드 기반 입출고 관리, 대여/반납 상태 자동 추적.
🛠️ 기술 스택 (Tech Stack)
분류	기술	설명
Framework	Next.js 15	App Router, Server Actions, PPR (Partial Prerendering)
Language	TypeScript	Strict Typing & End-to-End Type Safety
Styling	Tailwind CSS	Shadcn UI, Spacing-First Design System
Auth	Clerk	소셜 로그인, 미들웨어 기반 권한 제어 (RBAC)
Backend	Supabase	PostgreSQL, Realtime, Storage, Edge Functions
AI Engine	Gemini 1.5 Flash	고성능 경량 LLM (via Google AI Studio)
State	Zustand / TanStack Query	전역 상태 및 서버 데이터 캐싱
Deploy	Vercel	CI/CD 자동 배포 파이프라인
⚙️ 시작하기 (Getting Started)
로컬 개발 환경을 세팅하는 방법입니다.
1. 사전 준비 (Prerequisites)
Node.js 18.17.0 이상
npm 또는 pnpm
2. 설치 및 실행 (Installation)
code
Bash
# 1. 레포지토리 클론
git clone https://github.com/[Organization]/co-at.git
cd co-at

# 2. 패키지 설치
npm install

# 3. 환경 변수 설정 (.env.local 생성)
cp .env.example .env.local
# (아래 '환경 변수 가이드' 참고하여 키 값 입력)

# 4. 타입 생성 (Supabase 연동 시 필수)
npm run gen:types

# 5. 개발 서버 실행
npm run dev
브라우저에서 http://localhost:3000으로 접속하여 확인합니다.
🔑 환경 변수 가이드 (.env.local)
프로젝트 실행을 위해 다음 API Key들이 필요합니다. 보안을 위해 절대 GitHub에 커밋하지 마세요.
code
Env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_PROJECT_REF=[PROJECT-ID] # 타입 생성용

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...
📂 프로젝트 구조 (Directory Structure)
기능 중심(Feature-First) 설계와 Next.js 15 App Router 구조를 따릅니다.
(상세 내용은 docs/DIR.md 참조)
code
Text
app/
├── (public)/       # 대민용 페이지 (홈, 공지사항)
├── (auth)/         # 로그인/회원가입
├── (portal)/       # 일반 사용자 마이페이지
├── (admin)/        # 직원 전용 업무 시스템
├── api/            # Route Handlers
└── layout.tsx      # Root Layout
components/
├── ui/             # shadcn 공통 컴포넌트
├── common/         # 전역 공통 컴포넌트
└── features/       # 도메인별 컴포넌트 (soap-note, inventory...)
lib/                # 유틸리티 (supabase client, gemini)
actions/            # Server Actions (DB Mutation, AI Call)
types/              # TypeScript 정의 (database.types.ts)
📚 상세 문서 (Documentation)
이 프로젝트는 철저한 기획과 설계를 바탕으로 개발되었습니다. docs/ 폴더에서 상세 내용을 확인하세요.
MRD (시장 요구사항): 프로젝트 배경, 5대 핵심 사업 정의.
PRD (제품 상세 정의): 기능 명세, 비즈니스 로직, UI 시나리오.
TRD (기술 설계): 시스템 아키텍처, 타입 시스템, AI 구현 전략.
Mermaid (다이어그램): ERD, 시퀀스 다이어그램, 상태도 시각화.
DIR (디렉토리 구조): 파일 구조 및 네이밍 규칙 가이드.
🤝 개발 컨벤션 (Convention)
Branch: main (배포용) / feature/기능명 (개발용).
Commit: Conventional Commits 준수 (feat:, fix:, docs:).
Styling: Spacing-First 정책 준수. (Margin 사용 지양, Padding/Gap 활용).
Typing: any 사용 금지. Supabase Generated Types 적극 활용.
📜 라이선스 (License)
Copyright © 2025 GWATC (Gangwon Assistive Technology Center). All rights reserved.
This is an internal private project.