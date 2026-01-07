# 보안 가이드 (Security Guide)

## 개요

이 문서는 Co-AT 프로젝트의 보안 정책 및 구현 가이드를 제공합니다.

---

## 1. 환경 변수 보안

### 1.1 클라이언트 노출 가능한 환경 변수

다음 환경 변수는 `NEXT_PUBLIC_` 접두사를 사용하여 클라이언트에 노출됩니다:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL (공개 정보)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key (공개 키, RLS로 보호됨)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk Publishable Key (공개 키)

⚠️ **주의**: 이 키들은 공개되어도 안전하지만, RLS 정책과 인증 시스템으로 보호됩니다.

### 1.2 서버 전용 환경 변수 (절대 노출 금지)

다음 환경 변수는 **절대 클라이언트에 노출되면 안 됩니다**:

- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키 (RLS 우회 가능)
- `CLERK_SECRET_KEY`: Clerk 시크릿 키
- `GOOGLE_AI_API_KEY`: Google AI API 키
- `WEBHOOK_SECRET`: Clerk Webhook 검증 시크릿

✅ **보안 확인**:
- [x] 서버 전용 키는 `NEXT_PUBLIC_` 접두사 없음
- [x] 서버 사이드 코드에서만 사용 (`lib/supabase/admin.ts`, `actions/*.ts`)
- [x] 클라이언트 컴포넌트에서 직접 접근 불가

---

## 2. RLS (Row Level Security) 정책

### 2.1 현재 상태

**개발 환경**: RLS가 비활성화되어 있습니다. (개발 편의성)

**프로덕션 환경**: 배포 전에 RLS를 활성화해야 합니다.

### 2.2 RLS 정책 가이드

#### 2.2.1 profiles 테이블

```sql
-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid()::text = clerk_user_id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid()::text = clerk_user_id);

-- 관리자/직원은 모든 프로필 조회 가능
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.uid()::text
    AND role IN ('admin', 'manager', 'staff')
  )
);
```

#### 2.2.2 applications 테이블

```sql
-- 사용자는 자신의 신청서만 조회 가능
CREATE POLICY "Users can view own applications"
ON applications FOR SELECT
USING (client_id IN (
  SELECT id FROM profiles WHERE clerk_user_id = auth.uid()::text
));

-- 관리자/직원은 모든 신청서 조회 가능
CREATE POLICY "Admins can view all applications"
ON applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.uid()::text
    AND role IN ('admin', 'manager', 'staff')
  )
);
```

#### 2.2.3 기타 테이블

- `schedules`: 공개 일정은 모든 사용자 조회 가능, 관리자만 수정 가능
- `notices`: 공개 공지사항은 모든 사용자 조회 가능, 관리자만 수정 가능
- `inventory`: 관리자/직원만 조회 및 수정 가능
- `rentals`: 사용자는 자신의 대여만 조회 가능, 관리자/직원은 모든 대여 조회 가능

### 2.3 RLS 활성화 방법

1. Supabase Dashboard 접속
2. Authentication > Policies 메뉴로 이동
3. 각 테이블에 대해 위 정책 생성
4. RLS 활성화: `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`

⚠️ **주의**: RLS를 활성화하기 전에 모든 정책을 먼저 생성해야 합니다. 그렇지 않으면 모든 데이터 접근이 차단됩니다.

---

## 3. XSS (Cross-Site Scripting) 방어

### 3.1 현재 상태

✅ **XSS 방어 확인**:
- [x] `dangerouslySetInnerHTML` 사용 없음
- [x] `innerHTML` 직접 조작 없음
- [x] React의 기본 이스케이프 처리 활용
- [x] 사용자 입력 검증 및 이스케이프 (Zod 스키마 사용)

### 3.2 권장 사항

1. **사용자 입력 검증**: 모든 사용자 입력은 Zod 스키마로 검증
2. **출력 이스케이프**: React는 기본적으로 HTML 이스케이프 처리
3. **외부 링크**: `rel="noopener noreferrer"` 사용
4. **Content Security Policy (CSP)**: 프로덕션에서 CSP 헤더 설정 권장

