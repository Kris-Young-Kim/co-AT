import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { InventorySidebar } from '@/inventory/components/layout/InventorySidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 자산/재고 관리',
  description: '보조공학센터 자산 및 재고 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      isSatellite
      domain={process.env.NEXT_PUBLIC_CLERK_DOMAIN ?? 'inventory.gwatc.cloud'}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'}
    >
      <html lang="ko">
        <body className="bg-gray-50">
          <div className="flex min-h-screen">
            <InventorySidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
