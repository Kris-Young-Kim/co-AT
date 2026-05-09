# Inventory Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the inventory app with custom-made orders, reuse dispatches, fabrication equipment tracking, QR-based device management, maintenance logs, and approval app integration.

**Architecture:** All server actions live at the monorepo root `actions/` (imported via `@/actions/...`). New tables are prefixed `inventory_`. The QR system uses URL-encoded tokens so any phone camera app can scan and open the device page. Equipment status is derived from active custom order assignments.

**Tech Stack:** Next.js 16 App Router, Supabase (service role for admin writes), Clerk auth, `qrcode.react` (QRCodeSVG), ExcelJS, TypeScript strict, Tailwind CSS

**Worktree:** `.worktrees/feature-inventory-phase2` (branch `feature/inventory-phase2`)

---

## File Map

**Create:**
- `migrations/047_inventory_phase2.sql`
- `packages/types/src/inventory.types.ts`
- `actions/custom-order-actions.ts`
- `actions/reuse-actions.ts`
- `actions/fab-equipment-actions.ts`
- `apps/inventory/app/scan/[qr_token]/page.tsx`
- `apps/inventory/components/inventory/QrLabelPrint.tsx`
- `apps/inventory/components/inventory/DispatchPanel.tsx`
- `apps/inventory/app/custom-orders/page.tsx`
- `apps/inventory/app/custom-orders/[id]/page.tsx`
- `apps/inventory/app/reuse/page.tsx`
- `apps/inventory/app/reuse/[id]/page.tsx`
- `apps/inventory/app/fab-equipment/page.tsx`
- `apps/inventory/app/fab-equipment/[id]/page.tsx`
- `apps/inventory/app/maintenance/page.tsx`
- `apps/inventory/app/reports/page.tsx`
- `apps/inventory/actions/report-actions.ts`
- `apps/web/app/track/[track_token]/page.tsx`

**Modify:**
- `packages/types/src/index.ts` — add `export * from './inventory.types'`
- `apps/inventory/package.json` — add `qrcode.react`, `exceljs`, `date-fns`
- `actions/rental-actions.ts` — add `approval_id`, `pending_assignment` status, extend logic
- `actions/inventory-actions.ts` — add `qr_token` support, `updateInventoryStatus` to accept new statuses
- `apps/inventory/app/devices/[id]/page.tsx` — add QR print + dispatch button + maintenance tab
- `apps/inventory/components/layout/InventorySidebar.tsx` — add new nav items
- `apps/inventory/app/page.tsx` — add equipment utilization card
- `apps/approval/actions/approval-actions.ts` — auto-insert inventory record on final approval

---

## Task 1: Add Dependencies

**Files:**
- Modify: `apps/inventory/package.json`

- [ ] **Step 1: Add packages**

In `apps/inventory/package.json`, add to `dependencies`:
```json
"qrcode.react": "^4.2.0",
"exceljs": "^4.4.0",
"date-fns": "^3.0.0"
```

- [ ] **Step 2: Install**

```bash
cd .worktrees/feature-inventory-phase2
pnpm install
```

Expected: no errors, `node_modules` updated.

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/package.json pnpm-lock.yaml
git commit -m "chore: add qrcode.react, exceljs, date-fns to inventory app"
```

---

## Task 2: DB Migration

**Files:**
- Create: `migrations/047_inventory_phase2.sql`

- [ ] **Step 1: Create migration file**

```sql
-- migrations/047_inventory_phase2.sql

-- 1. Extend inventory table
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS qr_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Backfill existing rows
UPDATE inventory SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;
ALTER TABLE inventory ALTER COLUMN qr_token SET NOT NULL;

-- 2. Extend rentals table
ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS approval_id UUID REFERENCES approval_documents(id),
  ADD COLUMN IF NOT EXISTS wait_list_checked_at TIMESTAMPTZ;

-- Allow inventory_id to be null (pending_assignment status before device scanned)
ALTER TABLE rentals ALTER COLUMN inventory_id DROP NOT NULL;

-- extension_count already exists; ensure max is enforced at app level

-- 3. Custom-made orders
CREATE TABLE IF NOT EXISTS inventory_custom_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID REFERENCES inventory(id),
  client_id       UUID NOT NULL REFERENCES eval_clients(id),
  approval_id     UUID REFERENCES approval_documents(id),
  status          TEXT NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested','in_progress','completed','delivered')),
  track_token     UUID UNIQUE DEFAULT gen_random_uuid(),
  requested_at    TIMESTAMPTZ DEFAULT now(),
  delivered_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Reuse dispatches
CREATE TABLE IF NOT EXISTS inventory_reuse_dispatches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID NOT NULL REFERENCES inventory(id),
  client_id       UUID NOT NULL REFERENCES eval_clients(id),
  approval_id     UUID REFERENCES approval_documents(id),
  status          TEXT NOT NULL DEFAULT 'donated'
                    CHECK (status IN ('donated','inspecting','cleaning','delivered')),
  dispatched_at   TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. Fabrication equipment
CREATE TABLE IF NOT EXISTS inventory_fab_equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('3d_printer','cnc','laser','other')),
  status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available','in_use','maintenance')),
  serial_number   TEXT,
  purchased_at    DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. Custom order ↔ equipment junction (N:M)
CREATE TABLE IF NOT EXISTS inventory_custom_order_equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES inventory_custom_orders(id) ON DELETE CASCADE,
  equipment_id    UUID NOT NULL REFERENCES inventory_fab_equipment(id),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  notes           TEXT,
  UNIQUE (custom_order_id, equipment_id)
);

