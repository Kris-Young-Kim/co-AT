# Eval 대상자·서비스 입력 흐름 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** eval 앱에서 신규 대상자는 상담기록지에서 바로 접수하고, 기존 대상자는 클라이언트 상세 페이지에서 서비스를 바로 등록할 수 있도록 입력 경로를 재정비한다.

**Architecture:**
- `ClientSearchInline` 컴포넌트 신규 생성 — 어디서나 재사용 가능한 대상자 검색 콤보박스
- `/call-logs/new` 상단에 대상자 검색 통합 — 신규이면 pending client 생성 후 콜로그 저장
- `/service-records/new` 독립 라우트 신설 — `applicationId` 없이도 서비스 기록 생성 가능
- `ServiceRecordForm.applicationId` optional 처리 + 서비스 날짜 기본값 오늘

**Tech Stack:** Next.js App Router (Server + Client Components), Server Actions (`searchClients`, `createPendingClient`, `createCallLog`, `createServiceRecord`), Tailwind CSS

---

## 파일 목록

| 상태 | 파일 | 역할 |
|------|------|------|
| CREATE | `apps/eval/components/eval/ClientSearchInline.tsx` | 대상자 검색 콤보박스 (재사용) |
| MODIFY | `apps/eval/components/eval/CallLogNewWithStt.tsx` | 상단에 ClientSearchInline 통합 |
| MODIFY | `apps/eval/app/clients/[clientId]/page.tsx` | "새 서비스 등록" 버튼 추가 |
| CREATE | `apps/eval/app/service-records/new/page.tsx` | 독립 서비스 기록 입력 라우트 |
| CREATE | `apps/eval/components/eval/ServiceRecordNewWrapper.tsx` | 서비스 신규 입력 래퍼 (client 컴포넌트) |
| MODIFY | `apps/eval/components/eval/ServiceRecordForm.tsx` | applicationId optional, 날짜 기본값 오늘 |
| MODIFY | `apps/eval/app/service-records/page.tsx` | "+ 서비스 등록" 버튼 추가 |

---

## Task 1: `ClientSearchInline` 컴포넌트 생성

**Files:**
- Create: `apps/eval/components/eval/ClientSearchInline.tsx`

대상자 이름을 타이핑하면 드롭다운으로 검색 결과를 보여주고, 기존 대상자 선택 또는 "신규 대상자" 선택을 emit하는 컴포넌트.

- [ ] **Step 1: 파일 생성**

```tsx
// apps/eval/components/eval/ClientSearchInline.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { searchClients } from '@/actions/client-actions'
import type { ClientWithStats } from '@/actions/client-actions'

interface ClientSearchInlineProps {
  onSelectExisting: (client: ClientWithStats) => void
  onSelectNew: () => void
  onClear?: () => void
  placeholder?: string
}

export function ClientSearchInline({
  onSelectExisting,
  onSelectNew,
  onClear,
  placeholder = '대상자 이름 검색...',
}: ClientSearchInlineProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ClientWithStats | null>(null)
  const [isNew, setIsNew] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    setSelected(null)
    setIsNew(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchClients({ query: value.trim(), limit: 8 })
      setResults(res.clients ?? [])
      setOpen(true)
      setLoading(false)
    }, 300)
  }

  function selectExisting(client: ClientWithStats) {
    setSelected(client)
    setIsNew(false)
    setQuery(client.name)
    setOpen(false)
    onSelectExisting(client)
  }

  function selectNew() {
    setIsNew(true)
    setSelected(null)
    setOpen(false)
    onSelectNew()
  }

  function handleClear() {
    setQuery('')
    setSelected(null)
    setIsNew(false)
    setResults([])
    onClear?.()
  }

  const showBadge = selected !== null || isNew

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={showBadge ? '' : query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={showBadge ? '' : placeholder}
          className="w-full pl-9 pr-9 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={showBadge}
        />
        {showBadge && (
          <div className="absolute left-9 flex items-center gap-1.5 pointer-events-none">
            {selected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                {selected.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium">
                <UserPlus className="w-3 h-3" />
                신규 대상자
              </span>
            )}
          </div>
        )}
        {showBadge && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && !showBadge && (
          <span className="absolute right-3 inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg max-h-56 overflow-auto text-sm">
          {results.map(client => (
            <li key={client.id}>
              <button
                type="button"
                onMouseDown={() => selectExisting(client)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-medium">{client.name}</span>
                  <span className="ml-2 text-gray-400 text-xs">
                    {client.birth_date ?? '—'} · {client.disability_type ?? '장애유형 미상'}
                  </span>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{client.application_count ?? 0}건</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onMouseDown={selectNew}
              className="w-full text-left px-4 py-2.5 hover:bg-green-50 flex items-center gap-2 text-green-700 border-t"
            >
              <UserPlus className="w-4 h-4" />
              <span className="font-medium">신규 대상자로 접수</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/eval/components/eval/ClientSearchInline.tsx
git commit -m "feat(eval): add ClientSearchInline combobox component"
```

