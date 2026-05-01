import type { ReactNode } from "react"
import { PublicFooter } from "@/components/layout/public-footer"
import { PublicLayoutClient } from "@/components/layout/public-layout-client"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicLayoutClient>{children}</PublicLayoutClient>
      <PublicFooter />
    </div>
  )
}

