# Plan de implementación · FULL-TECH

**Equipo:** Ctrl C + Ctrl V = 404 Not Found · Programación IV · UTN FRSR\
**Integrantes:** Santiago, Gabriel, Hugo, Rocío, Delfina, Andre, Dolo, Stefano, Gustavo\
**Versión:** 1.1 (15/10/2026) · Frontend en Vue.js

Este documento está pensado para subirse al repositorio como `docs/PLAN.md`. Define la arquitectura, las reglas de trabajo con Git y qué hace cada integrante, con los commits esperados uno por uno.

---

## 1. Decisiones de arquitectura

### 1.1 Stack final

| Capa | Tecnología |
|---|---|
| Frontend | **Vue 3** (Composition API, `<script setup>`) + **Vite**, **Vue Router** (rutas y guardas por rol), **Pinia** (estado de sesión y carrito), CSS con custom properties, mobile-first |
| Backend | Node.js 20 + Express 4, `zod` (validación), `helmet`, `cors`, `morgan`, `multer` |
| Base de datos | PostgreSQL en **Supabase** (migraciones SQL versionadas en el repo) |
| Autenticación | **Supabase Auth** (bcrypt + JWT) + middleware de roles en Express |
| Imágenes | Supabase Storage (bucket `products`) |
| Tests | Vitest (stores de Vue) + Vitest y Supertest (API) |
| Calidad | ESLint + Prettier + GitHub Actions (lint y tests en cada PR) |
| Deploy | Frontend en **Vercel**, API en **Render**, BD y Auth en **Supabase** |

El frontend es una SPA (aplicación de una sola página): Vue Router cambia de vista sin recargar, Pinia guarda el carrito y la sesión en un solo lugar y cada parte de la pantalla es un componente `.vue` reutilizable.

### 1.2 El brief necesita actualizarse

La sección **10. Stack Tecnológico** y la **12. Alcance** dicen "PostgreSQL en Render", "bcrypt + JWT" hechos a mano y dejan Vue como opción. Hay que cambiarlas a:

- Frontend: Vue 3 + Vite, Vue Router y Pinia.
- Base de datos: PostgreSQL en Supabase.
- Autenticación: Supabase Auth (contraseñas cifradas con bcrypt y sesiones JWT), verificación del token y control de roles en la API Express.
- Despliegue: frontend en Vercel, API en Render, base de datos y autenticación en Supabase.

---

## 2. Estructura del repositorio

El proyecto es un **monorepo**: un solo repositorio de GitHub que contiene dos aplicaciones separadas (el frontend y el backend), las migraciones de la base de datos y la documentación. Así todo el equipo trabaja en el mismo lugar, el historial de commits es uno solo y un mismo Pull Request puede tocar la vista y el endpoint que usa.

Frontend y backend son proyectos independientes: cada uno tiene su `package.json`, sus dependencias y su `.env`, y se ejecutan en terminales distintas.

```bash
# Terminal 1
cd frontend
npm install
npm run dev      # abre la tienda en http://localhost:5173

# Terminal 2
cd backend
npm install
npm run dev      # levanta la API en http://localhost:3000
```

```
full-tech/
├── frontend/
│   ├── index.html
│   ├── public/img/
│   ├── src/
│   │   ├── main.js                    # Crea la app, registra Router y Pinia
│   │   ├── App.vue                    # Layout: AppHeader, <RouterView>, AppFooter, CartDrawer
│   │   ├── router/index.js            # Rutas y guardas
│   │   ├── stores/
│   │   │   ├── auth.js                # Pinia: sesión y rol
│   │   │   └── cart.js                # Pinia: carrito
│   │   ├── services/api.js            # fetch a la API con token
│   │   ├── lib/supabase.js            # Cliente con anon key
│   │   ├── composables/               # useToast.js, useProducts.js, useFormValidation.js
│   │   ├── utils/                     # validators.js, format.js
│   │   ├── assets/styles/             # tokens.css, base.css
│   │   ├── components/
│   │   │   ├── ui/                    # BaseButton, BaseInput, BaseBadge, BaseModal, ToastContainer
│   │   │   ├── layout/                # AppHeader, AppFooter, AdminLayout
│   │   │   ├── home/                  # HeroBanner, CategoryGrid, FeaturedKits, NewArrivals, ValueProps
│   │   │   ├── product/               # ProductCard, ProductGallery, ProductSpecs, VariantSelector
│   │   │   ├── catalog/               # FilterPanel, SearchBox, SortSelect
│   │   │   ├── cart/                  # CartButton, CartDrawer, CartItem
│   │   │   ├── auth/                  # UserMenu
│   │   │   └── checkout/              # ShippingForm, PaymentMethod, OrderSummary
│   │   └── views/
│   │       ├── HomeView.vue
│   │       ├── CatalogView.vue
│   │       ├── ProductView.vue
│   │       ├── CheckoutView.vue
│   │       ├── ConfirmationView.vue
│   │       ├── LoginView.vue
│   │       ├── RegisterView.vue
│   │       ├── AccountView.vue
│   │       ├── NotFoundView.vue
│   │       └── admin/                 # AdminDashboardView, AdminProductsView, AdminProductFormView, AdminOrdersView
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/                    # env.js, supabase.js
│   │   ├── middlewares/               # auth.js, validate.js, error-handler.js
│   │   ├── routes/                    # *.routes.js
│   │   ├── controllers/
│   │   ├── services/                  # Acceso a Supabase
│   │   └── schemas/                   # Esquemas zod
│   ├── tests/
│   └── package.json
├── supabase/
│   ├── migrations/                    # 001_..., 002_..., ...
│   └── seed.sql
├── docs/
│   ├── PLAN.md                        # Este documento
│   ├── API.md
│   ├── DB.md
│   └── MANUAL.md                      # Manual de usuario (para el video)
├── .github/
│   ├── workflows/ci.yml
│   └── pull_request_template.md
├── .editorconfig
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

### Carpeta `frontend/` (Vue 3)

| Archivo o carpeta | Qué es y para qué se usa |
|---|---|
| `index.html` | La **única** página HTML del sitio. Tiene un `<div id="app"></div>` vacío donde Vue dibuja todo. No se crean más archivos HTML: cada "página" de la tienda es una vista `.vue`. |
| `public/img/` | Archivos que se sirven tal cual, sin procesar: logo, favicon e imágenes fijas de la Home. Se usan con la ruta absoluta, por ejemplo `/img/logo.svg`. Las fotos de productos **no** van acá: se suben a Supabase Storage desde el panel de admin. |
| `src/main.js` | Punto de entrada. Crea la aplicación (`createApp(App)`), le conecta Pinia y Vue Router, importa los estilos globales y la monta en `#app`. Después del setup casi no se toca. |
| `src/App.vue` | El componente raíz, el "molde" fijo de todas las páginas: `AppHeader` arriba, `<RouterView />` en el medio (ahí aparece la vista de la ruta actual), `AppFooter` abajo, y el `CartDrawer` y los toasts, que tienen que existir en cualquier página. |
| `src/router/index.js` | La lista de rutas (`/catalogo`, `/producto/:slug`, etc.), qué vista corresponde a cada una y la guarda que controla quién puede entrar. Se explica en la sección 2.1. |
| `src/stores/` | **Estado global con Pinia**: datos que varias partes de la página necesitan al mismo tiempo. `auth.js` sabe quién está logueado y su rol; `cart.js` sabe qué hay en el carrito. Ejemplo: el botón "Agregar" de la ficha de producto y el contador del header usan el mismo `useCartStore()`; cuando uno agrega un ítem, el otro se actualiza solo. |
| `src/services/api.js` | El **único** lugar que hace `fetch` al backend. Le agrega la URL base (`VITE_API_URL`), el token del usuario cuando hace falta y convierte los errores en un `ApiError` con mensaje. Ningún componente escribe `fetch` directamente; todos llaman a `api.get(...)`, `api.post(...)`, etc. |
| `src/lib/supabase.js` | El cliente de Supabase del navegador, creado con la **anon key** (la clave pública). Solo se usa para iniciar sesión, cerrarla y obtener el token. Los datos (productos, carrito, pedidos) siempre se piden a nuestra API, nunca directo a Supabase. |
| `src/composables/` | Funciones reutilizables con lógica reactiva; por convención empiezan con `use`. `useProducts()` trae productos con filtros, `useFormValidation()` maneja los errores de un formulario y `useToast()` muestra avisos. A diferencia de un store, cada vez que se llama un composable se crea un estado nuevo: dos formularios tienen sus propios errores. |
| `src/utils/` | Funciones comunes de JavaScript, sin nada de Vue. `validators.js` (por ejemplo `isEmail`, `isStrongPassword`) y `format.js` (`formatPrice(45999)` devuelve `"$ 45.999"`, `formatDate`). |
| `src/assets/styles/` | Estilos globales. `tokens.css` define variables (`--color-cyan: #00F0FF`, espaciados, sombras glow) que todos usan en vez de escribir colores a mano; `base.css` tiene el reset y la tipografía. Los estilos propios de un componente van dentro del `.vue`, en `<style scoped>`, así no afectan al resto. |
| `src/components/` | Piezas reutilizables, agrupadas por tema: `ui/` (botones, inputs, modal: no saben nada de la tienda), `layout/` (header, footer, layout del admin), y después una carpeta por módulo: `home/`, `product/`, `catalog/`, `cart/`, `auth/`, `checkout/`. |
| `src/views/` | Una vista por ruta (`HomeView.vue`, `CatalogView.vue`...). Las del panel van en `views/admin/`. |

