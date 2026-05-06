# Approval Phase 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/approval` — a full electronic approval system with document creation, fixed 2-step approval (manager → admin), signature image stamps, PDF print, and in-app notifications.

**Architecture:** Server Actions handle all DB writes via Supabase service role. Client Components handle forms and signature upload. PDF/print uses `window.print()` with `@media print` CSS (same as hr certificates). Notifications insert directly into the shared `notifications` table. No external approval SaaS.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase (admin client), Clerk (`@co-at/auth`), shadcn/ui (`@co-at/ui`), Tailwind CSS, Supabase Storage (signature images)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `migrations/041_create_approval_tables.sql` | Create | approval_signatures, approval_documents, approval_steps 테이블 + RLS |
| `packages/types/src/approval.types.ts` | Create | 전자결재 TypeScript 타입 |
| `packages/types/src/index.ts` | Modify | approval.types.ts export 추가 |
| `apps/approval/lib/supabase-admin.ts` | Create | Supabase service role client |
| `apps/approval/actions/approval-actions.ts` | Create | 모든 Server Actions (CRUD + 결재 처리 + 알림) |
| `apps/approval/components/AppSidebar.tsx` | Create | 네비게이션 사이드바 |
| `apps/approval/app/layout.tsx` | Modify | AppSidebar 추가 |
| `apps/approval/app/page.tsx` | Modify | 결재함 대시보드 |
| `apps/approval/app/settings/signature/page.tsx` | Create | 서명 이미지 업로드 |
| `apps/approval/app/new/page.tsx` | Create | 기안 폼 (유형 선택 + 유형별 필드) |
| `apps/approval/app/[id]/page.tsx` | Create | 문서 상세 + 결재 현황 |
| `apps/approval/app/[id]/approve/page.tsx` | Create | 결재 처리 (승인/반려) |
| `apps/approval/components/ApprovalDocumentPreview.tsx` | Create | 인쇄용 결재 문서 컴포넌트 |
| `apps/approval/app/archive/page.tsx` | Create | 보관함 (검색/필터) |

---

## Task 1: DB Migration

**Files:**
- Create: `migrations/041_create_approval_tables.sql`

- [ ] **Step 1: Create migration file**

```sql
-- migrations/041_create_approval_tables.sql

-- ============================================================
-- approval_signatures — 직원별 서명 이미지 (1인 1개)
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_signatures (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   text        UNIQUE NOT NULL,
  image_url       text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- approval_documents — 결재 문서 본체
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL CHECK (type IN ('expenditure', 'leave', 'business_report')),
  title       text        NOT NULL,
  content     jsonb       NOT NULL DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_by  text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- approval_steps — 결재 단계 (문서당 2개 행: step=1 팀장, step=2 센터장)
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_steps (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     uuid        NOT NULL REFERENCES approval_documents(id) ON DELETE CASCADE,
  step            int         NOT NULL CHECK (step IN (1, 2)),
  approver_role   text        NOT NULL CHECK (approver_role IN ('manager', 'admin')),
  acted_by        text,
  status          text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  signature_url   text,
  comment         text,
  acted_at        timestamptz,
  UNIQUE (document_id, step)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS approval_documents_created_by_idx ON approval_documents(created_by);
CREATE INDEX IF NOT EXISTS approval_documents_status_idx     ON approval_documents(status);
CREATE INDEX IF NOT EXISTS approval_steps_document_id_idx    ON approval_steps(document_id);

-- ============================================================
-- RLS (service_role bypasses RLS for all writes)
-- ============================================================
ALTER TABLE approval_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_approval_signatures"
  ON approval_signatures FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_approval_documents"
  ON approval_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_approval_steps"
  ON approval_steps FOR ALL TO service_role USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Apply to Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration.
Also create Storage bucket: `approval-signatures` (public: false, file size limit: 2MB, allowed MIME: image/png, image/jpeg)

- [ ] **Step 3: Commit**

```bash
git add migrations/041_create_approval_tables.sql
git commit -m "feat(approval): add DB migration for approval tables"
```

Expected: Clean commit, no build errors.

---

## Task 2: TypeScript Types

**Files:**
- Create: `packages/types/src/approval.types.ts`
- Modify: `packages/types/src/index.ts`

- [ ] **Step 1: Create approval.types.ts**

```typescript
// packages/types/src/approval.types.ts

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
```

- [ ] **Step 2: Add export to packages/types/src/index.ts**

Current content of `packages/types/src/index.ts`:
```typescript
export * from './roles'
export * from './common'
export * from './hr.types'
```

New content:
```typescript
export * from './roles'
export * from './common'
export * from './hr.types'
export * from './approval.types'
```

- [ ] **Step 3: Commit**

```bash
git add packages/types/src/approval.types.ts packages/types/src/index.ts
git commit -m "feat(types): add approval system types"
```

---

## Task 3: Supabase Admin Client

**Files:**
- Create: `apps/approval/lib/supabase-admin.ts`

- [ ] **Step 1: Create supabase-admin.ts**

```typescript
// apps/approval/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/approval/lib/supabase-admin.ts
git commit -m "feat(approval): add supabase admin client"
```

---

## Task 4: Server Actions

**Files:**
- Create: `apps/approval/actions/approval-actions.ts`

- [ ] **Step 1: Create approval-actions.ts**

```typescript
// apps/approval/actions/approval-actions.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { assertRole, requireRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type {
  ApprovalDocument,
  ApprovalDocumentWithSteps,
  ApprovalSignature,
  ApprovalStepRole,
  CreateDocumentInput,
} from '@co-at/types'

