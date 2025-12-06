export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        센터소개
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-8">
        <a
          href="/about/greeting"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">인사말</h2>
          <p className="text-sm text-muted-foreground">
            센터장의 인사말을 확인하세요.
          </p>
        </a>
        <a
          href="/about/organization"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">조직도</h2>
          <p className="text-sm text-muted-foreground">
            센터의 조직 구조를 확인하세요.
          </p>
        </a>
        <a
          href="/about/history"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">연혁</h2>
          <p className="text-sm text-muted-foreground">
            센터의 역사와 주요 연혁을 확인하세요.
          </p>
        </a>
        <a
          href="/about/location"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">찾아오시는 길</h2>
          <p className="text-sm text-muted-foreground">
            센터 위치와 오시는 길을 확인하세요.
          </p>
        </a>
      </div>
    </div>
  )
}

