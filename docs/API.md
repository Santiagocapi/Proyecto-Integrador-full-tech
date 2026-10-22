# API de catálogo — FULL-TECH

## Entorno local y consolas

URL base por defecto: `http://localhost:3000/api` (el puerto depende de `PORT`).
Las respuestas son JSON. Los endpoints documentados son de lectura y no requieren
un token del cliente.

- **Consola 1:** desde `backend`, ejecutar `npm run dev` y reservarla para el servidor.
- **Consola 2:** Git, `npm run lint`, `npm test` y consultas manuales.

El backend requiere `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en su entorno.
Consultar `backend/.env.example`; nunca incluir claves en solicitudes del cliente,
documentación o commits. `CORS_ORIGIN` admite orígenes separados por comas.

## GET /health

Respuesta `200`:

```json
{ "status": "ok" }
```

Comprueba que Express responde; no consulta Supabase ni verifica sus permisos.

## GET /categories

Devuelve un array de categorías con `id`, `name` y `slug`, ordenadas por nombre
ascendente. No tiene paginación ni filtros.

Ejemplo ilustrativo de respuesta `200`:

```json
[
  { "id": 1, "name": "Iluminación", "slug": "iluminacion" }
]
```

Sin categorías devuelve `[]`.

## GET /products

Lista productos activos con paginación. Los filtros pueden combinarse.

| Parámetro | Validación / valor por defecto | Comportamiento |
| --- | --- | --- |
| `page` | Entero positivo; `1` | Página solicitada, comienza en 1. |
| `limit` | Entero entre 1 y 100; `10` | Tamaño de página. |
| `category` | Texto no vacío | Slug de categoría, coincidencia exacta. |
| `minPrice` | Número mayor o igual a 0 | Límite inferior inclusivo sobre `price`. |
| `maxPrice` | Número mayor o igual a 0 | Límite superior inclusivo sobre `price`. |
| `connection` | Texto no vacío | Patrón `ILIKE` sobre `connection_type`, sin distinguir mayúsculas. |
| `compat` | Texto no vacío | El array `compatibility` debe contener ese valor. |
| `q` | Texto no vacío | Busca en nombre o descripción mediante `ILIKE`, sin distinguir mayúsculas. |
| `sort` | `price_asc`, `price_desc` o `newest` | Precio ascendente, descendente o fecha de creación descendente. |

Sin `sort`, se ordena por `id` ascendente. Con `sort`, los empates se resuelven
por `id` ascendente para mantener un orden determinista al paginar.
Los filtros y el orden por precio usan
`price`, no `offer_price`. Los textos se recortan antes de validar. Los parámetros
no reconocidos se descartan. Zod convierte los valores numéricos con `Number`;
por ello `minPrice=` y `maxPrice=` se interpretan como `0`.

Si se indican ambos precios, `minPrice` debe ser menor o igual que `maxPrice`;
un rango invertido devuelve `400` con una incidencia en `maxPrice`.
La búsqueda `q` se envía entre comillas, escapando comillas y barras invertidas
para mantener los caracteres reservados dentro del valor del filtro PostgREST.
Esto sigue la [gramática de PostgREST](https://docs.postgrest.org/en/v16/references/api/url_grammar.html).

Ejemplo:

```text
GET /api/products?page=1&limit=10&category=iluminacion&minPrice=1000&maxPrice=50000&connection=usb&compat=android&q=aro&sort=price_asc
```

Respuesta `200` (ejemplo ilustrativo):

```json
{
  "items": [
    {
      "id": 1,
      "name": "Aro de luz",
      "slug": "aro-de-luz",
      "description": "Aro de luz USB",
      "price": 25000,
      "offer_price": null,
      "connection_type": "usb",
      "compatibility": ["android"],
      "images": [],
      "is_bundle": false,
      "created_at": "2026-01-01T00:00:00Z",
      "categories": { "id": 1, "name": "Iluminación", "slug": "iluminacion" }
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

`total` cuenta los resultados filtrados antes de paginar; `pages` es
`ceil(total / limit)`. Sin coincidencias devuelve `items: []`, `total: 0` y
`pages: 0`. Una página fuera de rango devuelve un array vacío y conserva el total
y la página solicitada. La consulta utiliza una relación interna con categorías.

## GET /products/:slug

Busca un producto activo por slug exacto. Devuelve los campos del listado y además:

- `specs`: especificaciones JSON del producto.
- `product_variants`: array con `id`, `name`, `sku` y `stock` de cada variante.
- `bundle_items`: array vacío para productos comunes; para un Starter Pack,
  componentes con `quantity` y `product` (`id`, `name`, `slug`, `price`,
  `offer_price`, `images`).

Ejemplo: `GET /api/products/aro-de-luz`.

Respuesta `404` si no existe o está inactivo:

```json
{ "error": "Producto no encontrado" }
```

No se aplica una validación Zod específica al slug.

## Errores

| Estado | Situación | Respuesta |
| --- | --- | --- |
| `400` | Query de productos inválida | `error` y `details` con las incidencias de Zod. |
| `404` | Producto inexistente o inactivo | `{"error":"Producto no encontrado"}` |
| `404` | Ruta inexistente | `{"error":"Ruta no encontrada"}` |
| `500` | Error interno o de Supabase sin estado HTTP propio | `{"error":"Error interno del servidor"}` |

Ejemplo inválido: `GET /api/products?page=-1`.
El campo `details` es un array de incidencias con `code`, `path`, `message` y
metadatos según la regla incumplida. Los errores sin detalles omiten ese campo.

## Verificación

En la Consola 2, desde `backend`:

```powershell
npm run lint
npm test
Invoke-RestMethod 'http://localhost:3000/api/health'
Invoke-RestMethod 'http://localhost:3000/api/categories'
Invoke-RestMethod 'http://localhost:3000/api/products?page=1&limit=10'
Invoke-RestMethod 'http://localhost:3000/api/products?category=iluminacion&q=aro&sort=price_asc'
Invoke-RestMethod 'http://localhost:3000/api/products/aro-de-luz'
```

Las consultas manuales requieren el servidor de la Consola 1 y datos reales con
slugs existentes. Comprobar también filtros individuales, ausencia de resultados,
una página fuera de rango, una query inválida y un producto inexistente.

La suite actual tiene 31 tests: salud, categorías, listado paginado, filtros,
validaciones, detalle, producto inexistente y construcción de solicitudes del servicio.
Los tests HTTP sustituyen los servicios por mocks. Los tests del servicio usan el
cliente real de Supabase con un transporte HTTP simulado para comprobar filtros,
paginación, búsqueda con caracteres reservados, errores y componentes de Starter Packs.
También cubren páginas vacías, productos sin componentes, fallos de permisos en
detalle y packs, y la respuesta HTTP genérica ante errores internos de categorías.
No ejecutan SQL ni validan relaciones o permisos de la base real.
Las pruebas reales de categorías, filtros, variantes y Starter Packs quedan
pendientes hasta corregir los permisos de Supabase.

## Límites actuales para la revisión

- `%`, `_` y el alias `*` de PostgREST funcionan como comodines en las búsquedas
  `ILIKE`; no se garantiza una búsqueda literal de esos caracteres.
- Falta confirmar la búsqueda y los componentes de Starter Packs contra Supabase real.
