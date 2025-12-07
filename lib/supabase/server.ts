/**
 * Supabase Server Client (Server Component용)
 * 서버 사이드에서 사용하는 Supabase 클라이언트 (Cookie 기반 인증)
 * Next.js 15 호환
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createClient() {
  // Next.js 15에서는 cookies()를 await해야 함
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Next.js 15 호환: cookieStore.getAll()의 반환값을
          // 명시적으로 배열로 변환하여 반환
          // Supabase SSR이 내부적으로 스프레드 연산자를 사용할 때 문제가 발생하지 않도록
          try {
            const allCookies = cookieStore.getAll()
            // ReadonlyRequestCookies.getAll()은 이미 배열을 반환하지만,
            // Next.js 15에서는 명시적으로 배열로 변환해야 함
            // 배열의 각 요소를 새 객체로 복사하여 반환 (원본 보호)
            return allCookies.map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }))
          } catch (error) {
            console.error('Cookie getAll failed:', error)
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn('Cookie setAll failed:', error)
          }
        },
      },
    }
  )
}

