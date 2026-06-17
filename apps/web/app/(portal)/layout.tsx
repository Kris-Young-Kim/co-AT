import type { ReactNode } from "react"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { PortalHeader } from "@/components/layout/portal-header"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function PortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await currentUser()

  if (user) {
    const meta = user.publicMetadata as { birth_date?: string }
    if (!meta?.birth_date) {
      redirect("/onboarding")
    }
  }

  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role ?? ''
  const showApps = role !== '' && role !== 'user'

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <PortalHeader showApps={showApps} />
      <main className="flex-1">{children}</main>
      <MobileBottomNav showApps={showApps} />
    </div>
  )
}
