# Partner Centers (협력기관 연락망) — Design Spec

**Date:** 2026-06-30  
**App:** `admin`  
**Status:** Approved

## Overview

전국 17개 보조기기센터 연락망을 admin 앱에서 관리하는 기능.
내부 직원(STAFF 이상)이 파트너 기관 연락처를 조회·수정하고, 협력 메모를 기록할 수 있다.

## DB Schema

Migration: `migrations/108_create_partner_centers.sql`

```sql
CREATE TABLE partner_centers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,         -- 기관명
  region     text NOT NULL,         -- 광역시도 (광역)
  district   text NOT NULL,         -- 시군구
  phone      text NOT NULL,         -- 전화번호
  fax        text,                  -- 팩스번호
  email      text,                  -- 이메일
  address    text,                  -- 서비스기관주소
  website    text,                  -- 홈페이지
  memo       text,                  -- 협력 메모 (자유 텍스트)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: `authenticated` 역할 SELECT/INSERT/UPDATE/DELETE 전체 허용.  
STAFF 이상 접근 보장은 Clerk 미들웨어 + `withStaffPermission` 래퍼에서 처리.

초기 데이터: CSV 17개 센터를 migration 파일 내 INSERT로 포함.

## File Structure

```
actions/
└── partner-center-actions.ts
    ├── listPartnerCenters()
    ├── createPartnerCenter(input)
    ├── updatePartnerCenter(id, input)
    └── deletePartnerCenter(id)

apps/admin/app/(app)/partner-centers/
└── page.tsx                    # 서버 컴포넌트, 초기 데이터 fetch

apps/admin/components/features/admin/partner-centers/
└── PartnerCenterManager.tsx    # 클라이언트 컴포넌트

apps/admin/components/layout/
└── admin-sidebar.tsx           # "협력기관 연락망" 메뉴 추가
```

## Component Design

### page.tsx (Server Component)
- `withStaffPermission` 없이 직접 redirect (페이지 레벨 권한)
- `listPartnerCenters()` 호출 → `PartnerCenterManager`에 `initialData` prop 전달

### PartnerCenterManager.tsx (Client Component)
- 테이블: 기관명 / 지역 / 전화 / 이메일 / 홈페이지 컬럼
- 지역(region) 드롭다운 필터
- 행 클릭 → 상세/편집 모달 (주소·팩스·메모 포함)
- 추가 버튼 → 생성 모달
- 삭제: 모달 내 삭제 버튼 + confirm

### partner-center-actions.ts (Server Actions)
- `withStaffPermission` 래퍼 사용
- `createAdminClient()` + `revalidatePath("/partner-centers")`
- 기존 banner-actions.ts 패턴 그대로 적용

## Access Control

- **조회/수정/삭제:** STAFF 이상 전체
- 미들웨어: 기존 `(app)` 레이아웃 보호 그대로 적용

## Out of Scope

- CSV 파일 업로드 기능 (17개 센터에 과도)
- 센터별 협력 히스토리 타임라인
- 외부 공개 (web 앱 노출)
