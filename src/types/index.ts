export type Perfil = 'profesional' | 'director' | 'admin'
export type Categoria =
  | 'PERMISOS_EDIFICACION'
  | 'OBRAS_MENORES'
  | 'SUBDIVISION_URB'
  | 'CERTIFICADOS'
  | 'ZONAS_CATASTROFE'
  | 'TORRES_ANTENAS'
  | 'AUTORIZACION_APRO'
  | 'REGULARIZACION'
  | 'DECLARACION_JURADA'
export type Etapa = 'ANTEPROYECTO' | 'PERMISO' | 'MODIFICACION' | 'RECEPCION'
export type Estado = 'en_revision' | 'aprobado' | 'observado' | 'vigente' | 'rechazado'
export type TipoDoc = 'PERMISO' | 'ANTEPROYECTO' | 'PLANO' | 'CERTIFICADO' | 'RECEPCION' | 'MODIFICACION' | 'OTRO'

export interface Usuario {
  id: string
  sp_id?: string
  nombre: string
  email: string
  perfil: Perfil
  activo: boolean
  cargo?: string
  created_at: string
}

export interface Documento {
  id: string
  expediente_id: string
  nombre: string
  tipo_doc: TipoDoc
  url: string
  created_at: string
}

export interface Expediente {
  id: string
  sp_id?: string
  ano: number
  numero: string
  fecha?: string
  propietario: string
  rol_avaluo: string
  direccion: string
  profesional: string
  patente_profesional?: string
  categoria: Categoria
  tipo_tramite: string
  etapa: Etapa
  estado: Estado
  superficie_m2?: number
  total_pesos?: number
  caja?: number
  num_permiso?: string
  observaciones?: string
  fuente?: string
  created_by?: string
  created_at: string
  updated_at: string
  documentos?: Documento[]
  docs_en_archivo?: DocDesarchivo[]
}

// ── Certificados ────────────────────────────────────────────────
export type TipoCertificado =
  | 'NUMERO'
  | 'RURALIDAD'
  | 'URBANIZACION'
  | 'AFECTACION_UTILIDAD_PUBLICA'
  | 'INFORMACIONES_PREVIAS'
  | 'VIVIENDA_SOCIAL'
  | 'LOCALIZACION'
  | 'ZONIFICACION'
  | 'OTROS'

export type EstadoCertificado = 'POR_ENTREGAR' | 'ENTREGADO'

export const TIPO_CERT_LABELS: Record<TipoCertificado, string> = {
  NUMERO:                    'Número',
  RURALIDAD:                 'Ruralidad',
  URBANIZACION:              'Urbanización',
  AFECTACION_UTILIDAD_PUBLICA: 'Afectación a Utilidad Pública',
  INFORMACIONES_PREVIAS:     'Informaciones Previas',
  VIVIENDA_SOCIAL:           'Vivienda Social',
  LOCALIZACION:              'Localización',
  ZONIFICACION:              'Zonificación',
  OTROS:                     'Otros',
}

export interface Certificado {
  id: string
  sp_id?: string
  numero: number
  fecha: string
  solicitante: string
  rut_solicitante?: string
  email?: string
  telefono?: string
  tipo: TipoCertificado
  otros_descripcion?: string
  anotaciones?: string
  rol_avaluo?: string
  direccion?: string
  numero_domicilio?: string
  localidad?: string
  manzana?: string
  lote?: string
  urbano_rural: 'URBANO' | 'RURAL'
  numero_asignado?: string
  fecha_entrega?: string
  estado: EstadoCertificado
  // Afectación Utilidad Pública
  afectacion_vialidad?: boolean
  afectacion_parque?: boolean
  afectacion_ensanche?: boolean
  afectacion_apertura?: boolean
  vias_afectadas?: string
  // Pago
  total_derechos?: number
  giro_municipal?: string
  fecha_pago?: string
  funcionario?: string
  created_at: string
  updated_at: string
}

