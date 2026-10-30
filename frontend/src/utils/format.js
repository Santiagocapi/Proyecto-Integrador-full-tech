const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

// formatPrice(45999) → "$ 45.999"
export function formatPrice(value) {
  return priceFormatter.format(Number(value) || 0)
}

// formatDate('2026-10-21T00:00:00Z') → "21/10/2026"
export function formatDate(value) {
  return dateFormatter.format(new Date(value))
}
