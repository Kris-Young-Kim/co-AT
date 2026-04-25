"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, FileText } from "lucide-react"
import { videoResources, documentResources } from "@/lib/data/resources"
import { cn } from "@/lib/utils"

export function ResourcesClient() {
  const [tab, setTab] = useState<"video" | "document">("video")
  const [query, setQuery] = useState("")

  const filteredVideos = videoResources.filter((v) =>
    v.title.replace(/\s/g, "").toLowerCase().includes(query.replace(/\s/g, "").toLowerCase())
  )

  const filteredDocs = documentResources.filter((d) =>
    d.title.replace(/\s/g, "").toLowerCase().includes(query.replace(/\s/g, "").toLowerCase())
  )

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

      {/* 영상자료 */}
      {tab === "video" && (
        filteredVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <Link
                key={video.id}
                href={`/info/resources/video/${video.id}`}
                className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white group"
              >
                {/* 썸네일 */}
                <div className="relative overflow-hidden" style={{ paddingTop: "56.25%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${video.youtubeIds[0]}/mqdefault.jpg`}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* 플레이 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                {/* 정보 */}
                <div className="p-3">
                  <p className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2 mb-1.5">
                    {video.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{video.date}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        )
      )}

      {/* 문서자료 */}
      {tab === "document" && (
        filteredDocs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
              >
                {/* 아이콘 영역 */}
                <div
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center"
                  style={{ height: "160px" }}
                >
                  <FileText className="h-12 w-12 text-indigo-300" />
                </div>
                {/* 정보 */}
                <div className="p-3">
                  <p className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2 mb-1.5">
                    {doc.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{doc.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        )
      )}
    </>
  )
}
