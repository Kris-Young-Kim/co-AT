import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AppSidebar } from '@/components/AppSidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 인사관리',
  description: '직원 인사 관리 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ClerkProvider
          isSatellite
          domain={process.env.NEXT_PUBLIC_CLERK_DOMAIN ?? 'hr.gwatc.cloud'}
          signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'}
          signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'}
        >
          <div className="flex min-h-screen bg-gray-50">
            <AppSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
