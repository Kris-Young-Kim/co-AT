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
