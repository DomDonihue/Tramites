// Utilidades para RUT chileno

/** Deja solo dígitos y K (mayúscula). */
function limpiar(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

/**
 * Formatea mientras se escribe: 123456789 → 12.345.678-9
 * Toma siempre el último carácter como dígito verificador.
 */
export function formatRut(rut: string): string {
  const limpio = limpiar(rut)
  if (limpio.length <= 1) return limpio
  const cuerpo = limpio.slice(0, -1)
  const dv     = limpio.slice(-1)
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}

/** Valida el dígito verificador (módulo 11). */
export function validarRut(rut: string): boolean {
  const limpio = limpiar(rut)
  if (limpio.length < 2) return false
  const cuerpo = limpio.slice(0, -1)
  const dv     = limpio.slice(-1)
  if (!/^\d+$/.test(cuerpo)) return false

  let suma = 0
  let mult = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const resto = 11 - (suma % 11)
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return dv === esperado
}

/**
 * true solo cuando ya hay suficientes dígitos como para juzgarlo.
 * Evita marcar "inválido" mientras el usuario todavía escribe.
 */
export function rutIncompleto(rut: string): boolean {
  return limpiar(rut).length < 8
}
