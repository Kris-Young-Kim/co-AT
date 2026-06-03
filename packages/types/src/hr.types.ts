// packages/types/src/hr.types.ts

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'daily'
export type LeaveType = 'annual' | 'sick' | 'special' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface HrEmployee {
  id: string
  clerk_user_id: string | null
  name: string
  email: string
  phone: string | null
  department: string
  position: string
  employment_type: EmploymentType
  hire_date: string
  leave_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HrCareer {
  id: string
  employee_id: string
  organization: string
  position: string
  start_date: string
  end_date: string | null
  description: string | null
  created_at: string
}

export interface HrAttendanceRecord {
  id: string
  employee_id: string
  date: string
  check_in: string | null
  check_out: string | null
  note: string | null
  created_at: string
}

export interface HrLeaveRequest {
  id: string
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  days_used: number
  reason: string | null
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

// Input types for forms / server actions
export interface CreateEmployeeInput {
  clerk_user_id?: string
  name: string
  email: string
  phone?: string
  department: string
  position: string
  employment_type: EmploymentType
  hire_date: string
  leave_date?: string
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  is_active?: boolean
}

export interface CreateCareerInput {
  employee_id: string
  organization: string
  position: string
  start_date: string
  end_date?: string
  description?: string
}

export interface UpsertAttendanceInput {
  employee_id: string
  date: string
  check_in?: string
  check_out?: string
  note?: string
}

export interface CreateLeaveRequestInput {
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  days_used: number
  reason?: string
}

export interface ReviewLeaveInput {
  id: string
  status: 'approved' | 'rejected'
  reviewed_by: string | null
}

// ============================================================
// HR Phase 2 — Salary, Allowances, Daily Wages
// ============================================================

export interface SalaryDeductions {
  national_pension: number      // 국민연금 4.5%
  health_insurance: number      // 건강보험 3.545%
  long_term_care: number        // 장기요양보험 건강보험료×12.81%
  employment_insurance: number  // 고용보험 0.9%
  income_tax: number            // 소득세 3.3% (간이세액표 단순화)
  local_income_tax: number      // 지방소득세 소득세×10%
}

export interface SalaryAllowance {
  type_id: string
  name: string
  amount: number
}

export interface HrSalaryGrade {
  id: string
  grade_name: string
  base_salary: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HrAllowanceType {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface HrSalaryRecord {
  id: string
  employee_id: string
  year_month: string
  salary_grade_id: string | null
  base_salary: number
  allowances: SalaryAllowance[]
  deductions: SalaryDeductions
  gross_pay: number
  net_pay: number
  note: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

export interface HrDailyWage {
  id: string
  employee_id: string
  work_date: string
  hours_worked: number
  hourly_rate: number
  gross_pay: number
  deductions: SalaryDeductions
  net_pay: number
  note: string | null
  created_at: string
}

// Input types
export interface CreateSalaryGradeInput {
  grade_name: string
  base_salary: number
}

export interface UpdateSalaryGradeInput extends Partial<CreateSalaryGradeInput> {
  is_active?: boolean
}

export interface CreateAllowanceTypeInput {
  name: string
}

export interface CreateSalaryRecordInput {
  employee_id: string
  year_month: string
  salary_grade_id?: string
  base_salary: number
  allowances: SalaryAllowance[]
  note?: string
}

export interface UpdateSalaryRecordInput {
  salary_grade_id?: string
  base_salary?: number
  allowances?: SalaryAllowance[]
  note?: string
}

export interface CreateDailyWageInput {
  employee_id: string
  work_date: string
  hours_worked: number
  hourly_rate: number
  note?: string
}

// ============================================================
// HR Phase 3 — Certificates
// ============================================================

export type CertificateType = 'employment' | 'career' | 'salary' | 'resignation'

export interface HrCertificate {
  id: string
  employee_id: string
  type: CertificateType
  purpose: string | null
  issued_by: string
  issued_at: string
}

export interface CreateCertificateInput {
  employee_id: string
  type: CertificateType
  purpose?: string
  // issued_by is resolved from the current Clerk user in the action
}

// ============================================================
// HR Phase D-1 — Departments, Positions, Salary Steps
// ============================================================

export interface HrDepartment {
  id: string
  name: string
  code: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HrPosition {
  id: string
  name: string
  code: string | null
  level: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HrSalaryStep {
  id: string
  step_number: number
  step_name: string | null
  base_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HrSalaryStepHistory {
  id: string
  employee_id: string
  from_step_id: string | null
  to_step_id: string
  effective_date: string
  reason: string | null
  created_by: string | null
  created_at: string
}

export interface CreateDepartmentInput {
  name: string
  code?: string
  description?: string
}

export interface UpdateDepartmentInput extends Partial<CreateDepartmentInput> {
  is_active?: boolean
}

export interface CreatePositionInput {
  name: string
  code?: string
  level?: number
}

export interface UpdatePositionInput extends Partial<CreatePositionInput> {
  is_active?: boolean
}

export interface CreateSalaryStepInput {
  step_number: number
  step_name?: string
  base_amount: number
}

export interface UpdateSalaryStepInput extends Partial<CreateSalaryStepInput> {
  is_active?: boolean
}

export interface CreateSalaryStepHistoryInput {
  employee_id: string
  from_step_id?: string
  to_step_id: string
  effective_date: string
  reason?: string
}
