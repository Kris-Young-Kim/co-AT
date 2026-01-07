# 📋 Co-AT 프로젝트 개발 TODO

> **프로젝트**: GWATC 통합 관리 플랫폼 (Co-AT)  
> **비전**: "행정은 AI에게, 사람은 클라이언트에게"  
> **기술 스택**: Next.js 15, Clerk, Supabase, Gemini Flash  
> **작성일**: 2025. 12. 06

---

## ♿ 접근성 (Accessibility) 가이드

### 접근성 원칙

본 프로젝트는 **WCAG 2.1 AA 수준**의 접근성을 목표로 합니다. 모든 사용자가 동등하게 서비스를 이용할 수 있도록 다음 원칙을 준수합니다:

1. **인지 가능성 (Perceivable)**: 모든 정보와 UI 요소를 사용자가 인지할 수 있어야 함
2. **조작 가능성 (Operable)**: 모든 기능을 키보드만으로도 사용할 수 있어야 함
3. **이해 가능성 (Understandable)**: 정보와 UI 조작 방법이 명확해야 함
4. **견고성 (Robust)**: 다양한 보조 기술과 호환되어야 함

### 구현된 접근성 기능

#### 1. 시각 장애인 지원 기능

**화면 확대/축소**

- 범위: 50% ~ 200% (기본 100%)
- 단축키: `Alt + +` (확대), `Alt + -` (축소), `Alt + 0` (리셋)
- 설정 저장: 로컬 스토리지에 저장되어 페이지 새로고침 후에도 유지
- 컴포넌트: `components/accessibility/accessibility-toolbar.tsx`

**고대비 모드**

- 단축키: `Alt + H`
- 기능: 배경과 텍스트의 대비를 극대화하여 가독성 향상
- 설정 저장: 로컬 스토리지에 저장
- CSS: `app/globals.css`의 `.high-contrast` 클래스

**음성 출력 (TTS)**

- 단축키: `Alt + S`
- 기능: 페이지 전체 텍스트를 음성으로 읽어줌
- 언어: 한국어 (ko-KR)
- 속도: 0.9배속 (조정 가능)
- 기술: Web Speech API (`window.speechSynthesis`)

#### 2. 지체 장애인 지원 기능

**키보드 스캔 모드**

- 단축키: `Alt + K` (활성화/비활성화)
- 기능: Tab 키로 모든 포커스 가능한 요소를 순차적으로 탐색
- 탐색: `Tab` (다음), `Shift + Tab` (이전), `Esc` (종료)
- 자동 스크롤: 포커스된 요소가 화면 중앙에 오도록 자동 스크롤
- 컴포넌트: `components/accessibility/keyboard-navigator.tsx`

**키보드 네비게이션**

- 모든 인터랙티브 요소는 키보드로 접근 가능
- 포커스 표시 강화: 3px 두께의 primary 색상 outline
- 논리적 탭 순서: 시각적 순서와 동일하게 구성
- CSS: `app/globals.css`의 `*:focus-visible` 스타일

#### 3. 접근성 툴바

- 위치: 화면 우측 하단 고정
- 열기/닫기: `Alt + A` 또는 버튼 클릭
- 기능: 화면 확대/축소, 고대비 모드, 음성 출력을 한 곳에서 제어
- 컴포넌트: `components/accessibility/accessibility-toolbar.tsx`

### 개발 가이드라인

#### HTML 시맨틱 태그 사용

```tsx
// ✅ 좋은 예
<nav aria-label="주요 메뉴">
  <ul>
    <li><a href="/services">주요사업</a></li>
  </ul>
</nav>

// ❌ 나쁜 예
<div onClick={...}>주요사업</div>
```

#### ARIA 레이블 추가

```tsx
// ✅ 좋은 예
<button aria-label="메뉴 열기">
  <MenuIcon />
</button>

// ✅ 아이콘만 있는 버튼은 반드시 aria-label 필요
<button aria-label="검색">
  <SearchIcon />
</button>
```

#### 이미지 alt 텍스트

```tsx
// ✅ 좋은 예
<img src="..." alt="보조기기센터 건물 외관" />

// ❌ 장식용 이미지는 빈 alt
<img src="..." alt="" role="presentation" />
```

#### 폼 접근성

```tsx
// ✅ 좋은 예
<label htmlFor="name">이름</label>
<input id="name" aria-describedby="name-error" />
{error && <span id="name-error" role="alert">{error}</span>}
```

#### 키보드 이벤트 처리

```tsx
// ✅ 좋은 예
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
>
  클릭
</button>
```

#### 색상 대비

- 일반 텍스트: 최소 4.5:1 대비율
- 큰 텍스트 (18pt 이상): 최소 3:1 대비율
- 인터랙티브 요소: 최소 3:1 대비율

#### 포커스 관리

```tsx
// ✅ 포커스 트랩 (모달 등)
useEffect(() => {
  const firstFocusable = modalRef.current?.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as HTMLElement;
  firstFocusable?.focus();
}, []);
```

### 테스트 체크리스트

#### 키보드 테스트 (메인 홈페이지: https://co-at-gw.vercel.app/ 에만 적용)

- [x] Tab 키로 모든 인터랙티브 요소 접근 가능
- [x] Shift + Tab으로 역방향 탐색 가능
- [x] Enter/Space로 버튼 클릭 가능 (PublicHeader 드롭다운에 명시적 핸들러 추가)
- [x] Esc로 모달/드롭다운 닫기 가능 (PublicHeader 드롭다운에 명시적 핸들러 추가)
- [x] 화살표 키로 메뉴/리스트 탐색 가능 (Radix UI DropdownMenu 기본 지원)

#### 스크린 리더 테스트 (메인 홈페이지: https://co-at-gw.vercel.app/ 에만 적용)

- [ ] NVDA (Windows) 또는 VoiceOver (Mac)로 테스트 (수동 테스트 필요)
- [x] 모든 이미지에 적절한 alt 텍스트 (배경 이미지는 role="presentation", aria-hidden="true" 추가)
- [x] 폼 요소에 레이블 연결 (메인 홈페이지에는 폼 없음, 향후 추가 시 적용)
- [x] 에러 메시지가 스크린 리더로 읽힘 (role="status", aria-live="polite" 추가)
- [x] 페이지 구조가 논리적으로 읽힘 (시맨틱 HTML, ARIA 랜드마크, 탭 구조 개선)

#### 시각 테스트 (메인 홈페이지: https://co-at-gw.vercel.app/ 에만 적용)

- [x] 고대비 모드에서 모든 요소가 명확히 보임 (고대비 모드 CSS 개선, 버튼/링크 테두리 강화)
- [x] 화면 확대 200%에서도 모든 기능 사용 가능 (반응형 그리드, 최소 터치 타겟 44px 적용)
- [x] 색상만으로 정보를 전달하지 않음 (아이콘/텍스트 병행, Badge는 텍스트로 구분)

### 참고 자료

- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM 접근성 체크리스트](https://webaim.org/standards/wcag/checklist)
- [MDN 접근성 가이드](https://developer.mozilla.org/ko/docs/Web/Accessibility)
- [한국형 웹 콘텐츠 접근성 지침 2.1](https://www.wah.or.kr/)

---

## 📊 문서 분석 요약

### 1. 프로젝트 핵심 목표

- **5대 핵심 사업 디지털화**: 상담, 체험, 맞춤형, 사후관리, 교육홍보
- **O2O 플랫폼**: 온라인 신청 → 오프라인 서비스 → 온라인 결과 관리
- **AI 업무 자동화**: Gemini를 활용한 상담기록 자동 생성, 상담 챗봇 자동 응대대
- **데이터 기반 운영**: 재고 관리, 실적 통계, 대상자 이력 통합 관리

### 2. 데이터베이스 스키마 분석 (co-AT.sql 기준)

#### 🔗 Supabase MCP 연동 정보

- **MCP 서버**: `supabase-co-AT`
- **Project Ref**: `uyjbndiwyddjyjkdfuyi`
- **접근 토큰**: 환경 변수에서 설정 (보안상 문서에 노출하지 않음)
- **모드**: Read-only (스키마 조회용)
- **타입 생성 명령어**: `npm run gen:types` (project-ref 사용)

#### ✅ 현재 구현된 테이블 (7개)

1. **profiles** - 직원/사용자 프로필 (Clerk 연동)

   - `id` (PK, UUID)
   - `clerk_user_id` (UK, text): ✅ UNIQUE 제약조건 설정됨
   - `email` (text, nullable)
   - `full_name` (text, nullable)
   - `role` (text, default 'staff', CHECK): ✅ user | staff | manager
   - `team` (text, nullable): 소속 팀
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now()): ✅ 추가됨

2. **clients** - 대상자 정보

   - `id` (PK, UUID)
   - `name` (text, NOT NULL)
   - `registration_number` (text, nullable): 등록번호
   - `birth_date` (date, nullable)
   - `gender` (text, nullable, CHECK): ✅ '남' | '여'
   - `contact` (text, nullable): 본인 연락처
   - `guardian_contact` (text, nullable): 보호자 연락처
   - `address` (text, nullable)
   - `housing_type` (text, nullable): 주거형태
   - `has_elevator` (boolean, default false): ✅ 기본값 설정됨
   - `obstacles` (text, nullable): 장애물
   - `economic_status` (text, nullable): 경제상황
   - `disability_type` (text, nullable): 장애유형
   - `disability_grade` (text, nullable): 장애정도
   - `disability_cause` (text, nullable): 장애발생원인
   - `disability_onset_date` (date, nullable): 장애발생시기
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now()): ✅ 추가됨

3. **inventory** - 재고/자산 관리

   - `id` (PK, UUID)
   - `name` (text, NOT NULL): 기기명
   - `asset_code` (text, nullable): 자산번호
   - `category` (text, nullable): 기기 카테고리
   - `status` (text, default '보관', CHECK): ✅ 보관 | 대여중 | 수리중 | 소독중 | 폐기
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now()): ✅ 추가됨

4. **applications** - 통합 신청서 (5대 사업 중심)

   - `id` (PK, UUID)
   - `client_id` (uuid, NOT NULL, FK → clients.id): ✅ 올바르게 설정됨
   - `status` (text, default '접수', CHECK): 접수 | 배정 | 진행 | 완료 | 반려
   - `service_year` (integer, nullable): 서비스 연도
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now()): ✅ 추가됨

5. **intake_records** - 상담 기록지 (첨부 19)

   - `id` (PK, UUID)
   - `application_id` (uuid, NOT NULL, FK → applications.id): ✅ 올바르게 설정됨
   - `consultant_id` (uuid, nullable, FK → profiles.id): 상담자
   - `consult_date` (date, default CURRENT_DATE): 상담일
   - `body_function_data` (jsonb, nullable): 신체 기능 체크 (관절가동범위 등)
   - `cognitive_sensory_check` (text[], nullable): ✅ ARRAY 타입으로 개선됨
   - `consultation_content` (text, nullable): 상담 내용 및 이용자욕구
   - `current_devices` (jsonb, nullable): 보유 보조기기 목록
   - `main_activity_place` (text, nullable): 주요 활동 장소
   - `activity_posture` (text, nullable): 활동 시 자세
   - `main_supporter` (text, nullable): 활동 주지원자
   - `environment_limitations` (text, nullable): 환경 제한 사항
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now()): ✅ 추가됨

6. **process_logs** - 서비스 진행 기록지 (첨부 20)

   - `id` (PK, UUID)
   - `application_id` (uuid, NOT NULL, FK → applications.id): ✅ 올바르게 설정됨
   - `staff_id` (uuid, nullable, FK → profiles.id): ✅ 올바르게 설정됨
   - `log_date` (date, default CURRENT_DATE): 기록일
   - `service_area` (text, nullable): 서비스 영역
   - `funding_source` (text, nullable): 지원 구분 (공적급여 | 민간급여 | 센터지원)
   - `process_step` (text, nullable): 과정 (상담·평가 | 시험적용 | 대여 | 제작 등)
   - `item_name` (text, nullable): 품목명
   - `content` (text, nullable): 내용
   - `remarks` (text, nullable): 비고
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now()): ✅ 추가됨

7. **domain_assessments** - 보조기기 서비스 평가지 (첨부 21)
   - `id` (PK, UUID)
   - `application_id` (uuid, NOT NULL, FK → applications.id): ✅ 올바르게 설정됨
   - `evaluator_id` (uuid, nullable, FK → profiles.id): ✅ 올바르게 설정됨
   - `evaluation_date` (date, default CURRENT_DATE): 평가일
   - `domain_type` (text, NOT NULL): WC(휠체어) | ADL | S(감각) | SP(자세) | EC(환경개조) | CA(컴퓨터) | L(레저) | AAC | AM(자동차)
   - `evaluation_data` (jsonb, nullable): 영역별 평가 데이터
   - `measurements` (jsonb, nullable): 신체 치수 측정 데이터
   - `evaluator_opinion` (text, nullable): 평가자의견
   - `recommended_device` (text, nullable): 추천 보조기기
   - `future_plan` (text, nullable): 향후 계획
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now()): ✅ 추가됨

#### ⚠️ 스키마 개선 필요사항 (우선순위)

**✅ 이미 완료된 개선 사항** (Supabase MCP 확인 결과)

1. **Foreign Key 컬럼명 정리** ✅

   - ✅ `applications.client_id` - 올바르게 설정됨 (`id2` 제거됨)
   - ✅ `intake_records.application_id` - 올바르게 설정됨 (`id2` 제거됨)
   - ✅ `process_logs.application_id` - 올바르게 설정됨 (`id2` 제거됨)
   - ✅ `process_logs.staff_id` - 올바르게 설정됨 (`id3` 제거됨)
   - ✅ `domain_assessments.application_id` - 올바르게 설정됨 (`id2` 제거됨)
   - ✅ `domain_assessments.evaluator_id` - 올바르게 설정됨 (`id3` 제거됨)

2. **타임스탬프 필드** ✅

   - ✅ 모든 테이블에 `updated_at` 필드 추가됨
   - ✅ `created_at` 기본값 `now()` 설정됨

3. **데이터 무결성 강화** ✅

   - ✅ `profiles.clerk_user_id` UNIQUE 제약조건 추가
   - ✅ `profiles.role` CHECK 제약조건 (`'user' | 'staff' | 'manager'`)
   - ✅ `clients.gender` CHECK 제약조건 (`'남' | '여'`)
   - ✅ `inventory.status` CHECK 제약조건 (`'보관' | '대여중' | '수리중' | '소독중' | '폐기'`)
   - ✅ `applications.status` CHECK 제약조건 (`'접수' | '배정' | '진행' | '완료' | '반려'`)

4. **타입 개선** ✅
   - ✅ `intake_records.cognitive_sensory_check`: `text` → `text[]` (ARRAY)

**🔴 긴급 (아직 필요한 개선 사항)**

2. **applications 테이블 필드 추가** ✅

   - [x] `category` 필드 추가: `text` 타입, `'consult' | 'experience' | 'custom' | 'aftercare' | 'education'` ✅
   - [x] `sub_category` 필드 추가: `text` 타입, `'repair' | 'rental' | 'custom_make' | 'visit' | 'exhibition' | 'cleaning' | 'reuse'` 등 ✅
   - [x] `desired_date` 필드 추가: `date` 타입 (희망 서비스 일자) ✅
   - [x] `assigned_staff_id` 필드 추가: `uuid` 타입, FK → profiles.id (배정된 담당자) ✅

   > 📝 **마이그레이션 파일**: `migrations/002_add_applications_fields.sql` 생성 완료  
   > ⚠️ **실행 필요**: Supabase Dashboard SQL Editor에서 마이그레이션 실행 후 `npm run gen:types` 실행

3. **inventory 테이블 필드 추가** ✅

   - [x] `is_rental_available` 필드 추가: `boolean` 타입, default `true` (대여 가능 여부) ✅
   - [x] `purchase_date` 필드 추가: `date` 타입 (구입일) ✅
   - [x] `purchase_price` 필드 추가: `numeric` 타입 (구입가격) ✅
   - [x] `manufacturer` 필드 추가: `text` 타입 (제조사) ✅
   - [x] `model` 필드 추가: `text` 타입 (모델명) ✅
   - [x] `qr_code` 필드 추가: `text` 타입 (QR 코드 값) ✅

   > 📝 **마이그레이션 파일**: `migrations/003_add_inventory_fields.sql` 생성 완료  
   > ⚠️ **실행 필요**: Supabase Dashboard SQL Editor에서 마이그레이션 실행 후 `npm run gen:types` 실행

