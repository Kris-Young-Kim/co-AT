import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  clientName: string
  outcomeScore: number | null
  staffName?: string
}

export function IppaCompletedEmail({ clientName, outcomeScore, staffName }: Props) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>K-IPPA 사후측정 완료 안내</Heading>
          <Hr />
          {staffName && <Text>담당자 <strong>{staffName}</strong>님께 알립니다.</Text>}
          <Text><strong>{clientName}</strong>님의 K-IPPA 사후측정이 완료되었습니다.</Text>
          {outcomeScore !== null && (
            <Text>목표달성도(성과점수): <strong>{outcomeScore}점</strong></Text>
          )}
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC AX PLATFORM 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const ippaCompletedSubject = (clientName: string) =>
  `[GWATC] ${clientName}님 K-IPPA 사후측정 완료`
