import type { Metadata } from "next"
import { getNoticeById } from "@/actions/notice-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeft, Pin, Calendar } from "lucide-react"
import { notFound } from "next/navigation"
import { NoticeShareButton } from "@/components/features/notices/NoticeShareButton"
import { NoticeAttachments } from "@/components/features/notices/NoticeAttachments"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

interface NoticeDetailPageProps {
  params: Promise<{ id: string }>
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: NoticeDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const notice = await getNoticeById(id)

  if (!notice) {
    return {
      title: "공지사항을 찾을 수 없습니다",
    }
  }

  // HTML 태그 제거하여 메타 설명 생성
  const plainContent = notice.content.replace(/<[^>]*>/g, "").substring(0, 150)

  return {
    title: notice.title,
    description: plainContent || "강원특별자치도 보조기기센터 공지사항입니다.",
    openGraph: {
      title: notice.title,
      description: plainContent || "강원특별자치도 보조기기센터 공지사항입니다.",
      url: `${baseUrl}/notices/${id}`,
      type: "article",
      publishedTime: notice.created_at,
      modifiedTime: notice.created_at,
    },
    alternates: {
      canonical: `${baseUrl}/notices/${id}`,
    },
  }
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { id } = await params
  const notice = await getNoticeById(id)

  if (!notice) {
    notFound()
  }

  // 구조화된 데이터 (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: notice.title,
    description: notice.content.replace(/<[^>]*>/g, "").substring(0, 200),
    datePublished: notice.created_at,
    dateModified: notice.created_at,
    author: {
      "@type": "Organization",
      name: "GWATC 보조기기센터",
    },
    publisher: {
      "@type": "Organization",
      name: "GWATC 보조기기센터",
    },
  }

  const categoryLabel =
    notice.category === "notice"
      ? "공지사항"
      : notice.category === "activity"
      ? "활동 소식"
      : notice.category === "support"
      ? "지원사업"
      : notice.category === "case"
      ? "서비스 사례"
      : "공지사항"

  return (
    <>
      {/* 구조화된 데이터 (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb
            items={[
              { label: "공지사항", href: "/notices" },
              { label: notice.title.length > 30 ? notice.title.substring(0, 30) + "..." : notice.title, href: `/notices/${id}` },
            ]}
            className="mb-6"
          />
          {/* 뒤로가기 버튼 및 공유 버튼 */}
          <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/notices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
          <NoticeShareButton noticeId={notice.id} noticeTitle={notice.title} />
        </div>

        {/* 공지사항 상세 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {notice.is_pinned && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Pin className="h-3 w-3" />
                    고정
                  </Badge>
                )}
                <Badge variant="outline">{categoryLabel}</Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                <Calendar className="h-4 w-4" />
                {format(new Date(notice.created_at), "yyyy년 MM월 dd일", {
                  locale: ko,
                })}
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-foreground">
              {notice.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm"
              dangerouslySetInnerHTML={{ __html: notice.content }}
            />
            {notice.attachments && notice.attachments.length > 0 && (
              <NoticeAttachments attachments={notice.attachments} />
            )}
          </CardContent>
        </Card>

        {/* 하단 네비게이션 */}
        <div className="mt-6 flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/notices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}

