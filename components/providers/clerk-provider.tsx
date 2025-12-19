"use client"

import { ClerkProvider as ClerkProviderBase } from "@clerk/nextjs"

interface ClerkProviderProps {
  children: React.ReactNode
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  // 잘못된 Publishable Key 검증
  if (publishableKey) {
    // base64로 인코딩된 도메인 이름이 아닌지 확인
    // 올바른 키는 pk_test_... 또는 pk_live_... 형식이어야 함
    const isValidKey = 
      publishableKey.startsWith('pk_test_') || 
      publishableKey.startsWith('pk_live_')
    
    if (!isValidKey) {
      console.error(
        '❌ 잘못된 Clerk Publishable Key 형식입니다.\n' +
        '현재 값:', publishableKey.substring(0, 50) + '...\n' +
        '이 값은 base64로 인코딩된 도메인 이름입니다.\n' +
        'Clerk 대시보드(https://dashboard.clerk.com/)에서 올바른 Publishable Key를 확인하고\n' +
        '.env.local 파일의 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY를 수정한 후 서버를 재시작하세요.'
      )
    }
  }

  return (
    <ClerkProviderBase
      dynamic
      appearance={{
        elements: {
          rootBox: "w-full",
        },
      }}
    >
      {children}
    </ClerkProviderBase>
  )
}

