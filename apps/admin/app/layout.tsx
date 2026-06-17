import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { ClerkProvider } from "@/components/providers/clerk-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { ClientOnlyProviders } from "@/components/layout/client-only-providers"
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
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <html lang="ko" suppressHydrationWarning>
          <body suppressHydrationWarning>
            {children}
            <ClientOnlyProviders />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  )
}
