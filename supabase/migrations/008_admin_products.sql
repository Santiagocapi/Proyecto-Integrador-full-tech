-- Escritura atómica de producto y variantes. Ejecutar como migración, no desde la API.
-- Solo service_role puede invocarla; los middlewares verifican el rol del usuario.
CREATE OR REPLACE FUNCTION public.admin_save_product(p_id BIGINT, p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  saved public.products;
  item JSONB;
  variant_id BIGINT;
BEGIN
  IF jsonb_typeof(p_payload->'variants') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_payload->'variants') = 0 THEN
    RAISE EXCEPTION 'Se requiere al menos una variante' USING ERRCODE = '22023';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.products (
      category_id, name, slug, description, price, offer_price,
      connection_type, compatibility, specs, images, is_bundle, active
    ) VALUES (
      (p_payload->>'category_id')::BIGINT, p_payload->>'name', p_payload->>'slug',
      p_payload->>'description', (p_payload->>'price')::NUMERIC,
      (p_payload->>'offer_price')::NUMERIC, p_payload->>'connection_type',
      ARRAY(SELECT jsonb_array_elements_text(p_payload->'compatibility')),
      p_payload->'specs', ARRAY(SELECT jsonb_array_elements_text(p_payload->'images')),
      (p_payload->>'is_bundle')::BOOLEAN, (p_payload->>'active')::BOOLEAN
    ) RETURNING * INTO saved;
  ELSE
    -- El bloqueo serializa ediciones del mismo producto y conserva referencias.
    PERFORM 1 FROM public.products WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado' USING ERRCODE = 'P0002';
    END IF;
    IF NOT (p_payload->>'is_bundle')::BOOLEAN
       AND EXISTS (SELECT 1 FROM public.bundle_items WHERE bundle_id = p_id) THEN
      RAISE EXCEPTION 'El producto conserva componentes de un pack' USING ERRCODE = '22023';
    END IF;
    UPDATE public.products SET
      category_id = (p_payload->>'category_id')::BIGINT,
      name = p_payload->>'name', slug = p_payload->>'slug',
      description = p_payload->>'description', price = (p_payload->>'price')::NUMERIC,
      offer_price = (p_payload->>'offer_price')::NUMERIC,
      connection_type = p_payload->>'connection_type',
      compatibility = ARRAY(SELECT jsonb_array_elements_text(p_payload->'compatibility')),
      specs = p_payload->'specs', images = ARRAY(SELECT jsonb_array_elements_text(p_payload->'images')),
      is_bundle = (p_payload->>'is_bundle')::BOOLEAN,
      active = (p_payload->>'active')::BOOLEAN, updated_at = now()
    WHERE id = p_id RETURNING * INTO saved;
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'variants') LOOP
    IF item ? 'id' THEN
      IF p_id IS NULL THEN
        RAISE EXCEPTION 'Una variante nueva no admite id' USING ERRCODE = '22023';
      END IF;
      variant_id = (item->>'id')::BIGINT;
      UPDATE public.product_variants SET name = item->>'name', sku = item->>'sku', stock = (item->>'stock')::INTEGER
      WHERE id = variant_id AND product_id = saved.id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'La variante no pertenece al producto' USING ERRCODE = '22023';
      END IF;
    ELSE
      INSERT INTO public.product_variants(product_id, name, sku, stock)
      VALUES(saved.id, item->>'name', item->>'sku', (item->>'stock')::INTEGER);
    END IF;
  END LOOP;

  -- Los identificadores se devuelven como texto para conservar BIGINT en JavaScript.
  RETURN to_jsonb(saved) || jsonb_build_object('id', saved.id::TEXT, 'category_id', saved.category_id::TEXT,
    'product_variants', (SELECT coalesce(jsonb_agg(to_jsonb(v) || jsonb_build_object('id', v.id::TEXT, 'product_id', v.product_id::TEXT) ORDER BY v.id), '[]'::JSONB)
                        FROM public.product_variants v WHERE product_id = saved.id));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_product(BIGINT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_product(BIGINT, JSONB) TO service_role;
