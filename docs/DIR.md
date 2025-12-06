📂 Project Co-AT: Directory Structure (DIR.md)
프로젝트: GWATC 통합 케어 플랫폼
원칙: 기능 중심(Feature-First) 설계 & 관심사 분리(Separation of Concerns)
설명: 유지보수와 협업을 위한 폴더 구조 및 파일 배치 가이드
1. ⚙️ Root Configuration (최상위 설정)
프로젝트의 환경 설정 및 린트, 빌드 설정을 담당합니다.
code
Text
co-at/
├── .env.local                  # [보안] 환경 변수 (API Keys, Secrets) - 절대 커밋 금지
├── .eslintrc.json              # Lint 설정
├── .gitignore                  # Git 제외 목록
├── .cursorrules                # Cursor AI 행동 지침
├── components.json             # shadcn/ui 설정 파일
├── middleware.ts               # [핵심] Next.js 미들웨어 (Clerk 인증 & 라우팅 보호)
├── next.config.mjs             # Next.js 빌드 설정
├── package.json                # 의존성 관리
├── postcss.config.mjs          # CSS 전처리
├── tailwind.config.ts          # Tailwind 테마 및 색상 설정
├── tsconfig.json               # TypeScript 설정
└── README.md                   # 프로젝트 설명서
2. 📱 App Directory (/app) - 라우팅 및 페이지
URL 경로와 직접 매핑되는 폴더입니다. Route Groups () 를 사용하여 권한별 레이아웃을 분리했습니다.
code
Text
app/
├── favicon.ico                 # 파비콘
├── globals.css                 # 전역 스타일 (Tailwind imports)
├── layout.tsx                  # [Root] 최상위 레이아웃 (Providers, Fonts)
│
├── (auth)/                     # [인증] 로그인 관련 (헤더/푸터 없음)
│   ├── sign-in/[[...sign-in]]/ # Clerk 로그인 페이지
│   │   └── page.tsx
│   └── sign-up/[[...sign-up]]/ # Clerk 회원가입 페이지
│       └── page.tsx
│
├── (public)/                   # [대민] 누구나 접근 가능
│   ├── layout.tsx              # Public Header/Footer 적용
│   ├── page.tsx                # [메인] 랜딩 페이지
│   ├── notices/                # 공지사항
│   │   ├── page.tsx            # 목록
│   │   └── [id]/page.tsx       # 상세
│   └── gallery/                # 보조기기 영상 갤러리
│       └── page.tsx
│
├── (portal)/                   # [유저] 로그인한 일반 사용자 전용
│   ├── layout.tsx              # Portal 전용 레이아웃 (Mobile Nav)
│   ├── apply/                  # 통합 서비스 신청 마법사
│   │   └── page.tsx
│   └── mypage/                 # 마이페이지 (타임라인)
│       └── page.tsx
│
├── (admin)/                    # [직원] 센터 직원 전용 (Side Nav)
│   ├── layout.tsx              # Admin Layout (Sidebar, Role Check)
│   ├── dashboard/              # 통합 대시보드
│   │   └── page.tsx
│   ├── clients/                # 대상자 CRM
│   │   ├── page.tsx            # 검색 및 리스트
│   │   └── [id]/page.tsx       # 상세 정보 및 탭 뷰
│   ├── inventory/              # 재고 관리
│   │   └── page.tsx
│   ├── schedule/               # 일정 캘린더
│   │   └── page.tsx
│   └── settings/               # 시스템 설정
│       └── page.tsx
│
└── api/                        # [Backend] Route Handlers
    ├── webhooks/               # 외부 연동
    │   └── clerk/route.ts      # Clerk 유저 생성 -> Supabase 동기화
    └── chat/                   # (Optional) AI 스트리밍용 API
        └── route.ts
3. 🧩 Components Directory (/components) - UI 블록
재사용성과 기능별 응집도를 고려하여 폴더를 구분합니다.
3.1. Primitives & Layout
code
Text
components/
├── ui/                         # [Atom] shadcn/ui 컴포넌트 (자동생성)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── calendar.tsx
│   └── ...
│
├── common/                     # [Shared] 전역 공통 컴포넌트
│   ├── logo.tsx                # GATC 로고
│   ├── loading-spinner.tsx     # 로딩 UI
│   ├── status-badge.tsx        # 상태값 뱃지 (접수/완료 등)
│   └── file-uploader.tsx       # 이미지 업로드 Dropzone
│
└── layout/                     # [Structure] 레이아웃 컴포넌트
    ├── public-header.tsx       # 대민용 GNB
    ├── public-footer.tsx       # 대민용 푸터
    ├── admin-sidebar.tsx       # 관리자 사이드바
    └── mobile-bottom-nav.tsx   # 모바일 하단 탭
