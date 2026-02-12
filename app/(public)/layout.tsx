import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { PublicFooter } from "@/components/layout/public-footer"

const PublicHeader = dynamic(
  () => import("@/components/layout/public-header").then((m) => ({ default: m.PublicHeader })),
  { ssr: false, loading: () => <div className="h-14 sm:h-16 border-b bg-background/95" /> }
)

const SupportServiceChatbotFloating = dynamic(
  () => import("@/components/features/chat/SupportServiceChatbotFloating").then((m) => ({ default: m.SupportServiceChatbotFloating })),
  { ssr: false }
)

export default function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <SupportServiceChatbotFloating />
    </div>
  )
}

