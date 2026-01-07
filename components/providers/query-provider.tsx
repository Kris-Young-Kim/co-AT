"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 캐시 유지 시간: 5분 (자주 변경되지 않는 데이터)
            staleTime: 5 * 60 * 1000,
            // 캐시 보관 시간: 30분
            gcTime: 30 * 60 * 1000,
            // 윈도우 포커스 시 자동 재요청 비활성화
            refetchOnWindowFocus: false,
            // 네트워크 재연결 시 자동 재요청 비활성화
            refetchOnReconnect: false,
            // 마운트 시 자동 재요청 비활성화 (초기 데이터는 Server Component에서 제공)
            refetchOnMount: false,
            // 재시도 설정
            retry: 1,
            retryDelay: 1000,
          },
          mutations: {
            // 뮤테이션 재시도 비활성화
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

