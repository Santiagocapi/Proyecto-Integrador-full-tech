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

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN.split(',') }))
app.use(express.json())
if (env.NODE_ENV !== 'test') app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Acá se montan las rutas de cada módulo, por ejemplo:
// app.use('/api/products', productsRoutes)

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminProductsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/products', productsRoutes)

app.use(notFound)
app.use(errorHandler)
