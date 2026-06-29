import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AppSidebar } from '@/components/AppSidebar'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#be185d',
}

export const metadata: Metadata = {
  title: 'GWATC — 인사관리',
  description: '직원 인사 관리 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="https://gwatc.cloud/sign-up"
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
