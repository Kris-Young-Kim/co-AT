import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  clientName: string
  registrationNumber: string
  staffName?: string
}

export function ClientRegisteredEmail({ clientName, registrationNumber, staffName }: Props) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>대상자 등록 완료 안내</Heading>
          <Hr />
          {staffName && <Text>담당자 <strong>{staffName}</strong>님께 알립니다.</Text>}
          <Text><strong>{clientName}</strong>님이 정식 등록 처리되었습니다.</Text>
          <Text>등록 번호: <strong>{registrationNumber}</strong></Text>
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC AX PLATFORM 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const clientRegisteredSubject = (clientName: string) =>
  `[GWATC] ${clientName}님 대상자 등록 완료`
