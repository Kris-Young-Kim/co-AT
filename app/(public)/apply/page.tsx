export default function ApplyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        서비스 신청
      </h1>
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <a
          href="/apply/guide"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">서비스 이용 안내</h2>
          <p className="text-sm text-muted-foreground">
            서비스 이용 방법과 절차를 안내합니다.
          </p>
        </a>
        <a
          href="/portal/apply"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">온라인 신청</h2>
          <p className="text-sm text-muted-foreground">
            온라인으로 서비스를 신청하세요.
          </p>
        </a>
      </div>
    </div>
  )
}

