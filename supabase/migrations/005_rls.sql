
-- 1. Activar RLS en todas las tablas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Lectura pública de categorías
CREATE POLICY "Public can read categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Lectura pública únicamente de productos activos
CREATE POLICY "Public can read active products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (active = true);

-- 4. Lectura pública de variantes
CREATE POLICY "Public can read product variants"
ON public.product_variants
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.products
        WHERE public.products.id = public.product_variants.product_id
          AND public.products.active = true
    )
);
