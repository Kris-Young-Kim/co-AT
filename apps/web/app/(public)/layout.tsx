import type { ReactNode } from "react"
import { PublicFooter } from "@/components/layout/public-footer"
import { PublicLayoutClient } from "@/components/layout/public-layout-client"
import { getActiveBanners } from "@/actions/banner-actions"

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const result = await getActiveBanners()
  const banners = result.success ? (result.banners ?? []) : []

  return (
    <div className="flex min-h-screen flex-col">
      <PublicLayoutClient banners={banners}>{children}</PublicLayoutClient>
      <PublicFooter />
    </div>
  )
}