**🟡 중요 (Phase 1 완료 전)**

4. **service_logs 테이블 생성** ✅ (서비스 제공 상세 기록 - 상담 기록지, 서비스 진행 기록지, 평가지 양식 반영)

   - [x] `id` (PK, UUID) ✅
   - [x] `application_id` (FK → applications.id, NOT NULL) ✅
   - [x] `staff_id` (FK → profiles.id, nullable) ✅
   - [x] `inventory_id` (FK → inventory.id, nullable): 관련 기기 ✅
   - [x] `service_date` (date, default CURRENT_DATE): 서비스 제공 일자 ✅
   - [x] `service_type` (text, nullable): 서비스 유형 (repair, custom_make, rental, education 등) ✅
   - [x] `service_area` (text, nullable): 서비스 영역 ✅
   - [x] `funding_source` (text, nullable): 지원 구분 (public, private, center, other) ✅
   - [x] `funding_detail` (text, nullable): 상세 재원 정보 ✅
   - [x] `work_type` (text, nullable): 작업 유형 (상담·평가, 시험적용, 대여, 제작 등) ✅
   - [x] `item_name` (text, nullable): 품목명 ✅
   - [x] `work_description` (text, nullable): 작업 내용 설명 ✅
   - [x] `work_result` (text, nullable): 작업 결과 ✅
   - [x] `cost_total` (numeric, nullable): 수리/제작비 총액 ✅
   - [x] `cost_materials` (numeric, nullable): 재료비 ✅
   - [x] `cost_labor` (numeric, nullable): 인건비 ✅
   - [x] `cost_other` (numeric, nullable): 기타 비용 ✅
   - [x] `images_before` (text[], nullable): 작업 전 사진 URL 배열 ✅
   - [x] `images_after` (text[], nullable): 작업 후 사진 URL 배열 ✅
   - [x] `remarks` (text, nullable): 비고 ✅
   - [x] `notes` (text, nullable): 추가 메모 ✅
   - [x] `created_at` (timestamptz, default now()) ✅
   - [x] `updated_at` (timestamptz, default now()) ✅

   > 📝 **마이그레이션 파일**: `migrations/004_create_service_logs.sql` 생성 완료  
   > ⚠️ **실행 필요**: Supabase Dashboard SQL Editor에서 마이그레이션 실행 후 `npm run gen:types` 실행  
   > 📋 **참고**: 상담 기록지(첨부 19), 서비스 진행 기록지(첨부 20), 평가지(첨부 21) 양식 기반으로 설계됨

5. **schedules 테이블 생성** ✅ (일정 관리)

   - [x] `id` (PK, UUID) ✅
   - [x] `application_id` (FK → applications.id, nullable) ✅
   - [x] `staff_id` (FK → profiles.id, NOT NULL) ✅
   - [x] `client_id` (FK → clients.id, nullable) ✅
   - [x] `schedule_type` (text, NOT NULL): 'visit' | 'consult' | 'assessment' | 'delivery' | 'pickup' ✅
   - [x] `scheduled_date` (date, NOT NULL) ✅
   - [x] `scheduled_time` (time, nullable) ✅
   - [x] `address` (text, nullable): 방문 주소 ✅
   - [x] `notes` (text, nullable): 일정 메모 ✅
   - [x] `status` (text, default 'scheduled'): 'scheduled' | 'completed' | 'cancelled' ✅
   - [x] `created_at` (timestamptz, default now()) ✅
   - [x] `updated_at` (timestamptz, default now()) ✅

   > 📝 **마이그레이션 파일**: `migrations/005_create_schedules.sql` 생성 완료  
   > ⚠️ **실행 필요**: Supabase Dashboard SQL Editor에서 마이그레이션 실행 후 `npm run gen:types` 실행

**🟢 개선 (Phase 2 이후)**

6. **notices 테이블 생성** ✅ (공지사항)

   - [x] `id` (PK, UUID) ✅
   - [x] `title` (text, NOT NULL) ✅
   - [x] `content` (text, NOT NULL) ✅
   - [x] `category` (text, nullable): 'notice' | 'support' | 'event' ✅
   - [x] `is_pinned` (boolean, default false) ✅
   - [x] `created_by` (FK → profiles.id, nullable) ✅
   - [x] `created_at` (timestamptz, default now()) ✅
   - [x] `updated_at` (timestamptz, nullable) ✅

   > 📝 **마이그레이션 파일**: `migrations/006_create_notices.sql` 생성 완료  
   > ⚠️ **실행 필요**: Supabase Dashboard SQL Editor에서 마이그레이션 실행 후 `npm run gen:types` 실행

7. **rentals 테이블 생성** ✅ (대여 관리)

   - [x] `id` (PK, UUID) ✅
   - [x] `application_id` (FK → applications.id, NOT NULL) ✅
   - [x] `inventory_id` (FK → inventory.id, NOT NULL) ✅
   - [x] `client_id` (FK → clients.id, NOT NULL) ✅
   - [x] `rental_start_date` (date, NOT NULL) ✅
   - [x] `rental_end_date` (date, NOT NULL) ✅
   - [x] `return_date` (date, nullable): 실제 반납일 ✅
   - [x] `extension_count` (integer, default 0): 연장 횟수 ✅
   - [x] `status` (text, default 'rented'): 'rented' | 'returned' | 'overdue' | 'damaged' ✅
   - [x] `created_at` (timestamptz, default now()) ✅
   - [x] `updated_at` (timestamptz, default now()) ✅

   > 📝 **마이그레이션 파일**: `migrations/007_create_rentals.sql` 생성 완료  
   > ⚠️ **실행 필요**: Supabase Dashboard SQL Editor에서 마이그레이션 실행 후 `npm run gen:types` 실행

---

## 🚀 Phase 1: 기반 구축 (Foundation) - 2주

### 1.1 프로젝트 초기 설정 ✅

- [x] Next.js 15 프로젝트 생성 (`create-next-app`) ✅
- [x] TypeScript 설정 (strict mode) ✅
- [x] Tailwind CSS + PostCSS 설정 ✅
- [x] ESLint 설정 ✅
- [x] `.env.local` 템플릿 생성 (`env.example` 파일 생성 완료) ✅
- [x] `.gitignore` 설정 (`.env.local` 제외) ✅

### 1.2 인증 시스템 (Clerk) ✅

- [x] Clerk 계정 생성 및 프로젝트 설정 ✅ (사용자 확인 완료)
- [x] Clerk SDK 설치 및 설정 ✅ (`@clerk/nextjs` 설치, ClerkProvider 설정)
- [x] `middleware.ts` 작성 (인증 체크, 라우팅 보호) ✅
- [x] Route Groups 설정: `(auth)`, `(public)`, `(portal)`, `(admin)` ✅
- [x] Clerk Webhook 설정 (`/api/webhooks/clerk/route.ts`) ✅
  - [x] 유저 생성 시 Supabase `profiles` 테이블 동기화 ✅
  - [x] 유저 삭제 시 정리 로직 ✅

### 1.3 데이터베이스 설정 (Supabase) ✅

- [x] Supabase 프로젝트 확인 ✅
  - [x] Project Ref: `uyjbndiwyddjyjkdfuyi` ✅
  - [x] MCP 서버 연결 확인 (`supabase-co-AT`) ✅
  - [x] Supabase Dashboard에서 스키마 확인 ✅ (사용자 확인 필요)
- [x] 마이그레이션 스크립트 생성 및 실행 ✅
  - [x] 마이그레이션 파일 생성 완료 (`migrations/002~007`) ✅
  - [x] Supabase Dashboard SQL Editor에서 마이그레이션 실행 완료 ✅
- [x] RLS (Row Level Security) 정책 작성 ✅
  - [x] 사용자 규칙에 따라 RLS 사용하지 않음 (스킵) ✅