**Vista vs. componente.** La **vista** es la página completa de una ruta: lee la URL, pide los datos a la API y arma la pantalla juntando componentes. El **componente** es una pieza que recibe datos por *props* y avisa lo que pasa con *eventos* (`emit`), sin saber de qué página forma parte. Ejemplo con la ficha de producto:

```vue
<!-- views/ProductView.vue (vista: busca el producto y arma la página) -->
<ProductGallery :images="product.images" />
<VariantSelector :variants="product.variants" @change="variant = $event" />
<BaseButton @click="cart.addItem(item, qty)">Agregar al carrito</BaseButton>
```

`VariantSelector` no sabe de dónde salieron las variantes ni qué se hace con la elegida: solo las muestra y emite `change`. Por eso se puede reutilizar y probar por separado.

**Convenciones de nombres.** Componentes y vistas en PascalCase (`ProductCard.vue`), los que son genéricos de UI empiezan con `Base`, las vistas terminan en `View`, y todo se escribe con `<script setup>`.

### Carpeta `backend/` (API Express)

La API está organizada **en capas**: cada archivo tiene una sola responsabilidad y una petición pasa por todas en orden.

| Archivo o carpeta | Qué es y para qué se usa |
|---|---|
| `src/server.js` | Arranca el servidor (`app.listen(PORT)`). Nada más. |
| `src/app.js` | Configura Express: middlewares globales (`helmet` para cabeceras de seguridad, `cors` para permitir solo a nuestro frontend, `express.json()` para leer el body, `morgan` para ver las peticiones en consola), monta todas las rutas bajo `/api` y al final el manejador de errores. Está separado de `server.js` para que los tests puedan usar la app sin abrir un puerto. |
| `src/config/env.js` | Lee las variables del `.env` y frena el arranque con un mensaje claro si falta alguna. |
| `src/config/supabase.js` | El cliente de Supabase del servidor, creado con la **service role key**. Esta clave tiene permiso total sobre la base, por eso vive solo en el backend y en el `.env` (nunca en el frontend ni en GitHub). |
| `src/middlewares/` | Funciones que se ejecutan **antes** del controlador. `auth.js`: `requireAuth` verifica el token y deja el usuario en `req.user`; `requireRole('admin')` corta con 403 si no es admin. `validate.js`: revisa los datos con un esquema zod y corta con 400 si están mal. `error-handler.js`: atrapa cualquier error y responde siempre con el mismo formato `{ error, details }`. |
| `src/routes/` | Un archivo por recurso (`products.routes.js`, `cart.routes.js`...). Solo dicen "este método y esta URL pasan por estos middlewares y terminan en este controlador". No tienen lógica. |
| `src/controllers/` | Reciben la petición (`req`), sacan lo que necesitan (params, query, body, usuario), llaman al service y responden con el código HTTP y el JSON. |
| `src/services/` | Donde está la lógica de negocio y las consultas a Supabase (por ejemplo, armar el filtro de productos o fusionar dos carritos). No saben nada de `req` ni `res`, así se pueden reutilizar y testear. |
| `src/schemas/` | Las reglas de validación con zod: qué campos llegan, de qué tipo y con qué formato. |
| `tests/` | Tests con Vitest y Supertest, que hacen peticiones reales a la app y revisan la respuesta. |

**Recorrido de una petición, de punta a punta.** Un visitante abre `/catalogo?category=audio`:

1. `CatalogView.vue` lee `category=audio` de la URL y llama a `useProducts()`.
2. El composable llama a `api.get('/products?category=audio')` desde `services/api.js`.
3. La petición llega a la API: `app.js` la pasa a `routes/products.routes.js`.
4. El middleware `validate` revisa los parámetros con `schemas/product.schema.js`.
5. `controllers/products.controller.js` llama a `productsService.list({ category: 'audio' })`.
6. `services/products.service.js` consulta las tablas en Supabase y devuelve los productos.
7. El controlador responde `200` con `{ items, total, page, pages }`.
8. El composable guarda los productos y la vista los dibuja con `ProductCard`.

Si algo falla en cualquier paso (parámetro inválido, error de base de datos), el `error-handler` responde con un mensaje y `api.js` lo convierte en un error que la vista muestra.

```js
// routes/products.routes.js: así se ve una ruta
router.get('/', validate(listProductsSchema, 'query'), productsController.list)
router.get('/:slug', productsController.getBySlug)

// routes/admin-products.routes.js: una ruta protegida
router.post('/', requireAuth, requireRole('admin'), validate(productSchema), adminProductsController.create)
```

### Carpeta `supabase/` (base de datos)

- `migrations/`: archivos SQL numerados (`001_catalogo.sql`, `002_profiles.sql`...) que crean y modifican las tablas. Se ejecutan en orden y quedan versionados en Git, así cualquiera puede recrear la base desde cero y se ve quién cambió qué. **Regla:** una migración que ya se ejecutó no se edita; si hay que cambiar algo, se crea una nueva (`008_agregar_columna_x.sql`).
- `seed.sql`: datos de ejemplo (categorías, productos, Starter Packs) para que la tienda no arranque vacía.
- `scripts/`: SQL de ayuda, como el que convierte un usuario en administrador.

### Resto de la raíz

- `docs/`: este plan, la documentación de la API, el modelo de datos y el manual de usuario que se usa en el video.
- `.github/workflows/ci.yml`: el CI, que en cada Pull Request corre lint, tests y build. Si falla, el PR no se puede mergear.
- `.github/pull_request_template.md`: la plantilla que aparece al abrir un PR.
- `.gitignore` (qué no se sube: `node_modules`, `.env`, `dist`), `.editorconfig` (mismo formato de indentación en todos los editores), `CONTRIBUTING.md` (cómo trabajar en el repo) y `README.md` (cómo instalarlo y correrlo).

### ¿Dónde pongo...?

| Si tenés que... | Va en... |
|---|---|
| Hacer una página nueva | `frontend/src/views/` + una ruta en `router/index.js` |
| Hacer una pieza que se repite | `frontend/src/components/<tema>/` |
| Guardar algo que usan varias páginas | Un store en `frontend/src/stores/` |
| Reutilizar lógica con estado (cargar, validar) | `frontend/src/composables/` |
| Pedir datos al backend | `api.get/post/...` de `services/api.js` |
| Crear un endpoint | Ruta en `routes/` → controlador en `controllers/` → lógica en `services/` → validación en `schemas/` |
| Cambiar una tabla | Una migración nueva en `supabase/migrations/` |
| Agregar una variable de entorno | El `.env` local **y** el `.env.example` (sin el valor real) |

