import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { notFound, errorHandler } from './middlewares/error-handler.js'
import categoriesRoutes from './routes/categories.routes.js'
import productsRoutes from './routes/products.routes.js'
import authRoutes from './routes/auth.routes.js'
import adminProductsRoutes from './routes/admin-products.routes.js'
import meRoutes from './routes/me.routes.js'
import adminOrdersRoutes from './routes/admin-orders.routes.js'
import adminStatsRoutes from './routes/admin-stats.routes.js'
import cartRoutes from './routes/cart.routes.js' // <--- 1. Importás tus rutas del carrito
import ordersRoutes from './routes/orders.routes.js'
import webhooksRoutes from './routes/webhooks.routes.js'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN.split(',') }))
app.use(express.json())
if (env.NODE_ENV !== 'test') app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminProductsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/products', productsRoutes)
app.use('/api', meRoutes)
app.use('/api/admin/orders', adminOrdersRoutes)
app.use('/api/admin/stats', adminStatsRoutes)
app.use('/api/cart', cartRoutes) // <--- 2. Montás tus rutas bajo /api/cart
app.use('/api/orders', ordersRoutes)
app.use('/api/webhooks', webhooksRoutes)

app.use(notFound)
app.use(errorHandler)