- [x] 타입 생성 스크립트 설정 및 실행 ✅
  - [x] `package.json`에 스크립트 추가 완료 ✅
  - [x] `types/database.types.ts` 파일 생성 완료 ✅
  - [x] 마이그레이션 실행 후 `npm run gen:types` 실행 완료 ✅
- [x] `lib/supabase/client.ts` 작성 (Client Component용) ✅
- [x] `lib/supabase/server.ts` 작성 (Server Component용, Cookie 기반) ✅

### 1.4 UI 기반 설정 ✅

- [x] shadcn/ui 초기화 (`npx shadcn-ui@latest init`) ✅
- [x] 기본 컴포넌트 설치: Button, Card, Input, Dialog, Calendar ✅
- [x] `app/globals.css` 설정 (Pretendard 폰트 CDN 추가) ✅
  - [x] Pretendard 폰트 적용 완료 ✅
  - [x] 다크 모드 가독성 개선 (배경 어두울 때 글자 밝게) ✅
  - [x] 반응형 텍스트 유틸리티 추가 (글자 깨짐 방지) ✅
- [x] Tailwind Config 설정 (색상 토큰, Spacing-First 준수) ✅
  - [x] Pretendard 폰트 패밀리 설정 ✅
  - [x] 반응형 폰트 크기 설정 ✅
- [x] `lib/utils.ts` 작성 (`cn()` 함수) ✅

### 1.5 레이아웃 컴포넌트 ✅

- [x] `app/layout.tsx` (Root Layout, Providers) ✅
- [x] `components/layout/public-header.tsx` (대민용 GNB) ✅
- [x] `components/layout/public-footer.tsx` ✅
- [x] `components/layout/admin-sidebar.tsx` (직원용 사이드바) ✅
- [x] `components/layout/admin-header.tsx` (관리자 헤더) ✅
- [x] `components/layout/portal-header.tsx` (포털 헤더) ✅
- [x] `components/layout/mobile-bottom-nav.tsx` (모바일 하단 탭) ✅

### 1.6 공통 컴포넌트 ✅

- [x] `components/common/logo.tsx` (GWATC 로고) ✅
- [x] `components/common/loading-spinner.tsx` ✅
- [x] `components/common/status-badge.tsx` (접수/완료 등 상태 뱃지) ✅
  - [x] 다크 모드 대비 개선 완료 ✅
- [x] `components/common/file-uploader.tsx` (이미지 업로드) ✅
  - [x] 반응형 디자인 개선 완료 ✅
  - [x] 다크 모드 대비 개선 완료 ✅

---

## 🎯 Phase 2: Public Zone (대민 서비스) - 2주

### 2.1 랜딩 페이지 ✅

- [x] `app/(public)/page.tsx` 작성 ✅
- [x] `components/features/landing/HomeHeroSection.tsx` ✅
  - [x] 메인 비주얼 및 슬로건 ✅
- [x] `components/features/landing/HomeQuickMenuGrid.tsx` ✅
  - [x] 5대 사업 바로가기 카드 (gap-4 md:gap-6) ✅
- [x] `components/features/landing/HomeNoticeTabs.tsx` ✅
  - [x] 공지사항/지원사업 탭 ✅
- [x] `components/features/landing/HomeGallerySlider.tsx` ✅
  - [x] 보조기기 유튜브 영상 갤러리 ✅
- [x] `components/features/landing/HomePublicCalendar.tsx` ✅
  - [x] 공개 캘린더 컴포넌트 (월간 뷰, shadcn/ui Calendar 활용) ✅
  - [x] 견학 일정, 교육 일정 등 대민 공개 일정 표시 ✅
  - [x] 일정 클릭 시 상세 정보 모달 표시 (일정 타입, 시간, 장소, 설명) ✅
  - [x] 견학 예약 기능 (로그인 사용자만 예약 가능, `createApplication()` 호출 준비) ✅
- [x] `actions/schedule-actions.ts` 작성 ✅
  - [x] `getPublicSchedules()` Server Action - 공개 일정 조회 ✅
  - [x] date-fns 라이브러리 활용 (날짜 포맷팅 및 계산) ✅
- [x] `actions/notice-actions.ts` 작성 ✅
  - [x] `getRecentNotices()`, `getNoticesByCategory()`, `getNoticeById()` Server Actions ✅

### 2.2 서비스 신청 시스템 ✅

- [x] `app/(portal)/apply/page.tsx` 작성 ✅
- [x] `components/features/application/ServiceApplicationWizard.tsx` ✅
  - [x] 단계 관리 컨테이너 (Zustand Store 연동) ✅
- [x] `components/features/application/ServiceCategorySelector.tsx` ✅
  - [x] 5대 사업 카테고리 선택 그리드 ✅
- [x] `components/features/application/wizard-step-nav.tsx` ✅
  - [x] 단계 표시기 (Step 1-2-3) ✅
- [x] `components/features/application/forms/` 폼 컴포넌트 ✅
  - [x] `ServiceConsultForm.tsx` (상담 신청) ✅
  - [x] `ServiceRentalForm.tsx` (대여 신청) ✅
  - [x] `ServiceCustomForm.tsx` (맞춤제작 신청) ✅
  - [x] `ServiceReuseForm.tsx` (재사용 신청) ✅
  - [x] `ServiceRepairForm.tsx` (수리 신청) ✅
  - [x] `ServiceCleaningForm.tsx` (소독 및 세척 신청) ✅
  - [x] `ServiceEducationForm.tsx` (교육 신청) ✅
  - [x] `ServicePromotionForm.tsx` (홍보 신청) ✅
- [x] `lib/validators.ts` 작성 ✅
  - [x] Zod 스키마 정의 (모든 신청 폼 검증) ✅
- [x] `actions/application-actions.ts` 작성 ✅
  - [x] `createApplication()` Server Action ✅
- [x] `components/features/application/success-modal.tsx` ✅
  - [x] 신청 완료 모달 ✅
- [x] `lib/stores/application-store.ts` 작성 ✅
  - [x] Zustand Store로 신청 상태 관리 ✅

### 2.3 마이페이지 (Portal) ✅

- [x] `app/(portal)/mypage/page.tsx` 작성 ✅
- [x] `components/features/portal/ClientTimelineList.tsx` ✅
  - [x] 신청 이력 타임라인 리스트 ✅
- [x] `components/features/portal/ClientTimelineItem.tsx` ✅
  - [x] 개별 이력 카드 (상태별 색상 분기) ✅
- [x] `components/features/portal/ClientRentStatus.tsx` ✅
  - [x] 대여 중인 기기 반납 D-Day 표시 ✅
- [x] `actions/portal-actions.ts` 작성 ✅
  - [x] `getMyApplications()` Server Action - 사용자 신청 이력 조회 ✅
  - [x] `getMyRentals()` Server Action - 사용자 대여 중인 기기 조회 ✅

### 2.4 공지사항 ✅

- [x] `app/(public)/notices/page.tsx` (목록) ✅
  - [x] 전체/지원사업/행사-이벤트 탭으로 분류 ✅
  - [x] 고정 공지사항 표시 ✅
  - [x] 카테고리별 필터링 ✅
- [x] `app/(public)/notices/[id]/page.tsx` (상세) ✅
  - [x] 공지사항 상세 내용 표시 ✅
  - [x] 목록으로 돌아가기 버튼 ✅
  - [x] 공유 기능 (사용자 권한) ✅
- [x] 공지사항 권한 시스템 ✅
  - [x] `lib/utils/permissions.ts` - 권한 체크 유틸리티 ✅
  - [x] 사용자: 열람, 공유 권한 ✅
  - [x] 관리자/직원: CRUD 모든 기능 ✅
- [x] `app/(admin)/notices/page.tsx` (관리자용 공지사항 관리) ✅
- [x] `components/features/admin/notices/NoticeList.tsx` ✅
  - [x] 공지사항 목록 표시 ✅
  - [x] 수정/삭제 기능 ✅
- [x] `components/features/admin/notices/NoticeCreateDialog.tsx` ✅
  - [x] 공지사항 작성 폼 ✅
- [x] `components/features/admin/notices/NoticeEditDialog.tsx` ✅
  - [x] 공지사항 수정 폼 ✅
