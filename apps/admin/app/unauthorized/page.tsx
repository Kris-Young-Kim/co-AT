import Link from 'next/link'

export default function UnauthorizedPage() {
  const mainUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gwatc.cloud'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">접근 제한</h1>
          <p className="text-muted-foreground text-lg">
            이 서비스에 접근할 권한이 없습니다.
          </p>
        </div>

        <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
          <p>관리자에게 계정 권한 부여를 요청하세요.</p>
          <p className="mt-1 text-xs">
            권한 요청: admin.gwatc.cloud 관리자
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={mainUrl}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            메인 사이트로 이동
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            다른 계정으로 로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