-- 7. Maintenance logs
CREATE TABLE IF NOT EXISTS inventory_maintenance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID NOT NULL REFERENCES inventory(id),
  type            TEXT NOT NULL CHECK (type IN ('inspection','repair','cleaning')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','done')),
  performed_at    TIMESTAMPTZ,
  technician      TEXT,
  cost            INTEGER DEFAULT 0,
  notes           TEXT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 8. Dispatch summary view
CREATE OR REPLACE VIEW inventory_dispatch_summary AS
  SELECT 'rental'::text AS dispatch_type, id, device_id, client_id, approval_id, status, created_at
  FROM rentals
  UNION ALL
  SELECT 'custom'::text, id, device_id, client_id, approval_id, status, created_at
  FROM inventory_custom_orders
  UNION ALL
  SELECT 'reuse'::text, id, device_id, client_id, approval_id, status, created_at
  FROM inventory_reuse_dispatches;

-- 9. updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_orders_updated_at') THEN
    CREATE TRIGGER trg_custom_orders_updated_at
      BEFORE UPDATE ON inventory_custom_orders
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reuse_dispatches_updated_at') THEN
    CREATE TRIGGER trg_reuse_dispatches_updated_at
      BEFORE UPDATE ON inventory_reuse_dispatches
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fab_equipment_updated_at') THEN
    CREATE TRIGGER trg_fab_equipment_updated_at
      BEFORE UPDATE ON inventory_fab_equipment
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- 10. RLS
ALTER TABLE inventory_custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reuse_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_fab_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_custom_order_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all; writes handled via service role in server actions
CREATE POLICY "auth_read_custom_orders" ON inventory_custom_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_custom_orders" ON inventory_custom_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_reuse" ON inventory_reuse_dispatches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_reuse" ON inventory_reuse_dispatches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_fab_equipment" ON inventory_fab_equipment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_fab_equipment" ON inventory_fab_equipment
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_order_equipment" ON inventory_custom_order_equipment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_order_equipment" ON inventory_custom_order_equipment
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_maintenance" ON inventory_maintenance_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_maintenance" ON inventory_maintenance_logs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "service_all_maintenance" ON inventory_maintenance_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 11. Extend approval_documents type check (add rental, custom_make, reuse)
ALTER TABLE approval_documents
  DROP CONSTRAINT IF EXISTS approval_documents_type_check;
ALTER TABLE approval_documents
  ADD CONSTRAINT approval_documents_type_check
  CHECK (type IN ('expenditure','leave','business_report','rental','custom_make','reuse'));
```

- [ ] **Step 2: Apply migration to Supabase**

In Supabase Dashboard → SQL Editor, run the migration file contents.

- [ ] **Step 3: Commit**

```bash
git add migrations/047_inventory_phase2.sql
git commit -m "feat: add inventory phase2 DB migration (custom orders, reuse, fab equipment, maintenance)"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `packages/types/src/inventory.types.ts`
- Modify: `packages/types/src/index.ts`

- [ ] **Step 1: Create types file**

```typescript
// packages/types/src/inventory.types.ts

export type CustomOrderStatus = 'requested' | 'in_progress' | 'completed' | 'delivered'
export type ReuseDispatchStatus = 'donated' | 'inspecting' | 'cleaning' | 'delivered'
export type FabEquipmentType = '3d_printer' | 'cnc' | 'laser' | 'other'
export type FabEquipmentStatus = 'available' | 'in_use' | 'maintenance'
export type MaintenanceLogType = 'inspection' | 'repair' | 'cleaning'
export type MaintenanceLogStatus = 'pending' | 'in_progress' | 'done'

export interface InventoryCustomOrder {
  id: string
  device_id: string | null
  client_id: string
  approval_id: string | null
  status: CustomOrderStatus
  track_token: string
  requested_at: string
  delivered_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryCustomOrderWithDetails extends InventoryCustomOrder {
  client_name?: string | null
  device_name?: string | null
  equipment?: InventoryFabEquipmentAssignment[]
}

export interface InventoryReuseDispatch {
  id: string
  device_id: string
  client_id: string
  approval_id: string | null
  status: ReuseDispatchStatus
  dispatched_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryReuseDispatchWithDetails extends InventoryReuseDispatch {
  client_name?: string | null
  device_name?: string | null
}

export interface InventoryFabEquipment {
  id: string
  name: string
  type: FabEquipmentType
  status: FabEquipmentStatus
  serial_number: string | null
  purchased_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryFabEquipmentAssignment {
  id: string
  custom_order_id: string
  equipment_id: string
  started_at: string | null
  finished_at: string | null
  notes: string | null
  equipment?: InventoryFabEquipment
}

export interface InventoryMaintenanceLog {
  id: string
  device_id: string
  type: MaintenanceLogType
  status: MaintenanceLogStatus
  performed_at: string | null
  technician: string | null
  cost: number
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface CreateCustomOrderInput {
  client_id: string
  approval_id?: string
  notes?: string
}

export interface CreateReuseDispatchInput {
  device_id: string
  client_id: string
  approval_id?: string
  notes?: string
}

export interface CreateMaintenanceLogInput {
  device_id: string
  type: MaintenanceLogType
  status?: MaintenanceLogStatus
  performed_at?: string
  technician?: string
  cost?: number
  notes?: string
}
```

- [ ] **Step 2: Export from index**

In `packages/types/src/index.ts`, add:
```typescript
export * from './inventory.types'
```

- [ ] **Step 3: Typecheck**

```bash
cd .worktrees/feature-inventory-phase2
pnpm --filter @co-at/types build 2>&1 || pnpm typecheck 2>&1
```

Expected: no type errors in types package.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/inventory.types.ts packages/types/src/index.ts
git commit -m "feat: add inventory phase2 TypeScript types"
```

---

## Task 4: Custom Order Server Actions

**Files:**
- Create: `actions/custom-order-actions.ts`

- [ ] **Step 1: Create actions file**

```typescript
// actions/custom-order-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { revalidatePath } from 'next/cache'
import type {
  InventoryCustomOrderWithDetails,
  InventoryFabEquipmentAssignment,
  CreateCustomOrderInput,
  CustomOrderStatus,
} from '@co-at/types'

const supabase = () => createAdminClient()

export async function getCustomOrders(filters?: {
  status?: CustomOrderStatus
  limit?: number
}): Promise<{ success: boolean; orders?: InventoryCustomOrderWithDetails[]; error?: string }> {
  let query = supabase()
    .from('inventory_custom_orders')
    .select('*, eval_clients(name), inventory(name)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query

  if (error) return { success: false, error: error.message }
  const orders = (data ?? []).map(o => ({
    ...o,
    client_name: (o.eval_clients as { name?: string } | null)?.name ?? null,
    device_name: (o.inventory as { name?: string } | null)?.name ?? null,
  }))
  return { success: true, orders }
}

export async function getCustomOrderById(id: string): Promise<{
  success: boolean
  order?: InventoryCustomOrderWithDetails
  error?: string
}> {
  const { data, error } = await supabase()
    .from('inventory_custom_orders')
    .select(`
      *,
      eval_clients(name),
      inventory(name),
      inventory_custom_order_equipment(*, inventory_fab_equipment(*))
    `)
    .eq('id', id)
    .single()

  if (error || !data) return { success: false, error: error?.message ?? 'Not found' }

  const equipment = ((data.inventory_custom_order_equipment as InventoryFabEquipmentAssignment[]) ?? [])

  return {
    success: true,
    order: {
      ...data,
      client_name: (data.eval_clients as { name?: string } | null)?.name ?? null,
      device_name: (data.inventory as { name?: string } | null)?.name ?? null,
      equipment,
    },
  }
}

export async function createCustomOrder(
  input: CreateCustomOrderInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { data, error } = await supabase()
    .from('inventory_custom_orders')
    .insert({ client_id: input.client_id, approval_id: input.approval_id ?? null, notes: input.notes ?? null })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/custom-orders')
  return { success: true, id: data.id }
}

export async function updateCustomOrderStatus(
  id: string,
  status: CustomOrderStatus,
  extra?: { device_id?: string; delivered_at?: string }
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (extra?.device_id) updates.device_id = extra.device_id
  if (status === 'delivered') updates.delivered_at = extra?.delivered_at ?? new Date().toISOString()

  const { error } = await supabase()
    .from('inventory_custom_orders')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/custom-orders')
  revalidatePath(`/custom-orders/${id}`)
  return { success: true }
}

export async function assignEquipmentToOrder(
  customOrderId: string,
  equipmentId: string
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { error } = await supabase()
    .from('inventory_custom_order_equipment')
    .upsert({ custom_order_id: customOrderId, equipment_id: equipmentId, started_at: new Date().toISOString() })

  if (error) return { success: false, error: error.message }

  // Mark equipment as in_use
  await supabase()
    .from('inventory_fab_equipment')
    .update({ status: 'in_use', updated_at: new Date().toISOString() })
    .eq('id', equipmentId)

  revalidatePath(`/custom-orders/${customOrderId}`)
  revalidatePath('/fab-equipment')
  return { success: true }
}

export async function finishEquipmentUsage(
  customOrderId: string,
  equipmentId: string
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  await supabase()
    .from('inventory_custom_order_equipment')
    .update({ finished_at: new Date().toISOString() })
    .eq('custom_order_id', customOrderId)
    .eq('equipment_id', equipmentId)

  // Check if equipment is still assigned to any active order; if not, set available
  const { data: activeAssignments } = await supabase()
    .from('inventory_custom_order_equipment')
    .select('id')
    .eq('equipment_id', equipmentId)
    .is('finished_at', null)

  if (!activeAssignments || activeAssignments.length === 0) {
    await supabase()
      .from('inventory_fab_equipment')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', equipmentId)
  }

  revalidatePath(`/custom-orders/${customOrderId}`)
  revalidatePath('/fab-equipment')
  return { success: true }
}

// Called from approval app on final approval
export async function createCustomOrderFromApproval(
  clientId: string,
  approvalId: string
): Promise<{ success: boolean; id?: string; trackToken?: string; error?: string }> {
  const { data, error } = await supabase()
    .from('inventory_custom_orders')
    .insert({ client_id: clientId, approval_id: approvalId, status: 'requested' })
    .select('id, track_token')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, id: data.id, trackToken: data.track_token }
}
```

- [ ] **Step 2: Typecheck**

```bash
cd .worktrees/feature-inventory-phase2
pnpm typecheck 2>&1 | grep "actions/custom-order"
```

Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add actions/custom-order-actions.ts
git commit -m "feat: add custom order server actions"
```

---

## Task 5: Reuse Server Actions

**Files:**
- Create: `actions/reuse-actions.ts`

- [ ] **Step 1: Create actions file**

```typescript
// actions/reuse-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { revalidatePath } from 'next/cache'
import type {
  InventoryReuseDispatchWithDetails,
  CreateReuseDispatchInput,
  ReuseDispatchStatus,
} from '@co-at/types'

const supabase = () => createAdminClient()

export async function getReuseDispatches(filters?: {
  status?: ReuseDispatchStatus
  limit?: number
}): Promise<{ success: boolean; dispatches?: InventoryReuseDispatchWithDetails[]; error?: string }> {
  let query = supabase()
    .from('inventory_reuse_dispatches')
    .select('*, eval_clients(name), inventory(name)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) return { success: false, error: error.message }

  const dispatches = (data ?? []).map(d => ({
    ...d,
    client_name: (d.eval_clients as { name?: string } | null)?.name ?? null,
    device_name: (d.inventory as { name?: string } | null)?.name ?? null,
  }))
  return { success: true, dispatches }
}

export async function getReuseDispatchById(id: string): Promise<{
  success: boolean
  dispatch?: InventoryReuseDispatchWithDetails
  error?: string
}> {
  const { data, error } = await supabase()
    .from('inventory_reuse_dispatches')
    .select('*, eval_clients(name), inventory(name)')
    .eq('id', id)
    .single()

  if (error || !data) return { success: false, error: error?.message ?? 'Not found' }
  return {
    success: true,
    dispatch: {
      ...data,
      client_name: (data.eval_clients as { name?: string } | null)?.name ?? null,
      device_name: (data.inventory as { name?: string } | null)?.name ?? null,
    },
  }
}

export async function createReuseDispatch(
  input: CreateReuseDispatchInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { data, error } = await supabase()
    .from('inventory_reuse_dispatches')
    .insert({
      device_id: input.device_id,
      client_id: input.client_id,
      approval_id: input.approval_id ?? null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  // Mark device as dispatched
  await supabase()
    .from('inventory')
    .update({ status: '대여중', updated_at: new Date().toISOString() })
    .eq('id', input.device_id)

  revalidatePath('/reuse')
  return { success: true, id: data.id }
}

export async function updateReuseStatus(
  id: string,
  status: ReuseDispatchStatus
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'delivered') updates.dispatched_at = new Date().toISOString()

  const { error } = await supabase()
    .from('inventory_reuse_dispatches')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/reuse')
  revalidatePath(`/reuse/${id}`)
  return { success: true }
}

// Called from approval app on final approval
export async function createReuseFromApproval(
  deviceId: string,
  clientId: string,
  approvalId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase()
    .from('inventory_reuse_dispatches')
    .insert({ device_id: deviceId, client_id: clientId, approval_id: approvalId, status: 'donated' })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, id: data.id }
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/reuse-actions.ts
git commit -m "feat: add reuse dispatch server actions"
```

---

## Task 6: Fabrication Equipment Server Actions

**Files:**
- Create: `actions/fab-equipment-actions.ts`

- [ ] **Step 1: Create actions file**

```typescript
// actions/fab-equipment-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { revalidatePath } from 'next/cache'
import type { InventoryFabEquipment, FabEquipmentStatus } from '@co-at/types'

const supabase = () => createAdminClient()

export async function getFabEquipment(): Promise<{
  success: boolean
  equipment?: InventoryFabEquipment[]
  error?: string
}> {
  const { data, error } = await supabase()
    .from('inventory_fab_equipment')
    .select('*')
    .order('name')

  if (error) return { success: false, error: error.message }
  return { success: true, equipment: data ?? [] }
}

export async function getFabEquipmentById(id: string): Promise<{
  success: boolean
  equipment?: InventoryFabEquipment & { active_orders?: { id: string; client_name: string | null; status: string }[] }
  error?: string
}> {
  const [eqResult, ordersResult] = await Promise.all([
    supabase().from('inventory_fab_equipment').select('*').eq('id', id).single(),
    supabase()
      .from('inventory_custom_order_equipment')
      .select('custom_order_id, inventory_custom_orders(id, status, eval_clients(name))')
      .eq('equipment_id', id)
      .order('started_at', { ascending: false })
      .limit(20),
  ])

  if (eqResult.error || !eqResult.data) return { success: false, error: eqResult.error?.message ?? 'Not found' }

  const active_orders = (ordersResult.data ?? []).map(r => {
    const o = r.inventory_custom_orders as { id: string; status: string; eval_clients: { name?: string } | null } | null
    return { id: o?.id ?? '', client_name: o?.eval_clients?.name ?? null, status: o?.status ?? '' }
  })

  return { success: true, equipment: { ...eqResult.data, active_orders } }
}

export async function createFabEquipment(input: {
  name: string
  type: string
  serial_number?: string
  purchased_at?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { error } = await supabase()
    .from('inventory_fab_equipment')
    .insert({ name: input.name, type: input.type, serial_number: input.serial_number ?? null, purchased_at: input.purchased_at ?? null, notes: input.notes ?? null })

  if (error) return { success: false, error: error.message }
  revalidatePath('/fab-equipment')
  return { success: true }
}

export async function updateFabEquipmentStatus(
  id: string,
  status: FabEquipmentStatus
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { error } = await supabase()
    .from('inventory_fab_equipment')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/fab-equipment')
  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/fab-equipment-actions.ts
git commit -m "feat: add fabrication equipment server actions"
```

---

## Task 7: Maintenance Log Server Actions

**Files:**
- Create: `actions/maintenance-actions.ts`

- [ ] **Step 1: Create actions file**

```typescript
// actions/maintenance-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { revalidatePath } from 'next/cache'
import type { InventoryMaintenanceLog, CreateMaintenanceLogInput } from '@co-at/types'
import { auth } from '@clerk/nextjs/server'

const supabase = () => createAdminClient()

export async function getMaintenanceLogs(filters?: {
  device_id?: string
  limit?: number
}): Promise<{ success: boolean; logs?: (InventoryMaintenanceLog & { device_name?: string | null })[]; error?: string }> {
  let query = supabase()
    .from('inventory_maintenance_logs')
    .select('*, inventory(name)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.device_id) query = query.eq('device_id', filters.device_id)

  const { data, error } = await query
  if (error) return { success: false, error: error.message }

  const logs = (data ?? []).map(l => ({
    ...l,
    device_name: (l.inventory as { name?: string } | null)?.name ?? null,
  }))
  return { success: true, logs }
}

export async function createMaintenanceLog(
  input: CreateMaintenanceLogInput
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { userId } = await auth()

  const { error } = await supabase()
    .from('inventory_maintenance_logs')
    .insert({
      device_id: input.device_id,
      type: input.type,
      status: input.status ?? 'pending',
      performed_at: input.performed_at ?? null,
      technician: input.technician ?? null,
      cost: input.cost ?? 0,
      notes: input.notes ?? null,
      created_by: userId,
    })

  if (error) return { success: false, error: error.message }
  revalidatePath(`/devices/${input.device_id}`)
  revalidatePath('/maintenance')
  return { success: true }
}

export async function updateMaintenanceLogStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'done'
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }

  const { error } = await supabase()
    .from('inventory_maintenance_logs')
    .update({ status, performed_at: status === 'done' ? new Date().toISOString() : undefined })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/maintenance')
  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/maintenance-actions.ts
git commit -m "feat: add maintenance log server actions"
```

---

## Task 8: Extend Rental Actions

**Files:**
- Modify: `actions/rental-actions.ts`

- [ ] **Step 1: Add `pending_assignment` status and `approval_id` to `RentalItem`**

In `actions/rental-actions.ts`, update the `RentalItem` interface:
```typescript
export interface RentalItem {
  id: string
  application_id: string | null   // make nullable (approval may be used instead)
  inventory_id: string
  client_id: string
  approval_id: string | null      // ADD THIS
  rental_start_date: string
  rental_end_date: string
  return_date: string | null
  extension_count: number | null
  status: string | null           // now includes 'pending_assignment'
  wait_list_checked_at: string | null  // ADD THIS
  created_at: string | null
  updated_at: string | null
}
```

- [ ] **Step 2: Add `createRentalFromApproval` function** (called by approval app on final approval)

Append to `actions/rental-actions.ts`:
```typescript
// Called from approval app on final approval
export async function createRentalFromApproval(
  clientId: string,
  approvalId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createAdminClient()

  const startDate = format(new Date(), 'yyyy-MM-dd')
  const endDate = format(addDays(new Date(), 180), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('rentals')
    .insert({
      application_id: null,
      inventory_id: null,   // assigned later via QR scan
      client_id: clientId,
      approval_id: approvalId,
      rental_start_date: startDate,
      rental_end_date: endDate,
      status: 'pending_assignment',
      extension_count: 0,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, id: data.id }
}
```

Note: `inventory_id` is null until device assigned via QR. Make `inventory_id` nullable in migration if needed (add: `ALTER TABLE rentals ALTER COLUMN inventory_id DROP NOT NULL;` to the migration).

- [ ] **Step 3: Add rental extension guard (max 1 extension)**

Find `extendRental` function and add extension count check:
```typescript
// Inside extendRental, before the update:
if ((rental.extension_count ?? 0) >= 1) {
  return { success: false, error: '이미 1회 연장하여 추가 연장이 불가합니다' }
}
```

- [ ] **Step 4: Typecheck**

```bash
cd .worktrees/feature-inventory-phase2
pnpm typecheck 2>&1 | grep "rental-actions"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add actions/rental-actions.ts
git commit -m "feat: extend rental actions with approval_id, pending_assignment, extension guard"
```

---

## Task 9: QR Scan Route

**Files:**
- Create: `apps/inventory/app/scan/[qr_token]/page.tsx`

- [ ] **Step 1: Create redirect page**

```typescript
// apps/inventory/app/scan/[qr_token]/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'

interface Props {
  params: Promise<{ qr_token: string }>
}

export default async function QrScanPage({ params }: Props) {
  const { qr_token } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('inventory')
    .select('id')
    .eq('qr_token', qr_token)
    .single()

  if (!data) notFound()
  redirect(`/devices/${data.id}`)
}
```

Note: `createAdminClient` is available at `@/lib/supabase/admin` — check path alias in inventory tsconfig: `@/*` maps to `../../*` (monorepo root), so this resolves to `lib/supabase/admin.ts`.

- [ ] **Step 2: Commit**

```bash
git add apps/inventory/app/scan/
git commit -m "feat: add QR scan landing route (token → device redirect)"
```

---

## Task 10: QrLabelPrint Component

**Files:**
- Create: `apps/inventory/components/inventory/QrLabelPrint.tsx`

- [ ] **Step 1: Create component**

```typescript
// apps/inventory/components/inventory/QrLabelPrint.tsx
'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QrLabelPrintProps {
  qrToken: string
  deviceName: string
  assetCode?: string | null
}

export function QrLabelPrint({ qrToken, deviceName, assetCode }: QrLabelPrintProps) {
  const url = `${process.env.NEXT_PUBLIC_INVENTORY_URL ?? 'https://inventory.gwatc.cloud'}/scan/${qrToken}`

  return (
    <div>
      <div id="qr-label" style={{ display: 'none' }} className="print:block p-4 border text-center w-48">
        <QRCodeSVG value={url} size={160} level="M" />
        <p className="mt-2 text-sm font-medium">{deviceName}</p>
        {assetCode && <p className="text-xs text-gray-500">{assetCode}</p>}
      </div>
      <button
        onClick={() => {
          const el = document.getElementById('qr-label')
          if (el) { el.style.display = 'block'; window.print(); el.style.display = 'none' }
        }}
        className="flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-gray-50"
      >
        QR 라벨 인쇄
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_INVENTORY_URL` to inventory app's `.env.local` (if not present)**

```
NEXT_PUBLIC_INVENTORY_URL=https://inventory.gwatc.cloud
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/components/inventory/QrLabelPrint.tsx
git commit -m "feat: add QrLabelPrint component"
```

---

## Task 11: Update Device Detail Page

**Files:**
- Modify: `apps/inventory/app/devices/[id]/page.tsx`

- [ ] **Step 1: Replace page with extended version**

```typescript
// apps/inventory/app/devices/[id]/page.tsx
import { getInventoryItem } from '@/actions/inventory-actions'
import { getMaintenanceLogs } from '@/actions/maintenance-actions'
import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'
import { QrLabelPrint } from '@/inventory/components/inventory/QrLabelPrint'
import { MaintenanceLogForm } from '@/inventory/components/maintenance/MaintenanceLogForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DeviceDetailPage({ params }: Props) {
  const { id } = await params
  const [deviceResult, logsResult] = await Promise.all([
    getInventoryItem(id),
    getMaintenanceLogs({ device_id: id, limit: 20 }),
  ])
  if (!deviceResult.success || !deviceResult.item) notFound()

  const d = deviceResult.item
  const logs = logsResult.success ? logsResult.logs ?? [] : []

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  const typeLabels: Record<string, string> = { inspection: '점검', repair: '수리', cleaning: '세척' }
  const statusLabels: Record<string, string> = { pending: '대기', in_progress: '진행중', done: '완료' }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/devices" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{d.name}</h1>
        <QrLabelPrint qrToken={d.qr_token ?? ''} deviceName={d.name} assetCode={d.asset_code} />
        <Link
          href={`/devices/${id}/edit`}
          className="flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
          수정
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-2xl">
        <dl>
          {row('기기명', d.name)}
          {row('자산번호', d.asset_code)}
          {row('카테고리', d.category)}
          {row('상태', <DeviceStatusBadge status={d.status} />)}
          {row('제조사', d.manufacturer)}
          {row('모델명', d.model)}
          {row('바코드', d.barcode)}
          {row('구입일', d.purchase_date)}
          {row('구입가격', d.purchase_price ? `${d.purchase_price.toLocaleString()}원` : null)}
          {row('대여가능', d.is_rental_available ? '가능' : '불가')}
        </dl>
      </div>

      {/* Maintenance history */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-3">점검/수리 이력</h2>
        {logs.length > 0 ? (
          <div className="bg-white border rounded-lg divide-y text-sm">
            {logs.map(l => (
              <div key={l.id} className="px-4 py-3 flex gap-4">
                <span className="w-12 text-gray-500">{typeLabels[l.type] ?? l.type}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${l.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {statusLabels[l.status] ?? l.status}
                </span>
                <span className="text-gray-500">{l.performed_at?.slice(0, 10) ?? l.created_at.slice(0, 10)}</span>
                <span className="flex-1">{l.notes ?? '—'}</span>
                {l.cost > 0 && <span className="text-gray-500">{l.cost.toLocaleString()}원</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">이력이 없습니다.</p>
        )}
        <div className="mt-3">
          <MaintenanceLogForm deviceId={id} />
        </div>
      </div>
    </div>
  )
}
```

Note: `d.qr_token` requires updating `InventoryItem` interface in `actions/inventory-actions.ts` to include `qr_token: string | null`.

- [ ] **Step 2: Add `qr_token` to InventoryItem in `actions/inventory-actions.ts`**

Find `export interface InventoryItem` and add:
```typescript
qr_token: string | null
```

Also update the select query in `getInventoryItem` to include `qr_token`:
```typescript
.select('*, qr_token')
// or just use .select('*') if not already
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/app/devices/[id]/page.tsx actions/inventory-actions.ts
git commit -m "feat: update device detail page with QR print and maintenance history"
```

---

## Task 12: MaintenanceLogForm Component

**Files:**
- Create: `apps/inventory/components/maintenance/MaintenanceLogForm.tsx`

- [ ] **Step 1: Create component**

```typescript
// apps/inventory/components/maintenance/MaintenanceLogForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { createMaintenanceLog } from '@/actions/maintenance-actions'

export function MaintenanceLogForm({ deviceId }: { deviceId: string }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'inspection' | 'repair' | 'cleaning'>('inspection')
  const [notes, setNotes] = useState('')
  const [cost, setCost] = useState('')
  const [technician, setTechnician] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createMaintenanceLog({
        device_id: deviceId,
        type,
        notes: notes.trim() || undefined,
        cost: cost ? parseInt(cost.replace(/,/g, '')) : 0,
        technician: technician.trim() || undefined,
      })
      if (result.success) {
        setOpen(false); setNotes(''); setCost(''); setTechnician('')
      } else {
        setError(result.error ?? '저장 실패')
      }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-blue-600 hover:underline">
        + 이력 추가
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 space-y-3">
      <p className="font-medium text-sm">점검/수리 이력 추가</p>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">유형 *</label>
          <select value={type} onChange={e => setType(e.target.value as typeof type)} className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="inspection">점검</option>
            <option value="repair">수리</option>
            <option value="cleaning">세척</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">담당자</label>
          <input value={technician} onChange={e => setTechnician(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="홍길동" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">비용(원)</label>
          <input value={cost} onChange={e => setCost(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="0" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">메모</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '저장'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">취소</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/inventory/components/maintenance/
git commit -m "feat: add MaintenanceLogForm component"
```

---

## Task 13: Custom Orders Pages

**Files:**
- Create: `apps/inventory/app/custom-orders/page.tsx`
- Create: `apps/inventory/app/custom-orders/[id]/page.tsx`

- [ ] **Step 1: Create list page**

```typescript
// apps/inventory/app/custom-orders/page.tsx
import { getCustomOrders } from '@/actions/custom-order-actions'
import Link from 'next/link'
import type { CustomOrderStatus } from '@co-at/types'

const STATUS_LABELS: Record<CustomOrderStatus, string> = {
  requested: '제작 대기', in_progress: '제작 중', completed: '제작 완료', delivered: '지급 완료',
}
const STATUS_COLORS: Record<CustomOrderStatus, string> = {
  requested: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-600',
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function CustomOrdersPage({ searchParams }: Props) {
  const sp = await searchParams
  const status = sp.status as CustomOrderStatus | undefined
  const result = await getCustomOrders({ status })
  const orders = result.success ? result.orders ?? [] : []

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">맞춤제작 관리</h1>

      <div className="flex gap-2">
        {([undefined, 'requested', 'in_progress', 'completed', 'delivered'] as (CustomOrderStatus | undefined)[]).map(s => (
          <Link
            key={s ?? 'all'}
            href={s ? `?status=${s}` : '/custom-orders'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              (status ?? undefined) === s
                ? 'bg-gray-800 text-white border-gray-800'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s ? STATUS_LABELS[s] : '전체'}
          </Link>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['신청일', '대상자', '기기', '상태', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{o.requested_at.slice(0, 10)}</td>
                <td className="px-4 py-3">{o.client_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{o.device_name ?? '미배정'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/custom-orders/${o.id}`} className="text-blue-600 hover:underline text-xs">상세</Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">맞춤제작 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create detail page**