---

## Task 2: `CallLogNewWithStt` — 대상자 검색 + 신규 접수 통합

**Files:**
- Modify: `apps/eval/components/eval/CallLogNewWithStt.tsx`

상단에 `ClientSearchInline` 추가. 기존 대상자 선택 시 target_* 필드 자동 채우기. 신규 대상자 선택 시 간소화된 기본정보 입력 필드 표시. 저장 시 신규이면 `createPendingClient` 후 `createCallLog` 실행.

- [ ] **Step 1: `CallLogNewWithStt.tsx` 전체 교체**

```tsx
// apps/eval/components/eval/CallLogNewWithStt.tsx
'use client'

import { useState } from 'react'
import { TranscriptPanel } from './TranscriptPanel'
import { CallLogForm } from './CallLogForm'
import { ClientSearchInline } from './ClientSearchInline'
import { createCallLog } from '@/actions/call-log-actions'
import { createPendingClient } from '@/actions/client-actions'
import type { CallLog, CreateCallLogInput } from '@/actions/call-log-actions'
import type { CallLogDraftFromTranscript } from '@/actions/ai-actions'
import type { ClientWithStats } from '@/actions/client-actions'

interface CallLogNewWithSttProps {
  defaultDate: string
}

interface NewClientFields {
  name: string
  birth_date: string
  contact: string
  disability_type: string
  disability_severity: string
}

const INPUT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const SELECT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export function CallLogNewWithStt({ defaultDate }: CallLogNewWithSttProps) {
  const [draftValues, setDraftValues] = useState<Partial<CallLog>>({})
  const [showTranscript, setShowTranscript] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const [isNewClient, setIsNewClient] = useState(false)
  const [newClient, setNewClient] = useState<NewClientFields>({
    name: '', birth_date: '', contact: '', disability_type: '', disability_severity: '',
  })
  const [clientError, setClientError] = useState<string | null>(null)

  const handleCallLogDraft = (draft: CallLogDraftFromTranscript) => {
    setDraftValues({
      question_content: draft.question_content,
      answer: draft.answer,
      requester_type: draft.requester_type,
      q_public_benefit: draft.q_public_benefit,
      q_private_benefit: draft.q_private_benefit,
      q_device: draft.q_device,
      q_case_management: draft.q_case_management,
      q_other: draft.q_other,
    })
    setHasDraft(true)
    setShowTranscript(false)
  }

  function handleSelectExisting(client: ClientWithStats) {
    setSelectedClient(client)
    setIsNewClient(false)
    setDraftValues(prev => ({
      ...prev,
      target_name: client.name,
      target_disability_type: client.disability_type ?? undefined,
      target_disability_severity: undefined,
      target_economic_status: client.economic_status ?? undefined,
      target_gender: client.gender ?? undefined,
    }))
  }

  function handleSelectNew() {
    setSelectedClient(null)
    setIsNewClient(true)
    setNewClient({ name: '', birth_date: '', contact: '', disability_type: '', disability_severity: '' })
  }

  function handleClearClient() {
    setSelectedClient(null)
    setIsNewClient(false)
    setDraftValues(prev => ({
      ...prev,
      target_name: undefined,
      target_disability_type: undefined,
      target_disability_severity: undefined,
      target_economic_status: undefined,
      target_gender: undefined,
    }))
  }

  async function handleSubmit(data: CreateCallLogInput) {
    setClientError(null)
    if (isNewClient) {
      if (!newClient.name.trim()) {
        setClientError('대상자 성명을 입력해 주세요')
        return { success: false, error: '대상자 성명을 입력해 주세요' }
      }
      const clientResult = await createPendingClient({
        name: newClient.name.trim(),
        birth_date: newClient.birth_date || null,
        contact: newClient.contact || null,
        disability_type: newClient.disability_type || null,
        disability_grade: newClient.disability_severity || null,
      })
      if (!clientResult.success) {
        return { success: false, error: clientResult.error ?? '대상자 생성 실패' }
      }
    }
    return createCallLog({
      ...data,
      target_name: isNewClient ? newClient.name : data.target_name,
      target_disability_type: isNewClient ? newClient.disability_type : data.target_disability_type,
    })
  }

  return (
    <div className="space-y-6">
      {/* 대상자 검색 */}
      <section className="border rounded-lg p-5 bg-white space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">대상자 연결 (선택)</h3>
        <ClientSearchInline
          onSelectExisting={handleSelectExisting}
          onSelectNew={handleSelectNew}
          onClear={handleClearClient}
          placeholder="이름으로 기존 대상자 검색..."
        />

        {isNewClient && (
          <div className="pt-2 space-y-3 border-t">
            <p className="text-xs text-gray-500">기본 정보를 입력하면 대기 접수로 등록됩니다. 상세 정보는 이후 등록 처리 시 추가할 수 있습니다.</p>
            {clientError && <p className="text-sm text-red-600">{clientError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">성명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))}
                  className={INPUT}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label>
                <input
                  type="text"
                  value={newClient.birth_date}
                  onChange={e => setNewClient(p => ({ ...p, birth_date: e.target.value }))}
                  className={INPUT}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
                <input
                  type="text"
                  value={newClient.contact}
                  onChange={e => setNewClient(p => ({ ...p, contact: e.target.value }))}
                  className={INPUT}
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">장애유형</label>
                <input
                  type="text"
                  value={newClient.disability_type}
                  onChange={e => setNewClient(p => ({ ...p, disability_type: e.target.value }))}
                  className={INPUT}
                  placeholder="지체, 뇌병변 등"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">장애정도</label>
                <select
                  value={newClient.disability_severity}
                  onChange={e => setNewClient(p => ({ ...p, disability_severity: e.target.value }))}
                  className={SELECT}
                >
                  <option value="">선택</option>
                  <option value="심한">심한</option>
                  <option value="심하지 않은">심하지 않은</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedClient && (
          <p className="text-xs text-blue-600 pt-1">
            기존 대상자 연결됨 — 대상자 정보가 상담기록지에 자동 입력됩니다.
          </p>
        )}
      </section>

      {/* STT 패널 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50"
        >
          {showTranscript ? '녹취 패널 닫기' : '🎙 STT 녹취 상담'}
        </button>
        {hasDraft && (
          <span className="text-xs text-green-600">
            AI 초안 적용됨 — 아래 폼을 확인 후 저장하세요
          </span>
        )}
      </div>

      {showTranscript && (
        <TranscriptPanel
          sessionDate={defaultDate}
          onCallLogDraft={handleCallLogDraft}
        />
      )}

      <CallLogForm
        key={hasDraft ? 'with-draft' : 'empty'}
        defaultValues={draftValues}
        onSubmit={handleSubmit}
        submitLabel="등록"
      />
    </div>
  )
}
```

