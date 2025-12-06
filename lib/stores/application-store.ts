import { create } from "zustand"
import { type ApplicationForm } from "@/lib/validators"

interface ApplicationState {
  // 현재 단계 (1: 카테고리 선택, 2: 폼 작성, 3: 확인)
  currentStep: number
  // 선택된 카테고리
  selectedCategory: string | null
  // 선택된 세부 카테고리
  selectedSubCategory: string | null
  // 폼 데이터
  formData: Partial<ApplicationForm> | null
  // 에러 메시지
  errors: Record<string, string>
  
  // Actions
  setCurrentStep: (step: number) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedSubCategory: (subCategory: string | null) => void
  setFormData: (data: Partial<ApplicationForm>) => void
  setError: (field: string, error: string) => void
  clearErrors: () => void
  reset: () => void
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  currentStep: 1,
  selectedCategory: null,
  selectedSubCategory: null,
  formData: null,
  errors: {},

  setCurrentStep: (step) => set({ currentStep: step }),
  
  setSelectedCategory: (category) =>
    set({ selectedCategory: category, selectedSubCategory: null }),
  
  setSelectedSubCategory: (subCategory) =>
    set({ selectedSubCategory: subCategory }),
  
  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  
  setError: (field, error) =>
    set((state) => ({
      errors: { ...state.errors, [field]: error },
    })),
  
  clearErrors: () => set({ errors: {} }),
  
  reset: () =>
    set({
      currentStep: 1,
      selectedCategory: null,
      selectedSubCategory: null,
      formData: null,
      errors: {},
    }),
}))

