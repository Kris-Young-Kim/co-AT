import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDocument } from '@/actions/approval-actions'
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'
import type {
  ApprovalDocumentWithSteps,
  ExpenditureContent,
  LeaveContent,
  BusinessReportContent,
  ApprovalStep,
} from '@co-at/types'

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  page:       { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#111' },
  title:      { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  meta:       { fontSize: 9, color: '#666', textAlign: 'center', marginBottom: 24 },
  section:    { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingBottom: 4, borderBottom: '1 solid #ddd' },
  row:        { flexDirection: 'row', marginBottom: 6 },
  label:      { width: 80, color: '#666', fontSize: 9 },
  value:      { flex: 1, fontWeight: 'bold' },
  preWrap:    { flex: 1, fontWeight: 'bold', lineHeight: 1.5 },
  // Approval table
  stepTable:  { flexDirection: 'row', border: '1 solid #ccc', borderRadius: 4 },
  stepCell:   { flex: 1, alignItems: 'center', padding: 8, borderRight: '1 solid #ccc' },
  stepCellLast: { flex: 1, alignItems: 'center', padding: 8 },
  stepLabel:  { fontSize: 8, color: '#666', marginBottom: 4 },
  stepStatus: { fontSize: 9, fontWeight: 'bold', marginBottom: 6 },
  sigBox:     { width: 60, height: 36, border: '1 solid #ddd', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  sigNone:    { fontSize: 8, color: '#bbb' },
})

// ── Label maps ────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  expenditure:     '지출 결의서',
  leave:           '휴가/출장 신청서',
  business_report: '업무 보고서/기안문',
}

const STATUS_LABELS: Record<string, string> = {
  draft:    '임시저장',
  pending:  '결재중',
  approved: '승인완료',
  rejected: '반려',
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: '연차', half: '반차', business_trip: '출장', other: '기타',
}

const STEP_STATUS_LABELS: Record<string, string> = {
  pending: '대기중', approved: '승인', rejected: '반려',
}

// ── Content section ───────────────────────────────────────

function ContentRows({ doc }: { doc: ApprovalDocumentWithSteps }) {
  const c = doc.content

  if (doc.type === 'expenditure') {
    const e = c as ExpenditureContent
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>문서 내용</Text>
        <View style={styles.row}><Text style={styles.label}>항목명</Text><Text style={styles.value}>{e.item_name}</Text></View>
        <View style={styles.row}><Text style={styles.label}>금액</Text><Text style={styles.value}>{e.amount.toLocaleString()}원</Text></View>
        <View style={styles.row}><Text style={styles.label}>지출일</Text><Text style={styles.value}>{e.spend_date}</Text></View>
        {e.note && <View style={styles.row}><Text style={styles.label}>비고</Text><Text style={styles.value}>{e.note}</Text></View>}
      </View>
    )
  }

  if (doc.type === 'leave') {
    const l = c as LeaveContent
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>문서 내용</Text>
        <View style={styles.row}><Text style={styles.label}>유형</Text><Text style={styles.value}>{LEAVE_TYPE_LABELS[l.leave_type] ?? l.leave_type}</Text></View>
        <View style={styles.row}><Text style={styles.label}>기간</Text><Text style={styles.value}>{l.start_date} ~ {l.end_date}</Text></View>
        <View style={styles.row}><Text style={styles.label}>사유</Text><Text style={styles.preWrap}>{l.reason}</Text></View>
        {l.destination && <View style={styles.row}><Text style={styles.label}>행선지</Text><Text style={styles.value}>{l.destination}</Text></View>}
      </View>
    )
  }

  const b = c as BusinessReportContent
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>문서 내용</Text>
      <View style={styles.row}><Text style={styles.label}>배경/목적</Text><Text style={styles.preWrap}>{b.background}</Text></View>
      <View style={styles.row}><Text style={styles.label}>내용</Text><Text style={styles.preWrap}>{b.body}</Text></View>
    </View>
  )
}

// ── Approval table ────────────────────────────────────────

function StepCell({ step, label, isLast }: { step?: ApprovalStep; label: string; isLast?: boolean }) {
  const cellStyle = isLast ? styles.stepCellLast : styles.stepCell
  const statusLabel = step ? (STEP_STATUS_LABELS[step.status] ?? step.status) : '—'
  return (
    <View style={cellStyle}>
      <Text style={styles.stepLabel}>{label}</Text>
      <Text style={styles.stepStatus}>{statusLabel}</Text>
      <View style={styles.sigBox}>
        {step?.signature_url ? (
          <Image src={step.signature_url} style={{ width: 56, height: 32, objectFit: 'contain' }} />
        ) : (
          <Text style={styles.sigNone}>미결재</Text>
        )}
      </View>
      {step?.acted_at && (
        <Text style={[styles.stepLabel, { marginTop: 4 }]}>
          {new Date(step.acted_at).toLocaleDateString('ko-KR')}
        </Text>
      )}
    </View>
  )
}

// ── PDF Document component ────────────────────────────────

function ApprovalPdf({ doc }: { doc: ApprovalDocumentWithSteps }) {
  const step1 = doc.approval_steps.find(s => s.step === 1)
  const step2 = doc.approval_steps.find(s => s.step === 2)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>{TYPE_LABELS[doc.type] ?? doc.type}</Text>
        <Text style={styles.meta}>
          {doc.title} | {STATUS_LABELS[doc.status] ?? doc.status} | 기안일: {new Date(doc.created_at).toLocaleDateString('ko-KR')}
        </Text>

        {/* Content */}
        <ContentRows doc={doc} />

        {/* Approval steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결재란</Text>
          <View style={styles.stepTable}>
            <StepCell label="기안자" />
            <StepCell step={step1} label="팀장 (1차)" />
            <StepCell step={step2} label="센터장 (2차)" isLast />
          </View>
        </View>

        {/* Rejection note */}
        {doc.status === 'rejected' && (() => {
          const rejectedStep = doc.approval_steps.find(s => s.status === 'rejected')
          return rejectedStep?.comment ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>반려 사유</Text>
              <Text style={{ fontSize: 10, color: '#c00' }}>{rejectedStep.comment}</Text>
            </View>
          ) : null
        })()}
      </Page>
    </Document>
  )
}

// ── Route handler ─────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const doc = await getDocument(id)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await renderToBuffer(<ApprovalPdf doc={doc} />)
  const filename = `approval_${doc.type}_${id.slice(0, 8)}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
