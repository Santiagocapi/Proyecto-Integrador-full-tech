# Administración del catálogo

Todas las rutas requieren `Authorization: Bearer <access_token>` y un perfil con
`role=admin`. Se ejecutan los middlewares de Rocío antes de validar datos o procesar
archivos: 401 sin sesión válida, 403 para comprador.

## Instalación y alcance

Aplicar `008_admin_products.sql` después de las migraciones 001–007. Crea una función
de escritura atómica; no cambia columnas ni carga datos. Solo `service_role` puede
ejecutarla. **Todavía no fue aplicada en Supabase compartido**. Si falta, alta y
edición responden 503. El frontend administrativo corresponde a otra tarea del equipo.

La base actual guarda `price` y `offer_price` en `products`; las variantes solo
tienen stock. Por eso la oferta se edita con PUT del producto. PATCH de variante
rechaza campos de precio: no se inventaron columnas ni se cambió el esquema de Gabriel.

## Crear y editar

- `POST /api/admin/products`: 201. Todas las variantes deben ser nuevas, sin `id`.
- `PUT /api/admin/products/:id`: 200. Reemplaza los campos del producto; no es PATCH.
  Los campos opcionales omitidos vuelven a sus valores predeterminados.
  Las variantes con `id` se actualizan solo si pertenecen al producto; las que no
  tienen `id` se crean. Las variantes omitidas se conservan, junto con sus referencias
  desde carritos y pedidos. Para retirarlas de la venta, establecer su stock en cero.

Ejemplo de cuerpo:

```json
{
  "category_id": "1",
  "name": "Micrófono de prueba",
  "slug": "microfono-de-prueba",
  "description": "Ejemplo; no enviar a la base compartida sin acordar datos de prueba",
  "price": 15000,
  "offer_price": 12000,
  "connection_type": "USB",
  "compatibility": ["PC"],
  "specs": { "color": "negro" },
  "images": ["https://example.com/microfono.png"],
  "active": true,
  "is_bundle": false,
  "variants": [{ "name": "Negro", "sku": "PRUEBA-MIC-NEGRO", "stock": 3 }]
}
```

Respuesta: el producto guardado con `product_variants`; sus identificadores se
devuelven como strings para conservar BIGINT. En los cuerpos y rutas, enviar IDs
como strings decimales positivos. Precio y oferta admiten dos decimales; oferta
debe ser nula o no superar el precio. Stock es un entero entre 0 y 2147483647.
Los campos desconocidos, SKU repetidos e IDs repetidos se rechazan.

Producto y variantes se guardan en una única transacción PostgreSQL: un conflicto
de SKU, categoría inexistente o variante ajena revierte toda la operación.
No se borran componentes de Starter Packs. Un pack con componentes existentes no
puede convertirse a producto común mediante este endpoint.

## Baja y stock

- `DELETE /api/admin/products/:id`: 200 con `{ "id": 1, "active": false }`.
  Baja lógica; conserva variantes, componentes y referencias. Repetirla es seguro.
- `PATCH /api/admin/variants/:id`: cuerpo `{ "stock": 5 }`; 200 con la variante.
  No acepta precio ni oferta. Para ofertas usar PUT del producto.

## Imágenes

`POST /api/admin/uploads`: multipart/form-data, un único archivo en el campo `file`,
sin otros campos. Hasta 2 MiB (2097152 bytes), JPG/PNG/WEBP. Se comprueba la firma
binaria y su coincidencia con MIME; no se usa el nombre original para guardar.
Se genera una ruta UUID en `products/admin/`, sin sobrescribir archivos existentes.
201 con `{ "url": "https://..." }`. Falta de archivo o tipo inválido: 400;
exceso de tamaño: 413. El bucket `products` debe existir (migración 006).

La comprobación de firma no decodifica la imagen completa. La gestión y eliminación
de imágenes sin uso no están incluidas en este módulo.

## Errores

400: validación, referencia inválida o variante ajena. 401/403: autenticación o rol.
404: recurso inexistente. 409: slug/SKU duplicado. 413: imagen demasiado grande.
503: falta la función de la migración 008. 500: error interno, sin exponer detalles
del proveedor. Validaciones incluyen `details` con el campo y motivo.

## Verificación

En backend: `npm test` y `npm run lint`. Las pruebas de rutas usan los middlewares
reales con el proveedor de identidad simulado. Las de servicios comprueban RPC,
baja lógica y archivos. `admin-products.database.test.js` ejecuta 001, 007 y 008 en
PostgreSQL local con PGlite y verifica rollback, roles y conservación de variantes.
No conecta con Supabase ni altera datos compartidos.

En frontend: `npx vitest run`, `npx eslint .`, `npm run build`. Se cubren perfiles
tardíos tras logout, cambio de cuenta, errores de solicitudes anteriores y roles.

Para cerrar la integración real: revisar/aplicar 008 con Gabriel y usar cuentas y
productos de prueba acordados. No crear administradores ni modificar el catálogo
del equipo desde una prueba automática. PR #6 conserva la versión anterior; la
corrección de Rocío está en PR #11 y aún necesita la protección ante cambio de cuenta
que se incluye y prueba en esta rama.
