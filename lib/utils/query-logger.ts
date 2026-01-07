/**
 * 쿼리 로깅 유틸리티
 * 슬로우 쿼리 (1초 이상) 추적 및 로깅
 */

export interface QueryLog {
  query: string
  table?: string
  duration: number
  timestamp: string
  error?: string
  metadata?: Record<string, unknown>
}

const SLOW_QUERY_THRESHOLD_MS = 1000 // 1초
const queryLogs: QueryLog[] = []

/**
 * 쿼리 실행 시간 측정 및 로깅
 */
export function logQuery(
  query: string,
  duration: number,
  options?: {
    table?: string
    error?: string
    metadata?: Record<string, unknown>
  }
): void {
  const log: QueryLog = {
    query,
    table: options?.table,
    duration,
    timestamp: new Date().toISOString(),
    error: options?.error,
    metadata: options?.metadata,
  }

  // 슬로우 쿼리만 로깅
  if (duration >= SLOW_QUERY_THRESHOLD_MS) {
    console.warn("[Slow Query]", {
      query: query.substring(0, 200), // 쿼리 일부만 로깅 (너무 길면 잘림)
      table: options?.table,
      duration: `${duration}ms`,
      threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
      timestamp: log.timestamp,
      error: options?.error,
      metadata: options?.metadata,
    })

    // 메모리에 최근 100개만 저장
    queryLogs.push(log)
    if (queryLogs.length > 100) {
      queryLogs.shift()
    }
  }
}

/**
 * 최근 슬로우 쿼리 로그 조회
 */
export function getSlowQueryLogs(limit: number = 50): QueryLog[] {
  return queryLogs.slice(-limit).reverse()
}

/**
 * 쿼리 실행 래퍼 (Promise 기반)
 */
export async function measureQuery<T>(
  queryFn: () => Promise<T>,
  options?: {
    query?: string
    table?: string
    metadata?: Record<string, unknown>
  }
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await queryFn()
    const duration = Date.now() - startTime

    if (options?.query) {
      logQuery(options.query, duration, {
        table: options.table,
        metadata: options.metadata,
      })
    }

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (options?.query) {
      logQuery(options.query, duration, {
        table: options.table,
        error: errorMessage,
        metadata: options.metadata,
      })
    }

    throw error
  }
}