// ── Helpers ───────────────────────────────────────────────

async function getUserIdsByRole(role: string): Promise<string[]> {
  const clerk = await clerkClient()
  const response = await clerk.users.getUserList({ limit: 200 })
  return response.data
    .filter(u => (u.publicMetadata as { role?: string }).role === role)
    .map(u => u.id)
}

async function sendApprovalNotification(
  targetClerkUserIds: string[],
  title: string,
  body: string,
  link: string
): Promise<void> {
  const supabase = createSupabaseAdmin()
  const inserts = targetClerkUserIds.map(userId => ({
    user_id:       userId,
    clerk_user_id: userId,
    type:          'approval',
    title,
    body,
    link,
    priority:      1,
    status:        'unread',
  }))
  if (inserts.length > 0) {
    await supabase.from('notifications').insert(inserts)
  }
}

// ── Signature ─────────────────────────────────────────────

export async function getSignature(clerkUserId: string): Promise<ApprovalSignature | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_signatures')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
  if (error) { console.error('[getSignature]', error); return null }
  return data
}

export async function upsertSignature(
  clerkUserId: string,
  imageUrl: string
): Promise<ApprovalSignature | null> {
  await assertRole(ROLES.STAFF)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_signatures')
    .upsert(
      { clerk_user_id: clerkUserId, image_url: imageUrl, updated_at: new Date().toISOString() },
      { onConflict: 'clerk_user_id' }
    )
    .select()
    .single()
  if (error) { console.error('[upsertSignature]', error); return null }
  return data
}

// ── Documents ─────────────────────────────────────────────

export async function createDocument(input: CreateDocumentInput): Promise<ApprovalDocument | null> {
  await assertRole(ROLES.STAFF)
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_documents')
    .insert({
      type:       input.type,
      title:      input.title,
      content:    input.content,
      status:     'draft',
      created_by: userId,
    })
    .select()
    .single()
  if (error) { console.error('[createDocument]', error); return null }
  return data
}

export async function submitDocument(id: string): Promise<boolean> {
  await assertRole(ROLES.STAFF)
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()

  // Verify ownership
  const { data: doc } = await supabase
    .from('approval_documents')
    .select('id, title, status, created_by')
    .eq('id', id)
    .single()
  if (!doc || doc.created_by !== userId || doc.status !== 'draft') return false

  // Update status to pending
  const { error: updateError } = await supabase
    .from('approval_documents')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (updateError) { console.error('[submitDocument] update', updateError); return false }

  // Create 2 approval steps
  const { error: stepsError } = await supabase
    .from('approval_steps')
    .insert([
      { document_id: id, step: 1, approver_role: 'manager' as ApprovalStepRole, status: 'pending' },
      { document_id: id, step: 2, approver_role: 'admin'   as ApprovalStepRole, status: 'pending' },
    ])
  if (stepsError) { console.error('[submitDocument] steps', stepsError); return false }

  // Notify all MANAGER users
  const managerIds = await getUserIdsByRole(ROLES.MANAGER)
  await sendApprovalNotification(
    managerIds,
    '결재 요청',
    `새로운 결재 요청: ${doc.title}`,
    `/approval/${id}`
  )

  return true
}

export async function approveStep(
  stepId: string,
  actorClerkUserId: string,
  signatureUrl: string | null
): Promise<boolean> {
  await assertRole(ROLES.MANAGER)
  const supabase = createSupabaseAdmin()

  // Load step
  const { data: step } = await supabase
    .from('approval_steps')
    .select('*, approval_documents(id, title, created_by, status)')
    .eq('id', stepId)
    .single()
  if (!step || step.status !== 'pending') return false

  const doc = step.approval_documents as { id: string; title: string; created_by: string; status: string }

  // Verify actor has the right role
  const actorRole = step.step === 1 ? ROLES.MANAGER : ROLES.ADMIN
  const hasRole = await requireRole(actorRole)
  if (!hasRole) return false

  // Update step
  const { error } = await supabase
    .from('approval_steps')
    .update({
      status:        'approved',
      acted_by:      actorClerkUserId,
      signature_url: signatureUrl,
      acted_at:      new Date().toISOString(),
    })
    .eq('id', stepId)
  if (error) { console.error('[approveStep]', error); return false }

  if (step.step === 1) {
    // Notify ADMIN users for step 2
    const adminIds = await getUserIdsByRole(ROLES.ADMIN)
    await sendApprovalNotification(
      adminIds,
      '결재 대기',
      `팀장 승인 완료, 최종 결재 대기: ${doc.title}`,
      `/approval/${doc.id}`
    )
  } else {
    // step === 2: final approval
    await supabase
      .from('approval_documents')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', doc.id)

    await sendApprovalNotification(
      [doc.created_by],
      '결재 완료',
      `결재가 최종 승인되었습니다: ${doc.title}`,
      `/approval/${doc.id}`
    )
  }

  return true
}

