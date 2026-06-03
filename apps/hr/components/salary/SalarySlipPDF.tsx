'use client'

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import type { HrSalaryRecord, HrEmployee } from '@co-at/types'
import { totalDeductions } from '@/lib/salary-calculator'

const styles = StyleSheet.create({
  page:        { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937' },
  title:       { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  section:     { marginBottom: 12 },
  sectionTitle:{ fontSize: 11, fontWeight: 'bold', marginBottom: 6, borderBottom: '1pt solid #e5e7eb', paddingBottom: 3 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label:       { color: '#6b7280' },
  value:       { fontWeight: 'bold' },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 4, borderTop: '1pt solid #e5e7eb' },
  netPay:      { fontSize: 13, fontWeight: 'bold', color: '#7c3aed' },
  footer:      { marginTop: 20, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
})

const fmt = (n: number) => n.toLocaleString('ko-KR') + '원'

interface PDFDocProps {
  record: HrSalaryRecord
  employee: HrEmployee
}

function SalarySlipDocument({ record, employee }: PDFDocProps) {
  const ded = record.deductions
  const totalDed = totalDeductions(ded)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>급여명세서</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지급 정보</Text>
          <View style={styles.row}><Text style={styles.label}>지급월</Text><Text>{record.year_month}</Text></View>
          <View style={styles.row}><Text style={styles.label}>성명</Text><Text>{employee.name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>부서</Text><Text>{employee.department}</Text></View>
          <View style={styles.row}><Text style={styles.label}>직급</Text><Text>{employee.position}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지급 내역</Text>
          <View style={styles.row}><Text style={styles.label}>기본급</Text><Text>{fmt(record.base_salary)}</Text></View>
          {record.allowances.map((a, i) => (
            <View key={i} style={styles.row}><Text style={styles.label}>{a.name}</Text><Text>{fmt(a.amount)}</Text></View>
          ))}
          <View style={styles.totalRow}><Text style={styles.label}>지급총액</Text><Text style={styles.value}>{fmt(record.gross_pay)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>공제 내역</Text>
          <View style={styles.row}><Text style={styles.label}>국민연금</Text><Text>{fmt(ded.national_pension)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>건강보험</Text><Text>{fmt(ded.health_insurance)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>장기요양보험</Text><Text>{fmt(ded.long_term_care ?? 0)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>고용보험</Text><Text>{fmt(ded.employment_insurance)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>근로소득세</Text><Text>{fmt(ded.income_tax)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>지방소득세</Text><Text>{fmt(ded.local_income_tax)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.label}>공제총액</Text><Text style={styles.value}>{fmt(totalDed)}</Text></View>
        </View>

        <View style={[styles.section, { backgroundColor: '#f5f3ff', padding: 12, borderRadius: 4 }]}>
          <View style={styles.row}>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>실지급액</Text>
            <Text style={styles.netPay}>{fmt(record.net_pay)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>본 명세서는 전자 발행되었습니다.</Text>
      </Page>
    </Document>
  )
}

interface Props {
  record: HrSalaryRecord
  employee: HrEmployee
}

export function SalarySlipPDFButton({ record, employee }: Props) {
  const filename = `급여명세서_${employee.name}_${record.year_month}.pdf`
  return (
    <PDFDownloadLink document={<SalarySlipDocument record={record} employee={employee} />} fileName={filename}>
      {({ loading }) => (
        <button className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700 disabled:opacity-50">
          {loading ? 'PDF 생성 중…' : 'PDF 다운로드'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
