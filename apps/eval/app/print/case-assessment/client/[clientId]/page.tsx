import { getAssessmentNotesByClient } from '@/actions/case-record-actions'
import { getClientById } from '@/actions/client-actions'
import { AssessmentNotePrintView } from '@/eval/components/print/AssessmentNotePrintView'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { HwpDownloadButton } from '@/eval/components/print/HwpDownloadButton'
import { generateClientAssessmentNotesHwpx } from '@/eval/actions/assessment-note-hwp-actions'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function AssessmentNoteClientPrintPage({ params }: Props) {
  const { clientId } = await params

  const [clientResult, notesResult] = await Promise.all([
    getClientById(clientId),
    getAssessmentNotesByClient(clientId),
  ])

  if (!clientResult.success || !clientResult.client) notFound()
  if (!notesResult.success || !notesResult.notes?.length) notFound()

  const notes = [...notesResult.notes].sort(
    (a, b) => a.assessment_date.localeCompare(b.assessment_date)
  )

  return (
    <>
      <div className="fixed top-4 right-4 flex gap-2 no-print z-10">
        <HwpDownloadButton
          action={generateClientAssessmentNotesHwpx.bind(null, clientId)}
          label="전체 HWP 다운로드"
        />
        <PrintButton />
      </div>
      <AssessmentNotePrintView notes={notes} client={clientResult.client} />
    </>
  )
}
