export function PermissionDeniedModal() {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="font-medium text-destructive">접근 권한이 없습니다</p>
      <p className="mt-1 text-sm text-muted-foreground">관리자 또는 매니저 권한이 필요합니다</p>
    </div>
  )
}
