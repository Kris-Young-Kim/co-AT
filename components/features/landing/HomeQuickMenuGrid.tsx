import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  MessageSquare,
  Eye,
  Wrench,
  Package,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const serviceCategories = [
  {
    id: "consult",
    label: "상담",
    description: "보조기기 상담 및 평가",
    icon: MessageSquare,
    href: "/portal/apply?category=consult",
    color: "bg-blue-500",
  },
  {
    id: "experience",
    label: "체험",
    description: "보조기기 체험 및 견학",
    icon: Eye,
    href: "/portal/apply?category=experience",
    color: "bg-purple-500",
  },
  {
    id: "custom",
    label: "맞춤형",
    description: "맞춤 제작 및 대여",
    icon: Wrench,
    href: "/portal/apply?category=custom",
    color: "bg-green-500",
  },
  {
    id: "aftercare",
    label: "사후관리",
    description: "수리 및 세척 서비스",
    icon: Package,
    href: "/portal/apply?category=aftercare",
    color: "bg-orange-500",
  },
  {
    id: "education",
    label: "교육홍보",
    description: "교육 프로그램 신청",
    icon: GraduationCap,
    href: "/portal/apply?category=education",
    color: "bg-pink-500",
  },
]

export function HomeQuickMenuGrid() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-responsive-xl font-bold text-center text-foreground mb-8 sm:mb-12">
          5대 핵심 사업
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {serviceCategories.map((service) => {
            const Icon = service.icon
            return (
              <Link key={service.id} href={service.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform",
                        service.color
                      )}
                    >
                      <Icon className="h-8 w-8" />
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

