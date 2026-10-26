-- FULL-TECH | Datos iniciales de demostración
-- Ejecutar DESPUÉS de aplicar las migraciones 001-006.
-- Idempotente: las categorías/productos/variantes se actualizan por slug/SKU.
-- Los precios y stocks son datos ficticios para desarrollo; validar antes de producción.
-- Las imágenes quedan vacías hasta cargar URLs reales en Supabase Storage.

BEGIN;

-- 1) Categorías: los slugs coinciden con AppHeader.vue.
INSERT INTO public.categories (name, slug)
VALUES
  ('Audio', 'audio'),
  ('Iluminación', 'iluminacion'),
  ('Video y Soportes', 'video-y-soportes'),
  ('Starter Packs', 'starter-packs')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

-- 2) Productos de demostración (20 en total, incluidos los 2 Starter Packs).
-- Los precios están expresados en pesos argentinos (ARS), como números de ejemplo.
WITH product_data (
  category_slug, name, slug, description, price, offer_price,
  connection_type, compatibility, specs, images, is_bundle, active
) AS (
  VALUES
  ('audio', 'Micrófono corbatero inalámbrico Dual USB-C', 'microfono-corbatero-dual-usbc',
   'Set inalámbrico de dos micrófonos para creadores móviles.', 79999.00, 69999.00,
   'USB-C', ARRAY['Android USB-C', 'Dispositivos compatibles con USB-C']::TEXT[],
   '{"tipo":"corbatero inalámbrico","canales":2,"receptor":"USB-C"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('audio', 'Micrófono corbatero inalámbrico Dual Lightning', 'microfono-corbatero-dual-lightning',
   'Set inalámbrico de dos micrófonos para dispositivos con Lightning.', 84999.00, NULL,
   'Lightning', ARRAY['iPhone con Lightning']::TEXT[],
   '{"tipo":"corbatero inalámbrico","canales":2,"receptor":"Lightning"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('audio', 'Micrófono de condensador USB con filtro antipop', 'microfono-condensador-usb',
   'Micrófono USB para streaming, podcast y videollamadas.', 104999.00, 89999.00,
   'USB', ARRAY['PC', 'Mac']::TEXT[],
   '{"tipo":"condensador","conexion":"USB","incluye":"filtro antipop"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('audio', 'Micrófono condensador USB/XLR', 'microfono-condensador-usb-xlr',
   'Micrófono para grabación y streaming con conexión USB/XLR.', 139999.00, NULL,
   'USB/XLR', ARRAY['PC', 'Mac', 'Interfaz de audio XLR']::TEXT[],
   '{"tipo":"condensador","conexiones":["USB","XLR"]}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('audio', 'Brazo articulado para micrófono', 'brazo-articulado-microfono',
   'Brazo articulado para ubicar el micrófono en el escritorio.', 45999.00, 39999.00,
   'Mecánica', ARRAY['Micrófonos con montaje compatible']::TEXT[],
   '{"montaje":"abrazadera de escritorio","movimiento":"articulado"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('audio', 'Soporte de escritorio para micrófono', 'soporte-escritorio-microfono',
   'Soporte compacto de escritorio para micrófonos compatibles.', 24999.00, NULL,
   'Mecánica', ARRAY['Micrófonos con rosca compatible']::TEXT[],
   '{"tipo":"soporte de escritorio","uso":"podcast y streaming"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('iluminacion', 'Aro de luz LED 18 pulgadas con trípode', 'aro-de-luz-led-18',
   'Aro LED con trípode ajustable para grabación y streaming.', 74999.00, NULL,
   'USB', ARRAY['Smartphone', 'Cámara compatible con iluminación externa']::TEXT[],
   '{"tipo":"aro LED","diametro_pulgadas":18,"incluye":"trípode"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('iluminacion', 'Aro de luz LED compacto 10 pulgadas', 'aro-de-luz-led-10',
   'Aro de luz compacto para escritorio y videollamadas.', 32999.00, 28999.00,
   'USB', ARRAY['Smartphone', 'PC']::TEXT[],
   '{"tipo":"aro LED","diametro_pulgadas":10}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('iluminacion', 'Minipanel LED portátil con clip', 'minipanel-led-portatil',
   'Luz LED portátil con clip para cámara o celular.', 39999.00, NULL,
   'USB-C', ARRAY['Smartphone', 'Cámara con montaje compatible']::TEXT[],
   '{"tipo":"panel LED","montaje":"clip","portatil":true}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('iluminacion', 'Tira LED Neón RGB inteligente', 'tira-led-neon-rgb',
   'Tira de iluminación RGB para ambientar el setup.', 35999.00, 31999.00,
   'USB', ARRAY['Setup de escritorio']::TEXT[],
   '{"tipo":"tira LED","colores":"RGB","control":"inteligente, según modelo"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('iluminacion', 'Luz LED de escritorio regulable', 'luz-led-escritorio-regulable',
   'Luz compacta regulable para iluminar el espacio de trabajo.', 27999.00, NULL,
   'USB', ARRAY['PC', 'Mac', 'Cargador USB compatible']::TEXT[],
   '{"tipo":"luz de escritorio","intensidad":"regulable"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('video-y-soportes', 'Gimbal estabilizador para celular', 'gimbal-estabilizador',
   'Estabilizador portátil para grabar video con el smartphone.', 119999.00, NULL,
   'Bluetooth/USB', ARRAY['Smartphones compatibles según tamaño y peso']::TEXT[],
   '{"tipo":"gimbal","uso":"video móvil","ejes":"según modelo"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('video-y-soportes', 'Trípode flexible para smartphone', 'tripode-flexible-smartphone',
   'Trípode flexible para grabación y fotografía móvil.', 22999.00, 19999.00,
   'Mecánica', ARRAY['Smartphones con soporte compatible']::TEXT[],
   '{"tipo":"trípode flexible","uso":"móvil"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('video-y-soportes', 'Trípode de mesa compacto', 'tripode-mesa-compacto',
   'Trípode pequeño para cámaras livianas o soportes de celular.', 18999.00, NULL,
   'Mecánica', ARRAY['Cámaras y soportes con montaje compatible']::TEXT[],
   '{"tipo":"trípode de mesa","portatil":true}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('video-y-soportes', 'Trípode ajustable para smartphone', 'tripode-ajustable-smartphone',
   'Trípode de altura ajustable con soporte para teléfono.', 34999.00, NULL,
   'Mecánica', ARRAY['Smartphones con soporte compatible']::TEXT[],
   '{"tipo":"trípode ajustable","incluye":"soporte para smartphone"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('video-y-soportes', 'Soporte de celular para escritorio', 'soporte-celular-escritorio',
   'Soporte de escritorio para posicionar el teléfono durante transmisiones.', 14999.00, 12999.00,
   'Mecánica', ARRAY['Smartphones compatibles con el ancho del soporte']::TEXT[],
   '{"tipo":"soporte de escritorio","dispositivo":"smartphone"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('video-y-soportes', 'Montura universal para cámara y celular', 'montura-universal-camara-celular',
   'Accesorio de montaje para configuraciones de grabación compatibles.', 16999.00, NULL,
   'Mecánica', ARRAY['Cámaras y smartphones con adaptador compatible']::TEXT[],
   '{"tipo":"montura universal","uso":"video"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('video-y-soportes', 'Trípode de mano para creador móvil', 'tripode-mano-creador-mobile',
   'Trípode compacto de mano para grabación en movimiento.', 25999.00, NULL,
   'Mecánica', ARRAY['Smartphones con soporte compatible']::TEXT[],
   '{"tipo":"trípode de mano","uso":"creación móvil"}'::JSONB, ARRAY[]::TEXT[], FALSE, TRUE),

  ('starter-packs', 'Kit Mi Primer Stream', 'kit-mi-primer-stream',
   'Combo inicial con iluminación, audio USB y trípode de mesa.', 174999.00, 149999.00,
   'USB/Mecánica', ARRAY['PC', 'Mac']::TEXT[],
   '{"tipo":"starter pack","incluye":["Aro de luz LED 18 pulgadas con trípode","Micrófono de condensador USB con filtro antipop","Trípode de mesa compacto"]}'::JSONB,
   ARRAY[]::TEXT[], TRUE, TRUE),

  ('starter-packs', 'Kit Creador Mobile', 'kit-creador-mobile',
   'Combo móvil con micrófonos inalámbricos, miniluz LED y trípode de mano.', 159999.00, 139999.00,
   'USB-C/Mecánica', ARRAY['Smartphones compatibles con USB-C']::TEXT[],
   '{"tipo":"starter pack","incluye":["Micrófono corbatero inalámbrico Dual USB-C","Minipanel LED portátil con clip","Trípode de mano para creador móvil"]}'::JSONB,
   ARRAY[]::TEXT[], TRUE, TRUE)
)
INSERT INTO public.products (
  category_id, name, slug, description, price, offer_price,
  connection_type, compatibility, specs, images, is_bundle, active
)
SELECT
  c.id, p.name, p.slug, p.description, p.price, p.offer_price,
  p.connection_type, p.compatibility, p.specs, p.images, p.is_bundle, p.active