### 2.1 Rutas del frontend

La tienda es una **SPA** (*Single Page Application*): el navegador carga `index.html` una sola vez y, cuando el usuario navega, **Vue Router** mira la URL y cambia la vista que se muestra en `<RouterView />`, sin recargar la página. Por eso el carrito y la sesión no se pierden al pasar de una página a otra, y la navegación es instantánea.

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | HomeView | Público |
| `/catalogo` | CatalogView | Público |
| `/producto/:slug` | ProductView | Público |
| `/login`, `/registro` | LoginView, RegisterView | Solo sin sesión |
| `/checkout` | CheckoutView | Logueado |
| `/confirmacion/:tracking` | ConfirmationView | Logueado |
| `/cuenta` | AccountView | Logueado |
| `/admin`, `/admin/productos`, `/admin/productos/nuevo`, `/admin/productos/:id`, `/admin/pedidos` | Vistas de admin | Admin |
| `/:pathMatch(.*)*` | NotFoundView | Público |

**Cómo se define una ruta.**

```js
// router/index.js
{
  path: '/producto/:slug',
  name: 'product',
  component: () => import('@/views/ProductView.vue'),   // carga diferida
  meta: { title: 'Producto' },
},
{
  path: '/checkout',
  name: 'checkout',
  component: () => import('@/views/CheckoutView.vue'),
  meta: { title: 'Checkout', requiresAuth: true },
},
```

- **`path`** es la URL. **`name`** es un nombre para navegar sin escribir la URL a mano. **`component`** es la vista.
- **Carga diferida** (`() => import(...)`): el código de cada vista se descarga recién cuando alguien entra a esa ruta. Así la primera carga del sitio es más liviana, algo importante en celulares.
- **`meta`** son datos extra: el título de la pestaña y quién puede entrar.

**Parámetros dinámicos (`:slug`, `:tracking`, `:id`).** La parte con dos puntos cambia según el producto o pedido:

| URL real | Vista | Valor que lee la vista |
|---|---|---|
| `/producto/aro-de-luz-led-26cm` | ProductView | `route.params.slug === 'aro-de-luz-led-26cm'` |
| `/confirmacion/FT-8K2M4Q` | ConfirmationView | `route.params.tracking === 'FT-8K2M4Q'` |
| `/admin/productos/12` | AdminProductFormView | `route.params.id === '12'` |

El **slug** es el nombre del producto en formato URL (minúsculas, sin acentos, con guiones). Se usa en vez del número de id porque la URL queda legible y mejor para buscadores.

**Query params (`?clave=valor`).** Son opcionales y no cambian la vista, solo su contenido. El catálogo los usa para los filtros: `/catalogo?category=audio&maxPrice=50000&sort=price_asc`. La vista los lee con `route.query` y, al cambiar un filtro, actualiza la URL con `router.replace({ query })`. Así, si alguien comparte o recarga el link, ve los mismos resultados. El login usa `?redirect=/checkout` para saber a dónde volver después de iniciar sesión.

**Cómo se navega.**

```vue
<RouterLink to="/catalogo">Ver catálogo</RouterLink>
<RouterLink :to="{ name: 'product', params: { slug: product.slug } }">{{ product.name }}</RouterLink>
```

```js
const router = useRouter()
router.push(`/confirmacion/${order.tracking_code}`)   // desde código, por ejemplo después de comprar
```

Para links internos **no se usa `<a href>`**: recargaría toda la aplicación y se perdería el estado.

**Niveles de acceso y qué pasa en cada caso.**

| Acceso | `meta` | Si no cumple |
|---|---|---|
| Público | (nada) | Entra cualquiera |
| Solo sin sesión | `guestOnly: true` | Un usuario logueado que entra a `/login` va al inicio |
| Logueado | `requiresAuth: true` | Va a `/login?redirect=<ruta>` y, al iniciar sesión, vuelve a donde quería ir |
| Admin | `requiresAdmin: true` | Sin sesión va al login; un comprador va al inicio |

La guarda es una función que Vue Router ejecuta **antes de cada cambio de ruta**:

```js
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()                                    // espera a saber si hay sesión
  if (to.meta.requiresAuth && !auth.isLoggedIn)
    return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.requiresAdmin && !auth.isAdmin)
    return auth.isLoggedIn ? { name: 'home' } : { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.isLoggedIn)
    return { name: 'home' }
})
```

> **Importante:** la guarda del frontend solo decide qué pantallas se muestran. Cualquiera con conocimientos puede saltearla desde el navegador, así que **la seguridad real está en la API**: cada endpoint protegido usa `requireAuth` y `requireRole('admin')`. Las dos protecciones van siempre juntas.

**Rutas anidadas del panel.** Todas las rutas `/admin/...` son "hijas" de una ruta padre que muestra `AdminLayout` (el menú del panel). Las vistas hijas se dibujan dentro de su propio `<RouterView />`, así el menú no se repite en cada vista y la regla de admin se pone una sola vez en la ruta padre.

```js
{
  path: '/admin',
  component: AdminLayout,
  meta: { requiresAdmin: true },
  children: [
    { path: '', name: 'admin', component: AdminDashboardView },
    { path: 'productos', component: AdminProductsView },
    { path: 'productos/nuevo', component: AdminProductFormView },
    { path: 'productos/:id', component: AdminProductFormView },
    { path: 'pedidos', component: AdminOrdersView },
  ],
}
```

**Página 404.** La última ruta, `/:pathMatch(.*)*`, atrapa cualquier URL que no coincida con las anteriores y muestra `NotFoundView`. Tiene que ir siempre al final de la lista.

**Por qué hace falta una regla en Vercel.** Si alguien recarga en `/catalogo`, el navegador le pide a Vercel un archivo `/catalogo` que no existe, porque esa ruta solo la conoce Vue Router. La regla de `vercel.json` le dice a Vercel que responda siempre con `index.html`, y después Vue Router muestra la vista correcta.

---

## 3. Modelo de datos

La base de datos es **PostgreSQL**, alojada en Supabase. Es **relacional**: la información se guarda en tablas que se conectan entre sí con **claves foráneas** (FK), es decir, columnas que guardan el id de una fila de otra tabla. La base controla que esas conexiones sean válidas: no se puede crear un producto con una categoría que no existe.

### Mapa de relaciones

```
categories      1 ── N  products
products        1 ── N  product_variants
products (kit)  1 ── N  bundle_items      N ── 1  products (lo que trae el kit)
auth.users      1 ── 1  profiles
profiles        1 ── N  cart_items        N ── 1  product_variants
profiles        1 ── N  orders
orders          1 ── N  order_items       N ── 1  product_variants
```

Cómo se lee: **1:N** significa "uno a muchos". Una categoría tiene muchos productos, pero cada producto pertenece a una sola categoría. Un pedido tiene muchos ítems, y cada ítem pertenece a un solo pedido.

### Tablas

**`profiles`: datos de cada usuario.** Supabase Auth guarda los usuarios en su propia tabla interna, `auth.users`, con el email y la contraseña cifrada; nosotros **nunca** guardamos contraseñas. `profiles` agrega lo que la tienda necesita y comparte el mismo `id` que `auth.users` (relación 1 a 1).

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | uuid, PK, FK a `auth.users` | Mismo id que el usuario de Supabase Auth |
| `full_name`, `phone` | texto | Datos personales |
| `address`, `city`, `province`, `zip` | texto | Dirección de envío, para precargar el checkout |
| `role` | texto, `'comprador'` o `'admin'` | Define los permisos. Por defecto `comprador`; solo se cambia a admin con un script SQL, nunca desde la página |
| `created_at` | fecha y hora | Cuándo se registró |

**`categories`: las secciones de la tienda.** Audio, Iluminación, Video y Soportes, y Starter Packs.

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | número, PK | Identificador |
| `name` | texto | Nombre que se muestra ("Iluminación") |
| `slug` | texto, único | Nombre para URLs y filtros (`iluminacion`) |

