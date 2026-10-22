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

    // Guardamos los datos ya limpios y transformados por Zod
    req[source] = result.data
    next()
  }
}