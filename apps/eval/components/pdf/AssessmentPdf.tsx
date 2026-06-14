import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { registerKoreanFont } from './fonts'

registerKoreanFont()

const DOMAIN_LABELS: Record<string, string> = {
  WC: '휠체어 및 이동',
  ADL: '일상생활동작',
  S: '감각',
  SP: '앉기 및 자세',
  EC: '주택 및 환경개조',
  CA: '컴퓨터접근',
  L: '레저',
  AAC: '보완대체의사소통',
  AM: '자동차개조',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Pretendard', fontSize: 10, padding: 48, color: '#111' },
  title: { fontSize: 15, fontWeight: 700, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 9, textAlign: 'center', color: '#666', marginBottom: 20 },
  tableRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#999', marginTop: -1 },
  th: { backgroundColor: '#f0f0f0', padding: 6, fontWeight: 700, width: 80 },
  td: { padding: 6, flex: 1 },
  section: { marginTop: 12, borderWidth: 1, borderColor: '#999', padding: 10 },
  sectionTitle: { fontWeight: 700, marginBottom: 6 },
  body: { lineHeight: 1.5, minHeight: 60 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  footerText: { fontSize: 9, color: '#888' },
})

interface Assessment {
  domain_type: string
  evaluation_date: string
  evaluator_opinion: string | null
  recommended_device: string | null
  future_plan: string | null
}

interface ClientInfo {
  name: string
  birth_date: string | null
}

export function AssessmentPdf({ assessment, client }: { assessment: Assessment; client: ClientInfo }) {
  const domainLabel = DOMAIN_LABELS[assessment.domain_type] ?? assessment.domain_type
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>영역별 보조기기 평가서</Text>
        <Text style={s.subtitle}>
          첨부 21 — {assessment.domain_type} ({domainLabel}) 영역
        </Text>

        <View>
          <View style={s.tableRow}>
            <Text style={s.th}>성명</Text>
            <Text style={s.td}>{client.name}</Text>
            <Text style={s.th}>생년월일</Text>
            <Text style={s.td}>{client.birth_date ?? '—'}</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.th}>평가 영역</Text>
            <Text style={s.td}>{assessment.domain_type} — {domainLabel}</Text>
            <Text style={s.th}>평가일</Text>
            <Text style={s.td}>{assessment.evaluation_date}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>평가자 의견</Text>
          <Text style={s.body}>{assessment.evaluator_opinion ?? ''}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>추천 보조기기</Text>
          <Text style={s.body}>{assessment.recommended_device ?? ''}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>향후 계획</Text>
          <Text style={s.body}>{assessment.future_plan ?? ''}</Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>출력일: {new Date().toLocaleDateString('ko-KR')}</Text>
          <Text style={s.footerText}>평가자: _______________  (서명 또는 인)</Text>
        </View>
      </Page>
    </Document>
  )
}
