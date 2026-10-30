
-- 1. Índices para filtrar y ordenar productos
CREATE INDEX idx_products_category_id
    ON public.products(category_id);

CREATE INDEX idx_products_price
    ON public.products(price);

-- 2. Índice para búsqueda de texto por nombre
CREATE INDEX idx_products_name_search
    ON public.products
    USING GIN (to_tsvector('spanish', name));

-- 3. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 4. Trigger que actualiza updated_at al modificar un producto
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
