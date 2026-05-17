# Client Registration Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a two-step client registration workflow (pending → registered) with staff review queue, registration code auto-assignment, and case manager assignment in apps/eval; add portal integration to create pending clients on service application submission.

**Architecture:** Three new columns on `clients` (`status`, `source`, `assigned_staff_id`). All server actions added to monorepo-root `actions/client-actions.ts`. Three new eval pages, two new eval components, two modified eval pages, one sidebar update. `searchClients` filters to `status='registered'` so existing list is unaffected.

**Tech Stack:** Next.js 16 App Router (RSC + Server Actions), Supabase `createClient`, Clerk `clerkClient` for staff list, Tailwind CSS, TypeScript strict

Path aliases in apps/eval: `@/actions/...` → monorepo root `actions/`, `@/eval/...` → `apps/eval/`

---

### Task 1: DB Migration

**Files:**
- Create: `migrations/055_clients_registration_workflow.sql`

- [ ] **Step 1: Write migration file**

```sql
-- migrations/055_clients_registration_workflow.sql
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS guardian_contact TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'registered')),
  ADD COLUMN IF NOT EXISTS assigned_staff_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'staff'
    CHECK (source IN ('portal', 'staff'));

-- All pre-migration clients are already registered
UPDATE clients SET status = 'registered';
```

- [ ] **Step 2: Apply migration**

Use the Supabase MCP tool `apply_migration` with name `055_clients_registration_workflow` and the SQL above, or paste into the Supabase SQL editor.

- [ ] **Step 3: Verify**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('status', 'source', 'assigned_staff_id', 'gender', 'guardian_contact');
```
Expected: 5 rows.

- [ ] **Step 4: Commit**

```bash
git add migrations/055_clients_registration_workflow.sql
git commit -m "feat(db): add client registration workflow columns"
```

---

### Task 2: Regenerate TypeScript DB Types

**Files:**
- Modify: `types/database.types.ts`

- [ ] **Step 1: Regenerate**

```bash
pnpm gen:types
```

- [ ] **Step 2: Verify**

In `types/database.types.ts`, confirm `clients` Row type now includes `status: string`, `source: string`, `assigned_staff_id: string | null`, `gender: string | null`, `guardian_contact: string | null`.

- [ ] **Step 3: Commit**

```bash
git add types/database.types.ts
git commit -m "chore(types): regenerate DB types after migration 055"
```

---

### Task 3: Extend client-actions.ts

**Files:**
- Modify: `actions/client-actions.ts`

- [ ] **Step 1: Add clerkClient import**

After the existing imports at the top of `actions/client-actions.ts`, add:

```typescript
import { clerkClient } from '@clerk/nextjs/server'
```

- [ ] **Step 2: Add new interfaces**

After `ClientHistoryItem` interface (after line 29), add:

```typescript
export interface CreatePendingClientInput {
  name: string
  birth_date?: string | null
  gender?: string | null
  contact?: string | null
  guardian_contact?: string | null
  disability_type?: string | null
}

export interface StaffMember {
  id: string
  fullName: string | null
  email: string | null
}
```

- [ ] **Step 3: Filter searchClients to registered only**

In `searchClients`, change the initial query builder (around line 49–51):

```typescript
    // Before
    let queryBuilder = supabase
      .from("clients")
      .select("*", { count: "exact" })

    // After
    let queryBuilder = supabase
      .from("clients")
      .select("*", { count: "exact" })
      .eq("status", "registered")
```

- [ ] **Step 4: Append new functions at the end of the file**

Add all the following after `getClientHistory`:

```typescript
export async function getPendingCount(): Promise<number> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return 0
    const supabase = await createClient()
    const { count } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
    return count ?? 0
  } catch {
    return 0
  }
}

