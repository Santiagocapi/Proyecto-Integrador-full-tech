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

- Node.js 24 o superior compatible con los requisitos del frontend.

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

Crear un archivo `.env` a partir de `.env.example` y completar las variables:

```env

PORT=3000

CORS_ORIGIN=http://localhost:5173

SUPABASE_URL=

SUPABASE_SERVICE_ROLE_KEY=

```

Iniciar el servidor:

```bash

npm run dev

```

El backend estará disponible en:

`http://localhost:3000`

### Configurar el frontend

Desde la raíz del proyecto, abrir una nueva terminal o volver con `cd ..` si se utiliza la misma terminal del backend:

```bash
cd frontend
npm ci
```

Crear un archivo `.env` a partir de `.env.example`:

```env

VITE_API_URL=http://localhost:3000/api

VITE_SUPABASE_URL=

VITE_SUPABASE_ANON_KEY=

```

Iniciar el servidor de desarrollo:

```bash

npm run dev

```

El frontend estará disponible en:

`http://localhost:5173`

## Variables de entorno

Las credenciales deben configurarse localmente y en los servicios de despliegue correspondientes.

| Variable                  | Aplicación | Descripción                          |
| ------------------------- | ---------- | ------------------------------------ |
| PORT                      | Backend    | Puerto del servidor                  |
| CORS_ORIGIN               | Backend    | Origen permitido para las peticiones |
| SUPABASE_URL              | Backend    | URL del proyecto Supabase            |
| SUPABASE_SERVICE_ROLE_KEY | Backend    | Clave privada de servicio            |
| VITE_API_URL              | Frontend   | URL base de la API                   |
| VITE_SUPABASE_URL         | Frontend   | URL pública de Supabase              |
| VITE_SUPABASE_ANON_KEY    | Frontend   | Clave pública de Supabase            |

**Importante:** nunca subir archivos `.env` ni publicar la clave `SUPABASE_SERVICE_ROLE_KEY`. Las variables `VITE_` forman parte del frontend y no deben contener secretos.

## Pruebas y calidad de código

### Backend

```bash

npm test

npm run lint

```

### Frontend

```bash

npm run test:unit

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
