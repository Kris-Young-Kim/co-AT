---
name: db-migrate
description: Create a new Supabase migration file with correct naming, namespace prefix, RLS skeleton, and then invoke supabase-reviewer agent to validate before applying.
disable-model-invocation: false
---

# DB Migration Creator

Create and validate a new Supabase migration for the GWATC project.

## Usage
```
/db-migrate <description>
```
Example: `/db-migrate create eval_sessions table`

## Step 1 — Determine Next Migration Number

```bash
ls migrations/ | sort | tail -1
```
Increment by 1. Format: `NNN` (zero-padded to 3 digits).

## Step 2 — Create Migration File

File: `migrations/<NNN>_<snake_case_description>.sql`

### Template
```sql
-- Migration: <NNN>_<description>
-- App: <app-namespace>
-- Created: <date>

-- ============================================================
-- Table: <namespace>_<tablename>
-- ============================================================
CREATE TABLE IF NOT EXISTS <namespace>_<tablename> (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  -- TODO: add columns here
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE <namespace>_<tablename> ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "staff can read own records"
  ON <namespace>_<tablename>
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- TODO: add INSERT/UPDATE/DELETE policies as needed

-- Indexes
-- CREATE INDEX ON <namespace>_<tablename> (<foreign_key_column>);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON <namespace>_<tablename>
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Namespace by app
| App | Prefix |
|-----|--------|
| eval | `eval_` |
| inventory | `inventory_` |
| stats | `stats_` |
| hr | `hr_` |
| approval | `approval_` |
| shared | (no prefix) |

## Step 3 — Invoke supabase-reviewer

After creating the file, automatically call the `supabase-reviewer` agent to validate:
- RLS enabled
- Policies defined
- Naming conventions
- Index coverage

## Step 4 — Apply (only after reviewer PASS)

```bash
# Apply via Supabase CLI (if installed)
npx supabase db push

# Or apply via dashboard / remote
```

## Rules
- Never apply a migration that supabase-reviewer marks as FAIL
- Always include RLS — no exceptions for internal apps
- Keep migrations forward-only (no rollback in same file)