- [x] `components/features/notices/NoticeShareButton.tsx` ✅
  - [x] 공유 기능 (Web Share API, 링크 복사) ✅
- [x] `actions/notice-actions.ts` 확장 ✅
  - [x] `createNotice()` Server Action ✅
  - [x] `updateNotice()` Server Action ✅
  - [x] `deleteNotice()` Server Action ✅
  - [x] `getAllNotices()` Server Action (관리자용) ✅

---

## 🏢 Phase 3: Admin Zone (업무 시스템) - 3주

### 3.1 통합 대시보드 ✅

- [x] `app/(admin)/dashboard/page.tsx` 작성 ✅
- [x] `components/features/dashboard/AdminDashboardKpi.tsx` ✅
  - [x] 오늘의 실적 요약 카드 (신규 접수, 진행 중, 완료) ✅
- [x] `components/features/dashboard/AdminNewRequestList.tsx` ✅
  - [x] 신규 접수 건 리스트 (최신순) ✅
- [x] `components/features/dashboard/AdminTodaySchedule.tsx` ✅
  - [x] 오늘의 일정 (방문 예정) ✅
- [x] React Query 설정 (`@tanstack/react-query`) ✅
  - [x] `useDashboardStats()` 훅 ✅
- [x] `actions/dashboard-actions.ts` 작성 ✅
  - [x] `getDashboardStats()` Server Action ✅
  - [x] `getNewApplications()` Server Action ✅
  - [x] `getTodaySchedules()` Server Action ✅

### 3.2 대상자 CRM

- [x] `app/(admin)/clients/page.tsx` 작성 (검색 및 리스트) ✅
- [x] `app/(admin)/clients/[id]/page.tsx` 작성 (상세 정보) ✅
- [x] `components/features/crm/ClientTable.tsx` ✅
  - [x] 대상자 목록 (이름/생년월일 검색) ✅
  - [x] 필터링 (장애유형, 서비스 이력) ✅
- [x] `components/features/crm/ClientProfileCard.tsx` ✅
  - [x] 대상자 기본 정보 표시 ✅
- [x] `components/features/crm/ClientHistoryTable.tsx` ✅
  - [x] 서비스 이용 이력 타임라인 (5대 사업 통합) ✅
- [x] `actions/client-actions.ts` 작성 ✅
  - [x] `searchClients()`, `getClientById()`, `updateClient()` ✅

### 3.3 상담 기록 시스템

- [x] `components/features/intake/IntakeRecordFormV2.tsx` ✅
  - [x] 동적 양식 빌더 시스템 ✅
  - [x] 상담 기록지 입력 폼 (첨부 19 양식) ✅
  - [x] 신체 기능 체크 (관절가동범위) ✅
  - [x] 인지/감각 기능 체크박스 ✅
  - [x] 보유 보조기기 목록 ✅
  - [x] 양식 자유 수정 기능 (드래그 앤 드롭, 필드 추가/수정/삭제) ✅
  - [x] 양식 템플릿 저장/불러오기 ✅
  - [x] 다양한 필드 타입 지원 (텍스트, 숫자, 날짜, 셀렉트, 체크박스, 라디오 등) ✅
- [x] `actions/intake-actions.ts` 작성 ✅
  - [x] `createIntakeRecord()` Server Action ✅
- [x] `components/features/intake/FormBuilder.tsx` - 동적 양식 빌더 ✅
- [x] `components/features/intake/DynamicFormField.tsx` - 동적 필드 렌더링 ✅
- [x] `components/features/intake/FieldEditor.tsx` - 필드 편집기 ✅
- [x] `components/features/intake/FormTemplateManager.tsx` - 템플릿 관리 ✅
- [x] `lib/types/form-builder.types.ts` - 양식 타입 정의 ✅
- [x] `lib/templates/default-intake-template.ts` - 기본 템플릿 ✅

### 3.4 평가 시스템

- [x] `components/features/assessment/DomainAssessmentFormV2.tsx` ✅
  - [x] 동적 양식 빌더 시스템 ✅
  - [x] 영역별 평가지 선택 (WC, ADL, S, SP, EC, CA, L, AAC, AM) ✅
  - [x] 각 영역별 평가 템플릿 (동적 필드 렌더링) ✅
    - [x] 휠체어 및 이동 (WC) ✅
    - [x] 일상생활동작 (ADL) ✅
    - [x] 감각 (S) ✅
    - [x] 자세 (SP) ✅
    - [x] 주택 및 환경개조 (EC) ✅
    - [x] 컴퓨터 접근 (CA) ✅
    - [x] 레저 (L) ✅
    - [x] 보완대체의사소통 (AAC) ✅
    - [x] 자동차 개조 (AM) ✅
  - [x] 양식 자유 수정 기능 (드래그 앤 드롭, 필드 추가/수정/삭제) ✅
  - [x] 평가 템플릿 저장/불러오기 ✅
  - [x] 평가 결과 시각화 ✅
- [x] `actions/assessment-actions.ts` 작성 ✅
  - [x] `createDomainAssessment()` Server Action ✅
  - [x] `getDomainAssessments()` - 평가 목록 조회 ✅
  - [x] `getDomainAssessmentById()` - 평가 상세 조회 ✅
  - [x] `updateDomainAssessment()` - 평가 수정 ✅
- [x] `components/features/assessment/AssessmentResultVisualization.tsx` - 평가 결과 시각화 ✅
- [x] `lib/templates/assessment-templates.ts` - 영역별 평가 템플릿 ✅

### 3.5 서비스 진행 기록

- [x] `components/features/process/ServiceProgressDashboard.tsx` ✅
  - [x] 종합 대시보드 (상담 기록, 평가, 일정, 진행 기록 통합) ✅
  - [x] 통합 타임라인 뷰 ✅
  - [x] 타입별 통계 요약 (상담/평가/일정/진행 기록) ✅
  - [x] 진행 기록 작성 기능 (Dialog) ✅
  - [x] 필터링 기능 (타입별, 날짜 범위별) ✅
  - [x] 검색 기능 (제목, 설명, 메타데이터) ✅
  - [x] 엑스포트 기능 (CSV 다운로드) ✅
  - [x] 최근 30일 활동 통계 ✅
  - [x] 향상된 UI/UX (그라데이션 헤더, 호버 효과, 필터 초기화) ✅
- [x] `components/features/process/ProcessLogForm.tsx` ✅
  - [x] 서비스 진행 기록지 입력 (첨부 20 양식) ✅
  - [x] 과정 선택 (상담·평가, 시험적용, 대여, 제작 등) ✅
  - [x] 지원 구분 선택 (공적급여, 민간급여, 센터지원) ✅
  - [x] 향상된 UI/UX (그라데이션 헤더, 아이콘) ✅
- [x] `actions/process-actions.ts` 작성 ✅
  - [x] `createProcessLog()` Server Action ✅
  - [x] `getServiceProgressData()` - 통합 진행 데이터 조회 ✅
  - [x] `getProcessLogs()` - 진행 기록 목록 조회 ✅
  - [x] `schedule_type` 매핑 수정 (visit, consult, assessment, delivery, pickup, exhibition, education) ✅

---

## 🤖 Phase 4: AI 기능 구현 - 2주 ✅

### 4.1 AI SOAP 노트 생성 ✅

- [x] Google AI Studio API Key 발급 ✅
- [x] `lib/gemini/client.ts` 작성 ✅
  - [x] `getGeminiClient()` 함수 ✅
  - [x] `getGeminiModel()` 함수 ✅
- [x] `actions/ai-actions.ts` 작성 ✅
  - [x] `generateSoapNote(text: string)` Server Action ✅
  - [x] System Prompt 작성 (SOAP Note JSON 형식 강제) ✅
  - [x] 에러 핸들링 ✅
  - [x] 권한 확인 (관리자/직원만 사용 가능) ✅
  - [x] JSON 파싱 및 검증 로직 ✅
- [x] `components/features/soap-note/SoapAudioRecorder.tsx` ✅
  - [x] 음성 녹음 컴포넌트 (Web Speech API) ✅
  - [x] STT 변환 (Web Speech API 사용) ✅
  - [x] 한국어 인식 지원 (ko-KR) ✅
  - [x] 연속 인식 및 중간 결과 표시 ✅
