-- 010_mercadopago.sql
-- Soporte para cobrar los pedidos con Mercado Pago Checkout Pro.

-- 1. Nuevo método de pago. El CHECK original (003) se reemplaza: no se editan migraciones ya ejecutadas.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('tarjeta', 'transferencia', 'efectivo', 'mercadopago'));

-- 2. Datos del cobro en Mercado Pago.
--    mp_preference_id: la preferencia creada al confirmar el pedido (permite reintentar el pago).
--    mp_payment_id: el pago aprobado; UNIQUE evita asociar el mismo pago a dos pedidos.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 3. Cancelar un pedido pendiente devolviendo su stock, en una sola transacción.
--    Es idempotente: si el pedido ya no está pendiente devuelve FALSE y no toca nada,
--    así una notificación repetida de Mercado Pago no devuelve el stock dos veces.
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_status TEXT;
BEGIN
  -- Bloquear el pedido para que dos cancelaciones simultáneas no devuelvan el stock dos veces.
  SELECT status INTO current_status FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF current_status IS DISTINCT FROM 'pendiente' THEN
    RETURN FALSE;
  END IF;

  UPDATE public.product_variants v
  SET stock = v.stock + oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id AND oi.variant_id = v.id;

  UPDATE public.orders SET status = 'cancelado' WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(BIGINT) TO service_role;