---

## 4. CSRF (Cross-Site Request Forgery) 방어

### 4.1 Next.js 기본 보호

Next.js는 기본적으로 CSRF 보호를 제공합니다:
- SameSite 쿠키 정책
- Origin 검증
- Server Actions는 자동으로 CSRF 보호

### 4.2 추가 보호

✅ **현재 구현**:
- [x] Webhook 검증: Clerk Webhook은 svix 라이브러리로 검증
- [x] 관리자 세션 쿠키: `httpOnly`, `secure`, `sameSite: 'lax'` 설정
- [x] API 라우트 인증: Clerk 인증으로 보호

### 4.3 권장 사항

1. **SameSite 쿠키**: 모든 인증 쿠키는 `sameSite: 'lax'` 또는 `'strict'` 사용
2. **Origin 검증**: API 라우트에서 Origin 헤더 검증 (필요 시)
3. **CSRF 토큰**: 민감한 작업에 추가 CSRF 토큰 사용 (필요 시)

---

## 5. 인증 및 권한 관리

### 5.1 Clerk 인증

- **Publishable Key**: 클라이언트에 노출 가능 (공개 키)
- **Secret Key**: 서버 전용 (절대 노출 금지)
- **Webhook Secret**: Webhook 검증용 (서버 전용)

### 5.2 권한 체크

모든 관리자 기능은 `hasAdminOrStaffPermission()` 함수로 권한을 확인합니다:

```typescript
// lib/utils/permissions.ts
export async function hasAdminOrStaffPermission(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  
  // Supabase에서 사용자 역할 확인
  // role이 'admin', 'manager', 'staff' 중 하나여야 함
}
```

### 5.3 Middleware 보호

`proxy.ts` (middleware)에서 다음 경로를 보호:
- `/portal/*`: 로그인 필요
- `/admin/*`: 관리자 권한 필요

---

## 6. API 보안

### 6.1 Server Actions

모든 Server Actions는:
- `'use server'` 디렉티브 사용
- 서버 사이드에서만 실행
- 클라이언트에서 직접 호출 불가

### 6.2 API Routes

- `/api/webhooks/clerk`: Webhook 검증 (svix)
- `/api/admin/session`: 관리자 세션 관리 (인증 필요)

---

## 7. 데이터 보안

### 7.1 민감 정보 처리

- **비밀번호**: Clerk에서 관리 (저장하지 않음)
- **개인정보**: RLS 정책으로 보호
- **API 키**: 환경 변수로 관리, 절대 코드에 하드코딩 금지

### 7.2 로깅

⚠️ **주의**: 로그에 민감 정보를 출력하지 않습니다.
- API 키, 비밀번호, 개인정보는 로그에 출력하지 않음
- 개발 환경에서만 디버그 로그 출력

---

## 8. 배포 전 체크리스트

프로덕션 배포 전에 다음을 확인하세요:

- [ ] 모든 환경 변수가 `.env.local`에 설정됨
- [ ] `.env.local`이 `.gitignore`에 포함됨
- [ ] RLS 정책이 모든 테이블에 설정됨
- [ ] RLS가 활성화됨 (프로덕션 환경)
- [ ] `NEXT_PUBLIC_` 접두사가 올바르게 사용됨
- [ ] 서버 전용 키가 클라이언트에 노출되지 않음
- [ ] Webhook 검증이 활성화됨
- [ ] 관리자 세션 쿠키가 `secure: true`로 설정됨 (프로덕션)
- [ ] Content Security Policy (CSP) 헤더 설정 (권장)

---

## 9. 보안 취약점 신고

보안 취약점을 발견한 경우:
1. 즉시 프로젝트 관리자에게 연락
2. 공개적으로 공유하지 않음
3. 수정 후 공개적으로 보고

---

**마지막 업데이트**: 2025. 01. 27
