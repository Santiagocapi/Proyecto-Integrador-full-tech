
-- Crear el bucket público para las imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id)
DO UPDATE SET public = EXCLUDED.public;