- [ ] **Step 2: `createPendingClient` 반환 타입 확인**

`actions/client-actions.ts` 571번 줄에서 `createPendingClient` 시그니처를 확인:

```bash
grep -n "export async function createPendingClient" /d/AILeader1/project/valuewith/co-AT/actions/client-actions.ts
```

반환 타입이 `{ success: boolean; clientId?: string; error?: string }` 형태인지 확인. `client_id`가 아닌 `clientId`인지, 또는 `id`인지 확인 후 위 코드의 `.success` 체크만 사용하므로 문제없음.

- [ ] **Step 3: 커밋**

```bash
git add apps/eval/components/eval/CallLogNewWithStt.tsx
git commit -m "feat(eval): integrate client search into call-log new form"
```

---

## Task 3: `/clients/[id]` — "새 서비스 등록" 버튼 추가

**Files:**
- Modify: `apps/eval/app/clients/[clientId]/page.tsx`

- [ ] **Step 1: 서비스 등록 버튼 추가**

`apps/eval/app/clients/[clientId]/page.tsx`에서 `applications.length` 헤더 바로 오른쪽에 "새 서비스 등록" Link 버튼 추가:

```tsx
// 변경 전 (line 72-73):
<div>
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    신청서 ({applications.length}건)
  </h2>

// 변경 후:
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-gray-900">
    신청서 ({applications.length}건)
  </h2>
  {client.status === 'registered' && (
    <Link
      href={`/service-records/new?clientId=${clientId}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
    >
      <span className="text-base leading-none">+</span>
      새 서비스 등록
    </Link>
  )}