**`products`: lo que se vende.**

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | número, PK | Identificador |
| `category_id` | FK a `categories` | A qué categoría pertenece |
| `name`, `slug` | texto (`slug` único) | Nombre y URL del producto |
| `description` | texto | Descripción larga para la ficha |
| `price` | decimal | Precio normal |
| `offer_price` | decimal, opcional | Precio de oferta; si tiene valor, el normal se muestra tachado |
| `connection_type` | texto | Para filtrar: `USB`, `XLR`, `Lightning`, `USB-C`, `Inalámbrico`... |
| `compatibility` | lista de textos | Para filtrar: `{'PC','iPhone','Android'}` |
| `specs` | jsonb | Ficha técnica flexible, distinta en cada producto: `{"Potencia": "18 W", "Diámetro": "26 cm"}` |
| `images` | lista de textos | URLs de las fotos en Supabase Storage |
| `is_bundle` | verdadero/falso | Si es un Starter Pack |
| `active` | verdadero/falso | Si se muestra en la tienda (se usa para dar de baja) |
| `created_at`, `updated_at` | fecha y hora | Para ordenar por "más nuevos" y saber cuándo se editó |

**`product_variants`: las versiones de cada producto y su stock.**

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | número, PK | Identificador; es lo que se guarda en el carrito y en los pedidos |
| `product_id` | FK a `products` | De qué producto es |
| `name` | texto | "26 cm", "Negro", o "Único" si el producto no tiene variantes |
| `sku` | texto, único | Código interno de inventario |
| `stock` | entero, nunca negativo | Unidades disponibles |

**`bundle_items`: qué trae cada Starter Pack.**

| Columna | Tipo | Para qué |
|---|---|---|
| `bundle_id` | FK a `products` | El kit (un producto con `is_bundle = true`) |
| `product_id` | FK a `products` | Un producto que viene dentro del kit |
| `quantity` | entero | Cuántas unidades trae |

**`cart_items`: el carrito de los usuarios logueados.** El carrito de los visitantes vive solo en el LocalStorage del navegador; esta tabla guarda el de los usuarios registrados, para que lo encuentren igual en otro dispositivo.

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | número, PK | Identificador |
| `user_id` | FK a `profiles` | De quién es |
| `variant_id` | FK a `product_variants` | Qué variante agregó |
| `quantity` | entero | Cuántas unidades |

La combinación `user_id` + `variant_id` es única: si el usuario agrega dos veces lo mismo, se suma la cantidad en la misma fila en vez de duplicarla.

**`orders`: los pedidos.**

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | número, PK | Identificador interno |
| `user_id` | FK a `profiles` | Quién compró |
| `tracking_code` | texto, único | Número de seguimiento que ve el cliente, por ejemplo `FT-8K2M4Q` |
| `status` | texto | `pendiente` → `pagado` → `enviado` → `entregado`, o `cancelado` |
| `total` | decimal | Total cobrado |
| `shipping_name`, `shipping_address`, `shipping_city`, `shipping_zip`, `shipping_phone` | texto | Datos de envío **de ese pedido** (pueden ser distintos a los del perfil) |
| `payment_method` | texto | `tarjeta`, `transferencia` o `efectivo` (simulado) |
| `created_at` | fecha y hora | Fecha de compra |

**`order_items`: el detalle de cada pedido.**

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | número, PK | Identificador |
| `order_id` | FK a `orders` | A qué pedido pertenece |
| `variant_id` | FK a `product_variants` | Qué se compró |
| `product_name`, `variant_name` | texto | Copia del nombre al momento de comprar |
| `unit_price` | decimal | Copia del precio pagado |
| `quantity` | entero | Cuántas unidades |

### Decisiones importantes y por qué

**El stock está en las variantes, no en el producto.** Un aro de luz puede venir en 26 cm y en 33 cm, y cada medida tiene su propio stock. Si el stock estuviera en `products`, no sabríamos cuántos quedan de cada una. Para no tener dos casos distintos en el código, **todo producto tiene al menos una variante**: si no tiene versiones, tiene una sola llamada "Único". Así el carrito y los pedidos siempre trabajan con `variant_id`.

**Los Starter Packs son productos.** Un kit tiene nombre, precio, fotos y stock como cualquier producto, así que se guarda en `products` con `is_bundle = true`. La tabla `bundle_items` dice qué contiene. Ejemplo:

```
products:      id 30 · "Kit Mi Primer Stream" · is_bundle = true · price 89.999
bundle_items:  (30, 4  "Aro de luz LED 26 cm",     1)
               (30, 9  "Micrófono USB condensador", 1)
               (30, 15 "Trípode de mesa",           1)
```

La ficha del kit muestra lo que incluye y cuánto se ahorra frente a comprar cada producto por separado.

**Los pedidos copian el nombre y el precio.** Si el administrador sube el precio de un micrófono la semana que viene, los pedidos viejos tienen que seguir mostrando lo que el cliente pagó. Por eso `order_items` guarda una copia del nombre y del precio al momento de la compra, en vez de leerlos de `products`.

**Los productos no se borran, se desactivan.** Si se borrara un producto, los pedidos que lo incluyen quedarían rotos. "Dar de baja" pone `active = false`: deja de verse en la tienda, pero el historial sigue intacto.

**La ficha técnica usa `jsonb`.** Un micrófono tiene "Patrón polar" y "Frecuencia de muestreo", y una luz tiene "Potencia" y "Temperatura de color". En vez de crear una columna por cada dato posible, `specs` guarda un objeto JSON con lo que corresponda a cada producto, y la vista lo recorre para armar la tabla.

**Las reglas se controlan en la base, no solo en el código.** Las restricciones `CHECK` impiden precios o stock negativos y estados de pedido inventados, y `UNIQUE` impide slugs, SKU o números de seguimiento repetidos. Aunque el código tenga un error, la base no acepta datos inválidos.

### Cómo se crea un pedido: la función `create_order`

Comprar toca varias tablas a la vez, así que se hace en una **transacción**: o se hacen todos los pasos o no se hace ninguno. Está escrita como función SQL en `supabase/migrations/007_create_order.sql` y la API la llama con un solo pedido.

1. Lee el carrito del usuario (`cart_items`).
2. Para cada ítem, **bloquea** la fila de la variante y verifica que haya stock suficiente. El bloqueo hace que, si dos personas compran la última unidad al mismo tiempo, la segunda espere y después vea que ya no hay.
3. Si falta stock de algo, cancela todo y la API responde `409` con el producto que no alcanza.
4. Descuenta el stock de cada variante.
5. Genera un `tracking_code` único (`FT-` + 6 caracteres).
6. Crea la fila en `orders` y una fila en `order_items` por cada producto, copiando nombre y precio.
7. Vacía el carrito del usuario.
8. Devuelve el número de seguimiento, que la página de confirmación muestra.

### Seguridad: RLS (Row Level Security)

Supabase permite consultar la base directamente desde el navegador con la anon key, que es pública. Para que nadie pueda leer pedidos ajenos ni cambiar precios con esa clave, todas las tablas tienen **RLS activado**: por defecto nadie puede leer ni escribir nada. Solo se habilita la lectura pública de productos activos, variantes y categorías. Todo lo demás pasa por nuestra API, que usa la service role key y aplica sus propias reglas: el token, el rol y la validación.

---

## 4. Endpoints de la API

