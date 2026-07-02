'use client'

import { usePathname } from 'next/navigation'
import { AppSidebar } from './AppSidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/contracts/sign/')) {
    return <>{children}</>
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