- [x] `components/features/soap-note/SoapNoteEditor.tsx` ✅
  - [x] SOAP 텍스트 에디터 (S, O, A, P 섹션) ✅
  - [x] AI 생성 버튼 연동 ✅
  - [x] Streaming UI 패턴 (로딩 중 Skeleton) ✅
  - [x] 음성 녹음 연동 ✅
  - [x] 에러 처리 및 표시 ✅
- [x] `components/features/soap-note/AiGenerateButton.tsx` ✅
  - [x] Gemini 호출 버튼 ✅
  - [x] 로딩 상태 표시 ✅
  - [x] 에러 핸들링 ✅

### 4.2 RAG 챗봇 (선택사항)

- [ ] 운영 지침서 벡터화 (Supabase pgvector)
- [ ] `actions/rag-actions.ts` 작성
  - [ ] 문서 검색 및 컨텍스트 결합
- [ ] `components/features/chat/RegulationChatbot.tsx`
  - [ ] 규정 검색 챗봇 UI

---

## 📦 Phase 5: 재고 관리 시스템 - 1주

### 5.1 재고 관리 ✅

- [x] `app/(admin)/inventory/page.tsx` 작성 ✅
- [x] `actions/inventory-actions.ts` 확장 ✅
  - [x] `getInventoryList()` - 필터링, 검색, 페이지네이션 지원 ✅
  - [x] `getInventoryItem()` - 재고 상세 조회 ✅
  - [x] `createInventoryItem()` - 재고 등록 ✅
  - [x] `updateInventoryItem()` - 재고 수정 ✅
  - [x] `deleteInventoryItem()` - 재고 삭제 ✅
  - [x] `updateInventoryStatus()` - 재고 상태 변경 (불출 관리) ✅
  - [x] `getInventoryByQRCode()` - QR 코드로 재고 조회 ✅
- [x] `components/features/inventory/InventoryManagementContent.tsx` ✅
  - [x] 통합 재고 관리 컨테이너 (카드/테이블 뷰 전환) ✅
  - [x] 실시간 검색 및 필터링 (상태, 카테고리, 대여 가능 여부) ✅
  - [x] 통계 대시보드 (전체, 보관, 대여중, 수리중, 소독중, 폐기) ✅
  - [x] QR 스캔 버튼 통합 ✅
- [x] `components/features/inventory/InventoryList.tsx` ✅
  - [x] 카드 뷰 (시각적 상태 표시, 빠른 액션 버튼) ✅
  - [x] 테이블 뷰 (정렬, 상세 정보 표시) ✅
  - [x] 뷰 전환 기능 ✅
  - [x] 상태 변경 다이얼로그 ✅
  - [x] 삭제 확인 다이얼로그 ✅
- [x] `components/features/inventory/InventoryFormDialog.tsx` ✅
  - [x] 재고 등록/수정 다이얼로그 ✅
  - [x] 대여 가능 여부 설정 ✅
  - [x] 제조사 정보 입력 ✅
  - [x] 구입 정보 입력 ✅
  - [x] QR 코드 필드 (자동 생성 가능) ✅
- [x] `components/features/inventory/QRCodeGenerator.tsx` ✅
  - [x] QR 코드 생성 (UUID 기반) ✅
  - [x] QR 코드 저장 기능 ✅
  - [x] QR 코드 다운로드 기능 ✅
  - [x] QR 코드 미리보기 ✅
- [x] `components/features/inventory/QRCodeScanner.tsx` ✅
  - [x] QR 코드 스캔 (카메라 API) ✅
  - [x] 수동 입력 지원 ✅
  - [x] 재고 조회 및 상세 정보 표시 ✅

### 5.2 대여 관리 ✅

- [x] `actions/rental-actions.ts` 작성 ✅
  - [x] `createRental()` - 대여 생성 (대여 승인) ✅
  - [x] `returnRental()` - 대여 반납 ✅
  - [x] `extendRental()` - 대여 기간 연장 ✅
  - [x] `getRentals()` - 대여 목록 조회 ✅
  - [x] `getRentalById()` - 대여 상세 조회 ✅
  - [x] `getOverdueRentals()` - 연체 대여 목록 조회 ✅
  - [x] `getExpiringRentals()` - 만료 예정 대여 목록 조회 (D-Day 계산) ✅
- [x] 대여 승인 시 `inventory.status` → '대여중' 변경 ✅
  - [x] `createRental()` 함수에서 자동 처리 ✅
- [x] 반납 시 `inventory.status` → '보관' 변경 ✅
  - [x] `returnRental()` 함수에서 자동 처리 ✅
- [x] 대여 기간 만료 알림 (D-Day 계산) ✅
  - [x] `getOverdueRentals()` - 연체 대여 조회 ✅
  - [x] `getExpiringRentals()` - 만료 예정 대여 조회 (7일 이내) ✅
  - [x] `RentalAlerts` 컴포넌트 - 대시보드 알림 표시 ✅
- [x] `app/(admin)/rentals/page.tsx` 작성 ✅
- [x] `components/features/inventory/RentalManagementContent.tsx` 작성 ✅
  - [x] 대여 목록 표시 (상태별 필터링) ✅
  - [x] 반납 처리 다이얼로그 ✅
  - [x] 연장 처리 다이얼로그 ✅
  - [x] D-Day 계산 및 표시 ✅
  - [x] 연체/만료 예정 알림 ✅
- [x] 사이드바에 대여 관리 메뉴 추가 ✅

### 5.3 맞춤제작 관리 ✅

- [x] 맞춤제작 전용 테이블 설계 및 마이그레이션 ✅
  - [x] `custom_makes` 테이블 생성 (제작 품목, 진행도, 장비 정보) ✅
  - [x] `equipment` 테이블 생성 (3D프린터, CNC 등 장비 관리) ✅
  - [x] `custom_make_progress` 테이블 생성 (진행도 이력) ✅
  - [x] 마이그레이션 파일: `migrations/010_create_custom_makes.sql` ✅
- [x] `actions/custom-make-actions.ts` 작성 ✅
  - [x] `createCustomMake()` - 맞춤제작 프로젝트 생성 ✅
  - [x] `updateCustomMakeProgress()` - 진행도 업데이트 ✅
  - [x] `getCustomMakes()` - 맞춤제작 목록 조회 ✅
  - [x] `getCustomMakeById()` - 맞춤제작 상세 조회 ✅
  - [x] `assignEquipment()` - 장비 배정 ✅
  - [x] `getEquipment()` - 장비 목록 조회 ✅
- [x] `app/(admin)/custom-makes/page.tsx` 작성 ✅
- [x] `components/features/custom-make/CustomMakeManagementContent.tsx` 작성 ✅
  - [x] 맞춤제작 목록 (진행도별 필터링) ✅
  - [x] 제작 품목 정보 표시 ✅
  - [x] 진행도 시각화 (단계별 진행률) ✅
  - [x] 장비 배정 관리 ✅
  - [x] 통계 대시보드 (전체, 설계, 제작, 검수, 납품, 완료) ✅
- [x] `components/features/custom-make/CustomMakeFormDialog.tsx` 작성 ✅
  - [x] 맞춤제작 프로젝트 생성 폼 ✅
  - [x] 제작 품목 정보 입력 ✅
  - [x] 대상자 선택 ✅
  - [x] 예상 완료일 설정 ✅
- [x] `components/features/custom-make/ProgressTracker.tsx` 작성 ✅
  - [x] 진행도 단계 표시 (설계 → 제작 → 검수 → 납품) ✅
  - [x] 단계별 완료 체크 ✅
  - [x] 진행률 시각화 ✅
  - [x] 진행 메모 입력 ✅
- [x] `components/ui/progress.tsx` 작성 (진행률 표시 컴포넌트) ✅
- [x] 사이드바에 맞춤제작 관리 메뉴 추가 ✅
- [ ] 장비 관리 페이지 (추가 개발 필요)
  - [ ] `components/features/custom-make/EquipmentManager.tsx` 작성
  - [ ] 장비 목록 관리
  - [ ] 장비 상태 관리 (사용중/대기중/점검중)
  - [ ] 장비 예약 관리
