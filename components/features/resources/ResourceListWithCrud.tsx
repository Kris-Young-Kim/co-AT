"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, FileText, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Resource, deleteResource } from "@/actions/resource-actions"
import { ResourceCreateDialog } from "./ResourceCreateDialog"
import { ResourceEditDialog } from "./ResourceEditDialog"

interface ResourceListWithCrudProps {
  resources: Resource[]
  isStaff: boolean
}

export function ResourceListWithCrud({ resources: initialResources, isStaff }: ResourceListWithCrudProps) {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [tab, setTab] = useState<"video" | "document">("video")
  const [query, setQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = resources.filter(
    (r) =>
      r.type === tab &&
      r.title.replace(/\s/g, "").toLowerCase().includes(query.replace(/\s/g, "").toLowerCase())
  )

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("정말로 삭제하시겠습니까?")) return
    setDeletingId(id)
    try {
      const result = await deleteResource(id)
      if (result.success) {
        setResources((prev) => prev.filter((r) => r.id !== id))
      } else {
        alert(result.error || "삭제에 실패했습니다")
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* 탭 */}
      <div className="flex border-b mb-6">
        {(["video", "document"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setQuery("") }}
            className={cn(
              "px-6 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "video" ? "영상자료" : "문서자료"}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력해 주세요"
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">{query ? "검색 결과가 없습니다." : "등록된 자료가 없습니다."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((resource) => (
            <div key={resource.id} className="relative group">
              {resource.type === "video" ? (
                <Link
                  href={`/info/resources/video/${resource.id}`}
                  className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white block"
                >
                  <div className="relative overflow-hidden" style={{ paddingTop: "56.25%" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${resource.youtube_ids?.[0]}/mqdefault.jpg`}
                      alt={resource.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2 mb-1.5">
                      {resource.title}
                    </p>
                    {resource.resource_date && (
                      <p className="text-xs text-muted-foreground">{resource.resource_date}</p>
                    )}
                  </div>
                </Link>
              ) : (
                <a
                  href={resource.file_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white block"
                >
                  <div
                    className="bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center"
                    style={{ height: "160px" }}
                  >
                    <FileText className="h-12 w-12 text-indigo-300" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2 mb-1.5">
                      {resource.title}
                    </p>
                    {resource.resource_date && (
                      <p className="text-xs text-muted-foreground">{resource.resource_date}</p>
                    )}
                  </div>
                </a>
              )}

              {/* staff 전용 편집 버튼 */}
              {isStaff && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <ResourceEditDialog resource={resource}>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 bg-background" aria-label="수정" title="수정">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </ResourceEditDialog>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 bg-background text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(e, resource.id)}
                    disabled={deletingId === resource.id}
                    aria-label="삭제"
                    title="삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      {isStaff && (
        <div className="fixed bottom-8 right-8 z-50">
          <ResourceCreateDialog>
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0" aria-label="자료 등록" title="자료 등록">
              <Plus className="h-6 w-6" />
            </Button>
          </ResourceCreateDialog>
        </div>
      )}
    </>
  )
}
