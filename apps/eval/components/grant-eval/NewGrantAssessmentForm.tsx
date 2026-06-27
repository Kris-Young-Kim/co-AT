'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { searchClients } from '@/actions/client-actions'
import { createGrantAssessment } from '@/actions/grant-assessment-actions'
import type { ClientWithStats } from '@/actions/client-actions'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i)

interface InitialClient {
  id: string
  name: string
  birth_date: string | null
  disability_type: string | null
}

interface Props {
  initialClient?: InitialClient | null
}

export function NewGrantAssessmentForm({ initialClient }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Client search state — skip if initialClient provided
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClientWithStats[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | InitialClient | null>(initialClient ?? null)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Form field state
  const [assessmentYear, setAssessmentYear] = useState<number>(CURRENT_YEAR)
  const [referralOrg, setReferralOrg] = useState('')

  // Submit error state
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('검색어를 입력하세요')
      return
    }
    setSearchError(null)
    setIsSearching(true)
    setSearchResults([])
    setSelectedClient(null)

    const result = await searchClients({ query: searchQuery.trim(), limit: 20 })
    setIsSearching(false)

    if (!result.success) {
      setSearchError(result.error ?? '검색에 실패했습니다')
      return
    }

    const clients = result.clients ?? []
    if (clients.length === 0) {
      setSearchError('검색 결과가 없습니다')
    } else {
      setSearchResults(clients)
    }
  }

  const handleSelectClient = (client: ClientWithStats) => {
    setSelectedClient(client)
    setSearchResults([])
    setSearchError(null)
  }

  const handleSubmit = () => {
    if (!selectedClient) {
      setSubmitError('대상자를 선택하세요')
      return
    }
    setSubmitError(null)

    startTransition(async () => {
      const result = await createGrantAssessment({
        client_id: selectedClient.id,
        assessment_year: assessmentYear,
        referral_org: referralOrg.trim() || null,
      })

      if (!result.success || !result.id) {
        setSubmitError(result.error ?? '평가 생성에 실패했습니다')
        return
      }

      router.push(`/grant-eval/${result.id}?tab=basic`)
    })
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Client — preselected or search */}
      {initialClient ? (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <svg className="h-4 w-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">{initialClient.name}</p>
            <p className="text-xs text-blue-600">
              {[initialClient.birth_date, initialClient.disability_type].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      ) : (
        <section className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">대상자 검색</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="이름 또는 생년월일(YYYY-MM-DD)"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSearching || isPending}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? '검색 중…' : '검색'}
            </button>
          </div>

          {searchError && <p className="text-sm text-red-600">{searchError}</p>}

          {searchResults.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
              {searchResults.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <span className="font-medium text-gray-900">{client.name}</span>
                    {client.birth_date && <span className="ml-2 text-gray-500">{client.birth_date}</span>}
                    {client.disability_type && <span className="ml-2 text-gray-400 text-xs">{client.disability_type}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedClient && (
            <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm">
              <svg className="h-4 w-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-blue-800">{selectedClient.name}</span>
              {selectedClient.birth_date && <span className="text-blue-600">{selectedClient.birth_date}</span>}
              <button
                type="button"
                onClick={() => { setSelectedClient(null); setSearchQuery('') }}
                className="ml-auto text-blue-400 hover:text-blue-600 text-xs"
              >
                변경
              </button>
            </div>
          )}
        </section>
      )}

      {/* Assessment year */}
      <section className="space-y-2">
        <label htmlFor="assessment-year" className="block text-sm font-medium text-gray-700">
          평가 연도
        </label>
        <select
          id="assessment-year"
          value={assessmentYear}
          onChange={(e) => setAssessmentYear(Number(e.target.value))}
          disabled={isPending}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </select>
      </section>

      {/* Referral org */}
      <section className="space-y-2">
        <label htmlFor="referral-org" className="block text-sm font-medium text-gray-700">
          의뢰기관 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <input
          id="referral-org"
          type="text"
          value={referralOrg}
          onChange={(e) => setReferralOrg(e.target.value)}
          placeholder="의뢰기관명을 입력하세요"
          disabled={isPending}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      {/* Submit error */}
      {submitError && (
        <p className="text-sm text-red-600">{submitError}</p>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !selectedClient}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? '등록 중…' : '평가 시작'}
      </button>
    </div>
  )
}
