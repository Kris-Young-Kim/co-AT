import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"
import { getRentals, getOverdueRentals, getExpiringRentals } from "@/actions/rental-actions"
import { RentalManagementContent } from "@/components/features/inventory/RentalManagementContent"

export default async function RentalsPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[?€??ê´€ë¦? ê¶Œí•œ ?†ìŒ - ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??)
        redirect("/")
      }
      console.log("[?€??ê´€ë¦? ê¶Œí•œ ?•ì¸ ?„ë£Œ - ?˜ì´ì§€ ?Œë”ë§?)
    } catch (error) {
      console.error("[?€??ê´€ë¦? ê¶Œí•œ ?•ì¸ ì¤??¤ë¥˜:", error)
      redirect("/")
    }
  }

  // ì´ˆê¸° ?°ì´??ë¡œë“œ
  const [rentalsResult, overdueResult, expiringResult] = await Promise.all([
    getRentals({}),
    getOverdueRentals(),
    getExpiringRentals(7),
  ])

  const initialRentals = rentalsResult.success ? rentalsResult.rentals || [] : []
  const initialOverdue = overdueResult.success ? overdueResult.rentals || [] : []
  const initialExpiring = expiringResult.success ? expiringResult.rentals || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?€??ê´€ë¦?        </h1>
        <p className="text-muted-foreground">
          ë³´ì¡°ê¸°ê¸° ?€???¹ì¸, ë°˜ë‚© ì²˜ë¦¬ ë°?ê¸°ê°„ ?°ì¥ ê´€ë¦?        </p>
      </div>

      <RentalManagementContent
        initialRentals={initialRentals}
        initialOverdue={initialOverdue}
        initialExpiring={initialExpiring}
      />
    </div>
  )
}
