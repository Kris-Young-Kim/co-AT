import { listReferrers, type ReferrerType } from '@/actions/referrer-actions'
import { REFERRER_TYPE_LABELS } from '@/actions/referrer-constants'
import Link from 'next/link'
import { Plus, Building2, Phone, Mail, Users, TrendingUp } from 'lucide-react'

const TYPE_OPTIONS: { value: ReferrerType | ''; label: string }[] = [
  { value: '', label: '전체 유형' },
  { value: 'hospital',       label: '병원/의원' },
  { value: 'health_center',  label: '보건소' },
  { value: 'welfare_center', label: '복지관' },
  { value: 'school',         label: '학교/특수학교' },
  { value: 'local_gov',      label: '지자체' },
  { value: 'agency',         label: '공단/기관' },
  { value: 'il_center',      label: 'IL센터' },
  { value: 'at_medical',     label: '장애인보건의료센터' },
  { value: 'individual',     label: '개인(자가접수)' },
]

interface Props {
  searchParams: Promise<{ type?: string; q?: string; active?: string }>
}

export default async function ReferrersPage({ searchParams }: Props) {
  const sp = await searchParams
  const selectedType = sp.type as ReferrerType | undefined
  const q = sp.q
  const showInactive = sp.active === 'false'

  const result = await listReferrers({
    type: selectedType,
    q,
    is_active: showInactive ? undefined : true,
  })
  const referrers = result.referrers ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">의뢰처 CRM</h1>
          <p className="text-sm text-gray-500 mt-1">의뢰 기관·담당자·협력 활동 관리</p>
        </div>
        <Link
          href="/referrers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          의뢰처 등록
        </Link>
      </div>

      {/* 필터 */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="기관명 검색..."
          className="px-3 py-2 border rounded-md text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="type"
          defaultValue={selectedType ?? ''}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            name="active"
            value="false"
            defaultChecked={showInactive}
            className="rounded"
          />
          비활성 포함
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
        >
          검색
        </button>
      </form>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-500 mb-1">전체 의뢰처</p>
          <p className="text-2xl font-bold text-gray-900">{referrers.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-500 mb-1">총 의뢰 건수</p>
          <p className="text-2xl font-bold text-blue-600">
            {referrers.reduce((s, r) => s + r.referral_count, 0)}
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-500 mb-1">활성 담당자</p>
          <p className="text-2xl font-bold text-green-600">
            {referrers.reduce((s, r) => s + r.active_contact_count, 0)}
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-500 mb-1">기관 유형 수</p>
          <p className="text-2xl font-bold text-gray-700">
            {new Set(referrers.map((r) => r.type)).size}
          </p>
        </div>
      </div>

      {/* 목록 */}
      {referrers.length === 0 ? (
        <div className="border rounded-lg p-12 text-center bg-white">
          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">등록된 의뢰처가 없습니다.</p>
          <Link
            href="/referrers/new"
            className="mt-4 inline-flex items-center gap-1 text-blue-600 text-sm hover:underline"
          >
            <Plus className="h-4 w-4" />
            첫 번째 의뢰처 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {referrers.map((r) => (
            <Link
              key={r.id}
              href={`/referrers/${r.id}`}
              className="block border rounded-lg p-4 bg-white hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 mt-0.5">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{r.name}</h2>
                      {!r.is_active && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">비활성</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        {REFERRER_TYPE_LABELS[r.type]}
                      </span>
                      {r.address && <span>{r.address}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {r.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </span>
                      )}
                      {r.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {r.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-blue-600 font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      {r.referral_count}
                    </div>
                    <p className="text-xs text-gray-400">의뢰 건수</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <Users className="h-4 w-4" />
                      {r.active_contact_count}
                    </div>
                    <p className="text-xs text-gray-400">담당자</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
