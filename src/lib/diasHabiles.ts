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
  if (dias >= 28) return 'rojo'
  if (dias >= 21) return 'amarillo'
  return 'verde'
}
