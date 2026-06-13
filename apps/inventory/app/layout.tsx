import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { InventorySidebar } from '@/inventory/components/layout/InventorySidebar'
import { PwaInstallBanner } from '@co-at/ui/pwa-install-banner'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#15803d',
}

export const metadata: Metadata = {
  title: 'GWATC — 자산/재고 관리',
  description: '보조공학센터 자산 및 재고 관리 시스템',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '재고관리' },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'}
    >
      <html lang="ko">
        <head><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" /></head>
        <body className="bg-gray-50">
          <div className="flex min-h-screen">
            <InventorySidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
          <PwaInstallBanner />
        </body>
      </html>
    </ClerkProvider>
  )
}
