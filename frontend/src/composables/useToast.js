// TODO (Dolo): mostrar toasts en pantalla manteniendo esta interfaz.
// Un toast es un mensaje que aparece en pantalla durante unos segundos y luego desaparece. Se usa para notificar al usuario de algo, como un error o un éxito.
export function useToast() {
  return {
    success: (message) => console.info('succes', message),
    error: (message) => console.error('error', message),
    info: (message) => console.info('i', message),
  }
}