import { hasAdminPermission } from "@/lib/utils/permissions"
import { UserManagementTable } from "@/components/features/admin/UserManagementTable"
import { PermissionDeniedModal } from "@/components/features/admin/PermissionDeniedModal"

export default async function UsersPage() {
  // admin만 접근 가능
  const hasPermission = await hasAdminPermission()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          사용자 관리
        </h1>
        <p className="text-muted-foreground">
          사용자 목록을 확인하고 역할을 관리할 수 있습니다
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

