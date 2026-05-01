import { performGlobalSearch } from "@/actions/search-actions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Search, FileText, Megaphone, Video, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  notice: "공지사항",
  activity: "센터활동",
  support: "지원사업",
  case: "보조기기 사례",
}

const CATEGORY_COLORS: Record<string, string> = {
  notice: "bg-blue-100 text-blue-700 border-blue-200",
  activity: "bg-green-100 text-green-700 border-green-200",
  support: "bg-purple-100 text-purple-700 border-purple-200",
  case: "bg-orange-100 text-orange-700 border-orange-200",
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams
  const results = query ? await performGlobalSearch(query) : { notices: [], resources: [], total: 0 }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb items={[{ label: "검색 결과", href: "/search" }]} className="mb-6" />

      <div className="mb-10">
        <h1 className="text-responsive-2xl font-bold text-foreground mb-4 flex items-center gap-3">
          <Search className="h-8 w-8 text-primary" />
          {query ? (
            <span>
              &quot;<span className="text-primary">{query}</span>&quot; 검색 결과
            </span>
          ) : (
            <span>검색어를 입력해주세요</span>
          )}
        </h1>
        {query && (
          <p className="text-muted-foreground">
            총 <span className="font-semibold text-foreground">{results.total}</span>개의 검색 결과가 있습니다.
          </p>
        )}
      </div>

      {!query ? (
        <Card className="border-dashed">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">검색어를 입력해주세요</h2>
            <p className="text-muted-foreground">상단의 검색창을 통해 센터 내 정보를 찾으실 수 있습니다.</p>
          </CardContent>
        </Card>
      ) : results.total === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">검색 결과가 없습니다</h2>
            <p className="text-muted-foreground">
              다른 검색어를 입력하시거나 철자를 확인해 보세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {/* 공지사항 및 지원사업 결과 */}
          {results.notices.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 pb-2 border-b">
                <Megaphone className="h-5 w-5 text-primary" />
                공지사항 및 지원사업 ({results.notices.length})
              </h2>
              <div className="grid gap-4">
                {results.notices.map((notice) => (
                  <Link key={notice.id} href={`/notices/${notice.id}`}>
                    <Card className="hover:border-primary/50 transition-all hover:shadow-md group">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {notice.category && (
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", CATEGORY_COLORS[notice.category])}>
                                  {CATEGORY_LABELS[notice.category]}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notice.created_at), "yyyy.MM.dd", { locale: ko })}
                              </span>
                            </div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                              {notice.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notice.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 자료실 결과 */}
          {results.resources.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 pb-2 border-b">
                <FileText className="h-5 w-5 text-primary" />
                자료실 ({results.resources.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.resources.map((resource) => (
                  <Link key={resource.id} href="/info/resources">
                    <Card className="hover:border-primary/50 transition-all hover:shadow-md h-full group">
                      <CardContent className="p-5 flex gap-4">
                        <div className="bg-muted p-3 rounded-lg h-fit group-hover:bg-primary/10 transition-colors">
                          {resource.type === "video" ? (
                            <Video className="h-6 w-6 text-primary" />
                          ) : (
                            <FileText className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {resource.type === "video" ? "영상" : "문서"}
                            </Badge>
                          </div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                            {resource.title}
                          </h3>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