```typescript
// apps/inventory/app/custom-orders/[id]/page.tsx
import { getCustomOrderById } from '@/actions/custom-order-actions'
import { getFabEquipment } from '@/actions/fab-equipment-actions'
import { CustomOrderStatusStepper } from '@/inventory/components/custom-order/CustomOrderStatusStepper'
import { EquipmentAssignPanel } from '@/inventory/components/custom-order/EquipmentAssignPanel'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function CustomOrderDetailPage({ params }: Props) {
  const { id } = await params
  const [orderResult, equipResult] = await Promise.all([
    getCustomOrderById(id),
    getFabEquipment(),
  ])
  if (!orderResult.success || !orderResult.order) notFound()

  const order = orderResult.order
  const allEquipment = equipResult.success ? equipResult.equipment ?? [] : []

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/custom-orders" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold flex-1">맞춤제작 상세</h1>
      </div>

      <CustomOrderStatusStepper orderId={id} currentStatus={order.status} />

      <div className="bg-white border rounded-lg p-6">
        <dl>
          {row('대상자', order.client_name)}
          {row('기기', order.device_name ?? '미배정')}
          {row('신청일', order.requested_at.slice(0, 10))}
          {row('지급일', order.delivered_at?.slice(0, 10))}
          {row('메모', order.notes)}
        </dl>
      </div>

      <EquipmentAssignPanel
        orderId={id}
        currentEquipment={order.equipment ?? []}
        allEquipment={allEquipment}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/app/custom-orders/
git commit -m "feat: add custom orders list and detail pages"
```

