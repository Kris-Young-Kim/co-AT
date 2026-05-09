-- 047h: Create inventory_dispatch_summary view
CREATE OR REPLACE VIEW inventory_dispatch_summary AS
  SELECT 'rental'::text AS dispatch_type, id, inventory_id AS device_id, client_id, approval_id, status, created_at
  FROM rentals
  UNION ALL
  SELECT 'custom'::text, id, device_id, client_id, approval_id, status, created_at
  FROM inventory_custom_orders
  UNION ALL
  SELECT 'reuse'::text, id, device_id, client_id, approval_id, status, created_at
  FROM inventory_reuse_dispatches;
