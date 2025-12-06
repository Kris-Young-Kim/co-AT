"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  url: string
}

// 예시 YouTube 영상 데이터 (실제로는 Supabase나 외부 API에서 가져올 수 있음)
const defaultVideos: YouTubeVideo[] = [
  {
    id: "1",
    title: "보조기기센터 소개",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "2",
    title: "보조기기 체험 프로그램",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "3",
    title: "맞춤형 보조기기 제작",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
]

interface HomeGallerySliderProps {
  videos?: YouTubeVideo[]
}

export function HomeGallerySlider({ videos = defaultVideos }: HomeGallerySliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (videos.length === 0) {
    return null
  }

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-responsive-xl font-bold text-center text-foreground mb-8 sm:mb-12">
          보조기기 영상 갤러리
        </h2>
        <div className="relative max-w-4xl mx-auto">
          {/* 슬라이더 컨테이너 */}
          <div className="relative overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {videos.map((video) => (
                <div key={video.id} className="min-w-full">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-0">
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Button
                            asChild
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-5 w-5" />
                              YouTube에서 보기
                            </a>
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                          {video.title}
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* 네비게이션 버튼 */}
          {videos.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={prevSlide}
                aria-label="이전 영상"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={nextSlide}
                aria-label="다음 영상"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* 인디케이터 */}
          {videos.length > 1 && (
            <div className="flex justify-center gap-2 mt-4 sm:mt-6">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`${index + 1}번째 영상으로 이동`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

