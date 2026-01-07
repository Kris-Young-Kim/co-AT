"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApplicationStore } from "@/lib/stores/application-store"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  TestTube,
  Wrench,
  Heart,
  GraduationCap,
  Save,
} from "lucide-react"

const serviceCategories = [
  {
    id: "consult",
    label: "상담 및 정보제공",
    description: "전화, 방문, 센터 방문 상담",
    icon: MessageSquare,
    subCategories: [
      { id: "visit", label: "방문 상담" },
      { id: "exhibition", label: "견학" },
    ],
  },
  {
    id: "experience",
    label: "체험",
    description: "보조기기 체험 및 대여",
    icon: TestTube,
    subCategories: [{ id: "rental", label: "대여" }],
  },
  {
    id: "custom",
    label: "맞춤형 지원",
    description: "맞춤 제작 및 대여",
    icon: Wrench,
    subCategories: [
      { id: "custom_make", label: "맞춤 제작" },
      { id: "rental", label: "대여" },
    ],
  },
  {
    id: "aftercare",
    label: "사후관리",
    description: "수리, 소독, 점검, 재사용",
    icon: Heart,
    subCategories: [
      { id: "repair", label: "수리" },
      { id: "cleaning", label: "소독/세척" },
      { id: "reuse", label: "재사용" },
    ],
  },
  {
    id: "education",
    label: "교육/홍보",
    description: "보조기기 활용 교육 및 홍보",
    icon: GraduationCap,
    subCategories: [
      { id: "education", label: "교육" },
      { id: "promotion", label: "홍보" },
    ],
  },
]

export function ServiceCategorySelector() {
  const { selectedCategory, setSelectedCategory, setSelectedSubCategory, setCurrentStep, selectedSubCategory } =
    useApplicationStore()
  const [isSaving, setIsSaving] = useState(false)

  const selectedCategoryData = serviceCategories.find(
    (cat) => cat.id === selectedCategory
  )

  const handleSaveDraft = () => {
    if (!selectedCategory) {
      alert("카테고리를 먼저 선택해주세요.")
      return
    }

    setIsSaving(true)
    try {
      const draftData = {
        selectedCategory,
        selectedSubCategory,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem("application_draft", JSON.stringify(draftData))
      alert("임시 저장되었습니다.")
    } catch (error) {
      console.error("임시 저장 실패:", error)
      alert("임시 저장에 실패했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">서비스 카테고리 선택</h2>
        <p className="text-sm text-muted-foreground">
          원하시는 서비스 카테고리를 선택해주세요
        </p>
      </div>

      {/* 메인 카테고리 선택 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {serviceCategories.map((category) => {
          const Icon = category.icon
          const isSelected = selectedCategory === category.id

          return (
            <Card
              key={category.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                isSelected && "border-primary ring-2 ring-primary"
              )}
              onClick={() => {
                setSelectedCategory(category.id)
                setSelectedSubCategory(null)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelectedCategory(category.id)
                  setSelectedSubCategory(null)
                }
              }}
              aria-label={`${category.label} 선택`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{category.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 세부 카테고리 선택 (메인 카테고리가 선택된 경우) */}
      {selectedCategoryData &&
        selectedCategoryData.subCategories.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">
              세부 카테고리 선택 (선택사항)
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedCategoryData.subCategories.map((subCategory) => {
                const { selectedSubCategory, setSelectedSubCategory } =
                  useApplicationStore.getState()
                const isSelected = selectedSubCategory === subCategory.id

                return (
                  <button
                    key={subCategory.id}
                    type="button"
                    onClick={() => setSelectedSubCategory(subCategory.id)}
                    className={cn(
                      "px-4 py-2 rounded-md border text-sm transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent"
                    )}
                    aria-label={`${subCategory.label} 선택`}
                  >
                    {subCategory.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

      {/* 버튼 영역 */}
      {selectedCategory && (
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "저장 중..." : "임시 저장"}
          </Button>
          <Button
            onClick={() => {
              // 선택된 카테고리와 세부 카테고리를 formData에 저장
              const { setFormData } = useApplicationStore.getState()
              setFormData({
                category: selectedCategory,
                sub_category: selectedSubCategory || undefined,
              } as any)
              setCurrentStep(2)
            }}
            className="min-w-[120px]"
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}

