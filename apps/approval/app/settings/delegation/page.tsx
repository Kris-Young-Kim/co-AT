import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCurrentRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import {
  getMyDelegations,
  createDelegation,
  deactivateDelegation,
} from '@/actions/approval-actions'
import type { DelegationWithNames } from '@co-at/types'
import { revalidatePath } from 'next/cache'

// ── Server Actions ────────────────────────────────────────

async function createAction(formData: FormData) {
  'use server'
  const { userId } = await auth()
  if (!userId) return
  const delegateeClerkId = formData.get('delegateeClerkId') as string
  const startDate        = (formData.get('startDate') as string) || null
  const endDate          = (formData.get('endDate') as string) || null
  const note             = (formData.get('note') as string) || null
  if (!delegateeClerkId) return
  await createDelegation({ delegatorClerkId: userId, delegateeClerkId, startDate, endDate, note })
  revalidatePath('/settings/delegation')
}

async function deactivateAction(formData: FormData) {
  'use server'
  const { userId } = await auth()
  if (!userId) return
  const id = formData.get('id') as string
  if (!id) return
  await deactivateDelegation(id, userId)
  revalidatePath('/settings/delegation')
}

// ── Helpers ───────────────────────────────────────────────

function formatDateRange(d: DelegationWithNames): string {
  if (!d.start_date && !d.end_date) return '상시'
  if (!d.start_date) return `~ ${d.end_date}`
  if (!d.end_date)   return `${d.start_date} ~`
  return `${d.start_date} ~ ${d.end_date}`
}

// ── Page ──────────────────────────────────────────────────

export default async function DelegationPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getCurrentRole()
  const isManager = role === ROLES.MANAGER

  const { given, received } = await getMyDelegations(userId)

  let adminUsers: { id: string; name: string }[] = []
  if (isManager) {
    const clerk = await clerkClient()
    const res = await clerk.users.getUserList({ limit: 200 })
    adminUsers = res.data
      .filter(u => (u.publicMetadata as { role?: string }).role === ROLES.ADMIN)
      .map(u => ({
        id:   u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.id,
      }))
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold">위임 결재 관리</h1>

      {/* 내가 위임한 결재 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">내가 위임한 결재</h2>

        {isManager && adminUsers.length > 0 && (
          <form action={createAction} className="bg-white border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">새 위임 추가</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">수임자 *</label>
                <select
                  name="delegateeClerkId"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">선택하세요</option>
                  {adminUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">사유</label>
                <input
                  name="note"
                  type="text"
                  placeholder="예: 출장 6/15~20"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작일 (빈칸=즉시)</label>
                <input name="startDate" type="date" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료일 (빈칸=상시)</label>
                <input name="endDate" type="date" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              위임 추가
            </button>
          </form>
        )}

        {!isManager && (
          <p className="text-sm text-gray-400">MANAGER 역할만 위임을 생성할 수 있습니다.</p>
        )}

        {given.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['수임자', '기간', '사유', '상태', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {given.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.delegatee_name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateRange(d)}</td>
                    <td className="px-4 py-3 text-gray-500">{d.note ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {d.is_active ? '활성' : '해제됨'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.is_active && (
                        <form action={deactivateAction}>
                          <input type="hidden" name="id" value={d.id} />
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:text-red-700 hover:underline"
                          >
                            해제
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">위임한 결재가 없습니다.</p>
        )}
      </section>

      {/* 내가 위임받은 결재 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">내가 위임받은 결재</h2>
        {received.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['위임자', '기간', '사유', '상태'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {received.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.delegator_name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateRange(d)}</td>
                    <td className="px-4 py-3 text-gray-500">{d.note ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {d.is_active ? '활성' : '해제됨'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">위임받은 결재가 없습니다.</p>
        )}
      </section>
    </div>
  )
}
