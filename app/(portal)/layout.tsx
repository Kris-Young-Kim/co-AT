import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </div>
  )
}