---

## Task 14: CustomOrderStatusStepper + EquipmentAssignPanel

**Files:**
- Create: `apps/inventory/components/custom-order/CustomOrderStatusStepper.tsx`
- Create: `apps/inventory/components/custom-order/EquipmentAssignPanel.tsx`

- [ ] **Step 1: Create CustomOrderStatusStepper**

```typescript
// apps/inventory/components/custom-order/CustomOrderStatusStepper.tsx
'use client'

import { useTransition } from 'react'
import { updateCustomOrderStatus } from '@/actions/custom-order-actions'
import type { CustomOrderStatus } from '@co-at/types'

const STEPS: { status: CustomOrderStatus; label: string }[] = [
  { status: 'requested',   label: '제작 대기' },
  { status: 'in_progress', label: '제작 중' },
  { status: 'completed',   label: '제작 완료' },
  { status: 'delivered',   label: '지급 완료' },
]

const NEXT: Record<CustomOrderStatus, CustomOrderStatus | null> = {
  requested: 'in_progress', in_progress: 'completed', completed: 'delivered', delivered: null,
}

export function CustomOrderStatusStepper({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: CustomOrderStatus
}) {
  const [isPending, startTransition] = useTransition()
  const currentIdx = STEPS.findIndex(s => s.status === currentStatus)
  const nextStatus = NEXT[currentStatus]

  function advance() {
    if (!nextStatus) return
    startTransition(async () => {
      await updateCustomOrderStatus(orderId, nextStatus)
    })
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < currentIdx ? 'bg-blue-600 text-white' :
                i === currentIdx ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i <= currentIdx ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      {nextStatus && (
        <button
          onClick={advance}
          disabled={isPending}
          className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? '처리 중...' : `"${STEPS[currentIdx + 1].label}"로 변경`}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create EquipmentAssignPanel**

```typescript
// apps/inventory/components/custom-order/EquipmentAssignPanel.tsx
'use client'

