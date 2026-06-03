export const dynamic = 'force-dynamic'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { PayItemsManager } from '@/components/salary/PayItemsManager'
import { PiggyBank } from 'lucide-react'

type PayItem = {
  id: string; name: string; type: 'pay' | 'deduction'
  is_statutory: boolean; rate: number | null; fixed_amount: number | null; is_active: boolean
}

export default async function PayItemsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseAdmin() as any
  const { data } = await supabase.from('hr_pay_items').select('*').order('type').order('name')
  const items: PayItem[] = data ?? []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <PiggyBank className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">지급공제항목 등록</h1>
      </div>
      <PayItemsManager initialItems={items} />
    </div>
  )
}
