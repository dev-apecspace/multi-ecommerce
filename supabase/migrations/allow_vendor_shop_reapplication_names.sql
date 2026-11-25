-- Rejected applications remain immutable history, so a new application may reuse the same shop name.
-- Keep vendor slugs unique in the application while allowing legitimate duplicate display names.
DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT DISTINCT c.conname, t.relname AS table_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN unnest(c.conkey) AS key(attnum) ON TRUE
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = key.attnum
    WHERE n.nspname = current_schema()
      AND t.relname IN ('Vendor', 'Shop')
      AND c.contype = 'u'
      AND a.attname = 'name'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', constraint_row.table_name, constraint_row.conname);
  END LOOP;
END $$;
