import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  deviceName: string
  daysLeft: number
  expiryDate: string
}

export function RentalExpiryEmail({ deviceName, daysLeft, expiryDate }: Props) {
  const urgency = daysLeft === 0 ? '오늘' : `${daysLeft}일 후`

  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>대여 기간 만료 안내</Heading>
          <Hr />
          <Text>보조기기 <strong>{deviceName}</strong>의 대여 기간이 <strong>{urgency}({expiryDate})</strong> 만료됩니다.</Text>
          <Text>반납이 필요한 경우 담당자에게 연락해 주세요.</Text>
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC 보조공학센터 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const rentalExpirySubject = (deviceName: string, daysLeft: number) =>
  daysLeft === 0
    ? `[GWATC] ${deviceName} 대여 기간이 오늘 만료됩니다`
    : `[GWATC] ${deviceName} 대여 기간 만료 D-${daysLeft} 안내`
