export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      const error = new Error('Parámetros de consulta inválidos')
      error.status = 400
      error.details = result.error.issues

      return next(error)
    }

    req.validatedQuery = result.data
    next()
  }
}