import { searchClients } from "@/actions/client-actions"
import { ClientTable } from "@/components/features/crm/ClientTable"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"

export default async function ClientsPage() {
  // ê¶Œí•œ ?•ì¸
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    console.log("[?€?ì ê´€ë¦? ê¶Œí•œ ?†ìŒ - ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??)
    redirect("/")
  }

  // ì´ˆê¸° ?°ì´??ë¡œë“œ
  const result = await searchClients({ limit: 20 })
  const initialClients = result.success ? result.clients || [] : []
  const initialTotal = result.success ? result.total || 0 : 0

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?€?ì ê´€ë¦?        </h1>
        <p className="text-muted-foreground">
          ?€?ì ?•ë³´ë¥?ê²€?‰í•˜ê³?ê´€ë¦¬í•  ???ˆìŠµ?ˆë‹¤
        </p>
      </div>

      <ClientTable initialClients={initialClients} initialTotal={initialTotal} />
    </div>
  )
}