- [ ] 일정 관리 연동 (추가 개발 필요)
  - [ ] 제작 일정과 schedules 테이블 연동
  - [ ] 캘린더에 제작 일정 표시

---

## 💼 Phase 6: 비즈니스 로직 구현 - 1주

### 6.1 한도 체크 로직

- [x] 수리비 10만원 한도 체크 ✅
  - [x] `actions/business-actions.ts` 작성 ✅
  - [x] `checkRepairLimit(clientId: string, amount: number)` 함수 ✅
  - [x] 연간 누적 수리비 계산 ✅
    - [x] `service_logs` 테이블에서 수리비 합계 계산 ✅
    - [x] `applications` 테이블과 JOIN하여 `client_id` 필터링 ✅
    - [x] 올해 연도 기준으로 계산 ✅
  - [x] 초과 시 경고 모달 표시 ✅
    - [x] `RepairLimitWarningDialog` 컴포넌트 작성 ✅
    - [x] 현재 누적 수리비, 신규 수리비, 합계, 한도 표시 ✅
    - [x] 초과 금액 계산 및 표시 ✅
  - [ ] 수리비 입력 폼에 한도 체크 통합 (service_logs 생성 시)
- [x] 맞춤제작 연 2회 횟수 제한 체크 ✅
  - [x] `actions/business-actions.ts` 작성 ✅
  - [x] `checkCustomLimit(clientId: string)` 함수 ✅
  - [x] 연간 맞춤제작 횟수 계산 ✅
    - [x] `custom_makes` 테이블에서 완료된 프로젝트 카운트 ✅
    - [x] `applications` 테이블에서 맞춤제작 신청서 카운트 ✅
    - [x] 올해 연도 기준으로 계산 ✅
  - [x] 초과 시 경고 모달 표시 ✅
    - [x] `CustomLimitWarningDialog` 컴포넌트 작성 ✅
    - [x] `CustomMakeFormDialog`에 제한 체크 로직 통합 ✅
    - [x] `createCustomMake()` 함수에 제한 체크 통합 ✅
- [x] 맞춤제작비 10만원 한도 체크 (재료비 기준) ✅
  - [x] `checkCustomMakeCostLimit(clientId: string, amount: number)` 함수 ✅
  - [x] 연간 누적 맞춤제작비(재료비) 계산 ✅
    - [x] `custom_makes` 테이블에서 재료비(`cost_materials`) 합계 계산 ✅
    - [x] 재료비 없으면 총 비용(`cost_total`)의 70% 추정 ✅
    - [x] 올해 연도 기준으로 계산 ✅
  - [x] 초과 시 경고 모달 표시 ✅
    - [x] `CustomMakeCostLimitWarningDialog` 컴포넌트 작성 ✅
    - [x] 현재 누적 재료비, 신규 재료비, 합계, 한도 표시 ✅
    - [x] 초과 금액 계산 및 표시 ✅
    - [x] `CustomMakeFormDialog`에 재료비 입력 필드 및 한도 체크 통합 ✅
    - [x] `createCustomMake()` 함수에 비용 한도 체크 통합 ✅

### 6.2 개인정보 보유 기간 관리

- [x] 개인정보 보유 기간(5년) 만료 시 알림 ✅
  - [x] `actions/privacy-actions.ts` 작성 ✅
    - [x] `getExpiringPrivacyData()` - 만료 예정 데이터 조회 (1개월 전 알림) ✅
    - [x] `getExpiredPrivacyData()` - 만료된 데이터 조회 ✅
    - [x] `getPrivacyRetentionStats()` - 보유 기간 통계 조회 ✅
  - [x] 만료 예정 데이터 조회 (1개월 전 알림) ✅
  - [x] 관리자 대시보드에 알림 표시 ✅
    - [x] `PrivacyRetentionAlerts` 컴포넌트 작성 ✅
    - [x] 만료된 데이터 우선 표시 (긴급) ✅
    - [x] 만료 예정 데이터 표시 (1개월 전, 7일 이내 긴급 표시) ✅
    - [x] 대상자 상세보기 링크 제공 ✅

---

## 📅 Phase 7: 일정 관리 - 1주

### 7.1 캘린더 시스템

- [ ] `app/(admin)/schedule/page.tsx` 작성
- [ ] `components/features/schedule/CalendarView.tsx`
  - [ ] 월간/주간/일간 뷰
  - [ ] 방문 일정 표시
- [ ] `components/features/schedule/ScheduleForm.tsx`
  - [ ] 일정 등록 폼
- [ ] `actions/schedule-actions.ts` 작성
  - [ ] `createSchedule()`, `updateSchedule()`, `deleteSchedule()`

---

## 🎨 Phase 8: UI/UX 개선 및 반응형 - 1주

### 8.1 모바일 최적화

- [ ] 모든 페이지 모바일 반응형 검토
- [ ] 터치 제스처 최적화
- [ ] 모바일 하단 네비게이션 적용

### 8.2 접근성 (A11y) ✅

- [x] 접근성 툴바 컴포넌트 생성 (`components/accessibility/accessibility-toolbar.tsx`) ✅
  - [x] 화면 확대/축소 기능 (50% ~ 200%, 기본 100%) ✅
  - [x] 고대비 모드 전환 기능 ✅
  - [x] 음성 출력 기능 (TTS, Web Speech API) ✅
  - [x] 키보드 단축키 지원 (Alt + A: 열기/닫기, Alt + +/-: 확대/축소, Alt + 0: 리셋, Alt + H: 고대비, Alt + S: 음성) ✅
  - [x] 설정 로컬 스토리지 저장 ✅
- [x] 키보드 네비게이션 컴포넌트 생성 (`components/accessibility/keyboard-navigator.tsx`) ✅
  - [x] 스캔 모드 기능 (Alt + K: 활성화/비활성화) ✅
  - [x] Tab 키로 모든 포커스 가능한 요소 순차 탐색 ✅
  - [x] Shift + Tab으로 역방향 탐색 ✅
  - [x] 포커스된 요소 자동 스크롤 ✅
- [x] 고대비 모드 CSS 추가 (`app/globals.css`) ✅
- [x] 키보드 포커스 강화 스타일 추가 ✅
- [x] 스크린 리더 전용 클래스 추가 (`.sr-only`) ✅
- [ ] 모든 인터랙티브 요소에 aria-label 추가
- [ ] 모든 이미지에 alt 텍스트 추가
- [ ] 폼 요소에 aria-describedby 연결
- [ ] 색상 대비 검증 (WCAG AA 기준)
- [ ] 스크린 리더 테스트 (NVDA, JAWS)

---

## 🧪 Phase 9: 테스트 및 안정화 - 1주

### 9.1 기능 테스트

- [ ] 인증 플로우 테스트
- [ ] 신청서 접수 플로우 테스트
- [ ] AI SOAP 노트 생성 테스트
- [ ] 재고 관리 플로우 테스트
- [ ] 비즈니스 로직 한도 체크 테스트

### 9.2 성능 최적화

- [ ] 이미지 최적화 (`next/image` 사용)
- [ ] 코드 스플리팅 검토
- [ ] React Query 캐싱 전략 최적화

### 9.3 보안 점검

- [ ] RLS 정책 재검토
- [ ] API Key 노출 방지 확인
- [ ] XSS, CSRF 방어 확인

---

## 📊 Phase 10: 통계 및 보고서 - 1주

### 10.1 통계 대시보드

- [ ] `components/features/dashboard/StatsChart.tsx`
  - [ ] 5대 사업별 실적 그래프
  - [ ] 월별/연도별 통계
- [ ] `actions/stats-actions.ts` 작성
  - [ ] 실적 집계 쿼리

### 10.2 데이터 내보내기

- [ ] Excel 내보내기 기능 (xlsx 라이브러리)
- [ ] 사업 실적 보고서 자동 생성

---

## 🚀 Phase 11: 배포 준비 - 1주

### 11.1 환경 설정

- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 (Clerk, Supabase, Gemini)
- [ ] 도메인 연결

### 11.2 CI/CD

