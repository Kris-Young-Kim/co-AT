# 테스트 가이드

## 테스트 환경 설정

이 프로젝트는 **Vitest**와 **React Testing Library**를 사용하여 테스트를 작성합니다.

### 설치

```bash
pnpm install
```

### 테스트 실행

```bash
# 모든 테스트 실행
pnpm test

# Watch 모드로 실행 (파일 변경 시 자동 재실행)
pnpm test:watch

# UI 모드로 실행 (시각적 테스트 인터페이스)
pnpm test:ui

# 커버리지 리포트 생성
pnpm test:coverage
```

## 테스트 구조

```
tests/
├── setup.ts                    # 테스트 환경 설정
└── actions/
    ├── auth.test.ts            # 인증 플로우 테스트
    ├── application.test.ts     # 신청서 접수 플로우 테스트
    ├── ai.test.ts              # AI SOAP 노트 생성 테스트
    ├── inventory.test.ts       # 재고 관리 플로우 테스트
    └── business.test.ts        # 비즈니스 로직 한도 체크 테스트
```

## 테스트 항목

### 1. 인증 플로우 테스트 (`tests/actions/auth.test.ts`)

- ✅ 로그인 상태 확인 (로그인된 사용자)
- ✅ 로그인 상태 확인 (비로그인 사용자)
- ✅ 관리자 권한 확인 (권한 있음)
- ✅ 관리자 권한 확인 (권한 없음)

### 2. 신청서 접수 플로우 테스트 (`tests/actions/application.test.ts`)

- ✅ 신청서 생성 성공
- ✅ 신청서 생성 실패 (로그인 필요)
- ✅ 신청서 생성 실패 (프로필 없음)

### 3. AI SOAP 노트 생성 테스트 (`tests/actions/ai.test.ts`)

- ✅ SOAP 노트 생성 성공
- ✅ SOAP 노트 생성 실패 (권한 없음)
- ✅ SOAP 노트 생성 실패 (빈 텍스트)
- ✅ SOAP 노트 생성 실패 (JSON 파싱 실패)

### 4. 재고 관리 플로우 테스트 (`tests/actions/inventory.test.ts`)

- ✅ 재고 목록 조회 성공
- ✅ 재고 등록 성공
- ✅ 재고 수정 성공
- ✅ 재고 삭제 성공
- ✅ 재고 목록 조회 실패 (권한 없음)

### 5. 비즈니스 로직 한도 체크 테스트 (`tests/actions/business.test.ts`)

#### 수리비 한도 체크
- ✅ 수리비 한도 체크 (한도 내)
- ✅ 수리비 한도 체크 (한도 초과)

#### 맞춤제작 횟수 제한 체크
- ✅ 맞춤제작 횟수 체크 (한도 내)
- ✅ 맞춤제작 횟수 체크 (한도 초과)

#### 맞춤제작비 한도 체크
- ✅ 맞춤제작비 한도 체크 (한도 내)
- ✅ 맞춤제작비 한도 체크 (한도 초과)

## 모킹 전략

### Clerk 인증 모킹

```typescript
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user-id' })),
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
}))
```

### Supabase 모킹

```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}))
```

### Gemini AI 모킹

```typescript
vi.mock('@/lib/gemini/client', () => ({
  getGeminiModel: vi.fn(() => ({
    generateContent: vi.fn(() =>
      Promise.resolve({
        response: {
          text: () => JSON.stringify({ ... }),
        },
      })
    ),
  })),
}))
```

## 테스트 작성 가이드

### 1. 테스트 파일 구조

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('기능명', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('테스트 케이스 설명', async () => {
    // Arrange: 테스트 데이터 준비
    // Act: 테스트 실행
    // Assert: 결과 검증
  })
})
```

### 2. 비동기 함수 테스트

```typescript
it('비동기 함수 테스트', async () => {
  const result = await someAsyncFunction()
  expect(result.success).toBe(true)
})
```

### 3. 에러 케이스 테스트

```typescript
it('에러 케이스 테스트', async () => {
  const result = await someFunction()
  expect(result.success).toBe(false)
  expect(result.error).toContain('에러 메시지')
})
```

## CI/CD 통합

GitHub Actions에서 테스트를 자동 실행하려면 `.github/workflows/test.yml` 파일을 생성하세요:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
```

## 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library 공식 문서](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
