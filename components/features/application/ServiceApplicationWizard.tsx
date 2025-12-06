"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardStepNav } from "./wizard-step-nav"
import { ServiceCategorySelector } from "./ServiceCategorySelector"
import { ServiceRepairForm } from "./forms/ServiceRepairForm"
import { ServiceRentalForm } from "./forms/ServiceRentalForm"
import { ServiceConsultForm } from "./forms/ServiceConsultForm"
import { ServiceCustomForm } from "./forms/ServiceCustomForm"
import { SuccessModal } from "./success-modal"
import { useApplicationStore } from "@/lib/stores/application-store"
import { createApplication } from "@/actions/application-actions"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const stepLabels = ["카테고리 선택", "신청서 작성", "확인 및 제출"]

export function ServiceApplicationWizard() {
  const router = useRouter()
  const {
    currentStep,
    selectedCategory,
    formData,
    setCurrentStep,
    reset,
  } = useApplicationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [applicationId, setApplicationId] = useState<string>()

  // 단계별 컴포넌트 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ServiceCategorySelector />

      case 2:
        if (!selectedCategory) {
          return (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                먼저 서비스 카테고리를 선택해주세요.
              </p>
              <Button
                onClick={() => setCurrentStep(1)}
                className="mt-4"
              >
                카테고리 선택으로 돌아가기
              </Button>
            </div>
          )
        }

        // 카테고리에 따른 폼 선택
        switch (selectedCategory) {
          case "aftercare":
            return <ServiceRepairForm />
          case "experience":
          case "custom":
            return <ServiceRentalForm />
          case "consult":
            return <ServiceConsultForm />
          case "education":
            return <ServiceCustomForm />
          default:
            return <ServiceConsultForm />
        }

      case 3:
        if (!formData) {
          return (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                신청서 정보가 없습니다.
              </p>
              <Button
                onClick={() => setCurrentStep(1)}
                className="mt-4"
              >
                처음부터 다시 시작
              </Button>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">신청 내용 확인</h3>
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <span className="font-medium">카테고리:</span>{" "}
                  {selectedCategory === "consult"
                    ? "상담 및 정보제공"
                    : selectedCategory === "experience"
                    ? "체험"
                    : selectedCategory === "custom"
                    ? "맞춤형 지원"
                    : selectedCategory === "aftercare"
                    ? "사후관리"
                    : "교육/홍보"}
                </div>
                {formData.sub_category && (
                  <div>
                    <span className="font-medium">세부 카테고리:</span>{" "}
                    {formData.sub_category}
                  </div>
                )}
                {formData.contact && (
                  <div>
                    <span className="font-medium">연락처:</span> {formData.contact}
                  </div>
                )}
                {formData.description && (
                  <div>
                    <span className="font-medium">설명:</span>
                    <p className="mt-1 text-sm">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                이전
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
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
    if (!formData) return

    setIsSubmitting(true)
    try {
      const result = await createApplication(formData as any)

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
            totalSteps={3}
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
          router.push("/portal/mypage")
        }}
      />
    </div>
  )
}

