import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { InventorySidebar } from '@/inventory/components/layout/InventorySidebar'
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="https://gwatc.cloud/sign-up"
    >
      <html lang="ko">
        <body className="bg-gray-50">
          <div className="flex min-h-screen">
            <InventorySidebar />
            <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
