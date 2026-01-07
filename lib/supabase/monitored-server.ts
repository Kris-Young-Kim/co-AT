/**
 * 모니터링이 활성화된 Supabase Server Client
 * 쿼리 실행 시간 측정 및 슬로우 쿼리 로깅
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import { measureQuery } from "@/lib/utils/query-logger";

type SupabaseClient = ReturnType<typeof createServerClient<Database>>;

/**
 * 쿼리 실행 시간을 측정하는 Supabase 클라이언트 래퍼
 */
class MonitoredSupabaseClient {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  // Supabase 클라이언트의 모든 메서드를 프록시로 래핑
  get from() {
    return new Proxy(this.client.from.bind(this.client), {
      apply: (target, thisArg, args) => {
        const table = args[0] as string;
        const queryBuilder = target.apply(thisArg, args);

        // QueryBuilder의 메서드들을 래핑
        return this.wrapQueryBuilder(queryBuilder, table);
      },
    });
  }

  private wrapQueryBuilder(queryBuilder: any, table: string) {
    const wrapped = new Proxy(queryBuilder, {
      get: (target, prop) => {
        const original = target[prop as keyof typeof target];

        // select, insert, update, delete, upsert 등 쿼리 실행 메서드 래핑
        if (typeof original === "function" && ["select", "insert", "update", "delete", "upsert"].includes(prop as string)) {
          return (...args: any[]) => {
            const query = `${prop}(${table})`;
            return measureQuery(
              () => original.apply(target, args),
              {
                query,
                table,
                metadata: { method: prop, args: args.length },
              }
            );
          };
        }

        // 최종 실행 메서드들 (then, catch 등)도 래핑
        if (prop === "then" || prop === "catch" || prop === "finally") {
          return (...args: any[]) => {
            const query = `query(${table})`;
            return measureQuery(
              () => Promise.resolve(target).then(...args),
              {
                query,
                table,
              }
            );
          };
        }

        return original;
      },
    });

    return wrapped;
  }

  // Supabase 클라이언트의 다른 메서드들도 직접 노출
  get auth() {
    return this.client.auth;
  }

  get storage() {
    return this.client.storage;
  }

  get functions() {
    return this.client.functions;
  }

  get realtime() {
    return this.client.realtime;
  }

  get rest() {
    return this.client.rest;
  }
}

/**
 * 모니터링이 활성화된 Supabase Server Client 생성
 */
export async function createMonitoredClient(): Promise<MonitoredSupabaseClient> {
  const cookieStore = await cookies();

  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            const allCookies = cookieStore.getAll();
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
            console.warn("Cookie setAll failed:", error);
          }
        },
      },
    }
  );

  return new MonitoredSupabaseClient(client);
}
