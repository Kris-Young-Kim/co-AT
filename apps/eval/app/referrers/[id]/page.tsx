import {
  getReferrerById, getContactsByReferrer, getActivitiesByReferrer,
  getReferrerReferralStats, updateReferrer,
} from '@/actions/referrer-actions'
import { REFERRER_TYPE_LABELS } from '@/actions/referrer-constants'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, ToggleLeft, ToggleRight } from 'lucide-react'
import { ReferrerForm } from '@/eval/components/referrers/ReferrerForm'
import { ReferrerContactsPanel } from '@/eval/components/referrers/ReferrerContactsPanel'
import { ReferrerActivitiesPanel } from '@/eval/components/referrers/ReferrerActivitiesPanel'
import { ReferrerReferralHistory } from '@/eval/components/referrers/ReferrerReferralHistory'
import { revalidatePath } from 'next/cache'

const TABS = [
  { key: 'basic',      label: '기관 정보' },
  { key: 'contacts',   label: '담당자' },
  { key: 'referrals',  label: '의뢰 이력' },
  { key: 'activities', label: '협력 활동' },
] as const

type TabKey = typeof TABS[number]['key']

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ReferrerDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const tab: TabKey = (TABS.find((t) => t.key === sp.tab)?.key ?? 'basic') as TabKey

  const [referrerResult, contactsResult, activitiesResult, statsResult] = await Promise.all([
    getReferrerById(id),
    getContactsByReferrer(id),
    tab === 'activities' ? getActivitiesByReferrer(id) : Promise.resolve({ success: true, activities: [] }),
    tab === 'referrals'  ? getReferrerReferralStats(id)  : Promise.resolve({ success: true, stats: [], pending_count: 0 }),
  ])

  if (!referrerResult.success || !referrerResult.referrer) notFound()
  const referrer = referrerResult.referrer
  const contacts = contactsResult.contacts ?? []
  const activities = activitiesResult.success ? (activitiesResult as any).activities ?? [] : []
  const stats = statsResult.success ? (statsResult as any).stats ?? [] : []
  const pendingCount = statsResult.success ? (statsResult as any).pending_count ?? 0 : 0

  // referral_count from contacts length proxy (actual from stats)
  const referralCount = stats.reduce((s: number, r: any) => s + r.count, 0)

  async function toggleActive() {
    'use server'
    await updateReferrer(id, { is_active: !referrer.is_active })
    revalidatePath(`/referrers/${id}`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/referrers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
        <form action={toggleActive}>
          <button
            type="submit"
            className={[
              'inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors',
              referrer.is_active
                ? 'text-gray-600 hover:bg-gray-50'
                : 'text-green-700 border-green-300 bg-green-50 hover:bg-green-100',
            ].join(' ')}
          >
            {referrer.is_active
              ? <><ToggleRight className="h-4 w-4 text-green-500" /> 활성</>
              : <><ToggleLeft className="h-4 w-4 text-gray-400" /> 비활성 (복구)</>
            }
          </button>
        </form>
      </div>

      {/* 헤더 */}
      <div className="border rounded-lg p-5 mb-6 bg-white">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{referrer.name}</h1>
              {!referrer.is_active && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">비활성</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                {REFERRER_TYPE_LABELS[referrer.type]}
              </span>
              {referrer.address && <span>{referrer.address}</span>}
              {referrer.phone && <span>{referrer.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/referrers/${id}?tab=${t.key}`}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t.label}
            {t.key === 'contacts' && contacts.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                {contacts.filter((c) => c.is_active).length}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'basic' && (
        <div className="max-w-2xl">
          <div className="border rounded-lg p-6 bg-white">
            <ReferrerForm mode="edit" defaultValues={referrer} />
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className="max-w-2xl">
          <ReferrerContactsPanel referrerId={id} initialContacts={contacts} />
        </div>
      )}

      {tab === 'referrals' && (
        <div className="max-w-2xl">
          <ReferrerReferralHistory
            stats={stats}
            pendingCount={pendingCount}
            referralCount={referralCount}
          />
        </div>
      )}

      {tab === 'activities' && (
        <div className="max-w-2xl">
          <ReferrerActivitiesPanel referrerId={id} initialActivities={activities} />
        </div>
      )}
    </div>
  )
}
