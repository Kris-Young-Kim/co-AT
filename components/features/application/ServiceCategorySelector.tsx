"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApplicationStore } from "@/lib/stores/application-store"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  ArrowLeftRight,
  Wrench,
  Eye,
  Hammer,
  GraduationCap,
} from "lucide-react"

const CLIENT_SERVICE_TYPES = [
  {
    id: "consultation",
    label: "보조기기 상담",
    description: "보조기기 선택·활용 방법 등 전문가와 상담",
    icon: MessageSquare,
    category: "consult",
    subCategory: null,
  },
  {
    id: "rental",
    label: "보조기기 대여",
    description: "필요한 보조기기를 빌려서 사용",
    icon: ArrowLeftRight,
    category: "experience",
    subCategory: "rental",
  },
  {
    id: "custom_make",
    label: "맞춤 제작",
    description: "나에게 꼭 맞는 보조기기 전문 제작",
    icon: Wrench,
    category: "custom",
    subCategory: "custom_make",
  },
  {
    id: "trial_visit",
    label: "체험·견학",
    description: "보조기기 직접 체험 또는 센터 방문·견학",
    icon: Eye,
    category: "consult",
    subCategory: "exhibition",
  },
  {
    id: "repair",
    label: "수리·점검",
    description: "사용 중인 보조기기 고장·점검 요청",
    icon: Hammer,
    category: "aftercare",
    subCategory: "repair",
  },
  {
    id: "education",
    label: "교육 신청",
    description: "보조기기 활용 교육 참여 신청",
    icon: GraduationCap,
    category: "education",
    subCategory: "education",
  },
] as const

export function ServiceCategorySelector() {
  const { selectedCategory, selectedSubCategory, setSelectedCategory, setSelectedSubCategory, setCurrentStep } =
    useApplicationStore()

  const selectedType = CLIENT_SERVICE_TYPES.find(
    (t) => t.category === selectedCategory && t.subCategory === selectedSubCategory
  )

  const handleSelect = (type: typeof CLIENT_SERVICE_TYPES[number]) => {
    setSelectedCategory(type.category)
    setSelectedSubCategory(type.subCategory)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">어떤 서비스가 필요하신가요?</h2>
        <p className="text-sm text-muted-foreground">원하시는 서비스를 선택해주세요</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CLIENT_SERVICE_TYPES.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType?.id === type.id

          return (
            <Card
              key={type.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary hover:shadow-sm",
                isSelected && "border-primary ring-2 ring-primary"
              )}
              onClick={() => handleSelect(type)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleSelect(type)
                }
              }}
              aria-label={`${type.label} 선택`}
              aria-pressed={isSelected}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2.5 rounded-lg shrink-0",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{type.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedType && (
        <div className="flex justify-end pt-2">
          <Button onClick={() => setCurrentStep(2)} className="min-w-[120px]">
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
