import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"
import { getCustomMakes } from "@/actions/custom-make-actions"
import { CustomMakeManagementContent } from "@/components/features/custom-make/CustomMakeManagementContent"

export default async function CustomMakesPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[ë§ì¶¤?œì‘ ê´€ë¦? ê¶Œí•œ ?†ìŒ - ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??)
        redirect("/")
      }
      console.log("[ë§ì¶¤?œì‘ ê´€ë¦? ê¶Œí•œ ?•ì¸ ?„ë£Œ - ?˜ì´ì§€ ?Œë”ë§?)
    } catch (error) {
      console.error("[ë§ì¶¤?œì‘ ê´€ë¦? ê¶Œí•œ ?•ì¸ ì¤??¤ë¥˜:", error)
      redirect("/")
    }
  }

  // ì´ˆê¸° ?°ì´??ë¡œë“œ
  const result = await getCustomMakes({})

  const initialCustomMakes = result.success ? result.customMakes || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ë§ì¶¤?œì‘ ê´€ë¦?        </h1>
        <p className="text-muted-foreground">
          3D?„ë¦°?? CNC ???¥ë¹„ë¥??œìš©??ë§ì¶¤?œì‘ ?„ë¡œ?íŠ¸ ê´€ë¦?        </p>
      </div>

      <CustomMakeManagementContent initialCustomMakes={initialCustomMakes} />
    </div>
  )
}
