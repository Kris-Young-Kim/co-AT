import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"
import { getResourceById } from "@/actions/resource-actions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const resource = await getResourceById(id)
  if (!resource) return {}
  return { title: resource.title }
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resource = await getResourceById(id)

  if (!resource || resource.type !== "video") notFound()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "자료실", href: "/info/resources" },
          { label: resource.title, href: `/info/resources/video/${resource.id}` },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">{resource.title}</h1>
        {resource.resource_date && (
          <p className="text-sm text-muted-foreground mb-8">{resource.resource_date}</p>
        )}

        <div className="space-y-6">
          {(resource.youtube_ids || []).map((ytId, i) => (
            <div key={ytId + i} className="rounded-xl overflow-hidden border bg-black">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={resource.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>

        {resource.description && (
          <p className="mt-6 text-sm text-gray-700 leading-relaxed">{resource.description}</p>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href="/info/resources"
            className="inline-flex items-center gap-2 px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            목록가기
          </Link>
        </div>
      </div>
    </div>
  )
}
