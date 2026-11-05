-- 009_create_order.sql
-- Crea un pedido a partir del carrito del usuario en una sola transacción:
-- o se hacen todos los pasos o no se hace ninguno.
-- Solo service_role puede invocarla; la API verifica el token antes de llamarla.
--
-- Errores que la API traduce a HTTP:
--   FT001 -> el carrito está vacío             (400)
--   FT002 -> stock insuficiente o sin venta     (409, DETAIL trae el producto en JSON)

CREATE OR REPLACE FUNCTION public.create_order(
  p_user_id UUID,
  p_shipping JSONB,
  p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  line RECORD;
  new_order public.orders;
  order_total NUMERIC(10, 2) := 0;
  code TEXT;
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INTEGER;
BEGIN
  -- 1. Bloquear las variantes del carrito, siempre en el mismo orden (por id)
  --    para que dos compras simultáneas no se bloqueen mutuamente.
  --    Si otra compra tiene la misma variante, esta espera a que termine.
  PERFORM 1
  FROM public.product_variants v
  JOIN public.cart_items c ON c.variant_id = v.id
  WHERE c.user_id = p_user_id
  ORDER BY v.id
  FOR UPDATE OF v;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El carrito está vacío' USING ERRCODE = 'FT001';
  END IF;

  -- 2. Verificar stock y que el producto siga a la venta, con los datos ya bloqueados.
  FOR line IN
    SELECT c.quantity, v.id AS variant_id, v.name AS variant_name, v.stock,
           p.name AS product_name, p.active, coalesce(p.offer_price, p.price) AS unit_price
    FROM public.cart_items c
    JOIN public.product_variants v ON v.id = c.variant_id
    JOIN public.products p ON p.id = v.product_id
    WHERE c.user_id = p_user_id
    ORDER BY v.id
  LOOP
    IF NOT line.active OR line.stock < line.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para %', line.product_name
        USING ERRCODE = 'FT002',
              DETAIL = jsonb_build_object(
                'variant_id', line.variant_id::TEXT,
                'product_name', line.product_name,
                'variant_name', line.variant_name,
                'available', CASE WHEN line.active THEN line.stock ELSE 0 END,
                'requested', line.quantity
              )::TEXT;
    END IF;
    order_total := order_total + line.unit_price * line.quantity;
  END LOOP;

  -- 3. Generar un número de seguimiento único: FT- + 6 caracteres (sin 0/O ni 1/I).
  LOOP
    code := 'FT-';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::INTEGER, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE tracking_code = code);
  END LOOP;

  -- 4. Crear el pedido. Los NOT NULL y CHECK de la tabla validan envío y método de pago.
  INSERT INTO public.orders (
    user_id, tracking_code, total, payment_method,
    shipping_name, shipping_address, shipping_city, shipping_zip, shipping_phone
  )
  VALUES (
    p_user_id, code, order_total, p_payment_method,
    p_shipping->>'name', p_shipping->>'address', p_shipping->>'city',
    p_shipping->>'zip', p_shipping->>'phone'
  )
  RETURNING * INTO new_order;

  -- 5. Copiar nombre y precio al detalle (los pedidos viejos no cambian si cambia el catálogo).
  INSERT INTO public.order_items (order_id, variant_id, product_name, variant_name, unit_price, quantity)
  SELECT new_order.id, v.id, p.name, v.name, coalesce(p.offer_price, p.price), c.quantity
  FROM public.cart_items c
  JOIN public.product_variants v ON v.id = c.variant_id
  JOIN public.products p ON p.id = v.product_id
  WHERE c.user_id = p_user_id;

  -- 6. Descontar el stock.
  UPDATE public.product_variants v
  SET stock = v.stock - c.quantity
  FROM public.cart_items c
  WHERE c.user_id = p_user_id AND c.variant_id = v.id;

  -- 7. Vaciar el carrito.
  DELETE FROM public.cart_items WHERE user_id = p_user_id;

  -- Los identificadores se devuelven como texto para conservar BIGINT en JavaScript.
  RETURN jsonb_build_object(
    'id', new_order.id::TEXT,
    'tracking_code', new_order.tracking_code,
    'status', new_order.status,
    'total', new_order.total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(UUID, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(UUID, JSONB, TEXT) TO service_role;
