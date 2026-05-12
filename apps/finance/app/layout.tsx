import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { FinanceSidebar } from '@/components/FinanceSidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 예산/재무',
  description: '예산 편성 및 재무 관리',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ClerkProvider
          isSatellite
          domain={(url: URL) => url.host}
          signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'}
          signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'}
        >
          <div className="flex min-h-screen bg-gray-50">
            <FinanceSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
