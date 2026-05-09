export type ApprovalDocumentType = 'expenditure' | 'leave' | 'business_report'
export type ApprovalDocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected'
export type ApprovalStepRole = 'manager' | 'admin'
export type LeaveSubType = 'annual' | 'half' | 'business_trip' | 'other'

// ── Document content shapes (stored as JSONB) ──────────────

export interface ExpenditureContent {
  item_name: string
  amount: number
  spend_date: string
  receipt_url?: string
  note?: string
}

export interface LeaveContent {
  leave_type: LeaveSubType
  start_date: string
  end_date: string
  reason: string
  destination?: string
}

export interface BusinessReportContent {
  background: string
  body: string
  attachment_urls?: string[]
}

export type ApprovalDocumentContent =
  | ExpenditureContent
  | LeaveContent
  | BusinessReportContent

// ── Core entities ─────────────────────────────────────────

export interface ApprovalSignature {
  id: string
  clerk_user_id: string
  image_url: string
  created_at: string
  updated_at: string
}

export interface ApprovalDocument {
  id: string
  type: ApprovalDocumentType
  title: string
  content: ApprovalDocumentContent
  status: ApprovalDocumentStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface ApprovalStep {
  id: string
  document_id: string
  step: 1 | 2
  approver_role: ApprovalStepRole
  acted_by: string | null
  status: ApprovalStepStatus
  signature_url: string | null
  comment: string | null
  acted_at: string | null
}

export interface ApprovalDocumentWithSteps extends ApprovalDocument {
  approval_steps: ApprovalStep[]
}

// ── Input types ───────────────────────────────────────────

export interface CreateDocumentInput {
  type: ApprovalDocumentType
  title: string
  content: ApprovalDocumentContent
}
