# FULLTECH

## Ctrl C Ctrl V 404 Not Found

Proyecto Integrador para la materia **Programación IV** de la Tecnicatura Universitaria en Programación.

FULLTECH es una plataforma de comercio electrónico orientada a la venta de productos tecnológicos, accesorios y kits especializados de audio, iluminación, video y soportes.

## Tecnologías utilizadas

### Frontend

- Vue 3
- Vite
- Vue Router
- Pinia
- JavaScript
- CSS

### Backend

- Node.js
- Express
- Zod
- Supabase

### Base de datos y servicios

- PostgreSQL
- Supabase Auth
- Supabase Storage

### Herramientas

- Git y GitHub
- Vitest
- ESLint
- Prettier
- Render
- Vercel

## Requisitos previos

Para ejecutar el proyecto localmente se necesita:

- Node.js 22.18.0 o superior dentro de la versión 22, o Node.js 24.12.0 o superior.
- npm.
- Git.
- Una cuenta y un proyecto de Supabase.

## Estructura del proyecto

```text

Proyecto-Integrador-full-tech/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── docs/
├── supabase/
├── render.yaml
└── README.md

```

## Configuración de Supabase

El proyecto utiliza Supabase como servicio de base de datos, autenticación y almacenamiento de imágenes.

### Ejecutar las migraciones

Crear un proyecto en Supabase y abrir el SQL Editor. Ejecutar los archivos de `supabase/migrations/` individualmente y respetando el siguiente orden:

1. `001_catalogo.sql`
2. `002_profiles.sql`
3. `003_carrito_pedidos.sql`
4. `004_indices.sql`
5. `005_rls.sql`
6. `006_storage.sql`
7. `007_permisos.sql`
8. `008_admin_products.sql`
9. `009_create_order.sql`
10. `010_mercadopago.sql`
11. `011_expire_orders.sql`

### Cargar los datos iniciales

Después de aplicar las migraciones, ejecutar el archivo `supabase/seed.sql` desde el SQL Editor.

Este archivo carga las categorías, productos, variantes y componentes de los Starter Packs.

**Importante:** los precios y stocks son datos de demostración. Volver a ejecutar el seed puede restablecer esos valores.

Las imágenes utilizan URLs públicas del bucket `products` de Supabase Storage.

### Crear un usuario administrador

El sistema permite asignar el rol de administrador a un usuario registrado.

1. Crear primero el usuario desde la aplicación o mediante el flujo de registro.
2. Abrir `supabase/scripts/make-admin.sql`.
3. Reemplazar el correo de ejemplo `admin@ejemplo.com` por el correo del usuario que se desea promover.
4. Ejecutar el script desde el SQL Editor de Supabase.
5. Verificar que el perfil tenga el rol `admin`.

**Importante:** ejecutar este procedimiento únicamente para cuentas autorizadas. No compartir credenciales ni claves privadas.

## Instalación

Clonar el repositorio:

```bash

git clone https://github.com/Santiagocapi/Proyecto-Integrador-full-tech.git
cd Proyecto-Integrador-full-tech

```

### Configurar el backend

```bash

cd backend
npm ci

```

Iniciar el servidor:

```bash

npm run dev

```

El backend estará disponible en:

`http://localhost:3000`

### Variables de entorno del backend

Crear un archivo `.env` dentro de la carpeta `backend`, tomando como referencia `backend/.env.example`.

Configurar las siguientes variables:

| Variable                    | Descripción                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `PORT`                      | Puerto local del servidor backend.                               |
| `CORS_ORIGIN`               | Dirección del frontend autorizado para realizar solicitudes.     |
| `SUPABASE_URL`              | URL del proyecto Supabase.                                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada de servicio de Supabase.                           |
| `MP_ACCESS_TOKEN`           | Token de acceso de Mercado Pago.                                 |
| `MP_WEBHOOK_SECRET`         | Secreto para validar las notificaciones webhook de Mercado Pago. |
| `FRONTEND_URL`              | URL pública del frontend.                                        |
| `API_PUBLIC_URL`            | URL pública de la API.                                           |

Para desarrollo local, utilizar los valores locales indicados en `.env.example` cuando corresponda y completar las credenciales de los servicios externos.

**Importante:** nunca subir el archivo `.env` a GitHub ni compartir la `SUPABASE_SERVICE_ROLE_KEY`, el token de Mercado Pago o el secreto del webhook.

### Configurar el frontend

Desde la raíz del proyecto, abrir una nueva terminal o volver con `cd ..` si se utiliza la misma terminal del backend:

```bash
cd frontend
npm ci
```

Iniciar el servidor de desarrollo:

```bash

npm run dev

```

El frontend estará disponible en:

`http://localhost:5173`

### Variables de entorno del frontend

Crear un archivo `.env` dentro de la carpeta `frontend`, tomando como referencia `frontend/.env.example`.

Configurar las siguientes variables:

| Variable                 | Descripción                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| `VITE_API_URL`           | URL base de la API backend. Para desarrollo local: `http://localhost:3000/api`. |
| `VITE_SUPABASE_URL`      | URL del proyecto Supabase.                                                      |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase para el cliente frontend.                      |

**Importante:** las variables que comienzan con `VITE_` quedan disponibles en el código del frontend. Nunca colocar claves privadas, como `SUPABASE_SERVICE_ROLE_KEY`, en estas variables.

## Pruebas y calidad de código

### Backend

```bash

npm test

npm run lint

```

### Frontend

```bash

npm run test:unit -- --run

npm run lint

npm run build

```

## Despliegue

### Backend – Render

El backend se encuentra desplegado en Render.

- Servicio: `fulltech-api`

- Rama configurada: `main`

- Directorio raíz: `backend`

- Comando de construcción: `npm ci`

- Comando de inicio: `npm start`

URL de la API:

https://fulltech-api.onrender.com

Endpoint de salud:

https://fulltech-api.onrender.com/api/health

Las variables privadas de entorno se configuran desde el panel de Render.

### Frontend – Vercel

El frontend se encuentra desplegado en Vercel.

Configuración prevista:

- Directorio raíz: `frontend`

- Comando de construcción: `npm run build`

- Directorio de salida: `dist`

Variables de entorno necesarias:

- `VITE_API_URL`

- `VITE_SUPABASE_URL`

- `VITE_SUPABASE_ANON_KEY`

URL de producción:

https://proyecto-integrador-full-tech.vercel.app

## Integrantes

- Aymar Stéfano
- Capitani Santiago
- Lucero Rocío
- Gabriel Jauregui
- Martinez Trejo Gustavo
- Mendoza Dolores
- Mulinetti Delfina
- Andrea Vargas
- Zanatta Hugo