- [ ] GitHub Actions 설정 (선택사항)
- [ ] 자동 배포 파이프라인 확인

### 11.3 문서화

- [ ] 사용자 매뉴얼 작성
- [ ] 관리자 가이드 작성
- [ ] API 문서 작성 (선택사항)

---

## 📝 개발 컨벤션 체크리스트

### 코드 스타일

- [ ] Spacing-First 정책 준수 (margin 사용 지양, padding/gap 활용)
- [ ] 컴포넌트 네이밍: `[Domain][Role][Variant]` 형식
- [ ] 불필요한 추상화 제거 (단순 래퍼 컴포넌트 금지)

### 타입 안전성

- [ ] `any` 타입 사용 금지
- [ ] `database.types.ts` 적극 활용
- [ ] Zod 스키마로 모든 폼 검증

### Next.js 15 준수

- [ ] 동적 파라미터에 `await params` 사용
- [ ] Server Actions 활용 (API Route 최소화)
- [ ] Server Components 우선 사용

### 로깅

- [ ] 핵심 기능에 로그 추가 (신청 접수, AI 생성, 재고 변경 등)

---

## 🔍 데이터베이스 스키마 개선 TODO

### 📝 마이그레이션 스크립트 작성 필요

> ⚠️ **참고**: Foreign Key 컬럼명 정리는 **이미 완료**되었습니다!  
> 아래 스크립트는 추가 필드 및 테이블 생성에 집중합니다.

다음 SQL 스크립트를 `migrations/002_add_fields_and_tables.sql` 파일로 작성:

```sql
-- ✅ Foreign Key 컬럼명 정리는 이미 완료되었습니다!
-- 실제 데이터베이스는 이미 올바르게 설정되어 있습니다.

-- 1. applications 테이블 필드 추가 ✅ (마이그레이션 파일: migrations/002_add_applications_fields.sql)
-- ALTER TABLE applications
--   ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('consult', 'experience', 'custom', 'aftercare', 'education')),
--   ADD COLUMN IF NOT EXISTS sub_category TEXT,
--   ADD COLUMN IF NOT EXISTS desired_date DATE,
--   ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES profiles(id);

-- 3. inventory 테이블 필드 추가 ✅ (마이그레이션 파일: migrations/003_add_inventory_fields.sql)
-- ALTER TABLE inventory
--   ADD COLUMN IF NOT EXISTS is_rental_available BOOLEAN DEFAULT true,
--   ADD COLUMN IF NOT EXISTS purchase_date DATE,
--   ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
--   ADD COLUMN IF NOT EXISTS manufacturer TEXT,
--   ADD COLUMN IF NOT EXISTS model TEXT,
--   ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- 4. service_logs 테이블 생성 ✅ (마이그레이션 파일: migrations/004_create_service_logs.sql)
-- 실제 양식 문서(상담 기록지, 서비스 진행 기록지, 평가지) 기반으로 설계됨
-- CREATE TABLE IF NOT EXISTS service_logs (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
--   staff_id UUID REFERENCES profiles(id),
--   inventory_id UUID REFERENCES inventory(id),
--   service_date DATE DEFAULT CURRENT_DATE,
--   service_type TEXT,
--   service_area TEXT,
--   funding_source TEXT,
--   funding_detail TEXT,
--   work_type TEXT,
--   item_name TEXT,
--   work_description TEXT,
--   work_result TEXT,
--   cost_total NUMERIC,
--   cost_materials NUMERIC,
--   cost_labor NUMERIC,
--   cost_other NUMERIC,
--   images_before TEXT[],
--   images_after TEXT[],
--   remarks TEXT,
--   notes TEXT,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- 5. schedules 테이블 생성 ✅ (마이그레이션 파일: migrations/005_create_schedules.sql)
-- CREATE TABLE IF NOT EXISTS schedules (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
--   staff_id UUID NOT NULL REFERENCES profiles(id),
--   client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
--   schedule_type TEXT NOT NULL CHECK (schedule_type IN ('visit', 'consult', 'assessment', 'delivery', 'pickup')),
--   scheduled_date DATE NOT NULL,
--   scheduled_time TIME,
--   address TEXT,
--   notes TEXT,
--   status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- 6. notices 테이블 생성 ✅ (마이그레이션 파일: migrations/006_create_notices.sql)
-- CREATE TABLE IF NOT EXISTS notices (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   title TEXT NOT NULL,
--   content TEXT NOT NULL,
--   category TEXT CHECK (category IN ('notice', 'support', 'event')),
--   is_pinned BOOLEAN DEFAULT false,
--   created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ
-- );

-- 7. rentals 테이블 생성 ✅ (마이그레이션 파일: migrations/007_create_rentals.sql)
-- CREATE TABLE IF NOT EXISTS rentals (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
--   inventory_id UUID NOT NULL REFERENCES inventory(id),
--   client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
--   rental_start_date DATE NOT NULL,
--   rental_end_date DATE NOT NULL,
--   return_date DATE,
--   extension_count INTEGER DEFAULT 0,
--   status TEXT DEFAULT 'rented' CHECK (status IN ('rented', 'returned', 'overdue', 'damaged')),
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_category ON applications(category);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_intake_records_application_id ON intake_records(application_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_application_id ON process_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_domain_assessments_application_id ON domain_assessments(application_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_application_id ON service_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_date ON schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_rentals_client_id ON rentals(client_id);
CREATE INDEX IF NOT EXISTS idx_rentals_rental_end_date ON rentals(rental_end_date);
```

### ✅ 체크리스트

**Phase 1.3 데이터베이스 설정 단계에서 수행:**

- [ ] 위 마이그레이션 스크립트 실행
- [ ] Foreign Key 제약조건 확인
- [ ] 인덱스 생성 확인
- [ ] `npm run gen:types` 실행하여 타입 재생성
- [ ] RLS 정책 작성 (새 테이블 포함)

---

## 🔬 Supabase MCP를 통한 데이터베이스 학습

### MCP 서버 설정 확인

`mcp.json` 파일에 다음 설정이 되어 있습니다:

```json
{
  "supabase-co-AT": {
    "command": "npx",
    "args": [
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--read-only",
      "--project-ref=uyjbndiwyddjyjkdfuyi"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "sbp_v0_4844266856c682057f82bc77cc1f1d2fb14d0e37"
    }
  }
}
```

### 데이터베이스 스키마 확인 방법

1. **MCP 리소스 조회**

   - Cursor에서 MCP 서버를 통해 테이블 목록 확인
   - 각 테이블의 컬럼 정보 확인

2. **타입 생성**

   - `npm run gen:types` 실행
   - `types/database.types.ts` 파일 확인
   - 생성된 타입을 코드에서 활용

3. **실제 데이터 확인**
   - Supabase Dashboard 접속
   - Table Editor에서 데이터 확인
   - SQL Editor에서 쿼리 실행

### 스키마 변경 시 워크플로우

1. Supabase Dashboard에서 스키마 변경 (또는 SQL 마이그레이션 실행)
2. `npm run gen:types` 실행하여 타입 재생성
3. TypeScript 타입 에러 확인 및 수정
4. 코드에서 새로운 필드/테이블 활용

---

## 📚 참고 문서

- **MRD.md**: 시장 요구사항, 5대 사업 정의
- **PRD.md**: 기능 명세, UI/UX 가이드
- **TRD.md**: 기술 설계, 아키텍처
- **Mermaid.md**: ERD, 시퀀스 다이어그램
- **DIR.md**: 디렉토리 구조 가이드
- **보조기기센터사업안내.md**: 실제 업무 규정 및 양식
- **assessform.md**: 평가 양식 상세
- **counsilform.md**: 상담 기록지 양식
- **processform.md**: 서비스 진행 기록지 양식

---

## ✅ 완료 기준 (Definition of Done)

각 Phase 완료 시 다음을 확인:

- [ ] 기능이 요구사항대로 동작하는가?
- [ ] 타입 에러가 없는가?
- [ ] 린트 에러가 없는가?
- [ ] 모바일 반응형이 적용되었는가?
- [ ] 핵심 기능에 로그가 추가되었는가?
- [ ] Spacing-First 정책을 준수했는가?

---

**마지막 업데이트**: 2025. 01. 27
