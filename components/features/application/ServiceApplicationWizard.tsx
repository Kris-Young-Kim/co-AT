"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardStepNav } from "./wizard-step-nav"
import { ServiceCategorySelector } from "./ServiceCategorySelector"
import { ServiceConsultForm } from "./forms/ServiceConsultForm"
import { ServiceRentalForm } from "./forms/ServiceRentalForm"
import { ServiceCustomForm } from "./forms/ServiceCustomForm"
import { ServiceReuseForm } from "./forms/ServiceReuseForm"
import { ServiceRepairForm } from "./forms/ServiceRepairForm"
import { ServiceCleaningForm } from "./forms/ServiceCleaningForm"
import { ServiceEducationForm } from "./forms/ServiceEducationForm"
import { ServicePromotionForm } from "./forms/ServicePromotionForm"
import { PersonalInfoStep } from "./PersonalInfoStep"
import { SuccessModal } from "./success-modal"
import { useApplicationStore } from "@/lib/stores/application-store"
import { createApplicationWithPendingClient } from "@/actions/application-actions"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

const stepLabels = ["서비스 선택", "본인 정보", "신청서 작성", "확인 및 제출"]

export function ServiceApplicationWizard() {
  const router = useRouter()
  const { user } = useUser()
  const {
    currentStep,
    selectedCategory,
    formData,
    personalInfo,
    setCurrentStep,
    reset,
  } = useApplicationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [applicationId, setApplicationId] = useState<string>()

  const SERVICE_LABELS: Record<string, Record<string, string>> = {
    consult: { default: "보조기기 상담", exhibition: "체험·견학" },
    experience: { rental: "보조기기 대여", default: "보조기기 대여" },
    custom: { custom_make: "맞춤 제작", default: "맞춤 제작" },
    aftercare: { repair: "수리·점검", default: "수리·점검" },
    education: { education: "교육 신청", default: "교육 신청" },
  }

  const getServiceLabel = (category: string | null, subCategory: string | null) => {
    if (!category) return ""
    const map = SERVICE_LABELS[category]
    if (!map) return category
    return (subCategory && map[subCategory]) || map.default || category
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ServiceCategorySelector />

      case 2:
        return <PersonalInfoStep />

      case 3:
        if (!selectedCategory) {
          return (
            <div className="text-center py-8">
              <p className="text-muted-foreground">먼저 서비스 카테고리를 선택해주세요.</p>
              <Button onClick={() => setCurrentStep(1)} className="mt-4">카테고리 선택으로 돌아가기</Button>
            </div>
          )
        }
        if (selectedCategory === "consult") return <ServiceConsultForm />
        if (selectedCategory === "experience" || (selectedCategory === "custom" && formData?.sub_category === "rental")) return <ServiceRentalForm />
        if (selectedCategory === "custom" && formData?.sub_category === "custom_make") return <ServiceCustomForm />
        if (selectedCategory === "aftercare") {
          if (formData?.sub_category === "reuse") return <ServiceReuseForm />
          if (formData?.sub_category === "cleaning") return <ServiceCleaningForm />
          return <ServiceRepairForm />
        }
        if (selectedCategory === "education") {
          if (formData?.sub_category === "promotion") return <ServicePromotionForm />
          return <ServiceEducationForm />
        }
        return <ServiceConsultForm />

      case 4:
        if (!formData) {
          return (
            <div className="text-center py-8">
              <p className="text-muted-foreground">신청서 정보가 없습니다.</p>
              <Button onClick={() => setCurrentStep(1)} className="mt-4">처음부터 다시 시작</Button>
            </div>
          )
        }
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">신청 내용 확인</h3>
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50 text-sm">
                {personalInfo?.name && (
                  <div><span className="font-medium">신청인:</span> {personalInfo.name}</div>
                )}
                {personalInfo?.contact && (
                  <div><span className="font-medium">연락처:</span> {personalInfo.contact}</div>
                )}
                {personalInfo?.disability_type && (
                  <div><span className="font-medium">장애유형:</span> {personalInfo.disability_type}</div>
                )}
                <div>
                  <span className="font-medium">신청 서비스:</span>{" "}
                  {getServiceLabel(selectedCategory ?? null, formData.sub_category ?? null)}
                </div>
                {formData.contact && !personalInfo?.contact && (
                  <div><span className="font-medium">연락처:</span> {formData.contact}</div>
                )}
                {formData.description && (
                  <div>
                    <span className="font-medium">설명:</span>
                    <p className="mt-1">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">이전</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "제출 중..." : "신청 제출"}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const handleSubmit = async () => {
    if (!formData || !selectedCategory) return

    const fallbackName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "신청자"

    setIsSubmitting(true)
    try {
      const result = await createApplicationWithPendingClient({
        name: personalInfo?.name || fallbackName,
        birth_date: personalInfo?.birth_date ?? null,
        gender: personalInfo?.gender ?? null,
        contact: personalInfo?.contact ?? formData.contact ?? null,
        disability_type: personalInfo?.disability_type ?? null,
        disability_grade: personalInfo?.disability_grade ?? null,
        economic_status: personalInfo?.economic_status ?? null,
        category: selectedCategory,
        sub_category: formData.sub_category ?? null,
        desired_date: formData.desired_date
          ? formData.desired_date.toISOString().split("T")[0]
          : null,
      })

      if (result.success) {
        setApplicationId(result.applicationId)
        setShowSuccessModal(true)
        reset()
      } else {
        alert(result.error || "신청 제출에 실패했습니다")
      }
    } catch (error) {
      console.error("Application submission error:", error)
      alert("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>서비스 신청</CardTitle>
          <WizardStepNav
            currentStep={currentStep}
            totalSteps={4}
            stepLabels={stepLabels}
          />
        </CardHeader>
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      <SuccessModal
        open={showSuccessModal}
        applicationId={applicationId}
        onClose={() => {
          setShowSuccessModal(false)
        }}
      />
    </div>
  )
}