| Método | Ruta | Acceso | Responsable |
|---|---|---|---|
| GET | `/api/health` | Público | Santiago |
| GET | `/api/categories` | Público | Hugo |
| GET | `/api/products?q&category&minPrice&maxPrice&connection&compat&sort&page` | Público | Hugo |
| GET | `/api/products/:slug` | Público | Hugo |
| POST | `/api/auth/register` | Público | Rocío |
| GET | `/api/auth/me` | Logueado | Rocío |
| PUT | `/api/me` | Logueado | Andre |
| GET | `/api/me/orders` | Logueado | Stefano |
| GET / PUT | `/api/cart` | Logueado | Dolo |
| POST | `/api/cart/merge` | Logueado | Dolo |
| POST | `/api/orders` | Logueado | Stefano |
| GET | `/api/orders/:tracking` | Dueño del pedido | Stefano |
| POST / PUT / DELETE | `/api/admin/products[/:id]` | Admin | Hugo |
| PATCH | `/api/admin/variants/:id` | Admin | Hugo |
| POST | `/api/admin/uploads` | Admin | Hugo |
| GET | `/api/admin/orders` | Admin | Gustavo |
| PATCH | `/api/admin/orders/:id/status` | Admin | Gustavo |
| GET | `/api/admin/stats` | Admin | Gustavo |

---

## 5. Reglas de trabajo con Git

Esto es lo que hace que el profesor pueda ver quién hizo qué.

### 5.1 Ramas

- `main`: versión estable, es la que se despliega. **Protegida**: nadie hace push directo.
- `develop`: integración. **Protegida**: solo entra por Pull Request.
- Ramas de trabajo desde `develop`: `feat/<modulo>`, `fix/<problema>`, `docs/<tema>`, `chore/<tarea>`.
- Al final de cada fase, Santiago abre un PR `develop → main`.

### 5.2 Pull Requests

- Todo cambio entra a `develop` por PR con la plantilla completa y **al menos 1 aprobación** de otro integrante.
- El CI (lint + tests) tiene que pasar.
- **Merge con "Create a merge commit"** (Santiago desactiva "Squash" y "Rebase" en la configuración del repo). Así cada commit individual queda en el historial con su autor. Con squash se perderían.
- Antes de abrir el PR: `git pull origin develop` en tu rama y resolver conflictos.

### 5.3 Revisores asignados

Cada PR lo revisa el compañero indicado (las revisiones también cuentan como aporte visible):

| Autor | Revisa |
|---|---|
| Santiago | Gabriel |
| Gabriel | Stefano |
| Hugo | Delfina |
| Rocío | Hugo |
| Delfina | Santiago |
| Andre | Dolo |
| Dolo | Andre |
| Stefano | Gustavo |
| Gustavo | Rocío |

---

## 6. Fases

| Fase | Qué se hace | Quién | Desbloquea |
|---|---|---|---|
| **0. Setup** | Repo, proyecto Vue y Express, linters, CI, rutas vacías, protección de ramas, proyecto Supabase | Santiago (repo) y Gabriel (Supabase) | A todos |
| **1. Bases** | Esquema de BD + seed, sistema de diseño + header/footer, auth en backend, API de productos | Gabriel, Santiago, Rocío, Hugo | Todas las vistas |
| **2. Funcionalidades** | Home, catálogo, detalle, carrito, auth frontend, checkout, mi cuenta, panel admin | Todos en paralelo | Integración |
| **3. Integración y entrega** | Deploy, pruebas cruzadas, corrección de bugs, README, manual, video | Todos | Entrega |

Mientras la Fase 0 no esté en `develop`, el resto puede leer este plan, repasar Vue (Composition API, Router y Pinia), armar su rama y bocetar su vista. **La Fase 0 es lo primero que hay que terminar** porque bloquea al grupo.

### 6.1 Contratos entre módulos

Para trabajar en paralelo sin esperar al otro, se acuerdan estas interfaces desde el inicio. Santiago deja creados los archivos con estas firmas (vacíos o con datos de prueba) en el setup, y cada responsable los completa.

```js
// services/api.js (Santiago)
api.get(path, { auth }) / api.post(path, body, { auth }) / api.put / api.patch / api.delete
// Lanza ApiError { status, message, details } si la respuesta no es 2xx.

// stores/auth.js — Pinia (Rocío)
const auth = useAuthStore()
auth.user, auth.profile             // estado
auth.isLoggedIn, auth.isAdmin       // getters
auth.init()                         // recupera la sesión al cargar la app
auth.login(email, password)
auth.register(datos)
auth.logout()

// stores/cart.js — Pinia (Dolo)
const cart = useCartStore()
cart.items                          // [{ variantId, productId, name, variantName, price, image, quantity }]
cart.count, cart.subtotal           // getters
cart.addItem(item, qty), cart.updateQuantity(variantId, qty), cart.removeItem(variantId), cart.clear()
cart.isOpen, cart.open(), cart.close()   // drawer

// composables/useToast.js (Dolo)
const { success, error, info } = useToast()

// components/product/ProductCard.vue (Santiago)
<ProductCard :product="product" />

// components/layout/AppHeader.vue (Santiago)
// Incluye <SearchBox /> (Delfina), <CartButton /> (Dolo) y <UserMenu /> (Rocío).
```

---

## 7. Tareas y commits por integrante

> Los commits están en el orden en que conviene hacerlos. Cada uno incluye qué archivos toca y qué tiene que quedar funcionando. Es la guía mínima: está bien hacer commits extra (por ejemplo `fix` después de una revisión).

---

### 7.1 Santiago · Setup inicial, sistema de diseño y Home

**Ramas:** `chore/setup-inicial`, `feat/design-system`, `feat/home`

**Tareas en GitHub (no generan commits):**
- Crear el repo `full-tech`, agregar a los 8 compañeros como colaboradores.
- Crear la rama `develop` y protegerla junto con `main` (PR obligatorio, 1 aprobación, CI en verde).
- En *Settings → General → Pull Requests* dejar solo **"Allow merge commits"**.
- Crear un tablero en *Projects* con una tarjeta por tarea de este plan.

**Rama `chore/setup-inicial`** (es lo primero de todo el proyecto):

1. `chore: crear estructura inicial del monorepo`
   Carpetas `frontend/`, `backend/`, `supabase/`, `docs/`. Archivos `.gitignore` (node_modules, .env, dist), `.editorconfig`, `README.md` con nombre del proyecto, integrantes y descripción corta.
2. `chore(frontend): inicializar proyecto Vue 3 con Vite`
   `npm create vue@latest` marcando Vue Router, Pinia, Vitest, ESLint y Prettier. Borrar los componentes de ejemplo y dejar `App.vue` y `main.js` limpios.
3. `feat(router): definir rutas de todas las vistas`
   `router/index.js` con las rutas de la sección 2.1 apuntando a vistas vacías (un `<h1>` con el título), carga diferida (`() => import(...)`), `meta.requiresAuth` / `meta.requiresAdmin` y vista 404. La guarda que lee esos `meta` la hace Rocío.
4. `chore(frontend): crear stores y componentes vacíos de los contratos`
   `stores/auth.js`, `stores/cart.js`, `composables/useToast.js`, `SearchBox.vue`, `CartButton.vue` y `UserMenu.vue` con las firmas de la sección 6.1 y datos de prueba, para que nadie dependa de otro para empezar.
5. `chore(backend): inicializar API Express`
   `app.js` con `helmet`, `cors` (origen desde `.env`), `express.json()`, `morgan`; `server.js`; ruta `GET /api/health` que devuelve `{ status: "ok" }`; `middlewares/error-handler.js` con respuesta `{ error, details }` y 404 para rutas inexistentes.
6. `chore(backend): configurar ESLint, Prettier y Vitest`
   Misma configuración de Prettier que el frontend, scripts `lint`, `format` y `test`.
7. `chore(config): agregar clientes de Supabase y variables de entorno`
   `backend/src/config/env.js` (lee y valida variables), `backend/src/config/supabase.js` (cliente con `SUPABASE_SERVICE_ROLE_KEY`), `frontend/src/lib/supabase.js` (cliente con `VITE_SUPABASE_ANON_KEY`), y `.env.example` en ambos sin valores reales.
8. `feat(frontend): crear servicio HTTP para la API`
   `services/api.js` con las funciones del contrato 6.1: usa `VITE_API_URL`, agrega `Authorization` con el token de la sesión de Supabase cuando `auth: true` y convierte los errores en `ApiError`.
