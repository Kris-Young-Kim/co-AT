import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"
import { getInventoryList } from "@/actions/inventory-actions"
import { InventoryManagementContent } from "@/components/features/inventory/InventoryManagementContent"

export default async function InventoryPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[?¬ê³  ê´€ë¦? ê¶Œí•œ ?†ìŒ - ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??)
        redirect("/")
      }
      console.log("[?¬ê³  ê´€ë¦? ê¶Œí•œ ?•ì¸ ?„ë£Œ - ?˜ì´ì§€ ?Œë”ë§?)
    } catch (error) {
      console.error("[?¬ê³  ê´€ë¦? ê¶Œí•œ ?•ì¸ ì¤??¤ë¥˜:", error)
      redirect("/")
    }
  }

  // ì´ˆê¸° ?¬ê³  ëª©ë¡ ì¡°íšŒ
  const initialInventory = await getInventoryList({})

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?¬ê³  ê´€ë¦?        </h1>
        <p className="text-muted-foreground">
          ?€?? ?¬ì‚¬?? ë§ì¶¤?œì‘ ì§€??ë¬¼í’ˆ ?±ë¡ ë°?ë¶ˆì¶œ ê´€ë¦?        </p>
      </div>

      <InventoryManagementContent initialInventory={initialInventory} />
    </div>
  )
}
