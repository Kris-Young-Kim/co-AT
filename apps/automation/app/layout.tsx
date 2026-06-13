import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AppSidebar } from '@/components/AppSidebar'
import { PwaInstallBanner } from '@co-at/ui/pwa-install-banner'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f766e',
}

export const metadata: Metadata = {
  title: 'GWATC — 업무 자동화',
  description: '업무 자동화 및 알림 센터',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '자동화' },
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
            <AppSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </ClerkProvider>
        <PwaInstallBanner />
      </body>
    </html>
  )
}
