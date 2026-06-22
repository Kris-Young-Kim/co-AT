import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  clientName: string
  deviceName: string
  rentalStartDate: string
  rentalEndDate: string
  guardianName?: string
}

export function RentalConfirmEmail({ clientName, deviceName, rentalStartDate, rentalEndDate, guardianName }: Props) {
  const recipient = guardianName ? `${clientName}님 보호자 ${guardianName}님` : `${clientName}님`
  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>보조기기 대여 확정 안내</Heading>
          <Hr />
          <Text>{recipient}께 안내드립니다.</Text>
          <Text><strong>{deviceName}</strong> 대여가 확정되었습니다.</Text>
          <Text>대여 기간: <strong>{rentalStartDate}</strong> ~ <strong>{rentalEndDate}</strong></Text>
          <Text>대여 기간 만료 전에 반납 또는 연장 신청을 해주세요.</Text>
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC AX PLATFORM 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const rentalConfirmSubject = (deviceName: string) =>
  `[GWATC] ${deviceName} 대여 확정 안내`
