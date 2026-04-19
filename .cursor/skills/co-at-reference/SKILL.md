---
name: co-at-reference
description: GWATC 보조기기센터 Co-AT 프로젝트의 구조, 컨벤션, 기술 스택을 안내합니다. 이 코드베이스에서 작업할 때 참조하세요.
---

# Co-AT 프로젝트 레퍼런스

## 프로젝트 개요

- **이름**: Co-AT (GWATC 통합 케어 플랫폼)
- **목적**: 강원특별자치도 보조기기센터의 5대 핵심 사업(상담, 체험, 맞춤형, 사후관리, 교육홍보) 관리
- **원칙**: 기능 중심(Feature-First) 설계, 관심사 분리(Separation of Concerns)

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 인증 | Clerk |
| DB | Supabase (PostgreSQL) |
| 스타일 | Tailwind CSS, shadcn/ui, Radix UI |
| 폼 | React Hook Form, Zod |
| 상태 | Zustand, TanStack Query |
| AI | Google Gemini (상담 일지), Agent Chat |

## Route Groups (app/)

| 그룹 | 경로 | 대상 |
|------|------|------|
| (auth) | /sign-in, /sign-up | 인증 전용 |
| (public) | /, /notices, /community | 대민 공개 |
| (portal) | /portal/*, /apply | 로그인 유저 |
| (admin) | /admin/*, /dashboard | 센터 직원 |

## 핵심 경로 (수정 시 참고)

| 수정할 내용 | 경로 |
|-------------|------|
| 메뉴/헤더 | `components/layout/` |
| 신청 폼 | `components/features/application/forms/` + `lib/validators.ts` |
| AI 상담 일지 | `actions/ai-actions.ts`, `lib/agents/` |
| DB 타입 | `npm run gen:types` → `types/database.types.ts` |
| 테마/색상 | `app/globals.css`, `tailwind.config.ts` |
| 인증/라우팅 | `middleware.ts` |

## 컴포넌트 구조

- `components/ui/` — shadcn/ui 원자 컴포넌트
- `components/common/` — 공통 UI (로고, 스피너, 뱃지 등)
- `components/layout/` — 헤더, 푸터, 사이드바
- `components/features/` — 도메인별 기능 (landing, application, crm, inventory, dashboard 등)

## 로직 계층

- `lib/` — Supabase 클라이언트, 유틸, Zod 검증
- `actions/` — Server Actions ('use server')
- `hooks/` — 커스텀 훅 (Zustand 스토어 포함)

## 사용 시점

이 스킬은 다음 상황에서 적용하세요:

- Co-AT 코드베이스에서 새 기능 추가/수정
- 폴더 구조나 파일 위치 확인
- 기존 패턴과 일관된 코드 작성
- DB 스키마 변경 후 타입 재생성 (`gen:types`)
