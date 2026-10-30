-- 007_permisos.sql
-- Supabase ya no da permisos automáticos sobre las tablas creadas por SQL.
-- Sin esto, la API (que usa la clave secreta = rol service_role) recibe
-- "permission denied for table ...". RLS no frena a service_role, solo faltaba el GRANT.

-- 1. Tablas que ya existen (las 8 de las migraciones 001 a 003)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. Tablas, secuencias y funciones que se creen más adelante (por ejemplo create_order)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;
