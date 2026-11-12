# 💻 FULL-TECH
### E-commerce | Tecnología y accesorios

<p align="center">
  <img src="https://img.shields.io/badge/Proyecto-Académico-0D1117?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/UTN-Facultad_Regional_San_Rafael-00599C?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Desarrollo-Web-00B8D9?style=for-the-badge" />
</p>

---

## 🚀 Sobre el proyecto

**FULL-TECH** es una plataforma de comercio electrónico desarrollada como proyecto académico, orientada a la venta de productos tecnológicos y accesorios para creadores de contenido, streamers y usuarios en general.

La aplicación permite explorar productos, consultar sus características, gestionar un carrito de compras, realizar pedidos y administrar cuentas de usuario. Además, cuenta con un panel de administración para la gestión de productos y pedidos.

## 🛠️ Tecnologías utilizadas

**Frontend**

<p>
  <img src="https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logo=pinia&logoColor=black" />
</p>

**Backend y base de datos**

<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

**Herramientas y testing**

<p>
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" />
  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
</p>

## ✨ Funcionalidades principales

- Catálogo de productos con búsqueda, filtros y ordenamiento.
- Detalle de productos, variantes y disponibilidad.
- Carrito de compras y proceso de checkout.
- Registro, inicio de sesión y gestión de cuenta.
- Historial y seguimiento de pedidos.
- Panel de administración de productos y pedidos.

## 👥 Equipo de desarrollo

**Ctrl C + Ctrl V = 404 Not Found**

- Santiago Capitani
- Gabriel Jauregui
- Rocío Lucero
- Hugo Zanatta
- Delfina Mulinetti
- Andrea Vargas
- Dolores Mendoza
- Stefano Aymar
- Gustavo Martinez

## 🎓 Información académica

| Dato | Información |
|---|---|
| Institución | Universidad Tecnológica Nacional |
| Facultad | Facultad Regional San Rafael |
| Carrera | Tecnicatura Universitaria en Programación |
| Asignatura | Programación IV |
| Proyecto | FULL-TECH |

---

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
