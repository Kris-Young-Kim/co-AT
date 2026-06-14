import { getAssessmentNoteById } from '@/actions/case-record-actions'
import { getClientById } from '@/actions/client-actions'
import { AssessmentNotePrintView } from '@/eval/components/print/AssessmentNotePrintView'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { HwpDownloadButton } from '@/eval/components/print/HwpDownloadButton'
import { PdfDownloadButton } from '@/eval/components/print/PdfDownloadButton'
import { generateAssessmentNoteHwpx } from '@/eval/actions/assessment-note-hwp-actions'
import { generateAssessmentNotePdf } from '@/eval/actions/pdf-actions'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ noteId: string }>
}

export default async function AssessmentNotePrintPage({ params }: Props) {
  const { noteId } = await params

  const noteResult = await getAssessmentNoteById(noteId)
  if (!noteResult.success || !noteResult.note) notFound()

  const note = noteResult.note
  const clientResult = await getClientById(note.client_id)
  if (!clientResult.success || !clientResult.client) notFound()

  return (
    <>
      <div className="fixed top-4 right-4 flex gap-2 no-print z-10">
        <HwpDownloadButton action={generateAssessmentNoteHwpx.bind(null, noteId)} />
        <PdfDownloadButton action={generateAssessmentNotePdf.bind(null, noteId)} />
        <PrintButton />
      </div>
      <AssessmentNotePrintView notes={[note]} client={clientResult.client} />
    </>
  )
}
