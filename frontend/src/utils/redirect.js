// Redirección a una URL externa (ej. Mercado Pago). Vive en su propio módulo
// para poder simularla en los tests sin tocar window.location.
export function redirectTo(url) {
  window.location.href = url
}
