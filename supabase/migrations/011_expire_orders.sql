-- 011_expire_orders.sql
-- Libera el stock de los pedidos de Mercado Pago que nunca se pagaron.
--
-- create_order reserva el stock al crear el pedido. Si el comprador abandona el pago,
-- ese stock quedaría bloqueado para siempre. La preferencia de Mercado Pago vence a los
-- 30 minutos; acá se cancela el pedido recién a los 60 para no cortar un pago que se
-- aprobó sobre el límite.
--
-- Solo aplica a pedidos de Mercado Pago: transferencia y efectivo se pagan por fuera
-- y los confirma un administrador.
--
-- Requisito: habilitar la extensión pg_cron en el dashboard de Supabase
-- (Database -> Extensions -> pg_cron) antes de ejecutar esta migración.

-- 1. Cancelar los pedidos vencidos reutilizando cancel_order (devuelve stock, es idempotente).
CREATE OR REPLACE FUNCTION public.expire_pending_orders(
  p_max_age INTERVAL DEFAULT INTERVAL '60 minutes'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  expired_order RECORD;
  expired_count INTEGER := 0;
BEGIN
  FOR expired_order IN
    SELECT id
    FROM public.orders
    WHERE status = 'pendiente'
      AND payment_method = 'mercadopago'
      AND created_at < now() - p_max_age
    ORDER BY id
  LOOP
    -- cancel_order vuelve a verificar el estado con el pedido bloqueado:
    -- si el webhook lo marcó pagado mientras tanto, devuelve FALSE y no toca nada.
    IF public.cancel_order(expired_order.id) THEN
      expired_count := expired_count + 1;
    END IF;
  END LOOP;

  RETURN expired_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_pending_orders(INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders(INTERVAL) TO service_role;

-- 2. Ejecutarla cada 10 minutos. Con el mismo nombre, cron.schedule reemplaza el job
--    existente, así que volver a correr esta migración no lo duplica.
SELECT cron.schedule(
  'expire-pending-orders',
  '*/10 * * * *',
  $$SELECT public.expire_pending_orders()$$
);
