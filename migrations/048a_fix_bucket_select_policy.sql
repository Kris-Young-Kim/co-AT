-- 048a: Remove broad SELECT policy on uploads bucket
-- Public buckets allow direct URL access without a SELECT RLS policy.
-- Listing is only available to staff via the write policies already in place.

DROP POLICY IF EXISTS "uploads_authenticated_read" ON storage.objects;