9. `ci: agregar workflow de lint y tests en pull requests`
   `.github/workflows/ci.yml`: en cada PR a `develop` o `main`, instala dependencias y corre `lint`, `test` y `build` en frontend y backend.
10. `docs: agregar guía de contribución y plantilla de PR`
    `CONTRIBUTING.md` (resumen de la sección 5 y convenciones de Vue: componentes en PascalCase, `<script setup>`, una vista por ruta), `.github/pull_request_template.md` (qué cambia, cómo probarlo, capturas, checklist) y este plan como `docs/PLAN.md`.

**Rama `feat/design-system`:**

11. `style: definir tokens de diseño`
    `assets/styles/tokens.css`: fondos `#0D0D11` / `#121218`, neón cyan `#00F0FF`, magenta `#FF007A`, violeta `#8A2BE2`, colores de texto, tipografías (Google Fonts), escala de espaciados, radios, sombras glow y breakpoints.
12. `style: agregar estilos base mobile-first`
    `assets/styles/base.css`: reset, tipografía, contenedor, utilidades de layout y foco visible para accesibilidad. Se importa en `main.js`.
13. `feat(ui): crear componentes BaseButton, BaseInput y BaseBadge`
    En `components/ui/`, con props (`variant`, `size`, `disabled`, `error`), `v-model` en el input y efecto glow en hover y focus.
14. `feat(ui): crear componente BaseModal`
    Modal reutilizable con `<Teleport>`, cierre con Escape y click afuera (lo usan admin y checkout).
15. `feat(ui): crear componente ProductCard`
    `components/product/ProductCard.vue`: prop `product`; imagen, nombre, precio, oferta tachada, badge "Kit" si es bundle y `<RouterLink>` a `/producto/:slug`.
16. `feat(layout): crear AppHeader responsive con menú móvil`
    Logo, navegación por categorías, `<SearchBox />`, `<CartButton />` y `<UserMenu />`. Menú hamburguesa en móvil.
17. `feat(layout): crear AppFooter y layout general`
    Footer con links, redes y datos del equipo; `App.vue` arma AppHeader + `<RouterView>` + AppFooter, con transición entre vistas.

**Rama `feat/home`:**

18. `feat(home): crear componente HeroBanner`
    Título, subtítulo, CTA "Ver Starter Packs" y fondo con degradado neón; adaptado a móvil, tablet y desktop.
19. `feat(home): crear componente CategoryGrid`
    Tarjetas de Audio, Iluminación, Video y Soportes, y Starter Packs que llevan a `/catalogo?category=...`.
20. `feat(home): mostrar kits destacados desde la API`
    `FeaturedKits.vue` pide `GET /api/products?category=starter-packs` en `onMounted` y los dibuja con `ProductCard`. Estados de carga y error.
21. `feat(home): crear carrusel de productos nuevos`
    `NewArrivals.vue` con `GET /api/products?sort=newest&limit=8`, scroll horizontal en móvil.
22. `feat(home): agregar propuesta de valor y CTA de registro`
    `ValueProps.vue` con los tres pilares del brief (curaduría, kits Plug & Play, identidad visual) y un llamado a crear cuenta. `HomeView.vue` une todas las secciones.
23. `perf(home): optimizar imágenes y metadatos`
    Imágenes en WebP, `loading="lazy"`, `alt` descriptivos, y título de pestaña por ruta (`meta.title` + `router.afterEach`).

**En el video:** presentación del equipo y del proyecto, arquitectura general, setup y flujo de Git, sistema de diseño y Home.

---

### 7.2 Gabriel · Base de datos (Supabase) y deploy

**Ramas:** `feat/db-schema`, `feat/db-seed`, `chore/deploy`

**Tareas fuera del repo:** crear el proyecto en Supabase, invitar a Santiago y a Hugo, desactivar la confirmación por email en Auth (simplifica las pruebas), y pasar las claves por un canal privado (nunca por el repo ni por un chat público).

**Rama `feat/db-schema`:**

1. `feat(db): crear tablas de catálogo`
   `supabase/migrations/001_catalogo.sql`: `categories`, `products`, `product_variants`, `bundle_items` con claves foráneas.
2. `feat(db): crear tabla de perfiles con roles`
   `002_profiles.sql`: `profiles` vinculada a `auth.users`, `role` con `CHECK` y valor por defecto `comprador`.
3. `feat(db): crear tablas de carrito y pedidos`
   `003_carrito_pedidos.sql`: `cart_items`, `orders`, `order_items`, estados del pedido con `CHECK`.
4. `feat(db): agregar restricciones, índices y trigger de updated_at`
   `004_indices.sql`: `CHECK (price >= 0)`, `CHECK (stock >= 0)`, índices por `category_id`, `price`, `slug`, búsqueda de texto en `name`, trigger que actualiza `updated_at`.
5. `feat(db): habilitar RLS en todas las tablas`
   `005_rls.sql`: RLS activado en todo; lectura pública solo de productos activos, categorías y variantes. El resto lo maneja la API con la service role.
6. `feat(storage): crear bucket de imágenes de productos`
   `006_storage.sql`: bucket público `products` con lectura pública.
7. `docs(db): documentar modelo de datos con diagrama ER`
   `docs/DB.md` con diagrama en Mermaid, descripción de cada tabla y cómo correr las migraciones.

**Rama `feat/db-seed`:**

8. `feat(db): cargar categorías y productos de ejemplo`
   `supabase/seed.sql`: 4 categorías y al menos 20 productos reales del catálogo del brief, con variantes, specs y stock.
9. `feat(db): cargar Starter Packs`
   "Kit Mi Primer Stream" y "Kit Creador Mobile" con sus `bundle_items`.
10. `chore(db): subir imágenes de productos al bucket`
    Imágenes optimizadas y las URLs actualizadas en el seed.
11. `feat(db): agregar script para promover un usuario a administrador`
    `supabase/scripts/make-admin.sql` (por email), documentado en el README.

**Rama `chore/deploy`** (Fase 3):

12. `chore(deploy): configurar la API en Render`
    `render.yaml` (build, start, health check `/api/health`), variables de entorno en Render.
13. `chore(deploy): configurar el frontend en Vercel`
    `frontend/vercel.json` con la regla que redirige todas las rutas a `index.html` (sin esto, recargar en `/catalogo` da 404 porque Vue Router maneja las rutas en el navegador), variables `VITE_API_URL` y `VITE_SUPABASE_*`, y CORS del backend con el dominio de Vercel.
14. `docs: agregar guía de instalación y despliegue al README`
    Requisitos, clonar, `.env`, correr migraciones y seed, levantar local, URLs de producción y usuarios de prueba.

**En el video:** modelo de datos, por qué el stock está en variantes, RLS, seed y cómo está desplegado todo.

---

### 7.3 Hugo · API de productos y administración del catálogo

**Ramas:** `feat/api-products`, `feat/api-admin-products`

**Rama `feat/api-products`:**

1. `feat(api): agregar endpoint de categorías`
   `routes/categories.routes.js`, controller y service. `GET /api/categories`.
2. `feat(api): listar productos con paginación`
   `GET /api/products?page=&limit=` devuelve `{ items, total, page, pages }`, solo productos activos, con su categoría y precio mínimo de variantes.
3. `feat(api): filtrar productos por categoría, precio, conexión y compatibilidad`
   Parámetros `category`, `minPrice`, `maxPrice`, `connection`, `compat`.
4. `feat(api): agregar búsqueda por texto y ordenamiento`
   `q` (nombre y descripción, sin distinguir mayúsculas) y `sort` (`price_asc`, `price_desc`, `newest`).
5. `feat(api): obtener detalle de producto por slug`
   `GET /api/products/:slug` con variantes y stock, specs, imágenes y, si es bundle, los productos que incluye. 404 si no existe.
6. `feat(api): validar query params con zod`
   `schemas/product.schema.js`; responde 400 con detalle si los parámetros son inválidos.
7. `test(api): agregar tests de endpoints de productos`
   Vitest + Supertest: listado, filtros, búsqueda, detalle, 404 y 400.