</div>
```

`ApplicationListCard` 위의 `<div>` 구조도 맞게 조정:

```tsx
// 변경 전 (line 76):
<ApplicationListCard applications={applications} clientId={clientId} />

// 변경 후: (그대로 유지, div 닫기 태그만 확인)
<ApplicationListCard applications={applications} clientId={clientId} />
</div>  {/* 이 닫는 태그를 확인 */}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/eval/app/clients/[clientId]/page.tsx
git commit -m "feat(eval): add new-service-record button on client detail page"
```

---

## Task 4: `ServiceRecordForm` — applicationId optional + 날짜 기본값

**Files:**
- Modify: `apps/eval/components/eval/ServiceRecordForm.tsx`

- [ ] **Step 1: Props 인터페이스 수정**

```tsx
// 변경 전 (line 32-37):
interface ServiceRecordFormProps {
  clientId: string
  applicationId: string
  clientData?: ClientData
  redirectTo: string
}

// 변경 후:
interface ServiceRecordFormProps {
  clientId: string
  applicationId: string | null
  clientData?: ClientData
  redirectTo: string
}
```

- [ ] **Step 2: AI 초안 섹션 — applicationId null 시 숨김**

`ServiceRecordForm` 내 AI 초안 섹션을 조건부 렌더링으로 변경:

```tsx
// 변경 전 (line 251):
{/* AI 초안 */}
<section className="border rounded-lg p-6 bg-white space-y-3">

// 변경 후:
{applicationId && (
<section className="border rounded-lg p-6 bg-white space-y-3">
  <h3 className="font-semibold text-gray-900">AI 초안 생성</h3>
  {/* ... AI 초안 내용 전부 ... */}
</section>
)}
```

- [ ] **Step 3: 날짜 기본값 추가**

서비스 내용 섹션의 날짜 필드에 `defaultValue` 추가 (line 427-430):

```tsx
// 변경 전:
<div><label ...>상담일</label><input name="consultation_date" type="date" className={INPUT} /></div>
<div><label ...>실적일</label><input name="performance_date" type="date" className={INPUT} /></div>

// 변경 후:
<div>
  <label className="block text-xs font-medium text-gray-600 mb-1">상담일</label>
  <input name="consultation_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className={INPUT} />
</div>
<div>
  <label className="block text-xs font-medium text-gray-600 mb-1">실적일 <span className="text-gray-400 text-xs font-normal">(오늘 자동)</span></label>
  <input name="performance_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className={INPUT} />
</div>
```

- [ ] **Step 4: handleAiGenerate — applicationId null 가드**

```tsx
// 변경 전 (line 126):
const result = await generateServiceRecordDraft({ applicationId, clientId, memo: memo || undefined })