// ── Desarchivo ───────────────────────────────────────────────────
export type DocDesarchivo = 'plano' | 'permiso_edificacion' | 'recepcion' | 'eet'

export interface Desarchivo {
  id: string
  sp_id?: string
  expediente_id: string
  solicitante: string
  rut_solicitante?: string
  documentos: DocDesarchivo[]
  documentos_retirados?: DocDesarchivo[]
  fecha: string
  funcionario?: string
  created_at: string
}

export const DOC_DESARCHIVO_LABELS: Record<DocDesarchivo, string> = {
  plano: 'Plano',
  permiso_edificacion: 'Permiso de Edificación',
  recepcion: 'Recepción',
  eet: 'EET (Especificaciones Técnicas)',
}

export interface Solicitante {
  id: string
  sp_id?: string
  rut: string
  nombre: string
  email?: string
  telefono?: string
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  perfil: Perfil
  nombre: string
}

export const TIPOS_POR_CATEGORIA: Record<Categoria, string[]> = {
  PERMISOS_EDIFICACION: ['OBRA_NUEVA', 'AMPLIACION_100', 'ALTERACION', 'RECONSTRUCCION', 'REPARACION'],
  OBRAS_MENORES: ['AMPLIACION_100', 'AMPLIACION_VIV_50', 'ARTE_SIN_OBRA', 'MODIF_SIN_ALT', 'REGUL_EDIF_ANTI'],
  SUBDIVISION_URB: ['FUSION', 'LOTEO', 'LOTEO_CONS_SIN', 'LOTEO_DFL2', 'SUBDIVISION', 'URBANIZACION'],
  CERTIFICADOS: ['CERT_NUM', 'CERT_COP', 'CERT_ZON', 'CERT_OTRO'],
  ZONAS_CATASTROFE: ['AMPLIACION_VIV', 'OBRA_NUEVA_VIV', 'RECONSTRUCCION_V', 'REGULARIZACION', 'VIVIENDA_TIPO'],
  TORRES_ANTENAS: ['116_BIS_F_GENERAL', '116_BIS_F_ESPECIAL', '116_BIS_G_SIMPLIF'],
  AUTORIZACION_APRO: ['OBRA_PRELIMINAR', 'DEMOLICION', 'CAMBIO_DESTINO', 'MOD_DESLINDES', 'REC_DESLINDES'],
  REGULARIZACION: ['LEY_20898', 'LEY_21031', 'LEY_21052', 'LEY_20251'],
  DECLARACION_JURADA: ['DJ_OBRA_MENOR', 'DJ_REGULARIZACION', 'DJ_OTRO'],
}

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  PERMISOS_EDIFICACION: 'Permisos de Edificación',
  OBRAS_MENORES: 'Obras Menores',
  SUBDIVISION_URB: 'Subdivisión Urbana',
  CERTIFICADOS: 'Certificados',
  ZONAS_CATASTROFE: 'Zonas Catástrofe',
  TORRES_ANTENAS: 'Torres y Antenas',
  AUTORIZACION_APRO: 'Autorización APRO',
  REGULARIZACION: 'Regularización',
  DECLARACION_JURADA: 'Declaración Jurada',
}

export const ESTADO_CONFIG: Record<Estado, { label: string; color: string; bg: string }> = {
  aprobado:    { label: 'Aprobado',    color: '#3B6D11', bg: '#EAF3DE' },
  vigente:     { label: 'Vigente',     color: '#185FA5', bg: '#E6F1FB' },
  en_revision: { label: 'En revisión', color: '#854F0B', bg: '#FAEEDA' },
  observado:   { label: 'Observado',   color: '#A32D2D', bg: '#FCEBEB' },
  rechazado:   { label: 'Rechazado',   color: '#5F5E5A', bg: '#F1EFE8' },
}

export const ETAPA_LABELS: Record<Etapa, string> = {
  ANTEPROYECTO: 'Anteproyecto',
  PERMISO: 'Permiso',
  MODIFICACION: 'Modificación',
  RECEPCION: 'Recepción',
}
