import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminHeader } from "@/components/layout/admin-header"
import { RegulationChatbotFloating } from "@/components/features/chat/RegulationChatbotFloating"

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <RegulationChatbotFloating />
    </div>
  )
}

