# Inventory Phase 2 — Design Spec
Date: 2026-05-09

## Overview

Extend the existing inventory app (`inventory.gwatc.cloud`) to support three assistive device service types — rental, custom-made, and reuse — with QR-based device tracking, approval app integration, maintenance logging, client progress visibility, and Excel reports.

---

## 1. DB Structure

### Existing Tables (Extended)

**`inventory`**
- Add `qr_token UUID UNIQUE DEFAULT gen_random_uuid()` — used for QR label URL

**`rentals`**
- Add `approval_id UUID REFERENCES approval_documents(id)` (nullable)
- Add `extension_count SMALLINT DEFAULT 0` (max 1)
- Add `wait_list_checked_at TIMESTAMPTZ` (recorded when extension eligibility is verified)
- Rental period: 6 months base, 1 extension of 6 months if no waiting list

### New Tables

```sql
-- 맞춤제작 (Custom-made orders)
CREATE TABLE inventory_custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES inventory(id),           -- nullable until production complete
  client_id UUID NOT NULL REFERENCES eval_clients(id),
  approval_id UUID REFERENCES approval_documents(id),
  status TEXT NOT NULL DEFAULT 'requested',          -- requested | in_progress | completed | delivered
  track_token UUID UNIQUE DEFAULT gen_random_uuid(), -- public progress tracking token
  requested_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 재사용 (Reuse dispatches)
CREATE TABLE inventory_reuse_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES inventory(id),
  client_id UUID NOT NULL REFERENCES eval_clients(id),
  approval_id UUID REFERENCES approval_documents(id),
  status TEXT NOT NULL DEFAULT 'donated',            -- donated | inspecting | cleaning | delivered
  dispatched_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 점검/수리 이력 (Maintenance logs)
CREATE TABLE inventory_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES inventory(id),
  type TEXT NOT NULL,                                -- inspection | repair | cleaning
  status TEXT NOT NULL DEFAULT 'pending',            -- pending | in_progress | done
  performed_at TIMESTAMPTZ,
  technician TEXT,
  cost INTEGER DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### DB View

```sql
-- Unified dispatch summary across all three types
CREATE VIEW inventory_dispatch_summary AS
  SELECT 'rental' AS type, id, device_id, client_id, approval_id, status, created_at FROM rentals
  UNION ALL
  SELECT 'custom' AS type, id, device_id, client_id, approval_id, status, created_at FROM inventory_custom_orders
  UNION ALL
  SELECT 'reuse' AS type, id, device_id, client_id, approval_id, status, created_at FROM inventory_reuse_dispatches;
```

### RLS
- All new tables: RLS enabled
- `inventory_custom_orders`: authenticated users can read; MANAGER+ can insert/update
- `inventory_reuse_dispatches`: authenticated users can read; MANAGER+ can insert/update
- `inventory_maintenance_logs`: authenticated users can read/insert; MANAGER+ can update/delete
- `track_token` based lookup: handled via service role in web app (no direct RLS exposure)

---

## 2. App Structure

### Sidebar Navigation (Updated)
```
대시보드          /
기기 목록         /devices
대여 관리         /rentals
맞춤제작          /custom-orders
재사용            /reuse
점검/수리         /maintenance
리포트            /reports
```

### Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server | Dashboard — 4 summary cards + overdue/expiring alerts |
| `/devices` | Server | Device list with search/filter |
| `/devices/new` | Client | Device registration form |
| `/devices/[id]` | Server | Device detail + QR label print + dispatch button + maintenance history tab |
| `/devices/[id]/edit` | Client | Edit device info |
| `/scan/[qr_token]` | Server | QR scan landing → redirect to `/devices/[id]` |
| `/rentals` | Server | Rental list with status filter |
| `/rentals/[id]` | Server | Rental detail + extend/return actions |
| `/custom-orders` | Server | Custom order list with status filter |
| `/custom-orders/[id]` | Server | Custom order detail + status change + device assignment |
| `/reuse` | Server | Reuse dispatch list with status filter |
| `/reuse/[id]` | Server | Reuse detail + status change |
| `/maintenance` | Server | Maintenance log list across all devices |
| `/reports` | Client | Excel download buttons |

### Web App Addition (gwatc.cloud)
| Route | Description |
|-------|-------------|
| `/track/[track_token]` | Public (no login) — custom order progress timeline for applicant |

---

## 3. Components & Data Flow

### QR Label
- **`QrLabelPrint`** — renders QR image from `https://inventory.gwatc.cloud/scan/[qr_token]` using `qrcode.react`, browser print triggered via `window.print()`
- `/scan/[qr_token]` — server component, looks up device by token, redirects to `/devices/[id]`

