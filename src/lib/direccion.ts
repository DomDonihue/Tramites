/**
 * Separa una dirección de una sola línea en calle y número.
 *
 * Los expedientes históricos guardan la dirección completa ("Vicente Carter N°424"),
 * mientras que el formulario de certificados tiene los campos separados.
 *
 *   "Vicente Carter N°424"   → { calle: 'Vicente Carter', numero: '424' }
 *   "Cachapoal 061"          → { calle: 'Cachapoal',      numero: '061' }
 *   "Juan Ramón Cornejo S/N" → { calle: 'Juan Ramón Cornejo', numero: '' }
 *   "Camino Nuevo 424"       → { calle: 'Camino Nuevo',   numero: '424' }
 */
export function separarDireccion(dir: string): { calle: string; numero: string } {
  const limpio = (dir ?? '').trim().replace(/\s+/g, ' ')
  if (!limpio) return { calle: '', numero: '' }

  // "S/N" — sitio sin número asignado
  if (/\bS\s*\/\s*N\.?$/i.test(limpio)) {
    return { calle: limpio.replace(/\bS\s*\/\s*N\.?$/i, '').trim(), numero: '' }
  }

  // Marcador con símbolo de grado: "N°424", "Nº 424"
  const conGrado = limpio.match(/^(.+?)\s*[Nn][°º]\s*(\d[\w\-/]*)$/)
  if (conGrado) return { calle: conGrado[1].trim(), numero: conGrado[2] }

  // Marcador como palabra suelta: "N 424", "No 424", "N. 424", "#424"
  // Exige espacio antes de la N para no partir calles como "Camino 424".
  const conPalabra = limpio.match(/^(.+?)\s+(?:[Nn][o°º.]*|#)\s*(\d[\w\-/]*)$/)
  if (conPalabra) return { calle: conPalabra[1].trim(), numero: conPalabra[2] }

  // Número suelto al final: "Cachapoal 061"
  const suelto = limpio.match(/^(.+?)\s+(\d[\d\-/]*)$/)
  if (suelto) return { calle: suelto[1].trim(), numero: suelto[2] }

  return { calle: limpio, numero: '' }
}
