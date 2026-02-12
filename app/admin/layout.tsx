import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminHeader } from "@/components/layout/admin-header"
import { RegulationChatbotFloating } from "@/components/features/chat/RegulationChatbotFloating"
import { hasManagerPermission } from "@/lib/utils/permissions"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const showUsersManagement = await hasManagerPermission()

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader showUsersManagement={showUsersManagement} />
      <div className="flex flex-1">
        <AdminSidebar showUsersManagement={showUsersManagement} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <RegulationChatbotFloating />
    </div>
  )
}