8. `docs(api): documentar endpoints de productos`
   `docs/API.md` con ejemplos de request y response.

**Rama `feat/api-admin-products`** (usa los middlewares de Rocío):

9. `feat(api): crear y editar productos como administrador`
   `POST /api/admin/products` y `PUT /api/admin/products/:id`, con variantes, validados con zod y protegidos con `requireAuth` + `requireRole('admin')`.
10. `feat(api): dar de baja productos`
    `DELETE /api/admin/products/:id` hace baja lógica (`active = false`) para no romper pedidos viejos.
11. `feat(api): actualizar stock y precio de variantes`
    `PATCH /api/admin/variants/:id` (stock, precio de oferta).
12. `feat(api): subir imágenes a Supabase Storage`
    `POST /api/admin/uploads` con `multer`, solo jpg/png/webp hasta 2 MB; devuelve la URL pública.
13. `test(api): agregar tests de endpoints de administración`
    401 sin token, 403 con comprador, alta, edición y baja con admin.

**En el video:** estructura en capas de la API (rutas → controladores → servicios), filtros y validación.

---

### 7.4 Rocío · Autenticación, roles y validaciones

**Ramas:** `feat/auth-backend`, `feat/auth-frontend`

**Rama `feat/auth-backend`** (Fase 1, otros dependen de esto):

1. `feat(api): agregar middleware de validación con zod`
   `middlewares/validate.js` (valida `body`, `query` o `params` y responde 400 con detalle) y `schemas/common.schema.js` (email, teléfono, contraseña: mínimo 8 caracteres, una mayúscula y un número).
2. `feat(auth): agregar endpoint de registro`
   `POST /api/auth/register`: valida, crea el usuario con `supabase.auth.admin.createUser` y su fila en `profiles` con rol `comprador`. 409 si el email ya existe.
3. `feat(auth): agregar middleware requireAuth`
   `middlewares/auth.js`: lee el Bearer token, lo verifica con `supabase.auth.getUser`, carga el perfil y lo deja en `req.user`. 401 si falta o no es válido.
4. `feat(auth): agregar middleware requireRole`
   `requireRole('admin')` responde 403 si el rol no coincide.
5. `feat(auth): agregar endpoint del usuario actual`
   `GET /api/auth/me` devuelve el perfil con el rol.
6. `test(auth): agregar tests de registro y middlewares`
   Registro válido e inválido, email duplicado, 401 y 403.

**Rama `feat/auth-frontend`:**

7. `feat(utils): agregar validadores y composable de formularios`
   `utils/validators.js` con las mismas reglas que el backend y `composables/useFormValidation.js` (errores reactivos por campo, mensajes en español). Lo reutilizan registro, checkout, Mi Cuenta y admin.
8. `feat(auth): implementar store de sesión con Pinia`
   `stores/auth.js` con el contrato 6.1: `init()` recupera la sesión de Supabase, escucha `onAuthStateChange` y carga el perfil con `GET /api/auth/me`.
9. `feat(auth): crear vista de registro`
   `RegisterView.vue`: valida en vivo, llama a `/api/auth/register`, inicia sesión y redirige.
10. `feat(auth): crear vista de inicio de sesión`
    `LoginView.vue` con `auth.login()`, mensaje claro si falla y redirección a `?redirect=`.
11. `feat(auth): crear componente UserMenu`
    En el header: "Ingresar" sin sesión; nombre, "Mi cuenta", "Panel admin" (solo admin) y "Cerrar sesión" con sesión.
12. `feat(router): agregar guardas de navegación por rol`
    `router.beforeEach` lee `meta.requiresAuth` y `meta.requiresAdmin`; sin sesión manda a `/login?redirect=...`, sin rol admin manda al inicio; con sesión, `/login` y `/registro` mandan al inicio.

**En el video:** cómo funciona el login con Supabase y JWT, el store de sesión, las guardas del router y la validación en cliente y servidor.

---

### 7.5 Delfina · Catálogo, filtros y búsqueda

**Rama:** `feat/catalogo`

1. `feat(catalogo): maquetar vista de catálogo mobile-first`
   `CatalogView.vue`: grilla de 1 columna en móvil, 2 en tablet y 3 o 4 en desktop, barra superior con contador de resultados.
2. `feat(catalogo): crear composable useProducts`
   `composables/useProducts.js`: recibe filtros reactivos, llama a `GET /api/products` y expone `products`, `total`, `loading` y `error`. Lo puede reutilizar la Home.
3. `feat(catalogo): mostrar productos desde la API`
   La vista usa `useProducts` y dibuja con `ProductCard`.
4. `feat(catalogo): crear componente FilterPanel`
   Categoría, rango de precio, tipo de conexión y compatibilidad, emitiendo los cambios con `v-model`. En móvil es un panel deslizable con botón "Filtros".
5. `feat(catalogo): sincronizar filtros con la URL`
   Los filtros se leen de `route.query` y cada cambio hace `router.replace({ query })`; un `watch` vuelve a pedir productos sin recargar la página, y un link compartido mantiene los filtros.
6. `feat(catalogo): agregar ordenamiento y paginación`
   `SortSelect.vue` y botón "Cargar más".
7. `feat(search): crear componente SearchBox con búsqueda predictiva`
   En el header: con debounce de 300 ms muestra hasta 5 sugerencias; Enter lleva a `/catalogo?q=`; navegable con teclado.
8. `feat(catalogo): agregar estados de carga, vacío y error`
   Skeletons mientras carga, mensaje y botón "Limpiar filtros" si no hay resultados.
9. `docs(manual): escribir sección de catálogo del manual de usuario`
   En `docs/MANUAL.md`, con capturas.

**En el video:** filtrado dinámico, composable `useProducts`, estado en la URL y búsqueda predictiva.

---

### 7.6 Andre · Detalle de producto y Mi Cuenta

**Ramas:** `feat/producto-detalle`, `feat/mi-cuenta`

**Rama `feat/producto-detalle`:**

1. `feat(producto): maquetar vista de detalle`
   `ProductView.vue`: galería arriba en móvil y al costado en desktop; nombre, precio, selector de variante, cantidad y botón.
2. `feat(producto): cargar el producto según el slug de la ruta`
   Lee `route.params.slug`, llama a `GET /api/products/:slug` y vuelve a cargar si cambia el slug (`watch`); muestra "Producto no encontrado" si da 404.
3. `feat(producto): crear componente ProductGallery`
   Imagen principal, miniaturas clickeables y deslizamiento táctil en móvil.
4. `feat(producto): crear componente ProductSpecs`
   Pestañas "Descripción", "Ficha técnica" (desde `specs`) y "Compatibilidad".
5. `feat(producto): crear componente VariantSelector`
   Emite la variante elegida; cambia precio y stock disponible, deshabilita variantes sin stock y limita la cantidad.
6. `feat(producto): agregar producto al carrito`
   Usa `cart.addItem()` del store, muestra un toast y abre el drawer con `cart.open()`.
7. `feat(producto): mostrar contenido de los Starter Packs y productos relacionados`
   Si es bundle, lista qué incluye y cuánto se ahorra; abajo, productos de la misma categoría con `ProductCard`.

**Rama `feat/mi-cuenta`:**

8. `feat(api): agregar endpoint para actualizar el perfil`
   `PUT /api/me`: nombre, teléfono y dirección, validados con zod (no permite cambiar el rol).
9. `feat(cuenta): crear vista Mi Cuenta con datos personales`
   `AccountView.vue`: formulario precargado desde `auth.profile`, editable, con `useFormValidation` y toast de guardado.
10. `feat(cuenta): mostrar historial de pedidos`
    Lista con fecha, número de seguimiento, estado y total, desplegando el detalle (usa `GET /api/me/orders` de Stefano).
11. `test(api): agregar tests de actualización de perfil`

**En el video:** ficha de producto, comunicación entre componentes con props y eventos, variantes con stock y Mi Cuenta.

---

### 7.7 Dolo · Carrito persistente

**Rama:** `feat/carrito`

