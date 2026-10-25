-- FULL-TECH | Promover un usuario existente a administrador
-- Ejecutar en Supabase SQL Editor como administrador del proyecto.
-- Reemplazá el correo de ejemplo por el correo real del usuario.
--
-- Este script asume que public.profiles tiene:
--   id UUID (relacionado con auth.users.id)
--   role TEXT (con el valor permitido 'admin')
-- Verificá supabase/migrations/002_profiles.sql antes de ejecutarlo.

BEGIN;

DO $$
DECLARE
  target_email TEXT := 'admin@ejemplo.com'; -- CAMBIAR por el correo real
  target_user_id UUID;
  updated_rows INTEGER;
BEGIN
  SELECT id
    INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION
      'No existe un usuario en auth.users con el correo %. Primero debe registrarse.', target_email;
  END IF;

  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = target_user_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    RAISE EXCEPTION
      'El usuario % existe en Auth, pero no tiene una fila en public.profiles. Revisá la migración 002_profiles.sql y el trigger de creación de perfiles.',
      target_email;
  END IF;

  RAISE NOTICE 'El usuario % fue promovido a administrador.', target_email;
END $$;

COMMIT;

-- Verificación opcional:
-- SELECT u.email, p.role
-- FROM auth.users u
-- JOIN public.profiles p ON p.id = u.id
-- WHERE lower(u.email) = lower('admin@ejemplo.com');
