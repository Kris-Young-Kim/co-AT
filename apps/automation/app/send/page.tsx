import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { SendForm } from '@/components/send/SendForm'

export default async function SendPage() {
  const supabase = createSupabaseAdmin()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, role')
    .in('role', ['admin', 'manager', 'staff'])
    .order('name')

  return (
    <div className="p-8 max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">수동 알림 발송</h1>
        <p className="text-sm text-gray-500 mt-1">특정 직원에게 즉시 알림을 발송합니다.</p>
      </div>
      <SendForm profiles={(profiles ?? []) as { id: string; name: string; role: string }[]} />
    </div>
  )
}
