import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { EvalSidebar } from '@/eval/components/layout/EvalSidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 상담/평가',
  description: '보조공학 전문가 상담 및 평가 툴',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <ClerkProvider>
          <div className="flex min-h-screen bg-gray-50">
            <EvalSidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