// 변경 후:
if (!applicationId) return
const result = await generateServiceRecordDraft({ applicationId, clientId, memo: memo || undefined })
```

- [ ] **Step 5: 커밋**

```bash
git add apps/eval/components/eval/ServiceRecordForm.tsx
git commit -m "feat(eval): make applicationId optional in ServiceRecordForm, add date defaults"
```

---

## Task 5: `ServiceRecordNewWrapper` 컴포넌트 생성

**Files:**
- Create: `apps/eval/components/eval/ServiceRecordNewWrapper.tsx`

클라이언트 컴포넌트. clientId가 없으면 `ClientSearchInline`으로 대상자를 선택하고, 선택되면 `ServiceRecordForm`을 렌더링.

- [ ] **Step 1: 파일 생성**

```tsx
// apps/eval/components/eval/ServiceRecordNewWrapper.tsx
'use client'

import { useState } from 'react'
import { ClientSearchInline } from './ClientSearchInline'
import { ServiceRecordForm } from './ServiceRecordForm'
import type { ClientWithStats } from '@/actions/client-actions'

interface ServiceRecordNewWrapperProps {
  initialClientId?: string
  initialClientData?: {
    name: string
    birth_date: string | null
    gender: string | null
    disability_type: string | null
    disability_severity: string | null
    economic_status: string | null
    region: string | null
    contact: string | null
  }
}

