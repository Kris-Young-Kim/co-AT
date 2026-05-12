import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { StatsSidebar } from '@/stats/components/layout/StatsSidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 성과 대시보드',
  description: '보조공학센터 사업 실적 및 성과 관리',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      isSatellite
      domain={process.env.NEXT_PUBLIC_CLERK_DOMAIN ?? 'stats.gwatc.cloud'}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'}
    >
      <html lang="ko">
        <body className="bg-gray-50">
          <div className="flex min-h-screen">
            <StatsSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