export async function rejectStep(
  stepId: string,
  actorClerkUserId: string,
  comment: string
): Promise<boolean> {
  await assertRole(ROLES.MANAGER)
  const supabase = createSupabaseAdmin()

  const { data: step } = await supabase
    .from('approval_steps')
    .select('*, approval_documents(id, title, created_by)')
    .eq('id', stepId)
    .single()
  if (!step || step.status !== 'pending') return false

  const doc = step.approval_documents as { id: string; title: string; created_by: string }

  // Verify actor role
  const actorRole = step.step === 1 ? ROLES.MANAGER : ROLES.ADMIN
  const hasRole = await requireRole(actorRole)
  if (!hasRole) return false

  // Update step
  await supabase
    .from('approval_steps')
    .update({
      status:   'rejected',
      acted_by: actorClerkUserId,
      comment,
      acted_at: new Date().toISOString(),
    })
    .eq('id', stepId)

  // Update document status
  await supabase
    .from('approval_documents')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', doc.id)

  // Notify drafter
  await sendApprovalNotification(
    [doc.created_by],
    '결재 반려',
    `결재가 반려되었습니다: ${doc.title} — ${comment}`,
    `/approval/${doc.id}`
  )

  return true
}

// ── Queries ───────────────────────────────────────────────

export async function getMyDocuments(userId: string): Promise<ApprovalDocumentWithSteps[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_documents')
    .select('*, approval_steps(*)')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('[getMyDocuments]', error); return [] }
  return (data ?? []) as ApprovalDocumentWithSteps[]
}

export async function getPendingApprovals(role: ApprovalStepRole): Promise<ApprovalDocumentWithSteps[]> {
  const supabase = createSupabaseAdmin()
  // Find step numbers for this role
  const stepNum = role === 'manager' ? 1 : 2
  const { data, error } = await supabase
    .from('approval_documents')
    .select('*, approval_steps!inner(*)')
    .eq('status', 'pending')
    .eq('approval_steps.step', stepNum)
    .eq('approval_steps.status', 'pending')
    .order('created_at', { ascending: false })
  if (error) { console.error('[getPendingApprovals]', error); return [] }
  return (data ?? []) as ApprovalDocumentWithSteps[]
}

export async function getDocument(id: string): Promise<ApprovalDocumentWithSteps | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('approval_documents')
    .select('*, approval_steps(*)')
    .eq('id', id)
    .single()
  if (error) { console.error('[getDocument]', error); return null }
  return data as ApprovalDocumentWithSteps
}

export async function getArchive(filters?: {
  type?: string
  status?: string
  search?: string
}): Promise<ApprovalDocumentWithSteps[]> {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('approval_documents')
    .select('*, approval_steps(*)')
    .order('created_at', { ascending: false })

  if (filters?.type)   query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error } = await query
  if (error) { console.error('[getArchive]', error); return [] }
  return (data ?? []) as ApprovalDocumentWithSteps[]
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/approval/actions/approval-actions.ts
git commit -m "feat(approval): add server actions for approval workflow"
```

---

## Task 5: AppSidebar + Layout

**Files:**
- Create: `apps/approval/components/AppSidebar.tsx`
- Modify: `apps/approval/app/layout.tsx`

- [ ] **Step 1: Create AppSidebar.tsx**

```typescript
// apps/approval/components/AppSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FilePlus,
  Archive,
  Stamp,
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

