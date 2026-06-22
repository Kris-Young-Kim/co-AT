import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  clientName: string
  serviceType: string
  newStatus: string
  staffName?: string
}

export function ServiceStatusChangedEmail({ clientName, serviceType, newStatus, staffName }: Props) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>서비스 기록 상태 변경 안내</Heading>
          <Hr />
          {staffName && <Text>담당자 <strong>{staffName}</strong>님께 알립니다.</Text>}
          <Text><strong>{clientName}</strong>님의 서비스 기록 상태가 변경되었습니다.</Text>
          <Text>서비스 유형: <strong>{serviceType}</strong></Text>
          <Text>변경된 상태: <strong>{newStatus}</strong></Text>
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC AX PLATFORM 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const serviceStatusChangedSubject = (clientName: string) =>
  `[GWATC] ${clientName}님 서비스 기록 상태 변경`
