# Cómo contribuir a FULL-TECH

Esta guía explica cómo preparar tu computadora, cómo trabajar con ramas y Pull Requests, y qué convenciones seguimos en el código. El plan completo del proyecto (arquitectura, rutas, base de datos y tareas de cada uno) está en [`docs/PLAN.md`](docs/PLAN.md).

## 1. Preparar tu computadora

### Requisitos

- **Node.js 24 LTS.** Con versiones anteriores la instalación del frontend falla. Verificá con `node -v`.
- **Git** y **VS Code** (recomendado, con las extensiones *Vue - Official*, *ESLint* y *Prettier*).

### Configurar Git con tu cuenta de GitHub

Antes de tu primer commit:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "el-mismo-email-de-tu-cuenta-de-github@ejemplo.com"
```

Si el email no coincide con uno de los que tenés en GitHub (*Settings → Emails*), tus commits **no aparecen a tu nombre** y no cuentan como aporte.

### Clonar e instalar

Cloná el repo en una carpeta fuera de OneDrive, por ejemplo `C:\dev`:

```bash
git clone https://github.com/Santiagocapi/Proyecto-Integrador-full-tech.git
cd Proyecto-Integrador-full-tech
```

Instalá las dependencias **dentro de cada carpeta** (la raíz no tiene `package.json`):

```bash
cd frontend
npm install
cd ../backend
npm install
```

### Variables de entorno

En `frontend` y en `backend`, copiá `.env.example` a un archivo nuevo llamado `.env` y completalo con las claves que pasa Gabriel por privado.

- Los `.env` **nunca** se suben al repo (ya están en el `.gitignore`).
- La clave secreta (`SUPABASE_SERVICE_ROLE_KEY`) va **solo** en `backend/.env`. En el frontend se usa únicamente la clave pública (`sb_publishable_...`).
- No compartas claves en capturas ni en chats abiertos.

### Levantar el proyecto

En dos terminales distintas:

```bash
# Terminal 1: API en http://localhost:3000
cd backend
npm run dev

# Terminal 2: frontend en http://localhost:5173
cd frontend
npm run dev
```

Para comprobar que la API anda, abrí `http://localhost:3000/api/health`: tiene que responder `{"status":"ok"}`.

## 2. Ramas

- `main`: versión estable, la que se despliega. Protegida: nadie hace push directo.
- `develop`: rama de integración. Protegida: solo entra por Pull Request.
- Cada tarea se hace en una rama nueva que sale de `develop`:
  - `feat/<modulo>` para funcionalidades nuevas (ej. `feat/carrito`)
  - `fix/<problema>` para corregir errores (ej. `fix/precio-checkout`)
  - `docs/<tema>` para documentación
  - `chore/<tarea>` para configuración o mantenimiento

Para empezar una tarea:

```bash
git checkout develop
git pull origin develop
git checkout -b feat/mi-modulo
```

## 3. Pull Requests

1. Antes de abrir el PR, traé lo último de `develop` a tu rama y resolvé los conflictos si los hay:
   ```bash
   git pull origin develop
   ```
2. Subí tu rama: `git push -u origin feat/mi-modulo`.
3. En GitHub, abrí el PR con base **`develop`** (no `main`) y completá la plantilla.
4. Asigná como revisor al compañero que te corresponde (tabla de abajo).
5. El PR se puede mergear cuando tiene **1 aprobación** y el **CI en verde** (checks `frontend` y `backend`).
6. Se mergea siempre con **"Create a merge commit"**. Así cada commit queda en el historial con su autor.

Si el revisor pide cambios, hacelos con commits nuevos en la misma rama y pusheá: el PR se actualiza solo.

### Revisores

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

## 4. Antes de cada commit

- Corré `git status` y revisá qué vas a subir. Nunca tiene que aparecer un `.env` ni `node_modules`.
- Agregá solo lo que corresponde a ese commit (`git add frontend/src/...`), no todo con `git add .` sin mirar.
- Comprobá que el proyecto sigue funcionando y que pasan lint y tests en la carpeta que tocaste:
  ```bash
  npm run lint
  npm test
  ```

## 5. Convenciones de Vue

- **Componentes en PascalCase:** `ProductCard.vue`, `CartButton.vue`.
- **Una vista por ruta**, en `src/views/` y con el sufijo `View`: `CatalogView.vue`, `AdminOrdersView.vue`.
- Las piezas reutilizables van en `src/components/`: `ui/` para las genéricas (empiezan con `Base`, como `BaseButton.vue`), `layout/` para header y footer, y una carpeta por módulo (`cart/`, `catalog/`, `product/`...).
- Todos los componentes usan **`<script setup>`** (Composition API).
- Los estilos van en **`<style scoped>`** para que no afecten a otros componentes. Los colores, espaciados y sombras salen de las variables de `src/assets/styles/tokens.css` (ej. `var(--color-cyan)`), no se escriben a mano.
- El estado compartido va en un store de Pinia (`src/stores/`), no en variables globales.
- Las llamadas a la API se hacen siempre con `src/services/api.js`, no con `fetch` directo.
