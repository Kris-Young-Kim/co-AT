import { getConsultationRecordsByClient } from '@/actions/case-record-actions'
import { getClientById } from '@/actions/client-actions'
import { ConsultationPrintView } from '@/eval/components/print/ConsultationPrintView'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { ConsultationHwpDownloadButton } from '@/eval/components/print/ConsultationHwpDownloadButton'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function ConsultationClientPrintPage({ params }: Props) {
  const { clientId } = await params

  const [clientResult, recordsResult] = await Promise.all([
    getClientById(clientId),
    getConsultationRecordsByClient(clientId),
  ])

  if (!clientResult.success || !clientResult.client) notFound()
  if (!recordsResult.success || !recordsResult.records?.length) notFound()

  const records = [...recordsResult.records].sort(
    (a, b) => a.consultation_date.localeCompare(b.consultation_date)
  )

  return (
    <>
      <div className="fixed top-4 right-4 flex gap-2 no-print z-10">
        <ConsultationHwpDownloadButton clientId={clientId} label="전체 HWP 다운로드" />
        <PrintButton />
      </div>
      <ConsultationPrintView records={records} client={clientResult.client} />
    </>
  )
}
