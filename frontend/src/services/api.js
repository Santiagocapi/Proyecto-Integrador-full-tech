import { supabase } from '@/lib/supabase'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request(method, path, { body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    const options = { method, headers }
    if (body !== undefined) {
      options.body = JSON.stringify(body)
    }
    res = await fetch(`${BASE_URL}${path}`, options)
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'Ocurrió un error inesperado', data?.details)
  return data
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
}