import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { FinanceSidebar } from '@/components/FinanceSidebar'
import { PwaInstallBanner } from '@co-at/ui/pwa-install-banner'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#047857',
}

export const metadata: Metadata = {
  title: 'GWATC — 예산/재무',
  description: '예산 편성 및 재무 관리',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '재무' },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" /></head>
      <body>
        <ClerkProvider
          signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'}
          signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'}
        >
          <div className="flex min-h-screen bg-gray-50">
            <FinanceSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </ClerkProvider>
        <PwaInstallBanner />
      </body>
    </html>
  )
}
