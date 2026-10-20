import * as authService from '../services/auth.service.js'

export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body)
    return res.status(201).json(result)
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({ error: error.message })
    }
    next(error)
  }
}