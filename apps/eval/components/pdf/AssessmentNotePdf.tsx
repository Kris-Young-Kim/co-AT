import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { registerKoreanFont } from './fonts'
import type { AssessmentNote } from '@/actions/case-record-actions'

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
  sig: { textAlign: 'right', fontSize: 9, color: '#666', marginTop: 8 },
  divider: { marginTop: 24, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#999' },
  footer: { textAlign: 'right', fontSize: 9, color: '#888', marginTop: 16 },
})

const FIELDS: { key: keyof AssessmentNote; label: string }[] = [
  { key: 'physical_function', label: '신체기능 평가' },
  { key: 'cognitive_function', label: '인지기능 평가' },
  { key: 'environment', label: '환경 요인' },
  { key: 'device_needs', label: '보조기기 필요도' },
  { key: 'recommendations', label: '추천 사항' },
  { key: 'notes', label: '비고' },
]

interface ClientInfo {
  name: string
  birth_date: string | null
  disability_type: string | null
  disability_grade: string | null
}

export function AssessmentNotePdf({ notes, client }: { notes: AssessmentNote[]; client: ClientInfo }) {
  const disability = [client.disability_type, client.disability_grade].filter(Boolean).join(' ') || '—'
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>평  가  지</Text>

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

        {notes.map((note, i) => (
          <View key={note.id} style={i > 0 ? s.divider : { marginTop: 16 }}>
            <View>
              <View style={s.tableRow}>
                <Text style={s.th}>평가일</Text>
                <Text style={s.td}>{note.assessment_date}</Text>
                <Text style={s.th}>평가자</Text>
                <Text style={s.td}>{note.assessor ?? '—'}</Text>
              </View>
            </View>

            {FIELDS.map(({ key, label }) =>
              note[key] ? (
                <View key={key} style={s.field}>
                  <Text style={s.fieldLabel}>{label}</Text>
                  <Text style={s.fieldBody}>{String(note[key])}</Text>
                </View>
              ) : null
            )}

            <Text style={s.sig}>평가자: _______________  (서명 또는 인)</Text>
          </View>
        ))}

        <Text style={s.footer}>출력일: {new Date().toLocaleDateString('ko-KR')}</Text>
      </Page>
    </Document>
  )
}
