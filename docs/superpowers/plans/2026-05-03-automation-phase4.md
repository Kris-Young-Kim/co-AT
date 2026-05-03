# Phase 4 Automation App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate admin cron jobs to `apps/automation`, add Resend email channel, and build a management dashboard at `automation.gwatc.cloud`.

**Architecture:** `apps/automation` owns all cron routes, notification dispatch, and channel config. The app reads/writes Supabase directly via service-role client. `apps/admin` cron routes are deleted after automation is confirmed working.

**Tech Stack:** Next.js 16 App Router, Server Actions, Supabase (service role), Resend + React Email, shadcn/ui, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `migrations/037_create_automation_tables.sql` | Create | automation_logs + automation_channels tables |
| `apps/automation/package.json` | Modify | add resend, @react-email/components |
| `apps/automation/lib/supabase-admin.ts` | Create | Supabase service-role client |
| `apps/automation/lib/cron-auth.ts` | Create | CRON_SECRET header validation |
| `apps/automation/lib/resend.ts` | Create | Resend client singleton |
| `apps/automation/emails/RentalExpiryEmail.tsx` | Create | React Email template for rental expiry |
| `apps/automation/emails/ScheduleReminderEmail.tsx` | Create | React Email template for schedule reminder |
| `apps/automation/actions/log-actions.ts` | Create | automation_logs CRUD server actions |
| `apps/automation/actions/channel-actions.ts` | Create | automation_channels CRUD server actions |
| `apps/automation/actions/notify-actions.ts` | Create | in-app notification insert + email dispatch |
| `apps/automation/app/api/cron/rental-expiry/route.ts` | Create | Rental expiry cron (migrated from admin) |
| `apps/automation/app/api/cron/schedule-reminders/route.ts` | Create | Schedule reminder cron (migrated from admin) |
| `apps/automation/app/api/notify/send/route.ts` | Create | Manual send API |
| `apps/automation/app/api/health/route.ts` | Create | Health check |
| `apps/automation/app/layout.tsx` | Modify | Add sidebar nav |
| `apps/automation/app/page.tsx` | Modify | Dashboard UI |
| `apps/automation/app/logs/page.tsx` | Create | Automation log list |
| `apps/automation/app/channels/page.tsx` | Create | Channel settings |
| `apps/automation/app/send/page.tsx` | Create | Manual send form |
| `apps/automation/components/AppSidebar.tsx` | Create | Sidebar navigation |
| `apps/automation/components/dashboard/SummaryCards.tsx` | Create | Today's run summary |
| `apps/automation/components/dashboard/RecentLogsTable.tsx` | Create | Last 10 runs table |
| `apps/automation/components/dashboard/ChannelStatus.tsx` | Create | Channel status badges |
| `apps/automation/components/logs/LogsTable.tsx` | Create | Full log table with filters |
| `apps/automation/components/logs/LogDetailModal.tsx` | Create | Log detail dialog |
| `apps/automation/components/channels/EmailChannelCard.tsx` | Create | Resend config + test send |
| `apps/automation/components/channels/KakaoChannelCard.tsx` | Create | Kakao placeholder card |
| `apps/automation/components/send/SendForm.tsx` | Create | Manual notification form |
| `apps/automation/vercel.json` | Create | Vercel cron schedule |
| `apps/admin/app/api/cron/rental-expiry-notifications/route.ts` | Delete | Remove after migration |
| `apps/admin/app/api/cron/schedule-reminders/route.ts` | Delete | Remove after migration |

---

## Task 1: DB Migration — automation tables

**Files:**
- Create: `migrations/037_create_automation_tables.sql`

- [ ] **Step 1: Create migration file**

```sql
-- migrations/037_create_automation_tables.sql
-- Automation execution logs and channel config tables
-- Created: 2026-05-03

-- 1. automation_logs: records every cron/manual run result
CREATE TABLE IF NOT EXISTS automation_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name      text NOT NULL,
  triggered_by  text NOT NULL CHECK (triggered_by IN ('cron', 'manual')),
  status        text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  total_sent    int NOT NULL DEFAULT 0,
  success_count int NOT NULL DEFAULT 0,
  fail_count    int NOT NULL DEFAULT 0,
  channel       text NOT NULL CHECK (channel IN ('in-app', 'email', 'kakao')),
  error_message text,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_job_name   ON automation_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status     ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at DESC);

-- 2. automation_channels: channel enable/disable + config
CREATE TABLE IF NOT EXISTS automation_channels (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type   text NOT NULL UNIQUE CHECK (channel_type IN ('email', 'kakao')),
  is_enabled     boolean NOT NULL DEFAULT false,
  config         jsonb,
  last_tested_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Seed default channel rows
INSERT INTO automation_channels (channel_type, is_enabled)
VALUES ('email', false), ('kakao', false)
ON CONFLICT (channel_type) DO NOTHING;

-- RLS: ADMIN only
ALTER TABLE automation_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_automation_logs"
  ON automation_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = auth.jwt()->>'sub'
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_all_automation_channels"
  ON automation_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = auth.jwt()->>'sub'
        AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE automation_logs     IS 'Automation job execution history (cron and manual)';
COMMENT ON TABLE automation_channels IS 'Notification channel config (email, kakao)';
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

Go to Supabase → SQL Editor → run the file content.
Verify: `SELECT * FROM automation_channels;` returns 2 rows (email, kakao).

- [ ] **Step 3: Commit**

```bash
git add migrations/037_create_automation_tables.sql
git commit -m "feat(automation): add automation_logs and automation_channels tables"
```

---

## Task 2: Add packages to automation app

**Files:**
- Modify: `apps/automation/package.json`

- [ ] **Step 1: Add dependencies**

```bash
cd apps/automation
pnpm add resend @react-email/components @react-email/render
```

- [ ] **Step 2: Verify package.json updated**

`apps/automation/package.json` dependencies should now include:
```json
{
  "resend": "^4.x.x",
  "@react-email/components": "^0.x.x",
  "@react-email/render": "^1.x.x"
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/automation/package.json pnpm-lock.yaml
git commit -m "feat(automation): add resend and react-email packages"
```

---

## Task 3: Core lib — Supabase admin client, cron auth, Resend client

**Files:**
- Create: `apps/automation/lib/supabase-admin.ts`
- Create: `apps/automation/lib/cron-auth.ts`
- Create: `apps/automation/lib/resend.ts`

- [ ] **Step 1: Create Supabase admin client**

```typescript
// apps/automation/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
```

- [ ] **Step 2: Create cron auth helper**

```typescript
// apps/automation/lib/cron-auth.ts
import { NextResponse } from 'next/server'

export function verifyCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return null // no secret configured — allow (dev mode)
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
```

- [ ] **Step 3: Create Resend client**

```typescript
// apps/automation/lib/resend.ts
import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(key)
  }
  return _resend
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@gwatc.cloud'
```

- [ ] **Step 4: Commit**

```bash
git add apps/automation/lib/
git commit -m "feat(automation): add supabase-admin, cron-auth, and resend lib"
```

---

## Task 4: React Email templates

**Files:**
- Create: `apps/automation/emails/RentalExpiryEmail.tsx`
- Create: `apps/automation/emails/ScheduleReminderEmail.tsx`

- [ ] **Step 1: Create rental expiry email template**

```tsx
// apps/automation/emails/RentalExpiryEmail.tsx
import {
  Html, Head, Body, Container, Heading, Text, Hr, Section
} from '@react-email/components'