### Dispatch Flow (from device detail page)
1. Device status is `available` → "출고 처리" button shown
2. Click → drawer/panel opens:
   - Select client from `eval_clients` (search by name)
   - Select service type: 대여 / 맞춤제작 / 재사용
   - Optional: link approval document ID
   - Confirm
3. Server Action `dispatchDevice()`:
   - Inserts into appropriate table
   - Updates `inventory.status` → `rented` or `dispatched`

### Approval App Integration
- When approval document is finally approved in the approval app:
  - The approval server action directly INSERTs into the relevant inventory table (shared Supabase DB)
  - `rentals`: status `pending_assignment`
  - `inventory_custom_orders`: status `requested`, `track_token` auto-generated
  - `inventory_reuse_dispatches`: status `donated`
- Staff then uses QR scan to complete device assignment

### Custom Order Progress (Web App — Public)
Applicant-facing timeline at `gwatc.cloud/track/[track_token]`:
```
✅ 제작 대기    — 신청이 접수되었습니다 (날짜)
🔄 제작 중     — 제작이 시작되었습니다 (날짜)
✅ 제작 완료   — 제작이 완료되었습니다 (날짜)
📦 지급 완료   — 기기가 지급되었습니다 (날짜)
```
- Fetched via service role using `track_token` (no auth required)
- Future: `track_token` URL sent via SMS/email through automation app

### Status Steppers
- **`CustomOrderStatusStepper`** — 4-step: requested → in_progress → completed → delivered
- **`ReuseStatusStepper`** — 4-step: donated → inspecting → cleaning → delivered
- Both show current step highlighted; staff/manager can advance to next step

### Maintenance Logs
- Tab on device detail page: list of maintenance entries
- **`MaintenanceLogForm`** — type (inspection/repair/cleaning), status, performed_at, technician, cost, notes
- Accessible by STAFF and above

### Reports (ExcelJS)
- Monthly rental report (by month/year)
- Dispatch statistics by type (rental / custom / reuse)
- Per-device usage history

---

## 4. Permissions & Error Handling

### Permissions

| Role | Capabilities |
|------|-------------|
| ADMIN / MANAGER | Full CRUD, status changes, dispatch, reports |
| STAFF | Dispatch, status changes, extend/return rentals, view, maintenance log entry |
| Unauthenticated | No access to inventory app (blocked by middleware) |

- `/track/[track_token]` lives in web app, outside inventory app auth

### Error Handling
- Device has no `qr_token` → auto-generate on first visit to device detail
- Rental extension attempted → check `extension_count < 1`, show waiting list warning if applicable
- Custom order `device_id` nullable until status reaches `completed`
- Approval ID reference is optional; dispatch can proceed without it

---

## 5. Migration File

Migration: `047_inventory_phase2.sql`

Adds:
- `inventory.qr_token`
- `rentals.approval_id`, `rentals.extension_count`, `rentals.wait_list_checked_at`
- `inventory_custom_orders` table + RLS
- `inventory_reuse_dispatches` table + RLS
- `inventory_maintenance_logs` table + RLS
- `inventory_dispatch_summary` view
- `updated_at` trigger on new tables

---

## 6. Implementation Sequence

1. Migration file `047_inventory_phase2.sql`
2. `@co-at/types` — add inventory phase 2 types
3. Server actions — `custom-order-actions.ts`, `reuse-actions.ts`, `maintenance-actions.ts`, extend `rental-actions.ts`
4. `/scan/[qr_token]` redirect route
5. `QrLabelPrint` component + device detail update
6. `/custom-orders` pages + `CustomOrderStatusStepper`
7. `/reuse` pages + `ReuseStatusStepper`
8. `/maintenance` page + `MaintenanceLogForm`
9. Dispatch panel on device detail
10. Reports page
11. Sidebar update
12. `web` app — `/track/[track_token]` page
13. `approval` app — auto-insert on final approval
