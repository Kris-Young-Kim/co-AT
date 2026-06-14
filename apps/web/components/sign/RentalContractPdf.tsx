import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1a1a1a',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    color: '#666',
  },
  value: {
    flex: 1,
  },
  clauseText: {
    lineHeight: 1.6,
    marginBottom: 8,
    color: '#333',
  },
  signatureSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 16,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  signatureLabel: {
    color: '#666',
    marginRight: 8,
  },
  signatureImage: {
    width: 100,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
  },
})

interface RentalContractPdfProps {
  rentalId: string
  clientName: string
  deviceName: string
  deviceModel: string | null
  rentalStartDate: string
  rentalEndDate: string
  signerName: string
  signerType: 'client' | 'guardian'
  signatureData: string
  signedAt: string
}

export function RentalContractPdf({
  rentalId,
  clientName,
  deviceName,
  deviceModel,
  rentalStartDate,
  rentalEndDate,
  signerName,
  signerType,
  signatureData,
  signedAt,
}: RentalContractPdfProps) {
  const signerLabel = signerType === 'guardian' ? '보호자' : '본인'
  const signedDate = new Date(signedAt).toLocaleDateString('ko-KR')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>보조기기 대여 계약서</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 계약 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>대여 번호</Text>
            <Text style={styles.value}>{rentalId.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>이용자</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>기기명</Text>
            <Text style={styles.value}>{deviceName}{deviceModel ? ` (${deviceModel})` : ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>대여 기간</Text>
            <Text style={styles.value}>{rentalStartDate} ~ {rentalEndDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 계약 조건</Text>
          <Text style={styles.clauseText}>
            제1조 (목적) 본 계약은 (사)가치함께자립생활센터(이하 "센터")가 이용자에게 보조기기를 대여함에 있어 필요한 사항을 규정함을 목적으로 합니다.
          </Text>
          <Text style={styles.clauseText}>
            제2조 (대여 기간) 이용자는 위 계약 정보에 명시된 기간 내에 기기를 사용하고, 기간 만료 시 즉시 반납하여야 합니다.
          </Text>
          <Text style={styles.clauseText}>
            제3조 (관리 의무) 이용자는 대여 기기를 선량한 관리자의 주의로써 보관·사용하여야 하며, 고의 또는 과실로 인한 파손·분실 시 변상 책임을 집니다.
          </Text>
          <Text style={styles.clauseText}>
            제4조 (반납) 기기 반납 시 정상 작동 상태를 확인하며, 이상이 있는 경우 센터에 즉시 통보하여야 합니다.
          </Text>
          <Text style={styles.clauseText}>
            제5조 (계약 해지) 이용자가 본 계약의 조건을 위반하거나 기기를 무단으로 양도·전대할 경우 센터는 즉시 계약을 해지하고 기기 반환을 요구할 수 있습니다.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <Text style={{ marginBottom: 8, color: '#666', fontSize: 10 }}>
            본인은 위 계약 내용을 충분히 이해하고 동의하여 서명합니다.
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>서명일자</Text>
            <Text style={styles.value}>{signedDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>서명인</Text>
            <Text style={styles.value}>{signerName} ({signerLabel})</Text>
          </View>
          <View style={[styles.signatureRow, { marginTop: 12 }]}>
            <Text style={styles.signatureLabel}>서명</Text>
            <Image src={signatureData} style={styles.signatureImage} />
          </View>
        </View>

        <Text style={styles.footer}>
          (사)가치함께자립생활센터 · gwatc.cloud · 본 문서는 전자서명으로 체결된 계약서입니다
        </Text>
      </Page>
    </Document>
  )
}
