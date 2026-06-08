export const dynamic = 'force-dynamic'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { QrCode, User } from 'lucide-react'
import Link from 'next/link'

export default async function QrListPage() {
  const supabase = createSupabaseAdmin()
  const { data: employees } = await supabase
    .from('hr_employees')
    .select('id, name, department, position')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <QrCode className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">QR 출퇴근</h1>
      </div>

      <p className="text-sm text-gray-500">
        직원을 선택하면 개인 QR 코드를 볼 수 있습니다. QR코드를 인쇄하여 출입구에 배치하세요.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {(employees ?? []).map((emp: { id: string; name: string; department: string; position: string }) => (
          <Link
            key={emp.id}
            href={`/attendance/qr/${emp.id}`}
            className="flex flex-col items-center gap-2 bg-white border rounded-xl p-4 hover:border-violet-400 hover:shadow-sm transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
              <User className="h-6 w-6 text-violet-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm text-gray-900">{emp.name}</p>
              <p className="text-xs text-gray-500">{emp.department}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-violet-600">
              <QrCode className="h-3 w-3" />
              QR 보기
            </div>
          </Link>
        ))}
        {(employees ?? []).length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-10">등록된 직원이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
