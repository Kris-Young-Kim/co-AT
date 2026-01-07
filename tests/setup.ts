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

// Clerk 모듈 모킹
const mockAuth = vi.fn(() => Promise.resolve({ userId: 'test-user-id' }))

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

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
    })),
  })),
}))

// 환경 변수 모킹
process.env.GOOGLE_AI_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key'
process.env.CLERK_SECRET_KEY = 'test-clerk-secret'
