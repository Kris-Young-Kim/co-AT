import type { ReactNode } from "react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { SupportServiceChatbotFloating } from "@/components/features/chat/SupportServiceChatbotFloating"

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

