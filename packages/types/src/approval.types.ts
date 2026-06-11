export type ApprovalDocumentType = 'expenditure' | 'leave' | 'business_report' | 'rental' | 'custom_make' | 'reuse' | 'grant_referral'
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

export interface RentalApprovalContent {
  client_id: string
  notes?: string
}

export interface CustomMakeApprovalContent {
  client_id: string
  notes?: string
}

export interface ReuseApprovalContent {
  client_id: string
  notes?: string
}

export interface GrantReferralContent {
  doc_number?: string
  sending_org: string
  doc_date?: string
  receive_date?: string
  referral_round?: number
  referral_count?: number
  note?: string
}

export type ApprovalDocumentContent =
  | ExpenditureContent
  | LeaveContent
  | BusinessReportContent
  | RentalApprovalContent
  | CustomMakeApprovalContent
  | ReuseApprovalContent
  | GrantReferralContent

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
  is_delegated: boolean
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

// ── Delegation ────────────────────────────────────────────

export interface ApprovalDelegation {
  id: string
  delegator_clerk_id: string
  delegatee_clerk_id: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  note: string | null
  created_at: string
}

export interface DelegationWithNames extends ApprovalDelegation {
  delegator_name: string
  delegatee_name: string
}