1. `feat(cart): implementar store del carrito con Pinia`
   `stores/cart.js` con el contrato 6.1, guardando en LocalStorage con un `watch` profundo y recuperándolo al iniciar.
2. `test(cart): agregar tests del store del carrito`
   Vitest: agregar, sumar cantidades de la misma variante, quitar, subtotal y persistencia.
3. `feat(ui): crear sistema de notificaciones toast`
   `composables/useToast.js` y `components/ui/ToastContainer.vue` (éxito, error, información), reutilizable por todo el equipo.
4. `feat(cart): crear componente CartButton con contador`
   En el header: muestra `cart.count` con una pequeña animación al cambiar; al hacer click abre el drawer.
5. `feat(cart): crear componente CartDrawer`
   Panel lateral desde la derecha con `<Transition>`, overlay, cierre con Escape y click afuera.
6. `feat(cart): permitir cambiar cantidades y eliminar ítems`
   `CartItem.vue` con botones + y −, eliminar, subtotal y botón "Proceder al pago" a `/checkout`.
7. `feat(api): agregar endpoints del carrito`
   `GET /api/cart` y `PUT /api/cart` (reemplaza el carrito del usuario), validando que las variantes existan y haya stock.
8. `feat(api): agregar fusión de carrito al iniciar sesión`
   `POST /api/cart/merge`: suma el carrito de LocalStorage al de la BD sin superar el stock.
9. `feat(cart): sincronizar carrito con la base de datos`
   Con sesión, cada cambio se guarda en la API; al iniciar sesión se fusiona (observando `auth.isLoggedIn`); al cerrar sesión se vacía el LocalStorage.
10. `test(api): agregar tests del carrito`
    Fusión, cantidades mayores al stock y variantes inexistentes.

**En el video:** Pinia, carrito para visitantes vs usuarios registrados y cómo se sincroniza.

---

### 7.8 Stefano · Checkout y pedidos

**Rama:** `feat/checkout`

1. `feat(db): crear función transaccional create_order`
   `supabase/migrations/007_create_order.sql`: valida stock de cada ítem, lo descuenta, crea `orders` y `order_items` y genera el `tracking_code`; si algo falla, no se guarda nada. (Revisa Gabriel.)
2. `feat(api): agregar endpoint para crear pedidos`
   `POST /api/orders`: requiere login, valida datos de envío y método de pago, toma el carrito del usuario, llama a `create_order` y vacía el carrito. 409 si no hay stock.
3. `feat(api): agregar consulta de pedidos del usuario`
   `GET /api/me/orders` y `GET /api/orders/:tracking` (solo el dueño o un admin).
4. `feat(checkout): crear vista de checkout`
   `CheckoutView.vue` (protegida por la guarda de login); si el carrito está vacío, vuelve a `/catalogo`.
5. `feat(checkout): crear componente ShippingForm`
   Precargado con `auth.profile`; valida campos obligatorios, teléfono y código postal con `useFormValidation`.
6. `feat(checkout): crear componente PaymentMethod`
   Tarjeta (solo valida formato, no guarda el número), transferencia o efectivo, con el aviso de que es una simulación.
7. `feat(checkout): crear componente OrderSummary`
   Ítems, subtotal, envío y total; botón "Confirmar pedido" deshabilitado mientras se procesa.
8. `feat(checkout): crear vista de confirmación con número de seguimiento`
   `ConfirmationView.vue` en `/confirmacion/:tracking`: muestra el número, el detalle y un link a Mi Cuenta; vacía el carrito local.
9. `test(api): agregar tests de pedidos`
   Pedido correcto, carrito vacío, stock insuficiente y que el stock se descuente.

**En el video:** flujo completo de compra y la transacción que protege el stock.

---

### 7.9 Gustavo · Panel de administración

**Rama:** `feat/admin-panel`

1. `feat(admin): crear AdminLayout con rutas anidadas`
   `components/layout/AdminLayout.vue` con menú lateral (desktop) o superior (móvil) y `<RouterView>` para las vistas hijas de `/admin`.
2. `feat(api): agregar listado y cambio de estado de pedidos`
   `GET /api/admin/orders?status=` y `PATCH /api/admin/orders/:id/status`, solo admin.
3. `feat(api): agregar métricas para el dashboard`
   `GET /api/admin/stats`: cantidad de pedidos, ventas totales, productos con poco stock.
4. `feat(admin): crear vista de dashboard con métricas`
   `AdminDashboardView.vue`: tarjetas de métricas y alerta de stock bajo.
5. `feat(admin): listar productos con búsqueda`
   `AdminProductsView.vue`: tabla (tarjetas en móvil) con imagen, nombre, categoría, precio, stock y acciones.
6. `feat(admin): crear formulario de alta y edición de productos`
   `AdminProductFormView.vue` (misma vista para `/admin/productos/nuevo` y `/admin/productos/:id`): todos los campos, variantes dinámicas con `v-for` (agregar y quitar) y validación.
7. `feat(admin): subir imágenes desde el formulario`
   Usa `POST /api/admin/uploads` con vista previa.
8. `feat(admin): dar de baja productos con confirmación`
   Usa `BaseModal`.
9. `feat(admin): editar stock y precio de oferta desde la tabla`
   Edición en línea que llama a `PATCH /api/admin/variants/:id`.
10. `feat(admin): listar pedidos y cambiar su estado`
    `AdminOrdersView.vue`: filtro por estado, detalle del pedido y selector de estado.
11. `test(api): agregar tests de pedidos de administración`

**En el video:** panel de administración, rutas anidadas, ABM de productos, stock y gestión de pedidos.

---

## 8. Tareas compartidas (Fase 3)

| Tarea | Responsable | Commit esperado |
|---|---|---|
| Prueba cruzada: cada uno prueba el módulo del compañero que revisa y abre *Issues* con los bugs | Todos | `fix(<modulo>): ...` por cada bug corregido |
| Accesibilidad y responsive: revisar todas las vistas en 360 px, 768 px y 1280 px | Santiago + Delfina | `fix(ui): ...` |
| Manual de usuario completo | Cada uno su sección; Andre une y da formato | `docs(manual): ...` |
| README final con links de deploy, usuarios de prueba y capturas | Gabriel | `docs: completar README con links de producción` |
| Actualizar el brief con el stack final y los links | Santiago | (fuera del repo) |
| Release `v1.0.0`: PR `develop → main` y tag | Santiago | `chore(release): v1.0.0` |

---

## 9. Video demostrativo (máximo 30 minutos)

Todos con la cámara encendida en su parte.

| Bloque | Quién | Tiempo |
|---|---|---|
| Presentación del equipo y del proyecto, problema y propuesta | Santiago | 2 min |
| Tecnologías y arquitectura (Vue, API, Supabase, deploy) | Santiago + Gabriel | 3 min |
| Manual de uso en vivo: visitante → registro → compra → Mi Cuenta → admin | Delfina, Andre, Dolo y Stefano (cada uno su parte) | 8 min |
| Explicación del código: 1 min 45 s por integrante, en el orden de la sección 7 | Los 9 | 16 min |
| Cierre y aprendizajes | Gustavo | 1 min |

Conviene grabar cada bloque por separado y editarlo después, con el sitio ya desplegado.

---

## 10. Checklist de requisitos de la cátedra

| Requisito | Dónde se cumple |
|---|---|
| Autenticación de usuarios | Supabase Auth + API + guardas de Vue Router (Rocío), roles visitante/comprador/admin |
| Base de datos | PostgreSQL en Supabase con migraciones y seed (Gabriel) |
| Carrito de compras nativo | Store de Pinia con LocalStorage + BD (Dolo) y checkout simulado con pedidos (Stefano) |
| Deploy funcional | Vercel + Render + Supabase (Gabriel) |
| Repositorio en GitHub | Repo con ramas protegidas, PRs y commits por autor (Santiago) |
| Brief del proyecto | Brief corregido, a actualizar con este stack (Santiago) |
| Video de hasta 30 minutos | Sección 9 |
