-- Instalar después de 011. Escritura/fusión transaccional, con stock e idempotencia.
CREATE TABLE IF NOT EXISTS public.cart_merge_requests (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merge_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, merge_id)
);
ALTER TABLE public.cart_merge_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cart_merge_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.cart_merge_requests TO service_role;

CREATE OR REPLACE FUNCTION public.save_cart(p_user_id UUID, p_items JSONB, p_merge_id UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  line RECORD;
  desired JSONB;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT, 12));
  IF p_merge_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cart_merge_requests WHERE user_id=p_user_id AND merge_id=p_merge_id
  ) THEN RETURN; END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'El carrito debe ser una lista' USING ERRCODE='FT004';
  END IF;
  IF jsonb_array_length(p_items)>100 THEN
    RAISE EXCEPTION 'Demasiadas variantes' USING ERRCODE='FT004';
  END IF;
  FOR line IN SELECT value AS item FROM jsonb_array_elements(p_items) LOOP
    IF coalesce(line.item->>'variant_id','') !~ '^[1-9][0-9]*$'
       OR length(line.item->>'variant_id')>19
       OR jsonb_typeof(line.item->'quantity') IS DISTINCT FROM 'number'
       OR coalesce(line.item->>'quantity','') !~ '^[1-9][0-9]*$' THEN
      RAISE EXCEPTION 'Variante o cantidad inválida' USING ERRCODE='FT004';
    END IF;
    IF (line.item->>'variant_id')::NUMERIC>9223372036854775807
       OR (line.item->>'quantity')::NUMERIC>2147483647 THEN
      RAISE EXCEPTION 'Variante o cantidad fuera de rango' USING ERRCODE='FT004';
    END IF;
  END LOOP;
  IF (SELECT count(*)<>count(DISTINCT value->>'variant_id') FROM jsonb_array_elements(p_items)) THEN
    RAISE EXCEPTION 'Variante repetida' USING ERRCODE='FT004';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) i
    LEFT JOIN public.product_variants v ON v.id=(i->>'variant_id')::BIGINT WHERE v.id IS NULL
  ) THEN RAISE EXCEPTION 'Variante inexistente' USING ERRCODE='FT004'; END IF;

  -- Mismo orden de bloqueo que create_order, antes de validar stock.
  PERFORM 1 FROM public.product_variants v
  WHERE v.id IN (SELECT (value->>'variant_id')::BIGINT FROM jsonb_array_elements(p_items))
     OR (p_merge_id IS NOT NULL AND v.id IN (SELECT variant_id FROM public.cart_items WHERE user_id=p_user_id))
  ORDER BY v.id FOR UPDATE;

  IF p_merge_id IS NOT NULL THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('variant_id', id::TEXT, 'quantity', qty)), '[]'::JSONB)
    INTO desired FROM (
      SELECT v.id, least(sum(x.quantity), v.stock)::INTEGER AS qty
      FROM (
        SELECT (value->>'variant_id')::BIGINT AS id, (value->>'quantity')::BIGINT AS quantity
        FROM jsonb_array_elements(p_items)
        UNION ALL SELECT variant_id, quantity FROM public.cart_items WHERE user_id=p_user_id
      ) x JOIN public.product_variants v ON v.id=x.id
      JOIN public.products p ON p.id=v.product_id
      WHERE p.active AND v.stock>0 GROUP BY v.id, v.stock
    ) merged;
  ELSE
    desired := p_items;
  END IF;
  IF jsonb_array_length(desired)>100 THEN
    RAISE EXCEPTION 'Demasiadas variantes' USING ERRCODE='FT004';
  END IF;
  FOR line IN
    SELECT v.stock, p.active, p.name, (i->>'quantity')::INTEGER AS quantity
    FROM jsonb_array_elements(desired) i
    JOIN public.product_variants v ON v.id=(i->>'variant_id')::BIGINT
    JOIN public.products p ON p.id=v.product_id
  LOOP
    IF NOT line.active OR line.quantity>line.stock THEN
      RAISE EXCEPTION 'Stock insuficiente para %', line.name USING ERRCODE='FT003';
    END IF;
  END LOOP;
  DELETE FROM public.cart_items WHERE user_id=p_user_id;
  INSERT INTO public.cart_items(user_id, variant_id, quantity)
  SELECT p_user_id, (value->>'variant_id')::BIGINT, (value->>'quantity')::INTEGER
  FROM jsonb_array_elements(desired);
  IF p_merge_id IS NOT NULL THEN
    INSERT INTO public.cart_merge_requests(user_id, merge_id) VALUES(p_user_id, p_merge_id);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.save_cart(UUID, JSONB, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_cart(UUID, JSONB, UUID) TO service_role;
