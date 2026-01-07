import type { ReactNode } from "react"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { PortalHeader } from "@/components/layout/portal-header"

export default function PortalLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <PortalHeader />
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </div>
  )
}