import { useTransition } from 'react'
import { assignEquipmentToOrder, finishEquipmentUsage } from '@/actions/custom-order-actions'
import type { InventoryFabEquipment, InventoryFabEquipmentAssignment } from '@co-at/types'

const TYPE_LABELS: Record<string, string> = { '3d_printer': '3D프린터', cnc: 'CNC', laser: '레이저', other: '기타' }
const STATUS_LABELS: Record<string, string> = { available: '유휴', in_use: '사용중', maintenance: '점검중' }

export function EquipmentAssignPanel({
  orderId,
  currentEquipment,
  allEquipment,
}: {
  orderId: string
  currentEquipment: InventoryFabEquipmentAssignment[]
  allEquipment: InventoryFabEquipment[]
}) {
  const [isPending, startTransition] = useTransition()

  const assignedIds = new Set(currentEquipment.map(e => e.equipment_id))
  const available = allEquipment.filter(e => !assignedIds.has(e.id) && e.status !== 'maintenance')

  function assign(equipmentId: string) {
    startTransition(async () => { await assignEquipmentToOrder(orderId, equipmentId) })
  }
  function finish(equipmentId: string) {
    startTransition(async () => { await finishEquipmentUsage(orderId, equipmentId) })
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h3 className="font-semibold text-sm">장비 배정</h3>

      {currentEquipment.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">배정된 장비</p>
          {currentEquipment.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">{(e.equipment as InventoryFabEquipment | undefined)?.name ?? e.equipment_id}</p>
                <p className="text-xs text-gray-500">{e.started_at?.slice(0, 10)} ~{e.finished_at ? ` ${e.finished_at.slice(0, 10)}` : ' 진행중'}</p>
              </div>
              {!e.finished_at && (
                <button
                  onClick={() => finish(e.equipment_id)}
                  disabled={isPending}
                  className="text-xs text-gray-500 border px-2 py-1 rounded hover:bg-gray-50"
                >
                  사용 완료
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">배정 가능한 장비</p>
          {available.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">{e.name}</p>
                <p className="text-xs text-gray-500">{TYPE_LABELS[e.type]} · {STATUS_LABELS[e.status]}</p>
              </div>
              <button
                onClick={() => assign(e.id)}
                disabled={isPending}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                배정
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length === 0 && currentEquipment.length === 0 && (
        <p className="text-sm text-gray-400">배정 가능한 장비가 없습니다.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/components/custom-order/
git commit -m "feat: add CustomOrderStatusStepper and EquipmentAssignPanel components"
```

---

## Task 15: Reuse Pages + ReuseStatusStepper

**Files:**
- Create: `apps/inventory/app/reuse/page.tsx`
- Create: `apps/inventory/app/reuse/[id]/page.tsx`
- Create: `apps/inventory/components/reuse/ReuseStatusStepper.tsx`

- [ ] **Step 1: Create ReuseStatusStepper**

```typescript
// apps/inventory/components/reuse/ReuseStatusStepper.tsx
'use client'

import { useTransition } from 'react'
import { updateReuseStatus } from '@/actions/reuse-actions'
import type { ReuseDispatchStatus } from '@co-at/types'

const STEPS: { status: ReuseDispatchStatus; label: string }[] = [
  { status: 'donated',    label: '기증/회수' },
  { status: 'inspecting', label: '점검' },
  { status: 'cleaning',   label: '세척' },
  { status: 'delivered',  label: '지급 완료' },
]

const NEXT: Record<ReuseDispatchStatus, ReuseDispatchStatus | null> = {
  donated: 'inspecting', inspecting: 'cleaning', cleaning: 'delivered', delivered: null,
}

export function ReuseStatusStepper({
  dispatchId,
  currentStatus,
}: {
  dispatchId: string
  currentStatus: ReuseDispatchStatus
}) {
  const [isPending, startTransition] = useTransition()
  const currentIdx = STEPS.findIndex(s => s.status === currentStatus)
  const nextStatus = NEXT[currentStatus]

  function advance() {
    if (!nextStatus) return
    startTransition(async () => { await updateReuseStatus(dispatchId, nextStatus) })
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < currentIdx ? 'bg-green-600 text-white' :
                i === currentIdx ? 'bg-green-600 text-white ring-4 ring-green-100' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i <= currentIdx ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      {nextStatus && (
        <button
          onClick={advance}
          disabled={isPending}
          className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? '처리 중...' : `"${STEPS[currentIdx + 1].label}"로 변경`}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create reuse list page**

```typescript
// apps/inventory/app/reuse/page.tsx
import { getReuseDispatches } from '@/actions/reuse-actions'
import Link from 'next/link'
import type { ReuseDispatchStatus } from '@co-at/types'

const STATUS_LABELS: Record<ReuseDispatchStatus, string> = {
  donated: '기증/회수', inspecting: '점검', cleaning: '세척', delivered: '지급 완료',
}
const STATUS_COLORS: Record<ReuseDispatchStatus, string> = {
  donated: 'bg-purple-100 text-purple-700',
  inspecting: 'bg-yellow-100 text-yellow-700',
  cleaning: 'bg-blue-100 text-blue-700',
  delivered: 'bg-gray-100 text-gray-600',
}

interface Props { searchParams: Promise<{ status?: string }> }

export default async function ReusePage({ searchParams }: Props) {
  const sp = await searchParams
  const status = sp.status as ReuseDispatchStatus | undefined
  const result = await getReuseDispatches({ status })
  const dispatches = result.success ? result.dispatches ?? [] : []

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">재사용 관리</h1>

      <div className="flex gap-2">
        {([undefined, 'donated', 'inspecting', 'cleaning', 'delivered'] as (ReuseDispatchStatus | undefined)[]).map(s => (
          <Link
            key={s ?? 'all'}
            href={s ? `?status=${s}` : '/reuse'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              (status ?? undefined) === s
                ? 'bg-gray-800 text-white border-gray-800'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s ? STATUS_LABELS[s] : '전체'}
          </Link>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['등록일', '기기', '대상자', '상태', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {dispatches.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{d.created_at.slice(0, 10)}</td>
                <td className="px-4 py-3 font-medium">{d.device_name ?? '—'}</td>
                <td className="px-4 py-3">{d.client_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status]}`}>
                    {STATUS_LABELS[d.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/reuse/${d.id}`} className="text-blue-600 hover:underline text-xs">상세</Link>
                </td>
              </tr>
            ))}
            {dispatches.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">재사용 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create reuse detail page**

```typescript
// apps/inventory/app/reuse/[id]/page.tsx
import { getReuseDispatchById } from '@/actions/reuse-actions'
import { ReuseStatusStepper } from '@/inventory/components/reuse/ReuseStatusStepper'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function ReuseDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getReuseDispatchById(id)
  if (!result.success || !result.dispatch) notFound()
  const d = result.dispatch

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/reuse" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold flex-1">재사용 상세</h1>
      </div>

      <ReuseStatusStepper dispatchId={id} currentStatus={d.status} />

      <div className="bg-white border rounded-lg p-6">
        <dl>
          {row('기기', d.device_name)}
          {row('대상자', d.client_name)}
          {row('지급일', d.dispatched_at?.slice(0, 10))}
          {row('메모', d.notes)}
        </dl>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/inventory/app/reuse/ apps/inventory/components/reuse/
git commit -m "feat: add reuse dispatch pages and ReuseStatusStepper"
```

---

## Task 16: Fabrication Equipment Pages

**Files:**
- Create: `apps/inventory/app/fab-equipment/page.tsx`
- Create: `apps/inventory/app/fab-equipment/[id]/page.tsx`

- [ ] **Step 1: Create list page**

```typescript
// apps/inventory/app/fab-equipment/page.tsx
import { getFabEquipment } from '@/actions/fab-equipment-actions'

const TYPE_LABELS: Record<string, string> = { '3d_printer': '3D프린터', cnc: 'CNC', laser: '레이저', other: '기타' }
const STATUS_LABELS: Record<string, string> = { available: '유휴', in_use: '사용중', maintenance: '점검중' }
const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
}

export default async function FabEquipmentPage() {
  const result = await getFabEquipment()
  const equipment = result.success ? result.equipment ?? [] : []

  const inUse = equipment.filter(e => e.status === 'in_use').length
  const available = equipment.filter(e => e.status === 'available').length

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">제작 장비</h1>
        <div className="text-sm text-gray-500">
          사용중 <span className="font-bold text-blue-600">{inUse}대</span> · 유휴 <span className="font-bold text-green-600">{available}대</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {equipment.map(e => (
          <a key={e.id} href={`/fab-equipment/${e.id}`} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-gray-500">{TYPE_LABELS[e.type] ?? e.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                {STATUS_LABELS[e.status]}
              </span>
            </div>
            <p className="font-semibold text-gray-900">{e.name}</p>
            {e.serial_number && <p className="text-xs text-gray-400 mt-1">{e.serial_number}</p>}
          </a>
        ))}
        {equipment.length === 0 && <p className="col-span-3 text-center py-12 text-gray-400">등록된 장비가 없습니다.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create detail page**

```typescript
// apps/inventory/app/fab-equipment/[id]/page.tsx
import { getFabEquipmentById, updateFabEquipmentStatus } from '@/actions/fab-equipment-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = { '3d_printer': '3D프린터', cnc: 'CNC', laser: '레이저', other: '기타' }
const STATUS_LABELS: Record<string, string> = { available: '유휴', in_use: '사용중', maintenance: '점검중' }

interface Props { params: Promise<{ id: string }> }

export default async function FabEquipmentDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getFabEquipmentById(id)
  if (!result.success || !result.equipment) notFound()

  const e = result.equipment
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-36 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/fab-equipment" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold flex-1">{e.name}</h1>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <dl>
          {row('유형', TYPE_LABELS[e.type] ?? e.type)}
          {row('상태', STATUS_LABELS[e.status])}
          {row('시리얼 번호', e.serial_number)}
          {row('구입일', e.purchased_at)}
          {row('메모', e.notes)}
        </dl>
      </div>

      {e.active_orders && e.active_orders.length > 0 && (
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-3">연결된 맞춤제작 주문</h2>
          <div className="space-y-2">
            {e.active_orders.map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <span>{o.client_name ?? '—'}</span>
                <span className="text-gray-500">{o.status}</span>
                <Link href={`/custom-orders/${o.id}`} className="text-blue-600 hover:underline text-xs">보기</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/app/fab-equipment/
git commit -m "feat: add fabrication equipment pages"
```

---

## Task 17: Maintenance Log Page

**Files:**
- Create: `apps/inventory/app/maintenance/page.tsx`

- [ ] **Step 1: Create page**

```typescript
// apps/inventory/app/maintenance/page.tsx
import { getMaintenanceLogs } from '@/actions/maintenance-actions'

const TYPE_LABELS: Record<string, string> = { inspection: '점검', repair: '수리', cleaning: '세척' }
const STATUS_LABELS: Record<string, string> = { pending: '대기', in_progress: '진행중', done: '완료' }
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

export default async function MaintenancePage() {
  const result = await getMaintenanceLogs({ limit: 100 })
  const logs = result.success ? result.logs ?? [] : []

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">점검/수리 이력</h1>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['일자', '기기', '유형', '상태', '담당자', '비용', '메모'].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{(l.performed_at ?? l.created_at).slice(0, 10)}</td>
                <td className="px-4 py-3 font-medium">{l.device_name ?? '—'}</td>
                <td className="px-4 py-3">{TYPE_LABELS[l.type] ?? l.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[l.status]}`}>
                    {STATUS_LABELS[l.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{l.technician ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{l.cost > 0 ? `${l.cost.toLocaleString()}원` : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{l.notes ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">이력이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/inventory/app/maintenance/
git commit -m "feat: add maintenance log list page"
```

---

## Task 18: Reports Page

**Files:**
- Create: `apps/inventory/app/reports/page.tsx`
- Create: `apps/inventory/actions/report-actions.ts`

- [ ] **Step 1: Create report server actions**

```typescript
// apps/inventory/actions/report-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import ExcelJS from 'exceljs'

export async function generateRentalReport(params: { year: number; month?: number }): Promise<{
  success: boolean; buffer?: number[]; filename?: string; error?: string
}> {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('rentals')
      .select('*, inventory(name, model), eval_clients(name)')
      .order('rental_start_date', { ascending: false })

    if (params.month) {
      const start = `${params.year}-${String(params.month).padStart(2, '0')}-01`
      const end = `${params.year}-${String(params.month).padStart(2, '0')}-31`
      query = query.gte('rental_start_date', start).lte('rental_start_date', end)
    } else {
      query = query.gte('rental_start_date', `${params.year}-01-01`).lte('rental_start_date', `${params.year}-12-31`)
    }

    const { data, error } = await query
    if (error) return { success: false, error: error.message }

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('대여 현황')
    ws.columns = [
      { header: '대여일', key: 'start', width: 14 },
      { header: '반납기한', key: 'end', width: 14 },
      { header: '기기명', key: 'device', width: 24 },
      { header: '모델', key: 'model', width: 20 },
      { header: '이용자', key: 'client', width: 16 },
      { header: '상태', key: 'status', width: 14 },
      { header: '연장횟수', key: 'ext', width: 10 },
    ]
    ws.getRow(1).font = { bold: true }
    ;(data ?? []).forEach(r => {
      const inv = r.inventory as { name?: string; model?: string } | null
      const cli = r.eval_clients as { name?: string } | null
      ws.addRow({
        start: r.rental_start_date, end: r.rental_end_date,
        device: inv?.name ?? '—', model: inv?.model ?? '—',
        client: cli?.name ?? '—', status: r.status ?? '—',
        ext: r.extension_count ?? 0,
      })
    })

    const buffer = await wb.xlsx.writeBuffer()
    const label = params.month ? `${params.year}년_${params.month}월` : `${params.year}년`
    return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename: `대여현황_${label}.xlsx` }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function generateDispatchSummaryReport(params: { year: number }): Promise<{
  success: boolean; buffer?: number[]; filename?: string; error?: string
}> {
  try {
    const supabase = createAdminClient()
    const yearRange = { start: `${params.year}-01-01`, end: `${params.year}-12-31` }

    const [rentals, customs, reuses] = await Promise.all([
      supabase.from('rentals').select('client_id, eval_clients(name), status').gte('rental_start_date', yearRange.start).lte('rental_start_date', yearRange.end),
      supabase.from('inventory_custom_orders').select('client_id, eval_clients(name), status').gte('created_at', yearRange.start).lte('created_at', yearRange.end),
      supabase.from('inventory_reuse_dispatches').select('client_id, eval_clients(name), status').gte('created_at', yearRange.start).lte('created_at', yearRange.end),
    ])

    const wb = new ExcelJS.Workbook()
    const addSheet = (name: string, rows: unknown[], type: string) => {
      const ws = wb.addWorksheet(name)
      ws.columns = [
        { header: '이용자', key: 'client', width: 16 },
        { header: '유형', key: 'type', width: 12 },
        { header: '상태', key: 'status', width: 14 },
      ]
      ws.getRow(1).font = { bold: true }
      ;(rows as { eval_clients: { name?: string } | null; status: string }[]).forEach(r => {
        ws.addRow({ client: r.eval_clients?.name ?? '—', type, status: r.status })
      })
    }

    addSheet('대여', rentals.data ?? [], '대여')
    addSheet('맞춤제작', customs.data ?? [], '맞춤제작')
    addSheet('재사용', reuses.data ?? [], '재사용')

    const buffer = await wb.xlsx.writeBuffer()
    return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename: `출고통계_${params.year}년.xlsx` }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
```

- [ ] **Step 2: Create reports page**

```typescript
// apps/inventory/app/reports/page.tsx
'use client'

import { useState } from 'react'
import { generateRentalReport, generateDispatchSummaryReport } from '@/inventory/actions/report-actions'

function DownloadButton({ label, onDownload }: {
  label: string
  onDownload: () => Promise<{ buffer?: number[]; filename?: string; error?: string; success: boolean }>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true); setError(null)
    const result = await onDownload()
    if (!result.success || !result.buffer) { setError(result.error ?? '다운로드 실패'); setLoading(false); return }
    const blob = new Blob([new Uint8Array(result.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = result.filename ?? 'report.xlsx'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setLoading(false)
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
        {loading ? '생성 중...' : label}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">리포트</h1>

      <div className="flex gap-3 items-center">
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
          {months.map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
      </div>

      <div className="grid gap-4">
        <div className="bg-white border rounded-lg p-5 space-y-3">
          <p className="font-semibold">월간 대여 현황</p>
          <p className="text-sm text-gray-500">{year}년 {month}월 대여 내역 Excel</p>
          <DownloadButton label="Excel 다운로드" onDownload={() => generateRentalReport({ year, month })} />
        </div>
        <div className="bg-white border rounded-lg p-5 space-y-3">
          <p className="font-semibold">연간 출고 통계</p>
          <p className="text-sm text-gray-500">{year}년 대여/맞춤제작/재사용 통계 Excel</p>
          <DownloadButton label="Excel 다운로드" onDownload={() => generateDispatchSummaryReport({ year })} />
        </div>
      </div>
    </div>
  )
}
```

Note: Report actions import path uses `@/inventory/actions/report-actions` which resolves to `apps/inventory/actions/report-actions.ts` via the `@/inventory/*` alias.

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/app/reports/ apps/inventory/actions/report-actions.ts
git commit -m "feat: add reports page with Excel download (rental + dispatch summary)"
```

---

## Task 19: Sidebar & Dashboard Update

**Files:**
- Modify: `apps/inventory/components/layout/InventorySidebar.tsx`
- Modify: `apps/inventory/app/page.tsx`

- [ ] **Step 1: Update sidebar**

Replace `navItems` in `InventorySidebar.tsx`:
```typescript
import { LayoutDashboard, Package, ArrowLeftRight, Wrench, Settings2, ClipboardList, FileBarChart } from 'lucide-react'

const navItems = [
  { href: '/',               label: '대시보드',   icon: LayoutDashboard },
  { href: '/devices',        label: '기기 목록',  icon: Package },
  { href: '/rentals',        label: '대여 관리',  icon: ArrowLeftRight },
  { href: '/custom-orders',  label: '맞춤제작',   icon: Wrench },
  { href: '/reuse',          label: '재사용',     icon: Settings2 },
  { href: '/fab-equipment',  label: '제작 장비',  icon: ClipboardList },
  { href: '/maintenance',    label: '점검/수리',  icon: ClipboardList },
  { href: '/reports',        label: '리포트',     icon: FileBarChart },
]
```

- [ ] **Step 2: Add equipment utilization card to dashboard**

In `apps/inventory/app/page.tsx`, add equipment stats:
```typescript
import { getFabEquipment } from '@/actions/fab-equipment-actions'
import { Cpu } from 'lucide-react'

// In InventoryDashboard, add to Promise.all:
const [inventoryResult, overdueResult, expiringResult, activeRentalsResult, equipResult] = await Promise.all([
  getInventoryList({ limit: 1 }),
  getOverdueRentals(),
  getExpiringRentals(7),
  getRentals({ status: 'rented', limit: 1 }),
  getFabEquipment(),
])

const equipInUse = equipResult.success ? (equipResult.equipment ?? []).filter(e => e.status === 'in_use').length : 0
const equipTotal = equipResult.success ? (equipResult.equipment ?? []).length : 0

// Add card:
{ label: '장비 가동', value: `${equipInUse}/${equipTotal}대`, href: '/fab-equipment', icon: Cpu, color: 'purple' },
```

Also add `purple` to `colorMap`:
```typescript
purple: 'bg-purple-100 text-purple-600',
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/components/layout/InventorySidebar.tsx apps/inventory/app/page.tsx
git commit -m "feat: update inventory sidebar and dashboard with new sections"
```

---

## Task 20: Web App — Track Page

**Files:**
- Create: `apps/web/app/track/[track_token]/page.tsx`

- [ ] **Step 1: Create public tracking page**

```typescript
// apps/web/app/track/[track_token]/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import type { CustomOrderStatus } from '@co-at/types'

const STEPS: { status: CustomOrderStatus; label: string; desc: string }[] = [
  { status: 'requested',   label: '제작 대기',  desc: '신청이 접수되었습니다' },
  { status: 'in_progress', label: '제작 중',    desc: '제작이 시작되었습니다' },
  { status: 'completed',   label: '제작 완료',  desc: '제작이 완료되었습니다' },
  { status: 'delivered',   label: '지급 완료',  desc: '기기가 지급되었습니다' },
]

interface Props { params: Promise<{ track_token: string }> }

export default async function TrackPage({ params }: Props) {
  const { track_token } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('inventory_custom_orders')
    .select('status, requested_at, delivered_at, updated_at')
    .eq('track_token', track_token)
    .single()

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">유효하지 않은 추적 코드입니다.</p>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex(s => s.status === data.status)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-center mb-2">맞춤제작 진행 현황</h1>
        <p className="text-center text-sm text-gray-500 mb-8">보조공학센터 맞춤제작 서비스</p>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const done = i < currentIdx
            const current = i === currentIdx
            return (
              <div key={step.status} className={`flex gap-4 p-4 rounded-lg ${current ? 'bg-blue-50 border border-blue-200' : done ? 'bg-gray-50' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  done ? 'bg-blue-600 text-white' : current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${current ? 'text-blue-700' : ''}`}>{step.label}</p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                  {i === 0 && data.requested_at && <p className="text-xs text-gray-400 mt-1">{data.requested_at.slice(0, 10)}</p>}
                  {i === currentIdx && data.updated_at && <p className="text-xs text-gray-400 mt-1">{data.updated_at.slice(0, 10)}</p>}
                  {i === STEPS.length - 1 && data.delivered_at && <p className="text-xs text-gray-400 mt-1">{data.delivered_at.slice(0, 10)}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

Note: The `web` app's tsconfig uses `@/*` → `./*`, so `createAdminClient` import needs to match web app's aliases. Check `apps/web/tsconfig.json` and use the correct path for `createAdminClient`.

- [ ] **Step 2: Verify web app Supabase admin client path**

```bash
grep -r "createAdminClient\|supabase/admin" apps/web/tsconfig.json apps/web/app --include="*.ts" --include="*.tsx" | head -5
```

Adjust import path based on result.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/track/
git commit -m "feat: add public custom order tracking page to web app"
```

---

## Task 21: Approval App Auto-Insert

**Files:**
- Modify: `apps/approval/actions/approval-actions.ts`

- [ ] **Step 1: Add inventory auto-insert in `approveStep` at step 2 (final approval)**

In `apps/approval/actions/approval-actions.ts`, inside the `step === 2` block (after updating `approval_documents.status = 'approved'`), add:

```typescript
// After: await supabase.from('approval_documents').update({ status: 'approved', ... }).eq('id', doc.id)

// Auto-create inventory record based on document type
if (doc.type === 'rental' || doc.type === 'custom_make' || doc.type === 'reuse') {
  // Load document to get client_id
  const { data: fullDoc } = await supabase
    .from('approval_documents')
    .select('id, type, content')
    .eq('id', doc.id)
    .single()

  const content = fullDoc?.content as Record<string, unknown> | null
  const clientId = content?.client_id as string | undefined

  if (clientId && fullDoc) {
    if (fullDoc.type === 'rental') {
      const { createRentalFromApproval } = await import('@/actions/rental-actions')
      await createRentalFromApproval(clientId, fullDoc.id)
    } else if (fullDoc.type === 'custom_make') {
      const { createCustomOrderFromApproval } = await import('@/actions/custom-order-actions')
      await createCustomOrderFromApproval(clientId, fullDoc.id)
    } else if (fullDoc.type === 'reuse') {
      const deviceId = content?.device_id as string | undefined
      if (deviceId) {
        const { createReuseFromApproval } = await import('@/actions/reuse-actions')
        await createReuseFromApproval(deviceId, clientId, fullDoc.id)
      }
    }
  }
}
```

Note: The approval app's tsconfig maps `@/*` to its own root. The `actions/rental-actions` etc. are at the monorepo root. Check approval app tsconfig to confirm the correct import path.

- [ ] **Step 2: Verify import paths in approval app**

```bash
cat apps/approval/tsconfig.json | grep -A5 '"paths"'
```

Adjust import paths as needed based on the alias configuration.

- [ ] **Step 3: Typecheck approval app**

```bash
cd .worktrees/feature-inventory-phase2
pnpm --filter @co-at/approval typecheck 2>&1 | head -20
```

Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add apps/approval/actions/approval-actions.ts
git commit -m "feat: auto-create inventory record on approval final approval"
```

---

## Task 22: Final Typecheck & PR

- [ ] **Step 1: Run full typecheck**

```bash
cd .worktrees/feature-inventory-phase2
pnpm typecheck 2>&1 | grep -E "error TS|Error" | head -30
```

Fix any remaining type errors.

- [ ] **Step 2: Verify build (optional)**

```bash
cd .worktrees/feature-inventory-phase2
pnpm --filter @co-at/inventory build 2>&1 | tail -20
```

- [ ] **Step 3: Create PR**

```bash
cd .worktrees/feature-inventory-phase2
git push -u origin feature/inventory-phase2

"/c/Program Files/GitHub CLI/gh.exe" pr create \
  --title "feat: inventory phase2 - custom orders, reuse, QR, fab equipment, maintenance" \
  --body "$(cat <<'EOF'
## Summary
- QR token-based device scanning (phone camera → /scan/[token] → device detail)
- Custom-made order management with 4-stage stepper + equipment assignment
- Reuse dispatch management with 4-stage pipeline
- Fabrication equipment (3D printer, CNC) utilization tracking
- Maintenance log tracking per device
- Approval app auto-creates inventory record on final approval
- Public tracking page at gwatc.cloud/track/[token] for custom order applicants
- Excel reports for rental history and dispatch statistics

## Migration
Run `migrations/047_inventory_phase2.sql` in Supabase SQL Editor before deploying.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