export function ServiceRecordNewWrapper({
  initialClientId,
  initialClientData,
}: ServiceRecordNewWrapperProps) {
  const [clientId, setClientId] = useState<string | null>(initialClientId ?? null)
  const [clientData, setClientData] = useState(initialClientData ?? null)

  function handleSelectExisting(client: ClientWithStats) {
    setClientId(client.id)
    setClientData({
      name: client.name,
      birth_date: client.birth_date ?? null,
      gender: client.gender ?? null,
      disability_type: client.disability_type ?? null,
      disability_severity: null,
      economic_status: client.economic_status ?? null,
      region: null,
      contact: client.contact ?? null,
    })
  }

  function handleClear() {
    setClientId(null)
    setClientData(null)
  }

  if (!clientId || !clientData) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-5 bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">대상자 선택</h3>
          <ClientSearchInline
            onSelectExisting={handleSelectExisting}
            onSelectNew={() => {}}
            onClear={handleClear}
            placeholder="대상자 이름으로 검색..."
          />
          <p className="text-xs text-gray-400 mt-2">기존 대상자를 선택해 주세요. 신규 대상자는 먼저 대상자 접수를 진행해 주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-blue-50 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-blue-900">{clientData.name}</span>
          <span className="ml-2 text-xs text-blue-600">
            {clientData.birth_date ?? '—'} · {clientData.disability_type ?? '장애유형 미상'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-blue-500 hover:text-blue-700 underline"
        >
          변경
        </button>
      </div>
      <ServiceRecordForm
        key={clientId}
        clientId={clientId}
        applicationId={null}
        clientData={clientData}
        redirectTo="/service-records"
      />
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/eval/components/eval/ServiceRecordNewWrapper.tsx
git commit -m "feat(eval): add ServiceRecordNewWrapper with client search"
```

---

## Task 6: `/service-records/new` 라우트 생성

**Files:**
- Create: `apps/eval/app/service-records/new/page.tsx`

- [ ] **Step 1: 페이지 파일 생성**

```tsx
// apps/eval/app/service-records/new/page.tsx
import { getClientById } from '@/actions/client-actions'
import { ServiceRecordNewWrapper } from '@/eval/components/eval/ServiceRecordNewWrapper'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  searchParams: Promise<{ clientId?: string }>
}

export default async function ServiceRecordNewPage({ searchParams }: Props) {
  const { clientId } = await searchParams

  let initialClientId: string | undefined
  let initialClientData: {
    name: string; birth_date: string | null; gender: string | null
    disability_type: string | null; disability_severity: string | null
    economic_status: string | null; region: string | null; contact: string | null
  } | undefined

  if (clientId) {
    const result = await getClientById(clientId)
    if (result.success && result.client) {
      const c = result.client
      initialClientId = c.id
      initialClientData = {
        name: c.name,
        birth_date: c.birth_date ?? null,
        gender: c.gender ?? null,
        disability_type: c.disability_type ?? null,
        disability_severity: c.disability_grade ?? null,
        economic_status: c.economic_status ?? null,
        region: c.city ?? null,
        contact: c.contact ?? null,
      }
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={clientId ? `/clients/${clientId}` : '/service-records'}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">서비스 기록 등록</h1>
      </div>
      <ServiceRecordNewWrapper
        initialClientId={initialClientId}
        initialClientData={initialClientData}
      />
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/eval/app/service-records/new/page.tsx
git commit -m "feat(eval): add standalone /service-records/new route"
```

---

## Task 7: `/service-records` 목록 — "+ 서비스 등록" 버튼 추가

**Files:**
- Modify: `apps/eval/app/service-records/page.tsx`

- [ ] **Step 1: 헤더에 등록 버튼 추가**

```tsx
// 변경 전 (line 43-53):
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">서비스 기록</h1>
    <p className="text-sm text-gray-500 mt-1">총 {records.length}건</p>
  </div>
  <DownloadReportButton ... />
</div>

// 변경 후:
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">서비스 기록</h1>
    <p className="text-sm text-gray-500 mt-1">총 {records.length}건</p>
  </div>
  <div className="flex items-center gap-3">
    <Link
      href="/service-records/new"
      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
    >
      <span className="text-base leading-none">+</span>
      서비스 등록
    </Link>
    <DownloadReportButton ... />
  </div>
</div>
```

파일 상단에 `import Link from 'next/link'` 추가 (이미 있으면 스킵).

- [ ] **Step 2: 커밋**

```bash
git add apps/eval/app/service-records/page.tsx
git commit -m "feat(eval): add service-record new button on list page"
```

---

## Task 8: 빌드 검증 & 최종 확인

- [ ] **Step 1: 타입 체크**

```bash
cd D:/AILeader1/project/valuewith/co-AT
pnpm --filter @co-at/eval typecheck 2>&1 | head -50
```

또는:
```bash
pnpm --filter @co-at/eval build 2>&1 | head -80
```

- [ ] **Step 2: `createPendingClient` 시그니처 재확인**

```bash
grep -A 10 "export async function createPendingClient" /d/AILeader1/project/valuewith/co-AT/actions/client-actions.ts
```

`disability_grade` 파라미터가 `CreatePendingClientInput`에 있는지 확인. 없으면 Task 2의 `handleSubmit`에서 `disability_grade` → `disability_severity` 로 교체.

- [ ] **Step 3: `Client` 타입 필드 확인**

`getClientById` 반환 `client.gender`, `client.city`, `client.disability_grade` 필드가 실제 타입에 있는지 확인:

```bash
grep -n "gender\|city\|disability_grade\|contact" /d/AILeader1/project/valuewith/co-AT/actions/client-actions.ts | head -20
```

없는 필드는 Task 6 페이지에서 `null`로 대체.

- [ ] **Step 4: 타입 오류 수정 후 최종 커밋**

```bash
git add -A
git commit -m "fix(eval): resolve type errors in service intake flow"
```

---

## Spec 커버리지 확인

| 요구사항 | 구현 Task |
|----------|-----------|
| 신규 입력이면 상담기록지 정보가 나옴 | Task 2 — CallLogNewWithStt에 대상자 검색 + 신규 시 기본정보 입력 |
| 서비스를 새로 받을 때 따라오는 정보 | Task 5 — ServiceRecordNewWrapper (클라이언트 정보 상단 고정) |
| 새로 받은 서비스 입력 공간 | Task 5, 6 — ServiceRecordForm + /service-records/new 라우트 |
| 서비스 진행 날짜 자동/수동 | Task 4 — performance_date, consultation_date defaultValue 오늘 |
| 대상자 상세에서 서비스 바로 등록 | Task 3 — 클라이언트 상세 "새 서비스 등록" 버튼 |
| 서비스 목록에서 직접 등록 | Task 7 — /service-records 목록 "+ 서비스 등록" 버튼 |
