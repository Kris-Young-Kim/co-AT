import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"
import { getEquipment } from "@/actions/custom-make-actions"
import { EquipmentManager } from "@/components/features/custom-make/EquipmentManager"

export default async function EquipmentPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[?¥ë¹„ ê´€ë¦? ê¶Œí•œ ?†ìŒ - ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??)
        redirect("/")
      }
      console.log("[?¥ë¹„ ê´€ë¦? ê¶Œí•œ ?•ì¸ ?„ë£Œ - ?˜ì´ì§€ ?Œë”ë§?)
    } catch (error) {
      console.error("[?¥ë¹„ ê´€ë¦? ê¶Œí•œ ?•ì¸ ì¤??¤ë¥˜:", error)
      redirect("/")
    }
  }

  // ì´ˆê¸° ?°ì´??ë¡œë“œ
  const result = await getEquipment({})

  const initialEquipment = result.success ? result.equipment || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?¥ë¹„ ê´€ë¦?        </h1>
        <p className="text-muted-foreground">
          3D?„ë¦°?? CNC ???œì‘ ?¥ë¹„ë¥?ê´€ë¦¬í•©?ˆë‹¤
        </p>
      </div>

      <EquipmentManager initialEquipment={initialEquipment} />
    </div>
  )
}
