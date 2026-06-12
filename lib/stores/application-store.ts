import { create } from "zustand"
import { type ApplicationForm } from "@/lib/validators"

export interface PersonalInfo {
  name: string
  birth_date: string | null
  gender: string | null
  contact: string | null
  disability_type: string | null
  disability_grade: string | null
  economic_status: string | null
}

interface ApplicationState {
  // 현재 단계 (1: 카테고리 선택, 2: 본인 정보, 3: 폼 작성, 4: 확인)
  currentStep: number
  selectedCategory: string | null
  selectedSubCategory: string | null
  formData: Partial<ApplicationForm> | null
  personalInfo: PersonalInfo | null
  errors: Record<string, string>

  setCurrentStep: (step: number) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedSubCategory: (subCategory: string | null) => void
  setFormData: (data: Partial<ApplicationForm>) => void
  setPersonalInfo: (info: PersonalInfo) => void
  setError: (field: string, error: string) => void
  clearErrors: () => void
  reset: () => void
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  currentStep: 1,
  selectedCategory: null,
  selectedSubCategory: null,
  formData: null,
  personalInfo: null,
  errors: {},

  setCurrentStep: (step) => set({ currentStep: step }),

  setSelectedCategory: (category) =>
    set({ selectedCategory: category, selectedSubCategory: null }),

  setSelectedSubCategory: (subCategory) =>
    set({ selectedSubCategory: subCategory }),

  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data } as ApplicationForm | null,
    })),

  setPersonalInfo: (info) => set({ personalInfo: info }),

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
      personalInfo: null,
      errors: {},
    }),
}))

