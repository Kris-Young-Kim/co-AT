import { hasManagerPermission } from "@co-at/auth"
import { UserManagementTable } from "@/components/features/admin/UserManagementTable"
import { PermissionDeniedModal } from "@/components/features/admin/PermissionDeniedModal"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  // admin, managerë§??‘ê·¼ ê°€??  const hasPermission = await hasManagerPermission()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?¬ìš©??ê´€ë¦?        </h1>
        <p className="text-muted-foreground">
          ?¬ìš©??ëª©ë¡???•ì¸?˜ê³  ??• ??ê´€ë¦¬í•  ???ˆìŠµ?ˆë‹¤
        </p>
      </div>

      {hasPermission ? (
        <UserManagementTable />
      ) : (
        <PermissionDeniedModal />
      )}
    </div>
  )
}

