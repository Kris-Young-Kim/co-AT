import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { registerKoreanFont } from './fonts'
import type { GrantAssessmentDetail, GrantAssessmentItem } from '@/actions/grant-assessment-actions'
import type { ChecklistTemplate } from '@/actions/checklist-template-actions'

registerKoreanFont()

const s = StyleSheet.create({
  page: { fontFamily: 'Pretendard', fontSize: 9, padding: 40, color: '#111' },
  title: { fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 4 },
  year: { fontSize: 9, textAlign: 'center', color: '#666', marginBottom: 16 },
  sectionTitle: { fontWeight: 700, fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#aaa', paddingBottom: 3, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#999', marginTop: -1 },
  th: { backgroundColor: '#f0f0f0', padding: 5, fontWeight: 700, width: 72 },
  td: { padding: 5, flex: 1 },
  itemBox: { borderWidth: 1, borderColor: '#999', padding: 10, marginBottom: 14 },
  itemTitle: { fontWeight: 700, fontSize: 10, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  gridCell: { width: '30%', fontSize: 8 },
  label: { color: '#666' },
  scoreGrid: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  scoreCell: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 4, alignItems: 'center' },
  scoreLabel: { fontSize: 7, color: '#666', marginBottom: 2 },
  scoreValue: { fontWeight: 700, fontSize: 10 },
  checkRow: { flexDirection: 'row', gap: 4, marginBottom: 2, alignItems: 'flex-start' },
  checkText: { flex: 1, fontSize: 8 },
  fieldLabel: { fontWeight: 700, fontSize: 8, marginBottom: 2 },
  fieldBody: { lineHeight: 1.4, color: '#444' },
  resultRow: { flexDirection: 'row', gap: 12, marginTop: 6, fontSize: 8 },
  section: { marginBottom: 12 },
  opinionBox: { borderWidth: 1, borderColor: '#ccc', padding: 8, minHeight: 48, lineHeight: 1.5 },
  footer: { textAlign: 'center', fontSize: 8, color: '#aaa', marginTop: 12 },
})

const SCORE_LABELS = ['환경 적합성', '조작 능력', '장애 특성', '활용 계획', '기대 효과']

function ItemSection({ item, templates }: { item: GrantAssessmentItem; templates: ChecklistTemplate[] }) {
  const scores = [item.score_env, item.score_operation, item.score_disability, item.score_use_plan, item.score_effectiveness]
  return (
    <View style={s.itemBox}>
      <Text style={s.itemTitle}>품목 {item.item_order} — {item.item_category}</Text>

      <View style={s.grid}>
        <Text style={s.gridCell}><Text style={s.label}>품목명: </Text>{item.item_name ?? '—'}</Text>
        <Text style={s.gridCell}><Text style={s.label}>사용 환경: </Text>{item.use_location ?? '—'} {item.use_location_detail ?? ''}</Text>
        <Text style={s.gridCell}><Text style={s.label}>사용 경험: </Text>{item.usage_experience === null ? '—' : item.usage_experience ? '있음' : '없음'}</Text>
        <Text style={s.gridCell}><Text style={s.label}>자가 사용: </Text>{item.self_usage_possible === null ? '—' : item.self_usage_possible ? '가능' : '불가'}</Text>
      </View>

      {item.use_plan ? (
        <View style={{ marginBottom: 6 }}>
          <Text style={s.fieldLabel}>활용 계획</Text>
          <Text style={s.fieldBody}>{item.use_plan}</Text>
        </View>
      ) : null}

      <View style={{ marginBottom: 6 }}>
        <Text style={s.fieldLabel}>적정성 평가</Text>
        <View style={s.scoreGrid}>
          {SCORE_LABELS.map((label, i) => (
            <View key={i} style={s.scoreCell}>
              <Text style={s.scoreLabel}>{label}</Text>
              <Text style={s.scoreValue}>{scores[i] ?? '—'}</Text>
            </View>
          ))}
        </View>
        <Text style={{ textAlign: 'right', fontSize: 8, fontWeight: 700 }}>합계: {item.total_score ?? 0}점</Text>
      </View>

      {templates.length > 0 ? (
        <View style={{ marginBottom: 6 }}>
          <Text style={s.fieldLabel}>기본 확인 사항</Text>
          {templates.map((t) => (
            <View key={t.question_id} style={s.checkRow}>
              <Text style={{ width: 12 }}>{item.checklist_responses?.[t.question_id] ? '☑' : '☐'}</Text>
              <Text style={s.checkText}>{t.question_text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {item.item_opinion ? (
        <View style={{ marginBottom: 6 }}>
          <Text style={s.fieldLabel}>품목 의견</Text>
          <Text style={s.fieldBody}>{item.item_opinion}</Text>
        </View>
      ) : null}

      <View style={s.resultRow}>
        <Text><Text style={s.label}>품목 결과: </Text><Text style={{ fontWeight: 700 }}>{item.item_result ?? '—'}</Text></Text>
        <Text><Text style={s.label}>추천 모델: </Text>{item.recommended_model ?? '—'}</Text>
        <Text><Text style={s.label}>지원금액: </Text>{item.support_amount ? `${item.support_amount.toLocaleString()}원` : '—'}</Text>
      </View>
    </View>
  )
}

interface ClientInfo {
  name: string | null
  birth_date: string | null
  disability_type: string | null
}

export function GrantAssessmentPdf({
  assessment,
  client,
  checklistMap,
}: {
  assessment: GrantAssessmentDetail
  client: ClientInfo | null
  checklistMap: Record<string, ChecklistTemplate[]>
}) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>보조기기 교부사업 적합성 평가 기록지</Text>
        <Text style={s.year}>{assessment.assessment_year}년</Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>대상자 정보</Text>
          <View>
            <View style={s.tableRow}>
              <Text style={s.th}>성명</Text>
              <Text style={s.td}>{client?.name ?? '—'}</Text>
              <Text style={s.th}>생년월일</Text>
              <Text style={s.td}>{client?.birth_date ?? '—'}</Text>
              <Text style={s.th}>장애유형</Text>
              <Text style={s.td}>{client?.disability_type ?? '—'}</Text>
            </View>
            <View style={s.tableRow}>
              <Text style={s.th}>의뢰기관</Text>
              <Text style={s.td}>{assessment.referral_org ?? '—'}</Text>
              <Text style={s.th}>평가일</Text>
              <Text style={s.td}>{assessment.evaluation_date ?? '—'}</Text>
              <Text style={s.th}>평가자</Text>
              <Text style={s.td}>{assessment.evaluator_name ?? '—'}</Text>
            </View>
          </View>
        </View>

        {assessment.items.map((item) => (
          <ItemSection key={item.id} item={item} templates={checklistMap[item.item_category] ?? []} />
        ))}

        <View style={s.section}>
          <Text style={s.sectionTitle}>종합 의견</Text>
          <Text style={s.opinionBox}>{assessment.general_opinion ?? '—'}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>최종 결과</Text>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>{assessment.final_result ?? '미결정'}</Text>
        </View>

        <Text style={s.footer}>출력일: {new Date().toLocaleDateString('ko-KR')}</Text>
      </Page>
    </Document>
  )
}
