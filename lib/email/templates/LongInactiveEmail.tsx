import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  clientName: string
  lastServiceDate: string
  staffName?: string
}

export function LongInactiveEmail({ clientName, lastServiceDate, staffName }: Props) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>장기 미활동 대상자 알림</Heading>
          <Hr />
          {staffName && <Text>담당자 <strong>{staffName}</strong>님께 알립니다.</Text>}
          <Text><strong>{clientName}</strong>님이 최근 6개월 이상 서비스 활동이 없습니다.</Text>
          <Text>마지막 서비스 일자: <strong>{lastServiceDate}</strong></Text>
          <Text>팔로업 상담이 필요한지 확인해 주세요.</Text>
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC AX PLATFORM 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const longInactiveSubject = (clientName: string) =>
  `[GWATC] ${clientName}님 장기 미활동 팔로업 안내`
