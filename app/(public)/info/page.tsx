export default function InfoPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        보조기기 정보
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <a
          href="/info/devices"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">보유 보조기기</h2>
          <p className="text-sm text-muted-foreground">
            센터에서 보유하고 있는 보조기기 목록을 확인하세요.
          </p>
        </a>
        <a
          href="/info/reusable-devices"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">재사용 보조기기</h2>
          <p className="text-sm text-muted-foreground">
            재사용 가능한 보조기기를 확인하세요.
          </p>
        </a>
        <a
          href="/info/recommendation"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">나에게 맞는 보조기기</h2>
          <p className="text-sm text-muted-foreground">
            개인에게 맞는 보조기기를 추천받으세요.
          </p>
        </a>
        <a
          href="/info/repair-center"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">보조기기 수리센터 안내</h2>
          <p className="text-sm text-muted-foreground">
            보조기기 수리센터 이용 안내를 확인하세요.
          </p>
        </a>
        <a
          href="/info/government-support"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">정부지원사업안내</h2>
          <p className="text-sm text-muted-foreground">
            정부 지원사업 정보를 확인하세요.
          </p>
        </a>
        <a
          href="/info/resources"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">자료실</h2>
          <p className="text-sm text-muted-foreground">
            보조기기 관련 자료를 다운로드하세요.
          </p>
        </a>
      </div>
    </div>
  )
}

