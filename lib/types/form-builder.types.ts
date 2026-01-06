/**
 * 동적 양식 빌더 타입 정의
 * 양식을 자유롭게 수정할 수 있는 유연한 시스템
 */

export type FieldType =
  | "text"
  | "number"
  | "email"
  | "tel"
  | "date"
  | "datetime"
  | "time"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "file"
  | "image"
  | "boolean"
  | "range"
  | "color"

export type ValidationRule = {
  type: "required" | "min" | "max" | "minLength" | "maxLength" | "pattern" | "email" | "custom"
  value?: string | number
  message?: string
  customValidator?: string // 함수 이름 또는 정규식
}

export type ConditionalLogic = {
  fieldId: string
  operator: "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty"
  value: string | number | boolean
  action: "show" | "hide" | "enable" | "disable" | "setValue"
  targetValue?: string | number | boolean
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  name: string
  placeholder?: string
  description?: string
  defaultValue?: string | number | boolean | string[]
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  validation?: ValidationRule[]
  options?: Array<{ label: string; value: string | number }> // select, radio, multiselect용
  rows?: number // textarea용
  min?: number // number, range용
  max?: number // number, range용
  step?: number // number, range용
  accept?: string // file, image용
  multiple?: boolean // file, multiselect용
  conditionalLogic?: ConditionalLogic[]
  width?: "full" | "half" | "third" | "quarter" // 레이아웃
  className?: string
}

export interface FormSection {
  id: string
  title: string
  description?: string
  collapsible?: boolean
  collapsed?: boolean
  fields: FormField[]
  order: number
}

export interface FormTemplate {
  id: string
  name: string
  description?: string
  version: string
  sections: FormSection[]
  createdAt: string
  updatedAt: string
  createdBy?: string
  isDefault?: boolean
}

export interface FormData {
  [fieldName: string]: string | number | boolean | string[] | File[] | null
}

export interface FormBuilderState {
  template: FormTemplate
  formData: FormData
  errors: Record<string, string>
  touched: Record<string, boolean>
}
