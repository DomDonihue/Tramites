export interface CatalogoCertificado {
  id: string
  title: string
  codigo: string
  descripcion: string
  valor: number
  plazoDias: number
  documentosRequeridos: string
  activo: boolean
  orden: number
  destacado: boolean
}

const toBool = (v: unknown) => v === true || String(v ?? '').toLowerCase() === 'sí' || String(v ?? '').toLowerCase() === 'si' || String(v ?? '').toLowerCase() === 'true'

export function mapCatalogoCertificado(item: Record<string, unknown>): CatalogoCertificado {
  return {
    id: String(item.Id ?? ''),
    title: String(item.Title ?? ''),
    codigo: String(item.Codigo ?? ''),
    descripcion: String(item.Descripcion ?? ''),
    valor: Number(item.Valor ?? 0),
    plazoDias: Number(item.PlazoDias ?? 0),
    documentosRequeridos: String(item.DocumentosRequeridos ?? ''),
    activo: toBool(item.Activo),
    orden: Number(item.Orden ?? 999),
    destacado: toBool(item.Destacado),
  }
}
