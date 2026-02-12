"use client"

import dynamic from "next/dynamic"

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

interface PublicLayoutClientProps {
  children: React.ReactNode
}

export function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <SupportServiceChatbotFloating />
    </>
  )
}