FROM product_data p
JOIN public.categories c ON c.slug = p.category_slug
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  offer_price = EXCLUDED.offer_price,
  connection_type = EXCLUDED.connection_type,
  compatibility = EXCLUDED.compatibility,
  specs = EXCLUDED.specs,
  images = EXCLUDED.images,
  is_bundle = EXCLUDED.is_bundle,
  active = EXCLUDED.active,
  updated_at = NOW();

-- 3) Una variante por producto. El stock es de demostración.
WITH variant_data (product_slug, name, sku, stock) AS (
  VALUES
  ('microfono-corbatero-dual-usbc', 'Único', 'FT-AUD-001', 18),
  ('microfono-corbatero-dual-lightning', 'Único', 'FT-AUD-002', 12),
  ('microfono-condensador-usb', 'Único', 'FT-AUD-003', 15),
  ('microfono-condensador-usb-xlr', 'Único', 'FT-AUD-004', 8),
  ('brazo-articulado-microfono', 'Único', 'FT-AUD-005', 20),
  ('soporte-escritorio-microfono', 'Único', 'FT-AUD-006', 25),
  ('aro-de-luz-led-18', 'Único', 'FT-LUZ-001', 14),
  ('aro-de-luz-led-10', 'Único', 'FT-LUZ-002', 20),
  ('minipanel-led-portatil', 'Único', 'FT-LUZ-003', 16),
  ('tira-led-neon-rgb', 'Único', 'FT-LUZ-004', 22),
  ('luz-led-escritorio-regulable', 'Único', 'FT-LUZ-005', 18),
  ('gimbal-estabilizador', 'Único', 'FT-VID-001', 7),
  ('tripode-flexible-smartphone', 'Único', 'FT-VID-002', 24),
  ('tripode-mesa-compacto', 'Único', 'FT-VID-003', 30),
  ('tripode-ajustable-smartphone', 'Único', 'FT-VID-004', 17),
  ('soporte-celular-escritorio', 'Único', 'FT-VID-005', 28),
  ('montura-universal-camara-celular', 'Único', 'FT-VID-006', 19),
  ('tripode-mano-creador-mobile', 'Único', 'FT-VID-007', 21),
  ('kit-mi-primer-stream', 'Único', 'FT-KIT-001', 6),
  ('kit-creador-mobile', 'Único', 'FT-KIT-002', 6)
)
INSERT INTO public.product_variants (product_id, name, sku, stock)
SELECT p.id, v.name, v.sku, v.stock
FROM variant_data v
JOIN public.products p ON p.slug = v.product_slug
ON CONFLICT (sku) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  name = EXCLUDED.name,
  stock = EXCLUDED.stock;

