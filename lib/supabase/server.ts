/**
 * Supabase Server Client (Server Component용)
 * 서버 사이드에서 사용하는 Supabase 클라이언트 (Cookie 기반 인증)
 * Next.js 16 호환
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";

export async function createClient() {
  // Next.js 16에서는 cookies()를 await해야 함
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Next.js 16 호환: cookieStore.getAll()의 반환값을 배열로 변환
          // ReadonlyRequestCookies.getAll()은 ReadonlyRequestCookie[]를 반환하므로
          // 일반 객체 배열로 변환하여 Supabase SSR과 호환되도록 함
          try {
            const allCookies = cookieStore.getAll();
            // ReadonlyRequestCookie 객체를 일반 객체로 변환
            return Array.from(allCookies).map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }));
          } catch (error) {
            console.error("Cookie getAll failed:", error);
            return [];
          }
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn("Cookie setAll failed:", error);
          }
        },
      },
    }
  );
}
