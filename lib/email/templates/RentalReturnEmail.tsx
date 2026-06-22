import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  clientName: string
  deviceName: string
  returnDate: string
  guardianName?: string
}

export function RentalReturnEmail({ clientName, deviceName, returnDate, guardianName }: Props) {
  const recipient = guardianName ? `${clientName}님 보호자 ${guardianName}님` : `${clientName}님`
  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>보조기기 반납 완료 안내</Heading>
          <Hr />
          <Text>{recipient}께 안내드립니다.</Text>
          <Text><strong>{deviceName}</strong> 반납이 완료되었습니다.</Text>
          <Text>반납일: <strong>{returnDate}</strong></Text>
          <Text>이용해 주셔서 감사합니다.</Text>
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC AX PLATFORM 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const rentalReturnSubject = (deviceName: string) =>
  `[GWATC] ${deviceName} 반납 완료 안내`
