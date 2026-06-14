import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { registerKoreanFont } from './fonts'
import type { ConsultationRecord } from '@/actions/case-record-actions'

registerKoreanFont()

const s = StyleSheet.create({
  page: { fontFamily: 'Pretendard', fontSize: 10, padding: 48, color: '#111' },
  title: { fontSize: 15, fontWeight: 700, textAlign: 'center', marginBottom: 20 },
  tableRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#999', marginTop: -1 },
  th: { backgroundColor: '#f0f0f0', padding: 6, fontWeight: 700, width: 80 },
  td: { padding: 6, flex: 1 },
  fieldLabel: { backgroundColor: '#f0f0f0', padding: '4 8', fontWeight: 700, fontSize: 9, borderBottomWidth: 1, borderBottomColor: '#999' },
  fieldBody: { padding: '6 8', lineHeight: 1.5, minHeight: 48 },
  field: { borderWidth: 1, borderColor: '#999', marginTop: 4 },
  divider: { marginTop: 24, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#999' },
  footer: { textAlign: 'right', fontSize: 9, color: '#888', marginTop: 16 },
})

const FIELDS: { key: keyof ConsultationRecord; label: string }[] = [
  { key: 'purpose', label: '방문·상담 목적 / 주호소' },
  { key: 'current_situation', label: '현재 상황' },
  { key: 'content', label: '상담 내용' },
  { key: 'result', label: '결과 및 조치사항' },
  { key: 'next_plan', label: '향후 계획' },
]

interface ClientInfo {
  name: string
  birth_date: string | null
  disability_type: string | null
  disability_grade: string | null
}

export function ConsultationPdf({ records, client }: { records: ConsultationRecord[]; client: ClientInfo }) {
  const disability = [client.disability_type, client.disability_grade].filter(Boolean).join(' ') || '—'
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>상  담  기  록  지</Text>

        <View>
          <View style={s.tableRow}>
            <Text style={s.th}>성명</Text>
            <Text style={s.td}>{client.name}</Text>
            <Text style={s.th}>생년월일</Text>
            <Text style={s.td}>{client.birth_date ?? '—'}</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.th}>장애유형</Text>
            <Text style={[s.td, { flex: 3 }]}>{disability}</Text>
          </View>
        </View>

        {records.map((record, i) => (
          <View key={record.id} style={i > 0 ? s.divider : { marginTop: 16 }}>
            <View>
              <View style={s.tableRow}>
                <Text style={s.th}>상담일</Text>
                <Text style={s.td}>{record.consultation_date}</Text>
                <Text style={s.th}>상담유형</Text>
                <Text style={s.td}>{record.consultation_type}</Text>
              </View>
              <View style={s.tableRow}>
                <Text style={s.th}>상담자</Text>
                <Text style={[s.td, { flex: 3 }]}>{record.consultant ?? '—'}</Text>
              </View>
            </View>

            {FIELDS.map(({ key, label }) =>
              record[key] ? (
                <View key={key} style={s.field}>
                  <Text style={s.fieldLabel}>{label}</Text>
                  <Text style={s.fieldBody}>{String(record[key])}</Text>
                </View>
              ) : null
            )}
          </View>
        ))}

        <Text style={s.footer}>출력일: {new Date().toLocaleDateString('ko-KR')}</Text>
      </Page>
    </Document>
  )
}
