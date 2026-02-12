# Clerk Google 로그인 설정 가이드

## "redirect_uri_mismatch" 오류 해결 (가장 흔함)

**원인**: Google Cloud Console의 "승인된 리디렉션 URI"에 Clerk의 URI가 없거나 다릅니다.

### 해결 순서 (중요: 순서대로 진행)

1. **Clerk 대시보드**에서 정확한 URI 복사
   - [Clerk Dashboard](https://dashboard.clerk.com/) → **Configure** → **SSO connections** → **Google** 클릭
   - **Use custom credentials** 활성화 시 **Authorized Redirect URI** 값이 표시됨
   - 이 값을 **그대로 복사** (예: `https://accounts.gwatc.cloud/...` 또는 `https://xxx.clerk.accounts.dev/...`)

2. **Google Cloud Console**에 동일 URI 추가
   - [Google Cloud Console](https://console.cloud.google.com/) → **API 및 서비스** → **사용자 인증 정보**
   - 사용 중인 OAuth 클라이언트 ID 클릭 (웹 애플리케이션)
   - **승인된 리디렉션 URI**에 Clerk에서 복사한 URI를 **정확히** 붙여넣기
   - 저장

3. **승인된 JavaScript 출처**에도 사이트 도메인 추가
   - 예: `https://co-at-gw.vercel.app`, `http://localhost:3000`

---

## "Missing required parameter: client_id" 오류 해결

이 오류는 **Clerk 대시보드**에 Google OAuth가 설정되지 않았을 때 발생합니다.

### 1단계: Clerk 대시보드에서 Redirect URI 확인 (먼저!)

1. [Clerk Dashboard](https://dashboard.clerk.com/) → **SSO connections** → **Google** → **Add connection**
2. **Use custom credentials** 켜기
3. 표시되는 **Authorized Redirect URI** 복사 (다음 단계에서 사용)

### 2단계: Google Cloud Console에서 OAuth 클라이언트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. **API 및 서비스** → **사용자 인증 정보** → **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
4. 애플리케이션 유형: **웹 애플리케이션**
5. **승인된 리디렉션 URI**: 1단계에서 복사한 Clerk URI **그대로** 추가
6. **승인된 JavaScript 출처**: `http://localhost:3000`, `https://your-domain.com` 추가
7. **클라이언트 ID**와 **클라이언트 보안 비밀** 복사

### 3단계: Clerk 대시보드에 Google 연결 설정

1. [Clerk Dashboard](https://dashboard.clerk.com/) 접속
2. **Configure** → **SSO connections** → **Google**
3. **Client ID**와 **Client Secret** 입력 (2단계에서 복사한 값)
4. 저장

### 4단계: .env.local 정리

`.env.local`에 Google OAuth JSON을 직접 넣으면 **동작하지 않습니다**.  
Clerk은 대시보드 설정만 사용합니다.

다음과 같은 형식은 **잘못된 형식**이므로 제거하세요:

```
"web":{"client_id":"...", "client_secret":"..."}
```

### 5단계: 도메인 허용 (프로덕션)

- Clerk **Production** 키 사용 시: **Clerk Dashboard** → **Configure** → **Domains**에 사용 도메인 추가
- 이전에 `firstmover.store` 전용이라면, GWATC 도메인도 추가 필요

### 참고

- 개발 모드: Clerk 공유 OAuth 자격 증명 사용 가능 (별도 설정 없이)
- 프로덕션: 반드시 Google Cloud + Clerk 대시보드 설정 필요
