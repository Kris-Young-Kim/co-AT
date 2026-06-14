import { getConsultationRecordById } from '@/actions/case-record-actions'
import { getClientById } from '@/actions/client-actions'
import { ConsultationPrintView } from '@/eval/components/print/ConsultationPrintView'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { ConsultationHwpDownloadButton } from '@/eval/components/print/ConsultationHwpDownloadButton'
import { PdfDownloadButton } from '@/eval/components/print/PdfDownloadButton'
import { generateConsultationPdf } from '@/eval/actions/pdf-actions'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ recordId: string }>
}

export default async function ConsultationPrintPage({ params }: Props) {
  const { recordId } = await params

  const recordResult = await getConsultationRecordById(recordId)
  if (!recordResult.success || !recordResult.record) notFound()

  const record = recordResult.record
  const clientResult = await getClientById(record.client_id)
  if (!clientResult.success || !clientResult.client) notFound()

  return (
    <>
      <div className="fixed top-4 right-4 flex gap-2 no-print z-10">
        <ConsultationHwpDownloadButton recordId={recordId} />
        <PdfDownloadButton action={generateConsultationPdf.bind(null, recordId)} />
        <PrintButton />
      </div>
      <ConsultationPrintView records={[record]} client={clientResult.client} />
    </>
  )
}
