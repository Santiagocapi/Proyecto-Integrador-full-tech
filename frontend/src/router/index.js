import { createRouter, createWebHistory } from 'vue-router'

// Rutas de la aplicación, incluyendo las rutas de administración y sus hijos. Cada ruta tiene un meta que indica si requiere autenticación, si es solo para invitados o si requiere permisos de administrador.
const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: 'Inicio' } },
  { path: '/catalogo', name: 'catalog', component: () => import('@/views/CatalogView.vue'), meta: { title: 'Catálogo' } },
  { path: '/producto/:slug', name: 'product', component: () => import('@/views/ProductView.vue'), meta: { title: 'Producto' } },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { title: 'Ingresar', guestOnly: true } },
  { path: '/registro', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { title: 'Crear cuenta', guestOnly: true } },
  { path: '/checkout', name: 'checkout', component: () => import('@/views/CheckoutView.vue'), meta: { title: 'Checkout', requiresAuth: true } },
  { path: '/confirmacion/:tracking', name: 'confirmation', component: () => import('@/views/ConfirmationView.vue'), meta: { title: 'Pedido confirmado', requiresAuth: true } },
  { path: '/cuenta', name: 'account', component: () => import('@/views/AccountView.vue'), meta: { title: 'Mi cuenta', requiresAuth: true } },
  {
    path: '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin', component: () => import('@/views/admin/AdminDashboardView.vue'), meta: { title: 'Panel' } },
      { path: 'productos', name: 'admin-products', component: () => import('@/views/admin/AdminProductsView.vue'), meta: { title: 'Productos' } },
      { path: 'productos/nuevo', name: 'admin-product-new', component: () => import('@/views/admin/AdminProductFormView.vue'), meta: { title: 'Nuevo producto' } },
      { path: 'productos/:id', name: 'admin-product-edit', component: () => import('@/views/admin/AdminProductFormView.vue'), meta: { title: 'Editar producto' } },
      { path: 'pedidos', name: 'admin-orders', component: () => import('@/views/admin/AdminOrdersView.vue'), meta: { title: 'Pedidos' } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Página no encontrada' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// La guarda que usa requiresAuth, requiresAdmin y guestOnly la agrega Rocío.

export default router