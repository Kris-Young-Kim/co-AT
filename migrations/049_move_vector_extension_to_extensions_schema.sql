-- Migration: 049_move_vector_extension_to_extensions_schema
-- App: shared
-- Created: 2026-05-09
-- Reason: Supabase Advisor lint 0014_extension_in_public
--   The `vector` extension should not live in the public schema.
--   Moving it to the `extensions` schema reduces the public attack surface.

-- Create extensions schema if it does not already exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate vector in the extensions schema
-- NOTE: This will briefly remove vector support. Run during a maintenance window.
DROP EXTENSION IF EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