-- 4) Relación entre kits y sus productos componentes.
-- Inserta o actualiza las relaciones sin borrar las existentes.
INSERT INTO public.bundle_items (bundle_id, product_id, quantity)
SELECT kit.id, component.id, 1
FROM (
  VALUES
    ('kit-mi-primer-stream', 'aro-de-luz-led-18'),
    ('kit-mi-primer-stream', 'microfono-condensador-usb'),
    ('kit-mi-primer-stream', 'tripode-mesa-compacto'),
    ('kit-creador-mobile', 'microfono-corbatero-dual-usbc'),
    ('kit-creador-mobile', 'minipanel-led-portatil'),
    ('kit-creador-mobile', 'tripode-mano-creador-mobile')
) AS links(bundle_slug, component_slug)
JOIN public.products kit ON kit.slug = links.bundle_slug
JOIN public.products component ON component.slug = links.component_slug
ON CONFLICT (bundle_id, product_id) DO UPDATE
SET quantity = EXCLUDED.quantity;

COMMIT;

-- Verificación rápida (debería devolver 4 categorías y 20 productos).
SELECT 'categories' AS entity, COUNT(*) AS total FROM public.categories
WHERE slug IN ('audio', 'iluminacion', 'video-y-soportes', 'starter-packs')
UNION ALL
SELECT 'products', COUNT(*) FROM public.products
WHERE slug IN (
  'microfono-corbatero-dual-usbc', 'microfono-corbatero-dual-lightning',
  'microfono-condensador-usb', 'microfono-condensador-usb-xlr',
  'brazo-articulado-microfono', 'soporte-escritorio-microfono',
  'aro-de-luz-led-18', 'aro-de-luz-led-10', 'minipanel-led-portatil',
  'tira-led-neon-rgb', 'luz-led-escritorio-regulable', 'gimbal-estabilizador',
  'tripode-flexible-smartphone', 'tripode-mesa-compacto',
  'tripode-ajustable-smartphone', 'soporte-celular-escritorio',
  'montura-universal-camara-celular', 'tripode-mano-creador-mobile',
  'kit-mi-primer-stream', 'kit-creador-mobile'
);
