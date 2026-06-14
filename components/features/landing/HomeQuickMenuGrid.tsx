import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  MessageSquare,
  Wrench,
  Package,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const serviceCategories = [
  {
    id: "consult",
    label: "상담 및 정보제공",
    description: "보조기기 상담 및 정보 안내",
    icon: MessageSquare,
    href: "/apply?category=consult",
    color: "bg-blue-500",
  },
  {
    id: "custom",
    label: "맞춤형 지원",
    description: "맞춤 제작 및 대여, 교부사업 적합성 평가",
    icon: Wrench,
    href: "/apply?category=custom",
    color: "bg-green-500",
  },
  {
    id: "aftercare",
    label: "사후관리",
    description: "수리 및 세척 서비스",
    icon: Package,
    href: "/apply?category=aftercare",
    color: "bg-orange-500",
  },
  {
    id: "education",
    label: "교육 및 홍보",
    description: "교육 프로그램 신청",
    icon: GraduationCap,
    href: "/apply?category=education",
    color: "bg-pink-500",
  },
]

export function HomeQuickMenuGrid() {
  return (
    <section id="services" className="py-12 sm:py-16 md:py-24 bg-background scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-responsive-xl font-bold text-center text-foreground mb-8 sm:mb-12">
          4대 주요 사업
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {serviceCategories.map((service) => {
            const Icon = service.icon
            return (
              <Link 
                key={service.id} 
                href={service.href}
                aria-label={`${service.label}: ${service.description}`}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform",
                        service.color
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                        {service.label}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