3.2. Features (핵심 도메인별 컴포넌트)
여기가 가장 중요합니다. 기능별로 컴포넌트를 모아두어 유지보수를 쉽게 합니다.
code
Text
components/features/
├── auth/                       # 인증 관련
│   └── user-sync-listener.tsx  # 로그인 시 DB 동기화 트리거
│
├── landing/                    # 랜딩 페이지 컴포넌트
│   ├── HomeHeroSection.tsx     # 메인 비주얼 및 슬로건
│   ├── HomeQuickMenuGrid.tsx  # 5대 사업 바로가기 그리드
│   ├── HomeNoticeTabs.tsx     # 공지사항/지원사업 탭
│   ├── HomeGallerySlider.tsx  # 보조기기 유튜브 영상 갤러리
│   └── HomePublicCalendar.tsx # 공개 캘린더 (견학/교육 일정)
│
├── application/                # 서비스 신청 관련
│   ├── wizard-step-nav.tsx     # 단계 표시기 (Step 1-2-3)
│   ├── category-grid.tsx       # 5대 사업 선택 그리드
│   ├── forms/                  # 신청 폼 모음
│   │   ├── repair-form.tsx     # 수리 신청 폼
│   │   └── rental-form.tsx     # 대여 신청 폼
│   └── success-modal.tsx       # 신청 완료 모달
│
├── dashboard/                  # 대시보드 위젯
│   ├── kpi-stats-card.tsx      # 실적 요약 카드
│   ├── today-schedule.tsx      # 오늘의 일정
│   └── recent-requests.tsx     # 신규 접수 목록
│
├── crm/                        # 대상자 관리
│   ├── client-table.tsx        # 대상자 목록 (검색/필터)
│   ├── client-profile.tsx      # 상세 프로필 카드
│   └── service-history.tsx     # 서비스 이용 이력 타임라인
│
├── inventory/                  # 재고 관리
│   ├── inventory-list.tsx      # 기기 목록
│   ├── status-toggle.tsx       # 대여/보관 상태 변경
│   └── qr-code-gen.tsx         # QR 코드 생성기
│
└── soap-note/                  # [AI] 상담 일지
    ├── audio-recorder.tsx      # 음성 녹음기
    ├── note-editor.tsx         # SOAP 텍스트 에디터
    └── ai-generate-button.tsx  # Gemini 호출 버튼
4. 🧠 Logic Layer (/lib, /actions, /hooks)
비즈니스 로직과 데이터 통신을 담당하는 계층입니다.
code
Text
lib/                            # [Utils] 설정 및 헬퍼 함수
├── supabase/
│   ├── client.ts               # Client Component용
│   └── server.ts               # Server Component용 (Cookie)
├── gemini/
│   └── client.ts               # Google AI Studio 설정
├── utils.ts                    # cn(), formatters (날짜, 통화)
└── validators.ts               # Zod 스키마 정의 (모든 폼 검증 로직)

actions/                        # [Server Actions] 백엔드 로직 ('use server')
├── auth-actions.ts             # 유저 권한 체크
├── application-actions.ts      # 신청서 접수 (Insert)
├── client-actions.ts           # 대상자 CRUD
├── inventory-actions.ts        # 재고 상태 변경
├── schedule-actions.ts         # 일정 등록
└── ai-actions.ts               # [핵심] Gemini API 호출 (SOAP 변환)

hooks/                          # [Custom Hooks] 클라이언트 로직 재사용
├── use-sidebar.ts              # 사이드바 상태 (Zustand)
├── use-wizard-store.ts         # 신청 마법사 상태 (Zustand)
├── use-current-user.ts         # 현재 로그인 유저 정보
└── use-inventory-filter.ts     # 재고 필터링 로직
5. 📦 Types & Assets (/types, /public)
code
Text
types/                          # [TypeScript] 전역 타입 정의
├── database.types.ts           # Supabase 자동 생성 타입 (Source of Truth)
├── index.ts                    # 공통 인터페이스 (Role, Menu)
└── soap.ts                     # SOAP 노트 JSON 구조체

public/                         # [Static Assets] 정적 파일
├── images/                     # 이미지 리소스
│   ├── hero-bg.jpg
│   └── logos/
└── icons/                      # 커스텀 SVG 아이콘
🗺️ 내비게이션 가이드 (Where to find?)
수정하고 싶은 기능이 있을 때, 어디를 봐야 할까요?
수정할 내용	찾아갈 경로
메뉴/헤더 디자인 수정	components/layout/
신청 폼 항목 추가/삭제	components/features/application/forms/ + lib/validators.ts
AI 상담 일지 프롬프트 수정	actions/ai-actions.ts
DB 테이블 타입 변경	npm run gen:types 실행 (자동 업데이트)
색상/테마 변경	app/globals.css 또는 tailwind.config.ts
권한/로그인 로직 수정	middleware.ts