import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  scheduleType: string
  scheduledDate: string
  scheduledTime?: string
  address?: string
  clientName?: string
}

export function ScheduleReminderEmail({
  scheduleType, scheduledDate, scheduledTime, address, clientName
}: Props) {
  const timeStr = scheduledTime ? ` ${scheduledTime}` : ''

  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>내일 일정 리마인더</Heading>
          <Hr />
          <Text>내일 <strong>{scheduleType}</strong> 일정이 예정되어 있습니다.</Text>
          <Text>
            일시: <strong>{scheduledDate}{timeStr}</strong><br />
            {address && <>장소: {address}<br /></>}
            {clientName && <>대상: {clientName}</>}
          </Text>
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC 보조공학센터 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const scheduleReminderSubject = (scheduleType: string, scheduledDate: string) =>
  `[GWATC] 내일 ${scheduleType} 일정 안내 (${scheduledDate})`
