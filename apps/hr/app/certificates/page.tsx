// apps/hr/app/certificates/page.tsx
import type { HrCertificate } from '@co-at/types'
import Link from 'next/link'
import { getCertificates } from '@/actions/certificate-actions'
import { Plus } from 'lucide-react'

type CertWithRelations = HrCertificate & {
  hr_employees?: { name: string }
  issued_by_employee?: { name: string }
}

const CERT_LABELS: Record<string, string> = {
  employment:  '재직증명서',
  career:      '경력증명서',
  salary:      '급여확인서',
  resignation: '퇴직증명서',
}

export default async function CertificatesPage() {
  const certificates = await getCertificates()

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">증명서 발급</h1>
        <Link href="/certificates/new"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          증명서 발급
        </Link>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['직원명', '증명서 종류', '사용 목적', '발급자', '발급일시'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {certificates.map((cert: CertWithRelations) => (
              <tr key={cert.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {cert.hr_employees?.name ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                    {CERT_LABELS[cert.type] ?? cert.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{cert.purpose ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500">
                  {cert.issued_by_employee?.name ?? '-'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(cert.issued_at).toLocaleString('ko-KR')}
                </td>
              </tr>
            ))}
            {certificates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  발급 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
