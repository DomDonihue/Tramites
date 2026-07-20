import { getConfig } from './config'

export function diasHabilesTranscurridos(fechaInicio: string): number {
  const inicio = new Date(fechaInicio)
  inicio.setHours(0, 0, 0, 0)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  if (inicio > hoy) return 0
  let dias = 0
  const cursor = new Date(inicio)
  while (cursor < hoy) {
    cursor.setDate(cursor.getDate() + 1)
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) dias++
  }
  return dias
}

export type NivelSemaforo = 'verde' | 'amarillo' | 'rojo'

export function nivelSemaforo(dias: number): NivelSemaforo {
  const cfg = getConfig()
  const plazo = cfg.plazo_expediente_dias
  const umbralRojo     = plazo
  const umbralAmarillo = Math.round(plazo * cfg.alerta_expediente_pct / 100)
  if (dias >= umbralRojo)     return 'rojo'
  if (dias >= umbralAmarillo) return 'amarillo'
  return 'verde'
}

export function nivelSemaforoCert(dias: number): NivelSemaforo {
  const cfg = getConfig()
  const plazo = cfg.plazo_certificado_dias
  const umbralRojo     = plazo
  const umbralAmarillo = Math.round(plazo * cfg.alerta_certificado_pct / 100)
  if (dias >= umbralRojo)     return 'rojo'
  if (dias >= umbralAmarillo) return 'amarillo'
  return 'verde'
}

export function diasRestantesExpediente(fechaInicio: string): number {
  const cfg = getConfig()
  return cfg.plazo_expediente_dias - diasHabilesTranscurridos(fechaInicio)
}

export function diasRestantesCert(fechaInicio: string): number {
  const cfg = getConfig()
  return cfg.plazo_certificado_dias - diasHabilesTranscurridos(fechaInicio)
}