const NAV_ITEMS = [
  { href: '/',                    label: '결재함',       icon: LayoutDashboard },
  { href: '/new',                 label: '기안하기',      icon: FilePlus        },
  { href: '/archive',             label: '보관함',       icon: Archive         },
  { href: '/settings/signature',  label: '서명 등록',    icon: Stamp           },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen border-r bg-white flex flex-col">
      <div className="px-6 py-5 border-b flex items-center gap-2">
        <Stamp className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-sm">전자결재</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Update apps/approval/app/layout.tsx**

```typescript
// apps/approval/app/layout.tsx
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AppSidebar } from '@/components/AppSidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 전자결재',
  description: '지능형 전자결재 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ClerkProvider>
          <div className="flex min-h-screen bg-gray-50">
            <AppSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/approval/components/AppSidebar.tsx apps/approval/app/layout.tsx
git commit -m "feat(approval): add AppSidebar and update layout"
```

---

## Task 6: Signature Upload Page

**Files:**
- Create: `apps/approval/app/settings/signature/page.tsx`

- [ ] **Step 1: Create signature upload page**

```typescript
// apps/approval/app/settings/signature/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { upsertSignature, getSignature } from '@/actions/approval-actions'
import { createClient } from '@supabase/supabase-js'

function createBrowserSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function SignaturePage() {
  const { user } = useUser()
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    getSignature(user.id).then(sig => {
      if (sig) setCurrentUrl(sig.image_url)
    })
  }, [user?.id])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setUploading(true)
    setMessage(null)

    const supabase = createBrowserSupabase()
    const path = `${user.id}/signature.png`

    const { error: uploadError } = await supabase.storage
      .from('approval-signatures')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setMessage('업로드 실패: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('approval-signatures')
      .getPublicUrl(path)

    const result = await upsertSignature(user.id, publicUrl)
    if (result) {
      setCurrentUrl(publicUrl)
      setMessage('서명 이미지가 저장되었습니다.')
    } else {
      setMessage('저장 실패. 다시 시도해주세요.')
    }
    setUploading(false)
  }

  return (
    <div className="p-8 space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">서명 이미지 등록</h1>
      <p className="text-sm text-gray-500">
        결재 시 도장처럼 사용될 서명 이미지를 등록합니다. PNG 또는 JPG, 최대 2MB.
      </p>

      {currentUrl && (
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm font-medium text-gray-700 mb-2">현재 등록된 서명</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="서명 이미지" className="h-24 object-contain border rounded" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          서명 이미지 {currentUrl ? '교체' : '등록'}
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
      </div>

      {uploading && <p className="text-sm text-blue-600">업로드 중...</p>}
      {message && (
        <p className={`text-sm ${message.includes('실패') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/approval/app/settings/signature/page.tsx
git commit -m "feat(approval): add signature image upload page"
```

---

## Task 7: New Document Form

**Files:**
- Create: `apps/approval/app/new/page.tsx`

- [ ] **Step 1: Create new document page**

```typescript
// apps/approval/app/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDocument, submitDocument } from '@/actions/approval-actions'
import type {
  ApprovalDocumentType,
  ExpenditureContent,
  LeaveContent,
  BusinessReportContent,
  LeaveSubType,
} from '@co-at/types'

const DOC_TYPES: { value: ApprovalDocumentType; label: string; desc: string }[] = [
  { value: 'expenditure',     label: '지출 결의서',        desc: '구매·비용 지출 승인 요청' },
  { value: 'leave',           label: '휴가/출장 신청서',    desc: '연차·반차·출장 등 신청' },
  { value: 'business_report', label: '업무 보고서/기안문', desc: '업무 보고 및 기안 작성' },
]

const LEAVE_SUBTYPES: { value: LeaveSubType; label: string }[] = [
  { value: 'annual',        label: '연차' },
  { value: 'half',          label: '반차' },
  { value: 'business_trip', label: '출장' },
  { value: 'other',         label: '기타' },
]

export default function NewDocumentPage() {
  const router = useRouter()
  const [docType, setDocType] = useState<ApprovalDocumentType | null>(null)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Expenditure fields
  const [itemName, setItemName]   = useState('')
  const [amount, setAmount]       = useState('')
  const [spendDate, setSpendDate] = useState('')
  const [expNote, setExpNote]     = useState('')

  // Leave fields
  const [leaveType, setLeaveType]       = useState<LeaveSubType>('annual')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')
  const [reason, setReason]             = useState('')
  const [destination, setDestination]   = useState('')

  // Business report fields
  const [background, setBackground] = useState('')
  const [body, setBody]             = useState('')

  function buildContent(): ExpenditureContent | LeaveContent | BusinessReportContent | null {
    if (docType === 'expenditure') {
      if (!itemName || !amount || !spendDate) return null
      return { item_name: itemName, amount: Number(amount), spend_date: spendDate, note: expNote || undefined }
    }
    if (docType === 'leave') {
      if (!startDate || !endDate || !reason) return null
      return { leave_type: leaveType, start_date: startDate, end_date: endDate, reason, destination: destination || undefined }
    }
    if (docType === 'business_report') {
      if (!background || !body) return null
      return { background, body }
    }
    return null
  }

  async function handleSaveDraft() {
    if (!docType || !title) { setError('문서 유형과 제목을 입력해주세요.'); return }
    const content = buildContent()
    if (!content) { setError('필수 항목을 모두 입력해주세요.'); return }
    setSaving(true)
    setError(null)
    const doc = await createDocument({ type: docType, title, content })
    if (!doc) { setError('저장 실패. 다시 시도해주세요.'); setSaving(false); return }
    router.push(`/${doc.id}`)
  }

  async function handleSubmit() {
    if (!docType || !title) { setError('문서 유형과 제목을 입력해주세요.'); return }
    const content = buildContent()
    if (!content) { setError('필수 항목을 모두 입력해주세요.'); return }
    setSaving(true)
    setError(null)
    const doc = await createDocument({ type: docType, title, content })
    if (!doc) { setError('저장 실패.'); setSaving(false); return }
    const ok = await submitDocument(doc.id)
    if (!ok) { setError('제출 실패.'); setSaving(false); return }
    router.push(`/${doc.id}`)
  }

  if (!docType) {
    return (
      <div className="p-8 space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">기안하기</h1>
        <p className="text-sm text-gray-500">작성할 문서 유형을 선택하세요.</p>
        <div className="grid gap-4">
          {DOC_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setDocType(t.value)}
              className="text-left border rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <p className="font-medium">{t.label}</p>
              <p className="text-sm text-gray-500 mt-1">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setDocType(null)} className="text-sm text-gray-500 hover:text-gray-700">← 뒤로</button>
        <h1 className="text-2xl font-bold">
          {DOC_TYPES.find(t => t.value === docType)?.label}
        </h1>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">문서 제목 *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="예: 2026년 5월 사무용품 구매 지출 결의"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        {docType === 'expenditure' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">항목명 *</label>
              <input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">금액 (원) *</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">지출일 *</label>
                <input type="date" value={spendDate} onChange={e => setSpendDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
              <textarea value={expNote} onChange={e => setExpNote(e.target.value)} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </>
        )}

        {docType === 'leave' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형 *</label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value as LeaveSubType)} className="w-full border rounded-md px-3 py-2 text-sm">
                {LEAVE_SUBTYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사유 *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            {leaveType === 'business_trip' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">행선지</label>
                <input value={destination} onChange={e => setDestination(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            )}
          </>
        )}

        {docType === 'business_report' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">배경 및 목적 *</label>
              <textarea value={background} onChange={e => setBackground(e.target.value)} rows={3} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          임시저장
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '처리 중...' : '결재 요청'}
        </button>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 px-2">취소</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/approval/app/new/page.tsx
git commit -m "feat(approval): add new document form"
```

---

## Task 8: Dashboard

**Files:**
- Modify: `apps/approval/app/page.tsx`

- [ ] **Step 1: Update dashboard page**

```typescript
// apps/approval/app/page.tsx
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCurrentRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { getMyDocuments, getPendingApprovals } from '@/actions/approval-actions'
import type { ApprovalDocumentWithSteps, ApprovalStepRole } from '@co-at/types'
import { FilePlus } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft:    { label: '임시저장', className: 'bg-gray-100 text-gray-600' },
  pending:  { label: '결재중',   className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인',     className: 'bg-green-100 text-green-700' },
  rejected: { label: '반려',     className: 'bg-red-100 text-red-600' },
}

const TYPE_LABELS: Record<string, string> = {
  expenditure:     '지출 결의서',
  leave:           '휴가/출장',
  business_report: '업무 보고',
}

function StatusBadge({ status }: { status: string }) {
  const { label, className } = STATUS_LABELS[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>
}

function DocRow({ doc }: { doc: ApprovalDocumentWithSteps }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">
        <Link href={`/${doc.id}`} className="hover:text-blue-600">{doc.title}</Link>
      </td>
      <td className="px-4 py-3 text-gray-500 text-sm">{TYPE_LABELS[doc.type] ?? doc.type}</td>
      <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(doc.created_at).toLocaleDateString('ko-KR')}</td>
    </tr>
  )
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  const role = await getCurrentRole()
  const myDocs = await getMyDocuments(userId)

  const stepRole: ApprovalStepRole | null =
    role === ROLES.ADMIN ? 'admin' : role === ROLES.MANAGER ? 'manager' : null
  const pendingApprovals = stepRole ? await getPendingApprovals(stepRole) : []

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">결재함</h1>
        <Link href="/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          <FilePlus className="w-4 h-4" />
          기안하기
        </Link>
      </div>

      {pendingApprovals.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">내 결재 대기 ({pendingApprovals.length})</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['문서명', '유형', '상태', '기안일'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingApprovals.map(doc => <DocRow key={doc.id} doc={doc} />)}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">내 기안 문서</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['문서명', '유형', '상태', '기안일'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {myDocs.map(doc => <DocRow key={doc.id} doc={doc} />)}
              {myDocs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">기안 문서가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/approval/app/page.tsx
git commit -m "feat(approval): add dashboard page"
```

---

## Task 9: Document Detail & Approval

**Files:**
- Create: `apps/approval/app/[id]/page.tsx`
- Create: `apps/approval/app/[id]/approve/page.tsx`

- [ ] **Step 1: Create document detail page**

```typescript
// apps/approval/app/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCurrentRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { getDocument, submitDocument } from '@/actions/approval-actions'
import type { ApprovalStep } from '@co-at/types'
import { SubmitButton } from '@/components/SubmitButton'

const TYPE_LABELS: Record<string, string> = {
  expenditure:     '지출 결의서',
  leave:           '휴가/출장 신청서',
  business_report: '업무 보고서/기안문',
}
const STATUS_LABELS: Record<string, string> = {
  draft: '임시저장', pending: '결재중', approved: '최종 승인', rejected: '반려',
}
const STEP_STATUS_STYLES: Record<string, string> = {
  pending:  'bg-yellow-50 border-yellow-200 text-yellow-700',
  approved: 'bg-green-50 border-green-200 text-green-700',
  rejected: 'bg-red-50 border-red-200 text-red-600',
}

function StepCard({ step, index }: { step: ApprovalStep; index: number }) {
  const roleLabel = step.approver_role === 'manager' ? '팀장' : '센터장'
  return (
    <div className={`border rounded-lg p-4 ${STEP_STATUS_STYLES[step.status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{index + 1}단계 — {roleLabel}</span>
        <span className="text-xs">{step.status === 'pending' ? '대기중' : step.status === 'approved' ? '승인' : '반려'}</span>
      </div>
      {step.signature_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={step.signature_url} alt="서명" className="h-12 object-contain mt-1" />
      )}
      {step.comment && <p className="text-xs mt-1">사유: {step.comment}</p>}
      {step.acted_at && <p className="text-xs text-gray-400 mt-1">{new Date(step.acted_at).toLocaleString('ko-KR')}</p>}
    </div>
  )
}

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await getDocument(id)
  if (!doc) notFound()

  const { userId } = await auth()
  const role = await getCurrentRole()
  const isOwner = doc.created_by === userId
  const isDraft = doc.status === 'draft'

  const sortedSteps = [...(doc.approval_steps ?? [])].sort((a, b) => a.step - b.step)

  // Can current user act on a pending step?
  const canApproveStep = sortedSteps.find(s => {
    if (s.status !== 'pending') return false
    if (s.approver_role === 'manager' && role === ROLES.MANAGER) return true
    if (s.approver_role === 'admin'   && role === ROLES.ADMIN)   return true
    return false
  })

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{TYPE_LABELS[doc.type] ?? doc.type}</p>
          <h1 className="text-2xl font-bold mt-1">{doc.title}</h1>
        </div>
        <span className="text-sm border rounded-full px-3 py-1">{STATUS_LABELS[doc.status] ?? doc.status}</span>
      </div>

      {/* Document content */}
      <div className="bg-white border rounded-lg p-6 space-y-3">
        <h2 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">문서 내용</h2>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
          {JSON.stringify(doc.content, null, 2)}
        </pre>
        <p className="text-xs text-gray-400">기안일: {new Date(doc.created_at).toLocaleString('ko-KR')}</p>
      </div>

      {/* Approval steps */}
      {sortedSteps.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">결재 현황</h2>
          <div className="grid grid-cols-2 gap-4">
            {sortedSteps.map((step, i) => <StepCard key={step.id} step={step} index={i} />)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isDraft && isOwner && (
          <form action={async () => {
            'use server'
            await submitDocument(id)
            revalidatePath(`/${id}`)
            redirect(`/${id}`)
          }}>
            <SubmitButton label="결재 요청" pendingLabel="제출 중..." className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700" />
          </form>
        )}
        {canApproveStep && (
          <Link
            href={`/${id}/approve?stepId=${canApproveStep.id}`}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
          >
            결재 처리
          </Link>
        )}
        <Link href="/" className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">목록으로</Link>
        <Link href={`/${id}/print`} className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">인쇄/PDF</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SubmitButton component**

```typescript
// apps/approval/components/SubmitButton.tsx
'use client'

import { useFormStatus } from 'react-dom'

interface Props {
  label: string
  pendingLabel: string
  className?: string
}

export function SubmitButton({ label, pendingLabel, className }: Props) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  )
}
```

- [ ] **Step 3: Create approval action page**

```typescript
// apps/approval/app/[id]/approve/page.tsx
'use client'

import { use, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { approveStep, rejectStep, getSignature } from '@/actions/approval-actions'

export default function ApprovePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { id } = use(params)
  const stepId = searchParams.get('stepId')

  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    getSignature(user.id).then(sig => {
      if (sig) setSignatureUrl(sig.image_url)
    })
  }, [user?.id])

  async function handleApprove() {
    if (!stepId || !user?.id) return
    setProcessing(true)
    setError(null)
    const ok = await approveStep(stepId, user.id, signatureUrl)
    if (!ok) { setError('결재 처리 실패. 다시 시도해주세요.'); setProcessing(false); return }
    router.push(`/${id}`)
  }

  async function handleReject() {
    if (!stepId || !user?.id || !comment.trim()) {
      setError('반려 사유를 입력해주세요.')
      return
    }
    setProcessing(true)
    setError(null)
    const ok = await rejectStep(stepId, user.id, comment)
    if (!ok) { setError('반려 처리 실패.'); setProcessing(false); return }
    router.push(`/${id}`)
  }

  return (
    <div className="p-8 space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">결재 처리</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {signatureUrl ? (
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm font-medium text-gray-700 mb-2">등록된 서명 (결재 시 사용)</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signatureUrl} alt="서명" className="h-20 object-contain" />
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-yellow-50 text-yellow-700 text-sm">
          서명 이미지가 등록되지 않았습니다.{' '}
          <a href="/settings/signature" className="underline">서명 등록하기</a>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">의견 (반려 시 필수)</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="결재 의견 또는 반려 사유를 입력하세요"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={processing}
          className="bg-green-600 text-white px-6 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {processing ? '처리 중...' : '승인'}
        </button>
        <button
          onClick={handleReject}
          disabled={processing || !comment.trim()}
          className="bg-red-600 text-white px-6 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
        >
          반려
        </button>
        <button onClick={() => router.push(`/${id}`)} className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">
          취소
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/approval/app/[id]/page.tsx apps/approval/app/[id]/approve/page.tsx apps/approval/components/SubmitButton.tsx
git commit -m "feat(approval): add document detail and approval pages"
```

---

## Task 10: Print / PDF Component

**Files:**
- Create: `apps/approval/components/ApprovalDocumentPreview.tsx`
- Create: `apps/approval/app/[id]/print/page.tsx`

- [ ] **Step 1: Create ApprovalDocumentPreview.tsx**

```typescript
// apps/approval/components/ApprovalDocumentPreview.tsx
'use client'

import type { ApprovalDocumentWithSteps, ApprovalStep, ExpenditureContent, LeaveContent, BusinessReportContent } from '@co-at/types'

const TYPE_LABELS: Record<string, string> = {
  expenditure:     '지  출  결  의  서',
  leave:           '휴가 / 출장 신청서',
  business_report: '업  무  보  고  서',
}
const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: '연차', half: '반차', business_trip: '출장', other: '기타',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-2 pr-8 text-gray-500 font-medium whitespace-nowrap w-24">{label}</td>
      <td className="py-2">{value}</td>
    </tr>
  )
}

function StepSignatureCell({ step, label }: { step: ApprovalStep | undefined; label: string }) {
  return (
    <div className="border rounded-md p-3 text-center w-28 min-h-[80px] flex flex-col items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      {step?.signature_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={step.signature_url} alt="서명" className="h-12 object-contain mt-1" />
      ) : (
        <span className="text-xs text-gray-300 mt-4">미결재</span>
      )}
    </div>
  )
}

interface Props {
  doc: ApprovalDocumentWithSteps
  authorName?: string
}

export function ApprovalDocumentPreview({ doc, authorName }: Props) {
  const sortedSteps = [...(doc.approval_steps ?? [])].sort((a, b) => a.step - b.step)
  const step1 = sortedSteps.find(s => s.step === 1)
  const step2 = sortedSteps.find(s => s.step === 2)

  return (
    <div className="p-12 bg-white min-h-screen font-serif" id="print-area">
      <style>{`
        @media print {
          body > *:not(#print-root) { display: none !important; }
          #print-area { display: block !important; }
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-widest mb-1">{TYPE_LABELS[doc.type] ?? doc.type}</h1>
        <p className="text-xs text-gray-400">보조공학센터</p>
      </div>

      {/* Approval stamps row */}
      <div className="flex justify-end gap-2 mb-8">
        <StepSignatureCell step={undefined} label="기안자" />
        <StepSignatureCell step={step1}     label="팀장" />
        <StepSignatureCell step={step2}     label="센터장" />
      </div>

      {/* Meta info */}
      <table className="text-sm mb-6 w-full">
        <tbody>
          <Row label="문서번호" value={doc.id.slice(0, 8).toUpperCase()} />
          <Row label="기  안  자" value={authorName ?? doc.created_by} />
          <Row label="기  안  일" value={new Date(doc.created_at).toLocaleDateString('ko-KR')} />
        </tbody>
      </table>

      <hr className="my-6" />

      {/* Body */}
      {doc.type === 'expenditure' && (() => {
        const c = doc.content as ExpenditureContent
        return (
          <table className="text-sm w-full">
            <tbody>
              <Row label="항  목  명" value={c.item_name} />
              <Row label="금      액" value={c.amount.toLocaleString('ko-KR') + '원'} />
              <Row label="지  출  일" value={c.spend_date} />
              {c.note && <Row label="비      고" value={c.note} />}
            </tbody>
          </table>
        )
      })()}

      {doc.type === 'leave' && (() => {
        const c = doc.content as LeaveContent
        return (
          <table className="text-sm w-full">
            <tbody>
              <Row label="유      형" value={LEAVE_TYPE_LABELS[c.leave_type] ?? c.leave_type} />
              <Row label="기      간" value={`${c.start_date} ~ ${c.end_date}`} />
              {c.destination && <Row label="행  선  지" value={c.destination} />}
              <Row label="사      유" value={c.reason} />
            </tbody>
          </table>
        )
      })()}

      {doc.type === 'business_report' && (() => {
        const c = doc.content as BusinessReportContent
        return (
          <div className="text-sm space-y-4">
            <div>
              <p className="font-semibold mb-1">배경 및 목적</p>
              <p className="whitespace-pre-wrap text-gray-700">{c.background}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">내용</p>
              <p className="whitespace-pre-wrap text-gray-700">{c.body}</p>
            </div>
          </div>
        )
      })()}

      <div className="mt-12 text-center text-xs text-gray-400">
        위와 같이 결재를 요청합니다.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create print page**

```typescript
// apps/approval/app/[id]/print/page.tsx
import { getDocument } from '@/actions/approval-actions'
import { notFound } from 'next/navigation'
import { PrintClient } from '@/components/PrintClient'

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await getDocument(id)
  if (!doc) notFound()
  return <PrintClient doc={doc} />
}
```

- [ ] **Step 2b: Create PrintClient.tsx (client wrapper for window.print)**

```typescript
// apps/approval/components/PrintClient.tsx
'use client'

import type { ApprovalDocumentWithSteps } from '@co-at/types'
import { ApprovalDocumentPreview } from './ApprovalDocumentPreview'

export function PrintClient({ doc }: { doc: ApprovalDocumentWithSteps }) {
  return (
    <div>
      <div className="p-4 bg-gray-100 flex gap-3 items-center print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          인쇄 / PDF 저장
        </button>
        <button onClick={() => window.history.back()} className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">
          돌아가기
        </button>
      </div>
      <ApprovalDocumentPreview doc={doc} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/approval/components/ApprovalDocumentPreview.tsx apps/approval/components/PrintClient.tsx apps/approval/app/[id]/print/page.tsx
git commit -m "feat(approval): add print-ready document preview"
```

---

## Task 11: Archive Page

**Files:**
- Create: `apps/approval/app/archive/page.tsx`

- [ ] **Step 1: Create archive page**

```typescript
// apps/approval/app/archive/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getArchive } from '@/actions/approval-actions'
import type { ApprovalDocumentWithSteps, ApprovalDocumentType, ApprovalDocumentStatus } from '@co-at/types'

const TYPE_LABELS: Record<string, string> = {
  expenditure: '지출 결의서', leave: '휴가/출장', business_report: '업무 보고',
}
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft:    { label: '임시저장', className: 'bg-gray-100 text-gray-600' },
  pending:  { label: '결재중',   className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인',     className: 'bg-green-100 text-green-700' },
  rejected: { label: '반려',     className: 'bg-red-100 text-red-600' },
}

export default function ArchivePage() {
  const [docs, setDocs] = useState<ApprovalDocumentWithSteps[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getArchive({
      search:  search  || undefined,
      type:    typeFilter  as ApprovalDocumentType  || undefined,
      status:  statusFilter as ApprovalDocumentStatus || undefined,
    }).then(data => { setDocs(data); setLoading(false) })
  }, [search, typeFilter, statusFilter])

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">보관함</h1>

      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="문서 제목 검색..."
          className="border rounded-md px-3 py-2 text-sm w-64"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
          <option value="">전체 유형</option>
          <option value="expenditure">지출 결의서</option>
          <option value="leave">휴가/출장</option>
          <option value="business_report">업무 보고</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
          <option value="">전체 상태</option>
          <option value="draft">임시저장</option>
          <option value="pending">결재중</option>
          <option value="approved">승인</option>
          <option value="rejected">반려</option>
        </select>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['문서명', '유형', '상태', '기안일'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">로딩 중...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">검색 결과가 없습니다.</td></tr>
            ) : docs.map(doc => {
              const { label, className } = STATUS_LABELS[doc.status] ?? { label: doc.status, className: '' }
              return (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/${doc.id}`} className="hover:text-blue-600">{doc.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABELS[doc.type] ?? doc.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(doc.created_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/approval/app/archive/page.tsx
git commit -m "feat(approval): add document archive with search and filters"
```

---

## Task 12: Build Verification

- [ ] **Step 1: TypeScript check**

```bash
cd D:/AILeader1/project/valuewith/co-AT
pnpm --filter @co-at/approval exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Build approval app**

```bash
pnpm --filter @co-at/approval build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix(approval): resolve build errors"
```

- [ ] **Step 4: Full build check**

```bash
pnpm build
```

Expected: All apps build successfully.
