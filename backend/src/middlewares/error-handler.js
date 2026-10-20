export function notFound(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500
  if (status === 500) console.error(err)
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message,
    details: err.details,
  })
}