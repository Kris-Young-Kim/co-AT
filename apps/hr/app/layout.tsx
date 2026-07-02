import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AppShell } from '@/components/AppShell'
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
          <AppShell>{children}</AppShell>
        </ClerkProvider>
      </body>
    </html>
  )
}
