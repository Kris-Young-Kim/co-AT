import { getDomainAssessmentById } from '@/actions/assessment-actions'
import { getClientById } from '@/actions/client-actions'
import { AssessmentPrintView } from '@/eval/components/print/AssessmentPrintView'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { HwpDownloadButton } from '@/eval/components/print/HwpDownloadButton'
import { PdfDownloadButton } from '@/eval/components/print/PdfDownloadButton'
import { generateDomainAssessmentHwpx } from '@/eval/actions/domain-assessment-hwp-actions'
import { generateAssessmentPdf } from '@/eval/actions/pdf-actions'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface AssessmentPrintPageProps {
  params: Promise<{ assessmentId: string }>
}

export default async function AssessmentPrintPage({ params }: AssessmentPrintPageProps) {
  const { assessmentId } = await params

  const assessmentResult = await getDomainAssessmentById(assessmentId)
  if (!assessmentResult.success || !assessmentResult.assessment) notFound()

  const assessment = assessmentResult.assessment
  let clientId: string | null = assessment.client_id ?? null

  if (!clientId && assessment.application_id) {
    const supabase = await createClient()
    const { data: app } = await supabase
      .from('applications')
      .select('client_id')
      .eq('id', assessment.application_id)
      .single()
    clientId = (app as { client_id: string } | null)?.client_id ?? null
  }

  if (!clientId) notFound()

  const clientResult = await getClientById(clientId)
  if (!clientResult.success || !clientResult.client) notFound()

  return (
    <>
      <div className="fixed top-4 right-4 flex gap-2 no-print z-10">
        <HwpDownloadButton action={generateDomainAssessmentHwpx.bind(null, assessmentId)} />
        <PdfDownloadButton action={generateAssessmentPdf.bind(null, assessmentId)} />
        <PrintButton />
      </div>
      <AssessmentPrintView assessment={assessment as any} client={clientResult.client} />
    </>
  )
}
