import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { ClerkProvider } from "@/components/providers/clerk-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { ClientOnlyProviders } from "@/components/layout/client-only-providers"
import { PwaInstallBanner } from '@co-at/ui/pwa-install-banner'
import "./globals.css"

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#334155',
}

export const metadata: Metadata = {
  title: "GWATC 어드민",
  description: "GWATC 통합 관리 시스템",
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '어드민' },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <html lang="ko" suppressHydrationWarning>
          <head><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" /></head>
          <body suppressHydrationWarning>
            {children}
            <ClientOnlyProviders />
            <PwaInstallBanner />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  )
}
