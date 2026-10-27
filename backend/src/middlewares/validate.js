export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))

      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details
      })
    }

    // En Express 5, req.query y req.params no tienen setter, por lo que no se pueden reasignar directamente.
    if (source === 'body') {
      req.body = result.data
    } else {
      // Guardamos el resultado validado en propiedades dedicadas de la petición
      req.validated = result.data
      if (source === 'query') req.validatedQuery = result.data
      if (source === 'params') req.validatedParams = result.data
    }

    next()
  }
}

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
