import '@testing-library/jest-dom'
import { vi } from 'vitest'

// server-only 모듈 모킹 (Clerk auth에서 사용)
vi.mock('server-only', () => ({
  default: {},
}))

// @clerk/nextjs/server 모듈 전체 모킹
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  currentUser: vi.fn(() => Promise.resolve({ id: 'test-user-id', emailAddresses: [{ emailAddress: 'test@example.com' }] })),
  clerkMiddleware: vi.fn(() => vi.fn()),
  createRouteMatcher: vi.fn(() => vi.fn(() => false)),
}))

// auth 함수를 export하여 테스트에서 사용 가능하도록
export { mockAuth }

// Next.js 모듈 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// next/headers 모킹
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
    get: vi.fn(() => undefined),
  })),
}))

// next/cache 모킹 (revalidatePath, revalidateTag 등)
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Clerk 모듈 모킹 — sessionClaims에 admin 역할 포함
const mockAuth = vi.fn(() => Promise.resolve({
  userId: 'test-user-id',
  sessionClaims: {
    metadata: { role: 'admin', apps: [] },
  },
}))

vi.mock('@clerk/nextjs', () => ({
  auth: mockAuth,
  currentUser: vi.fn(() => Promise.resolve({ id: 'test-user-id', emailAddresses: [{ emailAddress: 'test@example.com' }] })),
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
  }),
  SignInButton: ({ children }: any) => children,
  SignUpButton: ({ children }: any) => children,
  UserButton: () => null,
  ClerkProvider: ({ children }: any) => children,
  ClerkLoaded: ({ children }: any) => children,
  ClerkLoading: ({ children }: any) => children,
  ClerkFailed: ({ children }: any) => children,
}))

// Supabase 모듈 모킹 - 체이닝 지원
export const createMockSupabaseQuery = (result?: { data?: any; error?: any; count?: number }) => {
  const defaultResult = result || { data: null, error: null, count: 0 }
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    neq: vi.fn(() => query),
    gt: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    lte: vi.fn(() => query),
    in: vi.fn(() => query),
    or: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    range: vi.fn(() => Promise.resolve(defaultResult)),
    single: vi.fn(() => Promise.resolve(defaultResult)),
    maybeSingle: vi.fn(() => Promise.resolve(defaultResult)),
    count: 'exact',
  }
  // range나 single을 호출하면 Promise를 반환하도록 설정
  query.then = (resolve: any) => Promise.resolve(defaultResult).then(resolve)
  return query
}

export const mockCreateClient = vi.fn(() => ({
  from: vi.fn(() => createMockSupabaseQuery()),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

// Permissions 모듈 모킹
export const mockHasAdminOrStaffPermission = vi.fn(() => Promise.resolve(true))
export const mockGetCurrentUserProfileId = vi.fn(() => Promise.resolve('test-profile-id'))

vi.mock('@/lib/utils/permissions', () => ({
  hasAdminOrStaffPermission: mockHasAdminOrStaffPermission,
  getCurrentUserProfileId: mockGetCurrentUserProfileId,
}))

// @co-at/auth 모킹 — permissions (assertRole, getCurrentRole 등) 기본 통과
vi.mock('@co-at/auth', () => ({
  assertRole: vi.fn(() => Promise.resolve()),
  getCurrentRole: vi.fn(() => Promise.resolve('admin')),
  requireRole: vi.fn(() => Promise.resolve(true)),
  hasAppAccess: vi.fn(() => Promise.resolve(true)),
  hasAdminOrStaffPermission: vi.fn(() => Promise.resolve(true)),
  hasManagerPermission: vi.fn(() => Promise.resolve(true)),
  createAppMiddleware: vi.fn(() => vi.fn()),
  middlewareConfig: { matcher: [] },
}))

// Gemini 모듈 모킹
vi.mock('@/lib/gemini/client', () => ({
  getGeminiModel: vi.fn(() => ({
    generateContent: vi.fn(() =>
      Promise.resolve({
        response: {
          text: () => JSON.stringify({ subjective: '', objective: '', assessment: '', plan: '' }),
        },
      })
    ),
  })),
}))

const createMockAdminChain = (result = { data: null, error: null }): any => {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    in: vi.fn(() => chain),
    not: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  }
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve)
  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => createMockAdminChain()),
  })),
}))

// 환경 변수 모킹
process.env.GOOGLE_AI_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key'
process.env.CLERK_SECRET_KEY = 'test-clerk-secret'