export async function getPendingClients(): Promise<{
  success: boolean
  clients?: Client[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("getPendingClients:", error)
      return { success: false, error: "조회에 실패했습니다" }
    }
    return { success: true, clients: (data ?? []) as Client[] }
  } catch (error) {
    console.error("Unexpected error in getPendingClients:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function createPendingClient(
  input: CreatePendingClientInput
): Promise<{ success: boolean; client?: Client; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .insert({
        name: input.name,
        birth_date: input.birth_date ?? null,
        gender: input.gender ?? null,
        contact: input.contact ?? null,
        guardian_contact: input.guardian_contact ?? null,
        disability_type: input.disability_type ?? null,
        status: "pending",
        source: "staff",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      console.error("createPendingClient:", error)
      return { success: false, error: "등록에 실패했습니다: " + error.message }
    }
    return { success: true, client: data as Client }
  } catch (error) {
    console.error("Unexpected error in createPendingClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getNextRegistrationCode(): Promise<string> {
  const supabase = await createClient()
  const year = new Date().getFullYear()
  const { data } = await supabase
    .from("clients")
    .select("registration_number")
    .like("registration_number", `GW${year}%`)
    .order("registration_number", { ascending: false })
    .limit(1)
  const last = data?.[0]?.registration_number ?? null
  const seq = last ? Number(last.slice(6)) + 1 : 1
  return `GW${year}${String(seq).padStart(4, "0")}`
}

export async function registerClient(
  clientId: string,
  assignedStaffId: string
): Promise<{ success: boolean; client?: Client; registrationNumber?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }
    const supabase = await createClient()
    const registrationNumber = await getNextRegistrationCode()
    const { data, error } = await supabase
      .from("clients")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .update({
        status: "registered",
        registration_number: registrationNumber,
        assigned_staff_id: assignedStaffId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single()
    if (error) {
      console.error("registerClient:", error)
      return { success: false, error: "등록 처리에 실패했습니다" }
    }
    return { success: true, client: data as Client, registrationNumber }
  } catch (error) {
    console.error("Unexpected error in registerClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return []
    const clerk = await clerkClient()
    const response = await clerk.users.getUserList({ limit: 200 })
    return response.data.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.emailAddresses[0]?.emailAddress ?? null,
    }))
  } catch {
    return []
  }
}
```

- [ ] **Step 5: Type-check**

```bash
pnpm --filter eval exec tsc --noEmit
```
Expected: No new errors.

- [ ] **Step 6: Commit**

```bash
git add actions/client-actions.ts
git commit -m "feat(clients): add pending workflow server actions"
```

---

### Task 4: PendingClientTable + /clients/pending page

**Files:**
- Create: `apps/eval/components/eval/PendingClientTable.tsx`
- Create: `apps/eval/app/clients/pending/page.tsx`

- [ ] **Step 1: Create PendingClientTable component**

Create `apps/eval/components/eval/PendingClientTable.tsx`:

```tsx
import Link from 'next/link'
import type { Client } from '@/actions/client-actions'

interface PendingClientTableProps {
  clients: Client[]
}

const SOURCE_LABELS: Record<string, string> = {
  portal: '포털신청',
  staff: '직원입력',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function PendingClientTable({ clients }: PendingClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">대기 중인 접수가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">이름</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">생년월일</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">연락처</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">출처</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">접수일</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {clients.map(client => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{client.name}</td>
              <td className="px-4 py-3 text-gray-600">{client.birth_date ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{client.contact ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  client.source === 'portal'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {SOURCE_LABELS[client.source ?? 'staff'] ?? '직원입력'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {client.created_at ? formatDate(client.created_at) : '—'}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/clients/${client.id}/register`}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  등록 처리
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create /clients/pending page**

Create `apps/eval/app/clients/pending/page.tsx`:

```tsx
import { getPendingClients } from '@/actions/client-actions'
import { PendingClientTable } from '@/eval/components/eval/PendingClientTable'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

export default async function PendingClientsPage() {
  const result = await getPendingClients()
  const clients = result.success ? result.clients ?? [] : []

  return (
    <div className="p-8">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        클라이언트 목록
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">신규 접수 대기</h1>
          <p className="text-gray-500 text-sm">총 {clients.length}건의 미등록 클라이언트가 있습니다</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          직접 접수
        </Link>
      </div>

      <PendingClientTable clients={clients} />
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm --filter eval exec tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/eval/components/eval/PendingClientTable.tsx apps/eval/app/clients/pending/page.tsx
git commit -m "feat(eval): add pending clients queue page and table"
```

---

### Task 5: PendingClientForm + /clients/new page

**Files:**
- Create: `apps/eval/components/eval/PendingClientForm.tsx`
- Create: `apps/eval/app/clients/new/page.tsx`

- [ ] **Step 1: Create PendingClientForm component**

Create `apps/eval/components/eval/PendingClientForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPendingClient } from '@/actions/client-actions'

const DISABILITY_OPTIONS = [
  { value: 'physical', label: '지체' },
  { value: 'brain_lesion', label: '뇌병변' },
  { value: 'visual', label: '시각' },
  { value: 'hearing', label: '청각' },
  { value: 'language', label: '언어' },
  { value: 'intellectual', label: '지적' },
  { value: 'autism', label: '자폐성' },
  { value: 'mental', label: '정신' },
  { value: 'kidney', label: '신장' },
  { value: 'cardiac', label: '심장' },
  { value: 'respiratory', label: '호흡기' },
  { value: 'liver', label: '간' },
  { value: 'face', label: '안면' },
  { value: 'intestine', label: '장루·요루' },
  { value: 'epilepsy', label: '뇌전증' },
]

export function PendingClientForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    birth_date: '',
    gender: '',
    contact: '',
    guardian_contact: '',
    disability_type: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('이름은 필수 입력 항목입니다')
      return
    }
    setLoading(true)
    setError(null)
    const result = await createPendingClient({
      name: form.name.trim(),
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      contact: form.contact || null,
      guardian_contact: form.guardian_contact || null,
      disability_type: form.disability_type || null,
    })
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? '저장에 실패했습니다')
      return
    }
    router.push('/clients/pending')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="홍길동"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
          <input
            name="birth_date"
            type="date"
            value={form.birth_date}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택</option>
            <option value="male">남</option>
            <option value="female">여</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
        <input
          name="contact"
          value={form.contact}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="010-0000-0000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">보호자 연락처</label>
        <input
          name="guardian_contact"
          value={form.guardian_contact}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="010-0000-0000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">장애유형</label>
        <select
          name="disability_type"
          value={form.disability_type}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택</option>
          {DISABILITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2 px-4 border rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '임시 저장'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create /clients/new page**

Create `apps/eval/app/clients/new/page.tsx`:

```tsx
import { PendingClientForm } from '@/eval/components/eval/PendingClientForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewClientPage() {
  return (
    <div className="p-8">
      <Link href="/clients/pending" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        접수 대기 목록
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">신규 클라이언트 접수</h1>
        <p className="text-gray-500 text-sm mt-1">임시 저장 후 접수 대기 목록에서 정식 등록할 수 있습니다</p>
      </div>
      <PendingClientForm />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/eval/components/eval/PendingClientForm.tsx apps/eval/app/clients/new/page.tsx
git commit -m "feat(eval): add new pending client intake form and page"
```

---

### Task 6: RegisterWizard + /clients/[clientId]/register page

**Files:**
- Create: `apps/eval/components/eval/RegisterWizard.tsx`
- Create: `apps/eval/app/clients/[clientId]/register/page.tsx`

- [ ] **Step 1: Create RegisterWizard component**

Create `apps/eval/components/eval/RegisterWizard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerClient } from '@/actions/client-actions'
import type { Client, StaffMember } from '@/actions/client-actions'

interface RegisterWizardProps {
  client: Client
  nextCode: string
  staffMembers: StaffMember[]
}

export function RegisterWizard({ client, nextCode, staffMembers }: RegisterWizardProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit() {
    if (!assignedStaffId) {
      setError('담당자를 선택해 주세요')
      return
    }
    setLoading(true)
    setError(null)
    const result = await registerClient(client.id, assignedStaffId)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? '등록에 실패했습니다')
      return
    }
    router.push(`/clients/${client.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex items-center gap-2 text-sm ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step > 1 ? 'bg-green-500 text-white' : step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>1</span>
          등록코드 확인
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className={`flex items-center gap-2 text-sm ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>2</span>
          담당자 지정
        </div>
      </div>

      {step === 1 && (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">등록코드 자동 생성</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-blue-600 mb-1">발급 예정 등록코드</p>
            <p className="text-2xl font-bold text-blue-700 font-mono">{nextCode}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            등록 완료 시 위 코드가 자동으로 발급됩니다. 동시 등록 시 실제 코드가 달라질 수 있습니다.
          </p>
          <button
            onClick={() => setStep(2)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            다음
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">담당자 지정</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">담당 직원</label>
            <select
              value={assignedStaffId}
              onChange={e => setAssignedStaffId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">담당자 선택</option>
              {staffMembers.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName ?? staff.email ?? staff.id}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2 px-4 border rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '등록 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create register page**

Create `apps/eval/app/clients/[clientId]/register/page.tsx`:

```tsx
import { getClientById, getNextRegistrationCode, getStaffMembers } from '@/actions/client-actions'
import { RegisterWizard } from '@/eval/components/eval/RegisterWizard'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface RegisterPageProps {
  params: Promise<{ clientId: string }>
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { clientId } = await params

  const [clientResult, nextCode, staffMembers] = await Promise.all([
    getClientById(clientId),
    getNextRegistrationCode(),
    getStaffMembers(),
  ])

  if (!clientResult.success || !clientResult.client) notFound()
  const client = clientResult.client

  if (client.status !== 'pending') {
    redirect(`/clients/${clientId}`)
  }

  return (
    <div className="p-8">
      <Link href="/clients/pending" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        접수 대기 목록
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">등록 처리</h1>
        <p className="text-gray-500 text-sm mt-1">
          {client.name}
          {client.birth_date ? ` · ${client.birth_date}` : ''}
        </p>
      </div>

      <RegisterWizard
        client={client}
        nextCode={nextCode}
        staffMembers={staffMembers}
      />
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm --filter eval exec tsc --noEmit
```
Expected: No errors. If `client.status` has type error, verify Task 2 (pnpm gen:types) completed.

- [ ] **Step 4: Commit**

```bash
git add apps/eval/components/eval/RegisterWizard.tsx apps/eval/app/clients/[clientId]/register/page.tsx
git commit -m "feat(eval): add registration wizard (2-step: code preview + staff assignment)"
```

---

### Task 7: Modify /clients page (pending banner)

**Files:**
- Modify: `apps/eval/app/clients/page.tsx`

- [ ] **Step 1: Update imports and fetch pending count**

Replace the entire contents of `apps/eval/app/clients/page.tsx`:

```tsx
import { searchClients, getPendingCount } from '@/actions/client-actions'
import { ClientSearchBar } from '@/eval/components/eval/ClientSearchBar'
import { ClientListTable } from '@/eval/components/eval/ClientListTable'
import { Suspense } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface ClientsPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { q } = await searchParams
  const [result, pendingCount] = await Promise.all([
    searchClients({ query: q, limit: 30 }),
    getPendingCount(),
  ])
  const clients = result.success ? result.clients ?? [] : []
  const total = result.success ? result.total ?? 0 : 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">클라이언트</h1>
        <p className="text-gray-500 text-sm">이름 또는 생년월일로 검색하세요</p>
      </div>

      {pendingCount > 0 && (
        <Link
          href="/clients/pending"
          className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800 font-medium">
            신규 접수 대기 {pendingCount}건 — 등록 처리가 필요합니다
          </span>
        </Link>
      )}

      <div className="mb-6">
        <Suspense>
          <ClientSearchBar />
        </Suspense>
      </div>

      <ClientListTable clients={clients} total={total} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/eval/app/clients/page.tsx
git commit -m "feat(eval): add pending clients banner to client list page"
```

---

### Task 8: Modify /clients/[clientId] page (pending warning)

**Files:**
- Modify: `apps/eval/app/clients/[clientId]/page.tsx`

- [ ] **Step 1: Add pending warning banner**

Replace the entire contents of `apps/eval/app/clients/[clientId]/page.tsx`:

```tsx
import { getClientById } from '@/actions/client-actions'
import { getApplicationsByClientId } from '@/actions/application-actions'
import { ApplicationListCard } from '@/eval/components/eval/ApplicationListCard'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params

  const [clientResult, appsResult] = await Promise.all([
    getClientById(clientId),
    getApplicationsByClientId(clientId),
  ])

  if (!clientResult.success || !clientResult.client) notFound()

  const client = clientResult.client
  const applications = appsResult.success ? appsResult.applications ?? [] : []

  return (
    <div className="p-8">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {client.status === 'pending' && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-orange-50 border border-orange-200">
          <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">미등록 클라이언트</p>
            <p className="text-sm text-orange-700">등록 처리 후 정보 수정 및 서비스 신청이 가능합니다</p>
          </div>
          <Link
            href={`/clients/${clientId}/register`}
            className="px-3 py-1.5 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 whitespace-nowrap"
          >
            등록 처리
          </Link>
        </div>
      )}

      <div className="border rounded-lg p-6 mb-8 bg-white">
        <h1 className="text-xl font-bold text-gray-900 mb-4">{client.name}</h1>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">생년월일</dt>
            <dd className="font-medium mt-0.5">{client.birth_date ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">연락처</dt>
            <dd className="font-medium mt-0.5">{client.contact ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">장애유형</dt>
            <dd className="font-medium mt-0.5">{client.disability_type ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">등록일</dt>
            <dd className="font-medium mt-0.5">
              {client.created_at ? new Date(client.created_at).toLocaleDateString('ko-KR') : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          신청서 ({applications.length}건)
        </h2>
        <ApplicationListCard applications={applications} clientId={clientId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/eval/app/clients/[clientId]/page.tsx
git commit -m "feat(eval): add pending status warning banner to client detail"
```

---

### Task 9: Update EvalSidebar

**Files:**
- Modify: `apps/eval/components/layout/EvalSidebar.tsx`

- [ ] **Step 1: Add Clock icon import and 신규 접수 대기 nav item**

Replace the contents of `apps/eval/components/layout/EvalSidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, BarChart3, LogOut, Phone, RefreshCw, FileDown, Clock } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

const NAV_ITEMS = [
  { href: '/', label: '대시보드', icon: BarChart3 },
  { href: '/clients', label: '클라이언트', icon: Users },
  { href: '/clients/pending', label: '신규 접수 대기', icon: Clock },
  { href: '/call-logs', label: '콜센터 상담', icon: Phone },
  { href: '/migration', label: 'Sheets 동기화', icon: RefreshCw },
  { href: '/reports', label: '보고서 출력', icon: FileDown },
] as const

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/clients') {
    return pathname === '/clients' || (pathname.startsWith('/clients/') && !pathname.startsWith('/clients/pending'))
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export function EvalSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <aside className="flex flex-col w-56 min-h-screen border-r bg-white px-3 py-4">
      <div className="mb-6 px-2">
        <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          GWATC 평가툴
        </h1>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive(pathname, href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ redirectUrl: '/sign-in' })}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        로그아웃
      </button>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/eval/components/layout/EvalSidebar.tsx
git commit -m "feat(eval): add 신규 접수 대기 to sidebar navigation"
```

---

### Task 10: Web portal integration

**Files:**
- Modify: `actions/application-actions.ts`

- [ ] **Step 1: Read existing createApplication function**

Open `actions/application-actions.ts` and find the existing function that creates an application (likely `createApplication` or `submitApplication`). Note the exact fields it inserts into `applications` table.

- [ ] **Step 2: Add createApplicationWithPendingClient function**

At the end of `actions/application-actions.ts`, add:

```typescript
export interface CreateApplicationWithPendingClientInput {
  // Client info from portal
  name: string
  birth_date?: string | null
  contact?: string | null
  // Application info
  category: string
  sub_category?: string | null
  memo?: string | null
}

export async function createApplicationWithPendingClient(
  input: CreateApplicationWithPendingClientInput
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Create pending client (source = portal)
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .insert({
        name: input.name,
        birth_date: input.birth_date ?? null,
        contact: input.contact ?? null,
        status: "pending",
        source: "portal",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (clientError) {
      console.error("createApplicationWithPendingClient (client):", clientError)
      return { success: false, error: "클라이언트 생성에 실패했습니다" }
    }

    const clientId = (clientData as { id: string }).id

    // 2. Create application linked to the pending client
    const { data: appData, error: appError } = await supabase
      .from("applications")
      .insert({
        client_id: clientId,
        category: input.category,
        sub_category: input.sub_category ?? null,
        memo: input.memo ?? null,
        status: "submitted",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (appError) {
      console.error("createApplicationWithPendingClient (application):", appError)
      return { success: false, error: "신청서 생성에 실패했습니다" }
    }

    return { success: true, applicationId: (appData as { id: string }).id }
  } catch (error) {
    console.error("Unexpected error in createApplicationWithPendingClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
```

Note: Adjust the `applications` insert fields to match the existing schema (check the applications table columns in the existing `createApplication` function).

- [ ] **Step 3: Wire into web portal application wizard**

Find the page in `apps/web` where the service application wizard completes (likely `apps/web/app/apply/` or similar). Replace the current client-lookup + application-create flow with `createApplicationWithPendingClient`.

This step requires reading the web portal's application submission page to identify the exact call site.

- [ ] **Step 4: Commit**

```bash
git add actions/application-actions.ts
git commit -m "feat(portal): add createApplicationWithPendingClient for portal submissions"
```

---

## Verification Checklist

After all tasks complete, verify end-to-end in browser:

- [ ] `/clients` shows only registered clients; amber banner appears if pending count > 0
- [ ] Clicking banner → `/clients/pending` shows pending table
- [ ] Sidebar "신규 접수 대기" highlights correctly, does not conflict with "클라이언트"
- [ ] `/clients/new` form saves pending client → appears in pending list
- [ ] `/clients/[id]/register` wizard Step 1 shows expected code, Step 2 assigns staff
- [ ] After registration: client moves to `/clients` list with registration code
- [ ] `/clients/[id]` for pending client shows orange warning banner with "등록 처리" button
- [ ] `/clients/[id]` for registered client shows no warning banner