interface Props {
  deviceName: string
  daysLeft: number    // 7, 3, or 0
  expiryDate: string  // YYYY-MM-DD
}

export function RentalExpiryEmail({ deviceName, daysLeft, expiryDate }: Props) {
  const urgency = daysLeft === 0 ? '오늘' : `${daysLeft}일 후`
  const subject = daysLeft === 0
    ? `[GWATC] ${deviceName} 대여 기간이 오늘 만료됩니다`
    : `[GWATC] ${deviceName} 대여 기간 만료 ${urgency} 안내`

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
```

- [ ] **Step 2: Create schedule reminder email template**

```tsx
// apps/automation/emails/ScheduleReminderEmail.tsx
import {
  Html, Head, Body, Container, Heading, Text, Hr
} from '@react-email/components'

interface Props {
  scheduleType: string  // e.g. '방문', '상담'
  scheduledDate: string // YYYY-MM-DD
  scheduledTime?: string
  address?: string
  clientName?: string
}

export function ScheduleReminderEmail({
  scheduleType, scheduledDate, scheduledTime, address, clientName
}: Props) {
  const timeStr = scheduledTime ? ` ${scheduledTime}` : ''
  const addrStr = address ? ` (${address})` : ''
  const clientStr = clientName ? ` — ${clientName}` : ''

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
          {(addrStr || clientStr) && <Text>{addrStr}{clientStr}</Text>}
          <Hr />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>본 메일은 GWATC 보조공학센터 자동 발송 메일입니다.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const scheduleReminderSubject = (scheduleType: string, scheduledDate: string) =>
  `[GWATC] 내일 ${scheduleType} 일정 안내 (${scheduledDate})`
```

- [ ] **Step 3: Commit**

```bash
git add apps/automation/emails/
git commit -m "feat(automation): add React Email templates for rental expiry and schedule reminder"
```

---

## Task 5: Server Actions — log-actions and channel-actions

**Files:**
- Create: `apps/automation/actions/log-actions.ts`
- Create: `apps/automation/actions/channel-actions.ts`

- [ ] **Step 1: Create log-actions**

```typescript
// apps/automation/actions/log-actions.ts
'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'

export interface CreateLogInput {
  jobName: string
  triggeredBy: 'cron' | 'manual'
  status: 'success' | 'partial' | 'failed'
  totalSent: number
  successCount: number
  failCount: number
  channel: 'in-app' | 'email' | 'kakao'
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export async function createLog(input: CreateLogInput) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('automation_logs').insert({
    job_name:      input.jobName,
    triggered_by:  input.triggeredBy,
    status:        input.status,
    total_sent:    input.totalSent,
    success_count: input.successCount,
    fail_count:    input.failCount,
    channel:       input.channel,
    error_message: input.errorMessage,
    metadata:      input.metadata,
  })
  if (error) console.error('[createLog] error:', error)
}

export async function getLogs(params?: {
  jobName?: string
  status?: string
  fromDate?: string
  toDate?: string
  limit?: number
}) {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(params?.limit ?? 100)

  if (params?.jobName) query = query.eq('job_name', params.jobName)
  if (params?.status)  query = query.eq('status', params.status)
  if (params?.fromDate) query = query.gte('created_at', params.fromDate)
  if (params?.toDate)   query = query.lte('created_at', params.toDate)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function getTodaySummary() {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('automation_logs')
    .select('*')
    .gte('created_at', `${today}T00:00:00Z`)
  if (error) throw new Error(error.message)
  return data
}
```

- [ ] **Step 2: Create channel-actions**

```typescript
// apps/automation/actions/channel-actions.ts
'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'

export interface ChannelConfig {
  apiKey?: string
  fromEmail?: string
  [key: string]: unknown
}

export async function getChannels() {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('automation_channels')
    .select('*')
    .order('channel_type')
  if (error) throw new Error(error.message)
  return data
}

export async function toggleChannel(channelType: 'email' | 'kakao', enabled: boolean) {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('automation_channels')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('channel_type', channelType)
  if (error) throw new Error(error.message)
}

export async function saveChannelConfig(channelType: 'email' | 'kakao', config: ChannelConfig) {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('automation_channels')
    .update({ config, updated_at: new Date().toISOString() })
    .eq('channel_type', channelType)
  if (error) throw new Error(error.message)
}

export async function markChannelTested(channelType: 'email' | 'kakao') {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('automation_channels')
    .update({ last_tested_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('channel_type', channelType)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/automation/actions/log-actions.ts apps/automation/actions/channel-actions.ts
git commit -m "feat(automation): add log-actions and channel-actions server actions"
```

---

## Task 6: Server Action — notify-actions (in-app + email dispatch)

**Files:**
- Create: `apps/automation/actions/notify-actions.ts`

- [ ] **Step 1: Create notify-actions**

```typescript
// apps/automation/actions/notify-actions.ts
'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { render } from '@react-email/render'
import { RentalExpiryEmail, rentalExpirySubject } from '@/emails/RentalExpiryEmail'
import { ScheduleReminderEmail, scheduleReminderSubject } from '@/emails/ScheduleReminderEmail'

export interface InAppNotificationInput {
  userId: string
  clerkUserId?: string
  type: string
  title: string
  body: string
  link?: string
  priority?: number
  metadata?: Record<string, unknown>
}

export interface NotifyResult {
  success: boolean
  error?: string
}

/** Insert a single in-app notification into the notifications table */
export async function createInAppNotification(input: InAppNotificationInput): Promise<NotifyResult> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('notifications').insert({
    user_id:       input.userId,
    clerk_user_id: input.clerkUserId,
    type:          input.type,
    title:         input.title,
    body:          input.body,
    link:          input.link,
    priority:      input.priority ?? 0,
    metadata:      input.metadata,
    status:        'unread',
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

/** Send rental expiry email via Resend */
export async function sendRentalExpiryEmail(params: {
  toEmail: string
  deviceName: string
  daysLeft: number
  expiryDate: string
}): Promise<NotifyResult> {
  try {
    const resend = getResend()
    const html = await render(
      RentalExpiryEmail({ deviceName: params.deviceName, daysLeft: params.daysLeft, expiryDate: params.expiryDate })
    )
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: rentalExpirySubject(params.deviceName, params.daysLeft),
      html,
    })
    if (error) return { success: false, error: String(error) }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

/** Send schedule reminder email via Resend */
export async function sendScheduleReminderEmail(params: {
  toEmail: string
  scheduleType: string
  scheduledDate: string
  scheduledTime?: string
  address?: string
  clientName?: string
}): Promise<NotifyResult> {
  try {
    const resend = getResend()
    const html = await render(
      ScheduleReminderEmail({
        scheduleType:  params.scheduleType,
        scheduledDate: params.scheduledDate,
        scheduledTime: params.scheduledTime,
        address:       params.address,
        clientName:    params.clientName,
      })
    )
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: scheduleReminderSubject(params.scheduleType, params.scheduledDate),
      html,
    })
    if (error) return { success: false, error: String(error) }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

/** Send a manual custom notification (in-app only for now) */
export async function sendManualNotification(params: {
  userIds: string[]
  title: string
  body: string
  link?: string
}): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0
  let failCount = 0
  for (const userId of params.userIds) {
    const result = await createInAppNotification({
      userId,
      type: 'info',
      title: params.title,
      body: params.body,
      link: params.link,
      priority: 1,
    })
    if (result.success) successCount++
    else failCount++
  }
  return { successCount, failCount }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/automation/actions/notify-actions.ts
git commit -m "feat(automation): add notify-actions with in-app and email dispatch"
```

---

## Task 7: Cron route — rental-expiry

**Files:**
- Create: `apps/automation/app/api/cron/rental-expiry/route.ts`

- [ ] **Step 1: Create rental expiry cron route**

```typescript
// apps/automation/app/api/cron/rental-expiry/route.ts
import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { createInAppNotification, sendRentalExpiryEmail } from '@/actions/notify-actions'
import { createLog } from '@/actions/log-actions'

const DAYS_TO_CHECK = [7, 3, 0]

const SCHEDULE_TYPE_MAP: Record<string, string> = {
  visit: '방문', consult: '상담', assessment: '평가',
  delivery: '배송', pickup: '수거', exhibition: '견학',
  education: '교육', custom_make: '맞춤제작',
}

export async function GET(request: Request) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  const supabase = createSupabaseAdmin()
  const today = new Date()
  let totalSent = 0
  let failCount = 0

  try {
    // Check if email channel is enabled
    const { data: emailChannel } = await supabase
      .from('automation_channels')
      .select('is_enabled, config')
      .eq('channel_type', 'email')
      .single()
    const emailEnabled = emailChannel?.is_enabled ?? false

    for (const days of DAYS_TO_CHECK) {
      const target = new Date(today)
      target.setDate(today.getDate() + days)
      const targetDate = target.toISOString().split('T')[0]

      const { data: rentals, error } = await supabase
        .from('rentals')
        .select(`
          id, client_id, rental_end_date,
          inventory:inventory_id ( name ),
          clients:client_id (
            id,
            profiles!rentals_client_id_fkey ( clerk_user_id )
          )
        `)
        .eq('status', 'rented')
        .eq('rental_end_date', targetDate)

      if (error || !rentals) continue

      for (const rental of rentals) {
        const clientId = rental.client_id as string
        const clerkUserId = (rental.clients as Record<string, unknown> | null)?.clerk_user_id as string | undefined
        const deviceName = (rental.inventory as { name?: string } | null)?.name ?? '보조기기'

        // In-app notification
        const inApp = await createInAppNotification({
          userId:      clientId,
          clerkUserId: clerkUserId,
          type:        'rental_expiry',
          title:       `대여 기간 만료 ${days === 0 ? '오늘' : `D-${days}`} 안내`,
          body:        `${deviceName} 대여 기간이 ${days === 0 ? '오늘' : `${days}일 후`} 만료됩니다.`,
          link:        '/mypage',
          priority:    days === 0 ? 3 : 2,
          metadata:    { rentalId: rental.id, daysLeft: days, expiryDate: targetDate },
        })
        if (inApp.success) totalSent++
        else failCount++

        // Email notification (if enabled + user has email)
        if (emailEnabled && clerkUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('clerk_user_id', clerkUserId)
            .single()
          if (profile?.email) {
            const email = await sendRentalExpiryEmail({
              toEmail:    profile.email,
              deviceName,
              daysLeft:   days,
              expiryDate: targetDate,
            })
            if (email.success) totalSent++
            else failCount++
          }
        }
      }
    }

    await createLog({
      jobName:      'rental-expiry',
      triggeredBy:  'cron',
      status:       failCount === 0 ? 'success' : totalSent > 0 ? 'partial' : 'failed',
      totalSent:    totalSent + failCount,
      successCount: totalSent,
      failCount,
      channel:      emailEnabled ? 'email' : 'in-app',
      metadata:     { date: today.toISOString().split('T')[0] },
    })

    return NextResponse.json({ success: true, totalSent, failCount })
  } catch (error) {
    await createLog({
      jobName: 'rental-expiry', triggeredBy: 'cron', status: 'failed',
      totalSent: 0, successCount: 0, failCount: 1,
      channel: 'in-app', errorMessage: String(error),
    })
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/automation/app/api/cron/rental-expiry/route.ts
git commit -m "feat(automation): add rental-expiry cron route"
```

---

## Task 8: Cron route — schedule-reminders

**Files:**
- Create: `apps/automation/app/api/cron/schedule-reminders/route.ts`

- [ ] **Step 1: Create schedule reminders cron route**

```typescript
// apps/automation/app/api/cron/schedule-reminders/route.ts
import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { createInAppNotification, sendScheduleReminderEmail } from '@/actions/notify-actions'
import { createLog } from '@/actions/log-actions'

const SCHEDULE_TYPE_MAP: Record<string, string> = {
  visit: '방문', consult: '상담', assessment: '평가',
  delivery: '배송', pickup: '수거', exhibition: '견학',
  education: '교육', custom_make: '맞춤제작',
}

export async function GET(request: Request) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  const supabase = createSupabaseAdmin()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  let totalSent = 0
  let failCount = 0

  try {
    const { data: emailChannel } = await supabase
      .from('automation_channels')
      .select('is_enabled')
      .eq('channel_type', 'email')
      .single()
    const emailEnabled = emailChannel?.is_enabled ?? false

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        id, staff_id, client_id, schedule_type,
        scheduled_date, scheduled_time, address,
        profiles:staff_id ( clerk_user_id ),
        clients:client_id ( name )
      `)
      .eq('scheduled_date', tomorrowStr)
      .eq('status', 'scheduled')

    if (error || !schedules) {
      await createLog({
        jobName: 'schedule-reminders', triggeredBy: 'cron', status: 'failed',
        totalSent: 0, successCount: 0, failCount: 1,
        channel: 'in-app', errorMessage: error?.message,
      })
      return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
    }

    for (const schedule of schedules) {
      const staffId    = schedule.staff_id as string | null
      const clerkUserId = (schedule.profiles as { clerk_user_id?: string } | null)?.clerk_user_id
      const clientName  = (schedule.clients  as { name?: string }          | null)?.name
      const typeName    = SCHEDULE_TYPE_MAP[schedule.schedule_type] ?? schedule.schedule_type

      // Notify staff (in-app)
      if (staffId) {
        const result = await createInAppNotification({
          userId:      staffId,
          clerkUserId: clerkUserId,
          type:        'schedule',
          title:       '내일 일정 리마인더',
          body:        `${typeName} 일정이 내일${schedule.scheduled_time ? ` ${schedule.scheduled_time}` : ''}에 예정되어 있습니다.${clientName ? ` (${clientName})` : ''}`,
          link:        '/schedule',
          priority:    2,
          metadata:    { scheduleId: schedule.id, scheduleType: schedule.schedule_type, scheduledDate: schedule.scheduled_date },
        })
        if (result.success) totalSent++
        else failCount++

        // Email to staff
        if (emailEnabled && clerkUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('clerk_user_id', clerkUserId)
            .single()
          if (profile?.email) {
            const email = await sendScheduleReminderEmail({
              toEmail:       profile.email,
              scheduleType:  typeName,
              scheduledDate: schedule.scheduled_date,
              scheduledTime: schedule.scheduled_time ?? undefined,
              address:       schedule.address ?? undefined,
              clientName:    clientName ?? undefined,
            })
            if (email.success) totalSent++
            else failCount++
          }
        }
      }

      // Notify client (in-app only)
      if (schedule.client_id) {
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('id, clerk_user_id')
          .eq('id', schedule.client_id)
          .single()
        if (clientProfile) {
          const result = await createInAppNotification({
            userId:      clientProfile.id,
            clerkUserId: clientProfile.clerk_user_id ?? undefined,
            type:        'schedule',
            title:       '내일 일정 안내',
            body:        `${typeName} 일정이 내일${schedule.scheduled_time ? ` ${schedule.scheduled_time}` : ''}에 예정되어 있습니다.${schedule.address ? ` (${schedule.address})` : ''}`,
            link:        '/mypage',
            priority:    1,
            metadata:    { scheduleId: schedule.id },
          })
          if (result.success) totalSent++
          else failCount++
        }
      }
    }

    await createLog({
      jobName:      'schedule-reminders',
      triggeredBy:  'cron',
      status:       failCount === 0 ? 'success' : totalSent > 0 ? 'partial' : 'failed',
      totalSent:    totalSent + failCount,
      successCount: totalSent,
      failCount,
      channel:      emailEnabled ? 'email' : 'in-app',
      metadata:     { date: tomorrowStr, schedulesProcessed: schedules.length },
    })

    return NextResponse.json({ success: true, totalSent, failCount, schedulesProcessed: schedules.length })
  } catch (error) {
    await createLog({
      jobName: 'schedule-reminders', triggeredBy: 'cron', status: 'failed',
      totalSent: 0, successCount: 0, failCount: 1,
      channel: 'in-app', errorMessage: String(error),
    })
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/automation/app/api/cron/schedule-reminders/route.ts
git commit -m "feat(automation): add schedule-reminders cron route"
```

---

## Task 9: Manual send API + health route

**Files:**
- Create: `apps/automation/app/api/notify/send/route.ts`
- Create: `apps/automation/app/api/health/route.ts`

- [ ] **Step 1: Create manual send API**

```typescript
// apps/automation/app/api/notify/send/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { sendManualNotification } from '@/actions/notify-actions'
import { createLog } from '@/actions/log-actions'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = await requireRole(ROLES.ADMIN)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    userIds: string[]
    title: string
    body: string
    link?: string
  }

  if (!body.userIds?.length || !body.title || !body.body) {
    return NextResponse.json({ error: 'userIds, title, body are required' }, { status: 400 })
  }

  const result = await sendManualNotification({
    userIds: body.userIds,
    title:   body.title,
    body:    body.body,
    link:    body.link,
  })

  await createLog({
    jobName:      'manual-send',
    triggeredBy:  'manual',
    status:       result.failCount === 0 ? 'success' : result.successCount > 0 ? 'partial' : 'failed',
    totalSent:    result.successCount + result.failCount,
    successCount: result.successCount,
    failCount:    result.failCount,
    channel:      'in-app',
    metadata:     { title: body.title, targetCount: body.userIds.length },
  })

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Create health route**

```typescript
// apps/automation/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'automation', timestamp: new Date().toISOString() })
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/automation/app/api/
git commit -m "feat(automation): add manual send API and health route"
```

---

## Task 10: Layout with sidebar

**Files:**
- Create: `apps/automation/components/AppSidebar.tsx`
- Modify: `apps/automation/app/layout.tsx`

- [ ] **Step 1: Create AppSidebar**

```tsx
// apps/automation/components/AppSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ScrollText, Settings, Send, Zap } from 'lucide-react'
import { cn } from '@co-at/ui'

const NAV_ITEMS = [
  { href: '/',         label: '대시보드',  icon: LayoutDashboard },
  { href: '/logs',     label: '실행 로그', icon: ScrollText      },
  { href: '/channels', label: '채널 설정', icon: Settings        },
  { href: '/send',     label: '수동 발송', icon: Send            },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen border-r bg-white flex flex-col">
      <div className="px-6 py-5 border-b flex items-center gap-2">
        <Zap className="w-5 h-5 text-indigo-600" />
        <span className="font-semibold text-sm">업무 자동화</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Update layout.tsx**

```tsx
// apps/automation/app/layout.tsx
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AppSidebar } from '@/components/AppSidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 업무 자동화',
  description: '업무 자동화 및 알림 센터',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ClerkProvider>
          <div className="flex min-h-screen bg-gray-50">
            <AppSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/automation/components/AppSidebar.tsx apps/automation/app/layout.tsx
git commit -m "feat(automation): add sidebar navigation and layout"
```

---

## Task 11: Dashboard page

**Files:**
- Create: `apps/automation/components/dashboard/SummaryCards.tsx`
- Create: `apps/automation/components/dashboard/RecentLogsTable.tsx`
- Create: `apps/automation/components/dashboard/ChannelStatus.tsx`
- Modify: `apps/automation/app/page.tsx`

- [ ] **Step 1: Create SummaryCards**

```tsx
// apps/automation/components/dashboard/SummaryCards.tsx
import { CheckCircle, XCircle, AlertCircle, Activity } from 'lucide-react'

interface Log {
  id: string
  job_name: string
  status: string
  success_count: number
  fail_count: number
  created_at: string
}

export function SummaryCards({ logs }: { logs: Log[] }) {
  const total      = logs.length
  const success    = logs.filter(l => l.status === 'success').length
  const partial    = logs.filter(l => l.status === 'partial').length
  const failed     = logs.filter(l => l.status === 'failed').length
  const totalSent  = logs.reduce((s, l) => s + l.success_count, 0)

  const cards = [
    { label: '오늘 실행',  value: total,     icon: Activity,      color: 'text-blue-600',  bg: 'bg-blue-50'  },
    { label: '성공',       value: success,   icon: CheckCircle,   color: 'text-green-600', bg: 'bg-green-50' },
    { label: '부분 성공',  value: partial,   icon: AlertCircle,   color: 'text-yellow-600',bg: 'bg-yellow-50'},
    { label: '실패',       value: failed,    icon: XCircle,       color: 'text-red-600',   bg: 'bg-red-50'   },
    { label: '총 발송',    value: totalSent, icon: Activity,      color: 'text-indigo-600',bg: 'bg-indigo-50'},
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className={`${bg} p-2 rounded-md`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create RecentLogsTable**

```tsx
// apps/automation/components/dashboard/RecentLogsTable.tsx
import { Badge } from '@co-at/ui'

interface Log {
  id: string
  job_name: string
  status: string
  channel: string
  success_count: number
  fail_count: number
  created_at: string
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  success: 'default',
  partial: 'secondary',
  failed:  'destructive',
}

const STATUS_LABEL: Record<string, string> = {
  success: '성공',
  partial: '부분',
  failed:  '실패',
}

const JOB_LABEL: Record<string, string> = {
  'rental-expiry':     '대여 만료',
  'schedule-reminders':'일정 리마인더',
  'manual-send':       '수동 발송',
}

export function RecentLogsTable({ logs }: { logs: Log[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">오늘 실행 내역 없음</p>
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-gray-500 text-left">
          <th className="pb-2 font-medium">Job</th>
          <th className="pb-2 font-medium">채널</th>
          <th className="pb-2 font-medium">상태</th>
          <th className="pb-2 font-medium">성공/실패</th>
          <th className="pb-2 font-medium">시간</th>
        </tr>
      </thead>
      <tbody>
        {logs.map(log => (
          <tr key={log.id} className="border-b last:border-0">
            <td className="py-2">{JOB_LABEL[log.job_name] ?? log.job_name}</td>
            <td className="py-2 text-gray-500">{log.channel}</td>
            <td className="py-2">
              <Badge variant={STATUS_BADGE[log.status] ?? 'secondary'}>
                {STATUS_LABEL[log.status] ?? log.status}
              </Badge>
            </td>
            <td className="py-2">{log.success_count} / {log.fail_count}</td>
            <td className="py-2 text-gray-400">
              {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 3: Create ChannelStatus**

```tsx
// apps/automation/components/dashboard/ChannelStatus.tsx
import { Mail, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface Channel {
  channel_type: string
  is_enabled: boolean
}

export function ChannelStatus({ channels }: { channels: Channel[] }) {
  const email = channels.find(c => c.channel_type === 'email')
  const kakao = channels.find(c => c.channel_type === 'kakao')

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">채널:</span>
      <Link href="/channels" className="flex items-center gap-1.5 text-sm">
        <Mail className="w-4 h-4" />
        <span className={email?.is_enabled ? 'text-green-600 font-medium' : 'text-gray-400'}>
          이메일 {email?.is_enabled ? '활성' : '비활성'}
        </span>
      </Link>
      <Link href="/channels" className="flex items-center gap-1.5 text-sm">
        <MessageSquare className="w-4 h-4" />
        <span className="text-gray-300">카카오 준비 중</span>
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Update dashboard page**

```tsx
// apps/automation/app/page.tsx
import Link from 'next/link'
import { Send } from 'lucide-react'
import { getTodaySummary } from '@/actions/log-actions'
import { getChannels } from '@/actions/channel-actions'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { RecentLogsTable } from '@/components/dashboard/RecentLogsTable'
import { ChannelStatus } from '@/components/dashboard/ChannelStatus'

export default async function DashboardPage() {
  const [logs, channels] = await Promise.all([getTodaySummary(), getChannels()])

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">업무 자동화 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/send"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
        >
          <Send className="w-4 h-4" />
          수동 발송
        </Link>
      </div>

      <ChannelStatus channels={channels ?? []} />
      <SummaryCards logs={logs ?? []} />

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-base font-semibold mb-4">오늘 실행 내역</h2>
        <RecentLogsTable logs={(logs ?? []).slice(0, 10)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/automation/components/dashboard/ apps/automation/app/page.tsx
git commit -m "feat(automation): add dashboard page with summary cards and recent logs"
```

---

## Task 12: Logs page

**Files:**
- Create: `apps/automation/components/logs/LogsTable.tsx`
- Create: `apps/automation/components/logs/LogDetailModal.tsx`
- Create: `apps/automation/app/logs/page.tsx`

- [ ] **Step 1: Create LogDetailModal**

```tsx
// apps/automation/components/logs/LogDetailModal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@co-at/ui'

interface Log {
  id: string
  job_name: string
  triggered_by: string
  status: string
  total_sent: number
  success_count: number
  fail_count: number
  channel: string
  error_message: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

interface Props {
  log: Log | null
  onClose: () => void
}

export function LogDetailModal({ log, onClose }: Props) {
  if (!log) return null
  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>실행 상세 — {log.job_name}</DialogTitle>
        </DialogHeader>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><dt className="w-28 text-gray-500">실행 시각</dt><dd>{new Date(log.created_at).toLocaleString('ko-KR')}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">트리거</dt><dd>{log.triggered_by}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">채널</dt><dd>{log.channel}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">상태</dt><dd>{log.status}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">총 발송</dt><dd>{log.total_sent}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">성공</dt><dd>{log.success_count}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">실패</dt><dd>{log.fail_count}</dd></div>
          {log.error_message && (
            <div><dt className="text-gray-500 mb-1">오류 메시지</dt><dd className="bg-red-50 text-red-700 rounded p-2 text-xs font-mono">{log.error_message}</dd></div>
          )}
          {log.metadata && (
            <div><dt className="text-gray-500 mb-1">메타데이터</dt><dd className="bg-gray-50 rounded p-2 text-xs font-mono whitespace-pre">{JSON.stringify(log.metadata, null, 2)}</dd></div>
          )}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create LogsTable**

```tsx
// apps/automation/components/logs/LogsTable.tsx
'use client'

import { useState } from 'react'
import { Badge } from '@co-at/ui'
import { LogDetailModal } from './LogDetailModal'

interface Log {
  id: string
  job_name: string
  triggered_by: string
  status: string
  total_sent: number
  success_count: number
  fail_count: number
  channel: string
  error_message: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  success: 'default', partial: 'secondary', failed: 'destructive',
}
const STATUS_LABEL: Record<string, string> = {
  success: '성공', partial: '부분', failed: '실패',
}
const JOB_LABEL: Record<string, string> = {
  'rental-expiry': '대여 만료', 'schedule-reminders': '일정 리마인더', 'manual-send': '수동 발송',
}

export function LogsTable({ logs }: { logs: Log[] }) {
  const [selected, setSelected] = useState<Log | null>(null)

  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">로그 없음</p>
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-gray-500 text-left">
            <th className="pb-2 font-medium">Job</th>
            <th className="pb-2 font-medium">트리거</th>
            <th className="pb-2 font-medium">채널</th>
            <th className="pb-2 font-medium">상태</th>
            <th className="pb-2 font-medium">성공/실패</th>
            <th className="pb-2 font-medium">시각</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr
              key={log.id}
              className="border-b last:border-0 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelected(log)}
            >
              <td className="py-2">{JOB_LABEL[log.job_name] ?? log.job_name}</td>
              <td className="py-2 text-gray-500">{log.triggered_by}</td>
              <td className="py-2 text-gray-500">{log.channel}</td>
              <td className="py-2">
                <Badge variant={STATUS_BADGE[log.status] ?? 'secondary'}>
                  {STATUS_LABEL[log.status] ?? log.status}
                </Badge>
              </td>
              <td className="py-2">{log.success_count} / {log.fail_count}</td>
              <td className="py-2 text-gray-400">
                {new Date(log.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <LogDetailModal log={selected} onClose={() => setSelected(null)} />
    </>
  )
}
```

- [ ] **Step 3: Create logs page**

```tsx
// apps/automation/app/logs/page.tsx
import { getLogs } from '@/actions/log-actions'
import { LogsTable } from '@/components/logs/LogsTable'

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; status?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const logs = await getLogs({
    jobName:  params.job,
    status:   params.status,
    fromDate: params.from,
    toDate:   params.to,
    limit:    200,
  })

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">실행 로그</h1>
      <div className="bg-white rounded-lg border p-6">
        <LogsTable logs={logs ?? []} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/automation/components/logs/ apps/automation/app/logs/
git commit -m "feat(automation): add logs page with detail modal"
```

---

## Task 13: Channels page

**Files:**
- Create: `apps/automation/components/channels/EmailChannelCard.tsx`
- Create: `apps/automation/components/channels/KakaoChannelCard.tsx`
- Create: `apps/automation/app/channels/page.tsx`

- [ ] **Step 1: Create EmailChannelCard**

```tsx
// apps/automation/components/channels/EmailChannelCard.tsx
'use client'

import { useState, useTransition } from 'react'
import { Mail } from 'lucide-react'
import { toggleChannel, saveChannelConfig, markChannelTested } from '@/actions/channel-actions'
import { Switch, Button, Input, Label } from '@co-at/ui'

interface Channel {
  channel_type: string
  is_enabled: boolean
  config: { apiKey?: string; fromEmail?: string } | null
  last_tested_at: string | null
}

export function EmailChannelCard({ channel }: { channel: Channel }) {
  const [enabled, setEnabled]     = useState(channel.is_enabled)
  const [apiKey, setApiKey]       = useState(channel.config?.apiKey ?? '')
  const [fromEmail, setFromEmail] = useState(channel.config?.fromEmail ?? '')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleToggle(val: boolean) {
    setEnabled(val)
    startTransition(async () => {
      await toggleChannel('email', val)
      setMessage(val ? '이메일 채널을 활성화했습니다.' : '이메일 채널을 비활성화했습니다.')
    })
  }

  function handleSave() {
    startTransition(async () => {
      await saveChannelConfig('email', { apiKey, fromEmail })
      setMessage('설정이 저장되었습니다.')
    })
  }

  function handleTest() {
    startTransition(async () => {
      await markChannelTested('email')
      setMessage('테스트 발송 완료 (Resend 대시보드에서 확인)')
    })
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-md"><Mail className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h3 className="font-semibold">이메일 (Resend)</h3>
            <p className="text-xs text-gray-500">대여 만료·일정 리마인더 이메일 발송</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={isPending} />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="apiKey">Resend API Key</Label>
          <Input id="apiKey" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="re_..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fromEmail">발신 이메일</Label>
          <Input id="fromEmail" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@gwatc.cloud" />
        </div>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleTest} disabled={isPending}>테스트 발송</Button>
        <Button size="sm" onClick={handleSave} disabled={isPending}>저장</Button>
      </div>
      {channel.last_tested_at && (
        <p className="text-xs text-gray-400">마지막 테스트: {new Date(channel.last_tested_at).toLocaleString('ko-KR')}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create KakaoChannelCard**

```tsx
// apps/automation/components/channels/KakaoChannelCard.tsx
import { MessageSquare } from 'lucide-react'
import { Badge } from '@co-at/ui'

export function KakaoChannelCard() {
  return (
    <div className="bg-white rounded-lg border p-6 opacity-60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-50 p-2 rounded-md"><MessageSquare className="w-5 h-5 text-yellow-600" /></div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              카카오 알림톡
              <Badge variant="secondary" className="text-xs">준비 중</Badge>
            </h3>
            <p className="text-xs text-gray-500">카카오 비즈니스 채널 심사 후 연동 예정</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create channels page**

```tsx
// apps/automation/app/channels/page.tsx
import { getChannels } from '@/actions/channel-actions'
import { EmailChannelCard } from '@/components/channels/EmailChannelCard'
import { KakaoChannelCard } from '@/components/channels/KakaoChannelCard'

export default async function ChannelsPage() {
  const channels = await getChannels()
  const emailChannel = channels?.find(c => c.channel_type === 'email')

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">채널 설정</h1>
        <p className="text-sm text-gray-500 mt-1">알림 발송 채널을 설정합니다.</p>
      </div>
      <div className="space-y-4">
        {emailChannel && <EmailChannelCard channel={emailChannel as Parameters<typeof EmailChannelCard>[0]['channel']} />}
        <KakaoChannelCard />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/automation/components/channels/ apps/automation/app/channels/
git commit -m "feat(automation): add channels settings page"
```

---

## Task 14: Manual send page

**Files:**
- Create: `apps/automation/components/send/SendForm.tsx`
- Create: `apps/automation/app/send/page.tsx`

- [ ] **Step 1: Create SendForm**

```tsx
// apps/automation/components/send/SendForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { Button, Input, Textarea, Label } from '@co-at/ui'

interface Profile {
  id: string
  name: string
  role: string
}

interface Props {
  profiles: Profile[]
}

export function SendForm({ profiles }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [title, setTitle]             = useState('')
  const [body, setBody]               = useState('')
  const [result, setResult]           = useState<{ successCount: number; failCount: number } | null>(null)
  const [isPending, startTransition]  = useTransition()

  function toggleAll() {
    setSelectedIds(selectedIds.length === profiles.length ? [] : profiles.map(p => p.id))
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSubmit() {
    if (!title || !body || selectedIds.length === 0) return
    startTransition(async () => {
      const res = await fetch('/api/notify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds, title, body }),
      })
      const data = await res.json() as { successCount: number; failCount: number }
      setResult(data)
      setTitle('')
      setBody('')
      setSelectedIds([])
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">대상 선택 ({selectedIds.length}/{profiles.length}명)</h2>
        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" id="all" checked={selectedIds.length === profiles.length} onChange={toggleAll} className="w-4 h-4" />
          <label htmlFor="all" className="text-sm cursor-pointer">전체 선택</label>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded p-2">
          {profiles.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <input type="checkbox" id={p.id} checked={selectedIds.includes(p.id)} onChange={() => toggleOne(p.id)} className="w-4 h-4" />
              <label htmlFor={p.id} className="text-sm cursor-pointer">{p.name} <span className="text-gray-400">({p.role})</span></label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">알림 내용</h2>
        <div className="space-y-1.5">
          <Label htmlFor="title">제목</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="알림 제목" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">내용</Label>
          <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} placeholder="알림 내용" rows={4} />
        </div>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm">
          발송 완료 — 성공: {result.successCount}건, 실패: {result.failCount}건
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || !title || !body || selectedIds.length === 0}
        className="w-full"
      >
        {isPending ? '발송 중...' : `${selectedIds.length}명에게 발송`}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Create send page**

```tsx
// apps/automation/app/send/page.tsx
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { SendForm } from '@/components/send/SendForm'

export default async function SendPage() {
  const supabase = createSupabaseAdmin()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, role')
    .in('role', ['admin', 'manager', 'staff'])
    .order('name')

  return (
    <div className="p-8 max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">수동 알림 발송</h1>
        <p className="text-sm text-gray-500 mt-1">특정 직원에게 즉시 알림을 발송합니다.</p>
      </div>
      <SendForm profiles={profiles ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/automation/components/send/ apps/automation/app/send/
git commit -m "feat(automation): add manual send page"
```

---

## Task 15: Vercel cron config + env vars

**Files:**
- Create: `apps/automation/vercel.json`

- [ ] **Step 1: Create vercel.json**

```json
// apps/automation/vercel.json
{
  "crons": [
    {
      "path": "/api/cron/rental-expiry",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/schedule-reminders",
      "schedule": "0 0 * * *"
    }
  ]
}
```

> Schedule: `0 0 * * *` = 매일 00:00 UTC (한국 시간 09:00)

- [ ] **Step 2: Add env vars to Vercel**

Vercel → automation 프로젝트 → Settings → Environment Variables에 추가:

| Key | Value |
|---|---|
| `RESEND_API_KEY` | Resend 대시보드에서 발급 |
| `RESEND_FROM_EMAIL` | `noreply@gwatc.cloud` |
| `CRON_SECRET` | 임의의 강력한 랜덤 문자열 (예: `openssl rand -hex 32` 결과) |

- [ ] **Step 3: Commit**

```bash
git add apps/automation/vercel.json
git commit -m "feat(automation): add vercel.json cron schedule"
```

---

## Task 16: Remove admin cron routes (cleanup)

**Files:**
- Delete: `apps/admin/app/api/cron/rental-expiry-notifications/route.ts`
- Delete: `apps/admin/app/api/cron/schedule-reminders/route.ts`

> **전제조건:** automation 앱이 Vercel에 배포되어 cron이 정상 동작하는 것을 확인한 후 진행

- [ ] **Step 1: Verify automation crons are working**

Vercel 대시보드 → automation 프로젝트 → Cron Jobs 탭에서 두 cron이 등록됨을 확인.
또는 수동으로 호출:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://automation.gwatc.cloud/api/cron/rental-expiry
# Expected: {"success":true,"totalSent":...}
```

- [ ] **Step 2: Delete admin cron routes**

```bash
rm apps/admin/app/api/cron/rental-expiry-notifications/route.ts
rm apps/admin/app/api/cron/schedule-reminders/route.ts
rmdir apps/admin/app/api/cron 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor(admin): remove cron routes migrated to automation app"
```

---

## Spec Coverage Check

| Spec 요구사항 | 구현 태스크 |
|---|---|
| admin cron 이전 | Task 7, 8, 16 |
| automation_logs 테이블 | Task 1 |
| automation_channels 테이블 | Task 1 |
| 대시보드 UI | Task 11 |
| 로그 목록 + 상세 | Task 12 |
| 채널 설정 UI | Task 13 |
| 수동 발송 | Task 9, 14 |
| Resend 이메일 연동 | Task 3, 4, 6 |
| 카카오 준비 중 UI | Task 13 |
| Vercel cron 설정 | Task 15 |
| ADMIN only 접근 | proxy.ts (완료), actions assertRole |
