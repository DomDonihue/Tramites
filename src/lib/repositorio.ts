import { Expediente } from '../types'

// Prefijo por categoría
const PREFIJO: Record<string, string> = {
  PERMISOS_EDIFICACION: 'PE',
  OBRAS_MENORES:        'OM',
  SUBDIVISION_URB:      'SUB',
  ZONAS_CATASTROFE:     'CAT',
  TORRES_ANTENAS:       'TOR',
  AUTORIZACION_APRO:    'AUT',
  REGULARIZACION:       'REQ',
  CERTIFICADOS:         'CER',
}

// Etapas válidas por categoría
const ETAPAS_POR_CATEGORIA: Record<string, string[]> = {
  PERMISOS_EDIFICACION: ['ANTEPROYECTO', 'PERMISO', 'MODIFICACION', 'RECEPCION'],
  OBRAS_MENORES:        ['PERMISO', 'MODIFICACION', 'RECEPCION'],
  SUBDIVISION_URB:      ['ANTEPROYECTO', 'PERMISO', 'MODIFICACION', 'RECEPCION'],
  ZONAS_CATASTROFE:     ['PERMISO', 'RECEPCION'],
  TORRES_ANTENAS:       ['PERMISO', 'RECEPCION'],
  AUTORIZACION_APRO:    ['PERMISO'],
  REGULARIZACION:       ['PERMISO'],
  CERTIFICADOS:         [],
}

/**
 * Genera el número de expediente formateado con ceros a la izquierda.
 * Ej: "15/2024" → "0015" | "2024-0015" → "0015" | "0015" → "0015"
 */
function formatNumExp(numPermiso: string, ano: number): string {
  // Extrae solo la parte numérica antes del "/"
  const parte = numPermiso.split('/')[0].split('-').pop() ?? numPermiso
  const num = parseInt(parte.replace(/\D/g, ''), 10)
  if (isNaN(num)) return parte.padStart(4, '0')
  return num.toString().padStart(4, '0')
}

/**
 * Normaliza el rol avalúo para uso en nombre de carpeta.
 * Ej: "113-19" → "113-19" | "113 19" → "113-19"
 */
function normalizarRol(rol: string): string {
  return rol.trim().replace(/\s+/g, '-')
}

/**
 * Genera la ruta completa del repositorio para un expediente.
 *
 * Resultado: REPOSITORIO_DOM/{CATEGORIA}/{TIPO_TRAMITE}/{ETAPA}/{AÑO}/_{PREFIX}_{NEXP}_{ROL}
 *
 * Ejemplo:
 *   REPOSITORIO_DOM/PERMISOS_EDIFICACION/OBRA_NUEVA/PERMISO/2024/_PE_0001_113-19
 */
export function generarRutaRepositorio(exp: Expediente): string {
  const prefijo  = PREFIJO[exp.categoria] ?? exp.categoria.substring(0, 3)
  const numExp   = formatNumExp(exp.num_permiso ?? '', exp.ano)
  const rol      = normalizarRol(exp.rol_avaluo)
  const carpeta  = `_${prefijo}_${numExp}_${rol}`

  // CERTIFICADOS no tiene etapa — va directo por tipo de trámite
  if (exp.categoria === 'CERTIFICADOS') {
    return `REPOSITORIO_DOM/${exp.categoria}/${exp.tipo_tramite}/${exp.ano}/${carpeta}`
  }

  return `REPOSITORIO_DOM/${exp.categoria}/${exp.tipo_tramite}/${exp.etapa}/${exp.ano}/${carpeta}`
}

/**
 * Devuelve la ruta completa para un archivo específico dentro del expediente.
 *
 * Ejemplo:
 *   REPOSITORIO_DOM/PERMISOS_EDIFICACION/OBRA_NUEVA/PERMISO/2024/_PE_0001_113-19/Plano_Planta.pdf
 */
export function generarRutaArchivo(exp: Expediente, nombreArchivo: string): string {
  return `${generarRutaRepositorio(exp)}/${nombreArchivo}`
}

/**
 * Muestra la ruta como árbol legible para la UI.
 */
export function rutaComoArbol(exp: Expediente): { nivel: number; nombre: string }[] {
  const ruta = generarRutaRepositorio(exp)
  return ruta.split('/').map((nombre, i) => ({ nivel: i + 1, nombre }))
}

export { PREFIJO, ETAPAS_POR_CATEGORIA }
