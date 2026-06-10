"use client"

import dynamic from "next/dynamic"
import type { Banner } from "@/actions/banner-actions"
import { BannerPopup } from "@/components/features/banners/BannerPopup"

const PublicHeader = dynamic(
  () => import("@/components/layout/public-header").then((m) => ({ default: m.PublicHeader })),
  { ssr: false, loading: () => <div className="h-14 sm:h-16 border-b bg-background/95" /> }
)

const SupportServiceChatbotFloating = dynamic(
  () =>
    import("@/components/features/chat/SupportServiceChatbotFloating").then((m) => ({
      default: m.SupportServiceChatbotFloating,
    })),
  { ssr: false }
)

const QuickMenu = dynamic(
  () => import("@/components/layout/quick-menu").then((m) => ({ default: m.QuickMenu })),
  { ssr: false }
)

interface PublicLayoutClientProps {
  children: React.ReactNode
  banners: Banner[]
}

export function PublicLayoutClient({ children, banners }: PublicLayoutClientProps) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <QuickMenu />
      <SupportServiceChatbotFloating />
      {banners.length > 0 && <BannerPopup banners={banners} />}
    </>
  )
}
