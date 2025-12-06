"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface WizardStepNavProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function WizardStepNav({
  currentStep,
  totalSteps,
  stepLabels,
}: WizardStepNavProps) {
  return (
    <nav aria-label="신청 단계" className="w-full">
      <ol className="flex items-center justify-between w-full">
        {stepLabels.map((label, index) => {
          const step = index + 1
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          const isPending = step > currentStep

          return (
            <li
              key={step}
              className="flex items-center flex-1"
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex items-center flex-1">
                {/* 단계 번호/체크 아이콘 */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary border-primary text-primary-foreground",
                    isPending &&
                      "bg-background border-muted-foreground text-muted-foreground"
                  )}
                  aria-label={`${label} ${isCompleted ? "완료" : isCurrent ? "진행 중" : "대기 중"}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>

                {/* 단계 라벨 */}
                <div className="ml-3 hidden sm:block">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-primary",
                      isPending && "text-muted-foreground",
                      isCompleted && "text-foreground"
                    )}
                  >
                    {label}
                  </p>
                </div>

                {/* 연결선 */}
                {step < totalSteps && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

