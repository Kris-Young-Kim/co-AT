export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        커뮤니티
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <a
          href="/notices"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">공지사항</h2>
          <p className="text-sm text-muted-foreground">
            센터의 주요 공지사항을 확인하세요.
          </p>
        </a>
        <a
          href="/community/gallery"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">활동갤러리</h2>
          <p className="text-sm text-muted-foreground">
            센터의 다양한 활동 사진을 확인하세요.
          </p>
        </a>
        <a
          href="/community/cases"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">보조기기 서비스 사례</h2>
          <p className="text-sm text-muted-foreground">
            실제 서비스 사례를 확인하세요.
          </p>
        </a>
      </div>
    </div>
  )
}

