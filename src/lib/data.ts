import { Expediente, Usuario, Documento, Desarchivo, Certificado, Solicitante } from '../types'
import {
  spCreateExpediente, spUpdateExpediente, spDeleteExpediente,
  spCreateCertificado, spUpdateCertificado, spDeleteCertificado,
  spCreateDesarchivo,
  spCreateUsuario, spUpdateUsuario, spDeleteUsuario,
  spUpsertSolicitante,
  spLoadAll,
} from './sharepoint'

// Envío masivo de certificados locales a SharePoint
export async function sincronizarCertificadosToSP(
  onProgress?: (done: number, total: number, ok: number, err: number, lastError?: string) => void
): Promise<{ ok: number; err: number; total: number; lastError?: string }> {
  const pendientes = certificadosStore.filter(c => !c.sp_id)
  const total = pendientes.length
  let ok = 0, err = 0, lastError: string | undefined
  for (const c of pendientes) {
    try {
      const spId = await spCreateCertificado(c)
      certificadosStore = certificadosStore.map(x => x.id === c.id ? { ...x, sp_id: spId } : x)
      ok++
    } catch (e: any) {
      err++
      lastError = e?.message ?? String(e)
    }
    onProgress?.(ok + err, total, ok, err, lastError)
  }
  lsSave('dom_certificados', certificadosStore)
  return { ok, err, total, lastError }
}

// Carga inicial desde SharePoint (se llama desde App.tsx al montar)
export async function initFromSharePoint() {
  try {
    const { expedientes, certificados, desarchivos, usuarios } = await spLoadAll()

    // Si SP tiene datos → los cargamos (SP es la fuente de verdad)
    if (expedientes && expedientes.length > 0) {
      expedientesStore = expedientes
      lsSave(LS_KEYS.expedientes, expedientesStore)
    } else if (expedientes !== null) {
      // SP está vacío → migramos datos locales a SP
      for (const e of expedientesStore) {
        if (!e.sp_id) {
          const spId = await spCreateExpediente(e).catch(() => null)
          if (spId) e.sp_id = spId
        }
      }
      lsSave(LS_KEYS.expedientes, expedientesStore)
    }

    if (certificados && certificados.length > 0) {
      certificadosStore = certificados
      lsSave('dom_certificados', certificadosStore)
    } else if (certificados !== null && certificadosStore.length > 0) {
      for (const c of certificadosStore) {
        if (!c.sp_id) {
          const spId = await spCreateCertificado(c).catch(() => null)
          if (spId) c.sp_id = spId
        }
      }
      lsSave('dom_certificados', certificadosStore)
    }

    if (desarchivos && desarchivos.length > 0) {
      desarchivosStore = desarchivos
      lsSave(LS_KEYS.desarchivos, desarchivosStore)
    }

    if (usuarios && usuarios.length > 0) {
      usuariosStore = usuarios
      lsSave(LS_KEYS.usuarios, usuariosStore)
    }

    console.log('✅ SharePoint sincronizado')
  } catch (e) {
    console.warn('SP no disponible, usando datos locales:', e)
  }
}

export const mockUsuarios: Usuario[] = [
  { id: 'u0', nombre: 'Eugenio Novo Calderon', email: 'enovo@mdonihue.cl', perfil: 'admin', activo: true, created_at: '2024-01-01T10:00:00Z' },
  { id: 'u1', nombre: 'Rodrigo Vidal', email: 'admin@donihue.cl', perfil: 'admin', activo: true, created_at: '2024-01-10T10:00:00Z' },
  { id: 'u2', nombre: 'Patricia Soto', email: 'director@donihue.cl', perfil: 'director', activo: true, created_at: '2024-01-10T10:00:00Z' },
  { id: 'u3', nombre: 'Ana Carrasco', email: 'a.carrasco@donihue.cl', perfil: 'profesional', activo: true, created_at: '2024-02-01T10:00:00Z' },
  { id: 'u4', nombre: 'Jorge Medina', email: 'j.medina@donihue.cl', perfil: 'profesional', activo: true, created_at: '2024-02-15T10:00:00Z' },
  { id: 'u5', nombre: 'Beatriz Lagos', email: 'b.lagos@donihue.cl', perfil: 'profesional', activo: false, created_at: '2024-03-01T10:00:00Z' },
]

export const mockDocumentos: Documento[] = [
  { id: 'd1', expediente_id: 'e1', nombre: 'Permiso_Edificacion.pdf', tipo_doc: 'PERMISO', url: '#', created_at: '2024-02-20T10:00:00Z' },
  { id: 'd2', expediente_id: 'e1', nombre: 'Plano_Planta_A1.pdf', tipo_doc: 'PLANO', url: '#', created_at: '2024-02-20T10:00:00Z' },
  { id: 'd3', expediente_id: 'e1', nombre: 'Plano_Elevacion.pdf', tipo_doc: 'PLANO', url: '#', created_at: '2024-02-20T10:00:00Z' },
  { id: 'd4', expediente_id: 'e2', nombre: 'Permiso_Subdivision.pdf', tipo_doc: 'PERMISO', url: '#', created_at: '2024-05-10T10:00:00Z' },
  { id: 'd5', expediente_id: 'e3', nombre: 'Permiso_ON_Perez.pdf', tipo_doc: 'PERMISO', url: '#', created_at: '2024-06-15T10:00:00Z' },
  { id: 'd6', expediente_id: 'e3', nombre: 'Plano_Arquitectura.pdf', tipo_doc: 'PLANO', url: '#', created_at: '2024-06-15T10:00:00Z' },
  { id: 'd7', expediente_id: 'e5', nombre: 'Antep_Edificacion.pdf', tipo_doc: 'ANTEPROYECTO', url: '#', created_at: '2025-02-10T10:00:00Z' },
]

export const mockExpedientes: Expediente[] = [
  {
    id: 'e1', ano: 2024, numero: '2024-0001', fecha: '2024-02-01',
    propietario: 'Cecilia Palma Pereira',
    rol_avaluo: '113-19', direccion: 'Juan Ramón Cornejo S/N',
    profesional: 'Pablo César Avendaño',
    categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA',
    etapa: 'RECEPCION', estado: 'aprobado',
    superficie_m2: 187.42, total_pesos: 594080, caja: 1, num_permiso: '1/2024',
    observaciones: 'Obra nueva vivienda. Recepción otorgada.',
    fuente: 'permisos', created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-01T10:00:00Z',
    documentos: mockDocumentos.filter(d => d.expediente_id === 'e1'),
  },
  {
    id: 'e2', ano: 2024, numero: '2024-0035', fecha: '2024-05-10',
    propietario: 'Municipalidad de Doñihue',
    rol_avaluo: '19-17', direccion: 'Doctor Sanhueza S/N',
    profesional: 'Victor Moraga Muñoz',
    categoria: 'SUBDIVISION_URB', tipo_tramite: 'SUBDIVISION',
    etapa: 'PERMISO', estado: 'aprobado',
    superficie_m2: 29252, total_pesos: 1201063, caja: 2, num_permiso: '35/2024',
    observaciones: 'Subdivisión predio municipal.',
    fuente: 'permisos', created_at: '2024-05-10T10:00:00Z', updated_at: '2024-05-10T10:00:00Z',
    documentos: mockDocumentos.filter(d => d.expediente_id === 'e2'),
  },
  {
    id: 'e3', ano: 2024, numero: '2024-0055', fecha: '2024-06-12',
    propietario: 'Noelia Lucía Pérez Peralta',
    rol_avaluo: '45-5', direccion: 'Pedro Aguirre Cerda N°76',
    profesional: 'Marcos Colil Ríos',
    categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA',
    etapa: 'PERMISO', estado: 'aprobado',
    superficie_m2: 632.1, total_pesos: 2326893, caja: 2, num_permiso: '55/2024',
    observaciones: 'Obra nueva de gran envergadura.',
    fuente: 'permisos', created_at: '2024-06-12T10:00:00Z', updated_at: '2024-06-12T10:00:00Z',
    documentos: mockDocumentos.filter(d => d.expediente_id === 'e3'),
  },
  {
    id: 'e4', ano: 2024, numero: '2024-0026', fecha: '2024-04-15',
    propietario: 'Sandra El Moro Hendriksen',
    rol_avaluo: '2-8', direccion: 'Cachapoal 061',
    profesional: 'Sofía Zuñiga González',
    categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA',
    etapa: 'RECEPCION', estado: 'vigente',
    superficie_m2: 679.88, total_pesos: 791115, caja: 2, num_permiso: '26/2024',
    observaciones: '',
    fuente: 'permisos', created_at: '2024-04-15T10:00:00Z', updated_at: '2024-04-15T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e5', ano: 2025, numero: '2025-0001', fecha: '2025-01-08',
    propietario: 'Roberto González Santana',
    rol_avaluo: '117-95', direccion: 'Nemesio Camus N°257',
    profesional: 'Marcos Colil Ríos',
    categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA',
    etapa: 'PERMISO', estado: 'aprobado',
    superficie_m2: 212.29, total_pesos: 537668, caja: 2, num_permiso: '1/2025',
    observaciones: '',
    fuente: 'permisos', created_at: '2025-01-08T10:00:00Z', updated_at: '2025-01-08T10:00:00Z',
    documentos: mockDocumentos.filter(d => d.expediente_id === 'e5'),
  },
  {
    id: 'e6', ano: 2025, numero: '2025-0021', fecha: '2025-03-12',
    propietario: 'Metalúrgica Rancagua S.A.',
    rol_avaluo: '115-382', direccion: 'Rodolfo de Miranda N°064',
    profesional: 'Alejandro Weinstein Menchaca',
    categoria: 'SUBDIVISION_URB', tipo_tramite: 'SUBDIVISION',
    etapa: 'PERMISO', estado: 'en_revision',
    superficie_m2: 14620, total_pesos: 6318419, caja: 2, num_permiso: '21/2025',
    observaciones: 'Proyecto de gran escala. En segunda revisión.',
    fuente: 'permisos', created_at: '2025-03-12T10:00:00Z', updated_at: '2025-03-12T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e7', ano: 2025, numero: '2025-0054', fecha: '2025-06-02',
    propietario: 'Francisco Javier Garrido Tapia',
    rol_avaluo: '99-81', direccion: 'Camino Vecinal S/N',
    profesional: 'Carolina Mondaca Valdés',
    categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA',
    etapa: 'PERMISO', estado: 'aprobado',
    superficie_m2: 191.3, total_pesos: 662839, caja: 2, num_permiso: '54/2025',
    observaciones: '',
    fuente: 'permisos', created_at: '2025-06-02T10:00:00Z', updated_at: '2025-06-02T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e8', ano: 2025, numero: '2025-0057', fecha: '2025-06-18',
    propietario: 'Luis Pérez Serrano',
    rol_avaluo: '19-138', direccion: 'Errázuriz N°496',
    profesional: 'Pablo Cerda Vidal',
    categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA',
    etapa: 'PERMISO', estado: 'aprobado',
    superficie_m2: 184.28, total_pesos: 675748, caja: 2, num_permiso: '57/2025',
    observaciones: '',
    fuente: 'permisos', created_at: '2025-06-18T10:00:00Z', updated_at: '2025-06-18T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e9', ano: 2024, numero: '2024-0063', fecha: '2024-07-20',
    propietario: 'Ena Uribe Adille',
    rol_avaluo: '10-17', direccion: 'Miraflores N°298',
    profesional: 'Pablo Cerda Vidal',
    categoria: 'REGULARIZACION', tipo_tramite: 'LEY_20898',
    etapa: 'PERMISO', estado: 'aprobado',
    superficie_m2: 433.07, total_pesos: 918568, caja: 2, num_permiso: '63/2024',
    observaciones: 'Regularización edificación antigua.',
    fuente: 'permisos', created_at: '2024-07-20T10:00:00Z', updated_at: '2024-07-20T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e10', ano: 2024, numero: '2024-0018', fecha: '2024-03-05',
    propietario: 'Elias García Acosta',
    rol_avaluo: '120-009', direccion: 'Andrea Cortinez N°017',
    profesional: 'Jaime Lillo Madariaga',
    categoria: 'SUBDIVISION_URB', tipo_tramite: 'SUBDIVISION',
    etapa: 'RECEPCION', estado: 'aprobado',
    superficie_m2: 0, total_pesos: 2190078, caja: 2, num_permiso: '18/2024',
    observaciones: '',
    fuente: 'permisos', created_at: '2024-03-05T10:00:00Z', updated_at: '2024-03-05T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e11', ano: 2026, numero: '2026-0002', fecha: '2026-01-15',
    propietario: 'Victor Leiva Cañete',
    rol_avaluo: '163-12', direccion: 'Por definir',
    profesional: '—',
    categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA',
    etapa: 'ANTEPROYECTO', estado: 'en_revision',
    superficie_m2: 0, total_pesos: 0, num_permiso: '1/2026',
    observaciones: 'Ingresado vía DOM en Línea.',
    fuente: 'expedientes_2026', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e12', ano: 2026, numero: '2026-0004', fecha: '2026-01-20',
    propietario: 'Gloria Marchant Cuadra',
    rol_avaluo: '42-46', direccion: 'Por definir',
    profesional: '—',
    categoria: 'REGULARIZACION', tipo_tramite: 'LEY_20898',
    etapa: 'PERMISO', estado: 'en_revision',
    superficie_m2: 0, total_pesos: 0, num_permiso: '1/2026',
    observaciones: 'Ingresado vía DOM en Línea. En revisión.',
    fuente: 'expedientes_2026', created_at: '2026-01-20T10:00:00Z', updated_at: '2026-01-20T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e13', ano: 2024, numero: '2024-0003', fecha: '2024-02-10',
    propietario: 'Georgina Soto G.',
    rol_avaluo: '44-70', direccion: 'Rosa Zuñiga 202',
    profesional: 'Carlos Jiménez',
    categoria: 'REGULARIZACION', tipo_tramite: 'LEY_20898',
    etapa: 'PERMISO', estado: 'aprobado',
    superficie_m2: 83.13, total_pesos: 38870, caja: 1, num_permiso: '3/2024',
    observaciones: '',
    fuente: 'permisos', created_at: '2024-02-10T10:00:00Z', updated_at: '2024-02-10T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e14', ano: 2024, numero: '2024-0004', fecha: '2024-02-15',
    propietario: 'Adriana Pérez',
    rol_avaluo: '517-33', direccion: 'Río Cipreses 33',
    profesional: 'Pablo Cerda V.',
    categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'AMPLIACION_100',
    etapa: 'PERMISO', estado: 'aprobado',
    superficie_m2: 38.33, total_pesos: 77830, caja: 1, num_permiso: '4/2024',
    observaciones: '',
    fuente: 'permisos', created_at: '2024-02-15T10:00:00Z', updated_at: '2024-02-15T10:00:00Z',
    documentos: [],
  },
  {
    id: 'e15', ano: 2025, numero: '2025-0005', fecha: '2025-01-25',
    propietario: 'Manuel Guerrero Hidalgo',
    rol_avaluo: '006-007', direccion: 'Cachapoal N°398',
    profesional: 'Claudio Mella Loyola',
    categoria: 'SUBDIVISION_URB', tipo_tramite: 'SUBDIVISION',
    etapa: 'PERMISO', estado: 'observado',
    superficie_m2: 667, total_pesos: 480890, caja: 2, num_permiso: '5/2025',
    observaciones: 'Observado por falta de antecedentes.',
    fuente: 'permisos', created_at: '2025-01-25T10:00:00Z', updated_at: '2025-01-25T10:00:00Z',
    documentos: [],
  },
]

// Persistencia localStorage
const LS_KEYS = {
  expedientes: 'dom_expedientes',
  usuarios:    'dom_usuarios',
  desarchivos: 'dom_desarchivos',
}

function lsLoad<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : fallback
  } catch { return fallback }
}

function lsSave(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// Stores con persistencia
let expedientesStore: Expediente[] = lsLoad(LS_KEYS.expedientes, mockExpedientes)
const PERFIL_NORM: Record<string, string> = {
  administrador: 'admin', admin: 'admin',
  director: 'director',
  profesional: 'profesional',
}
function normalizarPerfil(p: string): 'admin' | 'director' | 'profesional' {
  return (PERFIL_NORM[String(p).toLowerCase()] ?? 'profesional') as 'admin' | 'director' | 'profesional'
}
let usuariosStore: Usuario[] = lsLoad(LS_KEYS.usuarios, mockUsuarios)
  .map(u => ({ ...u, perfil: normalizarPerfil(u.perfil) }))
let desarchivosStore: Desarchivo[]   = lsLoad(LS_KEYS.desarchivos, [])
let certificadosStore: Certificado[] = lsLoad('dom_certificados', [])
let solicitantesStore: Solicitante[] = lsLoad('dom_solicitantes', [])

export const db = {
  // Expedientes
  getExpedientes: () => [...expedientesStore],
  getExpediente: (id: string) => expedientesStore.find(e => e.id === id),
  createExpediente: (data: Omit<Expediente, 'id' | 'created_at' | 'updated_at' | 'documentos'>) => {
    const newExp: Expediente = {
      ...data,
      id: 'e' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      documentos: [],
    }
    expedientesStore = [newExp, ...expedientesStore]
    lsSave(LS_KEYS.expedientes, expedientesStore)
    spCreateExpediente(newExp).then(spId => {
      expedientesStore = expedientesStore.map(e => e.id === newExp.id ? { ...e, sp_id: spId } : e)
      lsSave(LS_KEYS.expedientes, expedientesStore)
    }).catch(console.warn)
    return newExp
  },
  updateExpediente: (id: string, data: Partial<Expediente>) => {
    expedientesStore = expedientesStore.map(e =>
      e.id === id ? { ...e, ...data, updated_at: new Date().toISOString() } : e
    )
    lsSave(LS_KEYS.expedientes, expedientesStore)
    const exp = expedientesStore.find(e => e.id === id)
    if (exp?.sp_id) spUpdateExpediente(exp.sp_id, exp).catch(console.warn)
    return exp
  },
  deleteExpediente: (id: string) => {
    const exp = expedientesStore.find(e => e.id === id)
    expedientesStore = expedientesStore.filter(e => e.id !== id)
    lsSave(LS_KEYS.expedientes, expedientesStore)
    if (exp?.sp_id) spDeleteExpediente(exp.sp_id).catch(console.warn)
  },
  addDocumento: (expedienteId: string, doc: Omit<Documento, 'id' | 'created_at'>) => {
    const newDoc: Documento = { ...doc, id: 'd' + Date.now(), created_at: new Date().toISOString() }
    expedientesStore = expedientesStore.map(e =>
      e.id === expedienteId
        ? { ...e, documentos: [...(e.documentos || []), newDoc] }
        : e
    )
    lsSave(LS_KEYS.expedientes, expedientesStore)
    return newDoc
  },
  deleteDocumento: (expedienteId: string, docId: string) => {
    expedientesStore = expedientesStore.map(e =>
      e.id === expedienteId
        ? { ...e, documentos: (e.documentos || []).filter(d => d.id !== docId) }
        : e
    )
    lsSave(LS_KEYS.expedientes, expedientesStore)
  },
  // Usuarios
  getUsuarios: () => [...usuariosStore],
  createUsuario: (data: Omit<Usuario, 'id' | 'created_at'>) => {
    const newUser: Usuario = { ...data, id: 'u' + Date.now(), created_at: new Date().toISOString() }
    usuariosStore = [...usuariosStore, newUser]
    lsSave(LS_KEYS.usuarios, usuariosStore)
    spCreateUsuario(newUser).then(spId => {
      usuariosStore = usuariosStore.map(u => u.id === newUser.id ? { ...u, sp_id: spId } : u)
      lsSave(LS_KEYS.usuarios, usuariosStore)
    }).catch(console.warn)
    return newUser
  },
  updateUsuario: (id: string, data: Partial<Usuario>) => {
    usuariosStore = usuariosStore.map(u => u.id === id ? { ...u, ...data } : u)
    lsSave(LS_KEYS.usuarios, usuariosStore)
    const u = usuariosStore.find(u => u.id === id)
    if (u?.sp_id) spUpdateUsuario(u.sp_id, u).catch(console.warn)
    return u
  },
  deleteUsuario: (id: string) => {
    const u = usuariosStore.find(u => u.id === id)
    usuariosStore = usuariosStore.filter(u => u.id !== id)
    lsSave(LS_KEYS.usuarios, usuariosStore)
    if (u?.sp_id) spDeleteUsuario(u.sp_id).catch(console.warn)
  },
  // Inventario de archivo por expediente
  setDocsEnArchivo: (expedienteId: string, docs: import('../types').DocDesarchivo[]) => {
    expedientesStore = expedientesStore.map(e =>
      e.id === expedienteId ? { ...e, docs_en_archivo: docs, updated_at: new Date().toISOString() } : e
    )
    lsSave(LS_KEYS.expedientes, expedientesStore)
  },
  // Desarchivos
  getDesarchivos: (expedienteId?: string) =>
    expedienteId ? desarchivosStore.filter(d => d.expediente_id === expedienteId) : [...desarchivosStore],
  createDesarchivo: (data: Omit<Desarchivo, 'id' | 'created_at'>) => {
    const nuevo: Desarchivo = { ...data, id: 'da' + Date.now(), created_at: new Date().toISOString() }
    desarchivosStore = [nuevo, ...desarchivosStore]
    lsSave(LS_KEYS.desarchivos, desarchivosStore)
    spCreateDesarchivo({ ...nuevo, documentos_retirados: nuevo.documentos }).catch(console.warn)
    return nuevo
  },
  // Certificados
  getCertificados: () => [...certificadosStore],
  getCertificado: (id: string) => certificadosStore.find(c => c.id === id),
  createCertificado: (data: Omit<Certificado, 'id' | 'numero' | 'created_at' | 'updated_at'>) => {
    const esPrevio = data.tipo === 'INFORMACIONES_PREVIAS'
    const grupo = certificadosStore.filter(c => (c.tipo === 'INFORMACIONES_PREVIAS') === esPrevio)
    const numero = grupo.length > 0 ? Math.max(...grupo.map(c => c.numero)) + 1 : 1
    const nuevo: Certificado = {
      ...data, id: 'cert' + Date.now(), numero,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    certificadosStore = [nuevo, ...certificadosStore]
    lsSave('dom_certificados', certificadosStore)
    spCreateCertificado(nuevo).then(spId => {
      certificadosStore = certificadosStore.map(c => c.id === nuevo.id ? { ...c, sp_id: spId } : c)
      lsSave('dom_certificados', certificadosStore)
    }).catch(console.warn)
    return nuevo
  },
  updateCertificado: (id: string, data: Partial<Certificado>) => {
    certificadosStore = certificadosStore.map(c =>
      c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
    )
    lsSave('dom_certificados', certificadosStore)
    const cert = certificadosStore.find(c => c.id === id)
    if (cert?.sp_id) spUpdateCertificado(cert.sp_id, cert).catch(console.warn)
    return cert
  },
  deleteCertificado: (id: string) => {
    const cert = certificadosStore.find(c => c.id === id)
    certificadosStore = certificadosStore.filter(c => c.id !== id)
    lsSave('dom_certificados', certificadosStore)
    if (cert?.sp_id) spDeleteCertificado(cert.sp_id).catch(console.warn)
  },
  limpiarTodosCertificados: () => {
    certificadosStore = []
    lsSave('dom_certificados', [])
  },
  bulkImportExpedientes: (items: Omit<Expediente, 'id' | 'created_at' | 'updated_at' | 'documentos'>[]) => {
    const nuevos: Expediente[] = items.map((data, i) => ({
      ...data,
      id: 'hist' + Date.now() + i,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      documentos: [],
    }))
    expedientesStore = [...nuevos, ...expedientesStore]
    lsSave(LS_KEYS.expedientes, expedientesStore)
    return nuevos.length
  },
  // Solicitantes
  getSolicitantes: () => [...solicitantesStore],
  getSolicitanteByRut: (rut: string) =>
    solicitantesStore.find(s => s.rut.replace(/\./g,'').replace(/-/g,'') === rut.replace(/\./g,'').replace(/-/g,'')),
  upsertSolicitante: (data: Omit<Solicitante, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    const existing = solicitantesStore.find(
      s => s.rut.replace(/\./g,'').replace(/-/g,'') === data.rut.replace(/\./g,'').replace(/-/g,'')
    )
    if (existing) {
      const updated: Solicitante = { ...existing, ...data, updated_at: new Date().toISOString() }
      solicitantesStore = solicitantesStore.map(s => s.id === existing.id ? updated : s)
      lsSave('dom_solicitantes', solicitantesStore)
      spUpsertSolicitante(updated).then(spId => {
        solicitantesStore = solicitantesStore.map(s => s.id === updated.id ? { ...s, sp_id: spId } : s)
        lsSave('dom_solicitantes', solicitantesStore)
      }).catch(console.warn)
      return updated
    } else {
      const nuevo: Solicitante = {
        ...data, id: 'sol' + Date.now(),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      solicitantesStore = [nuevo, ...solicitantesStore]
      lsSave('dom_solicitantes', solicitantesStore)
      spUpsertSolicitante(nuevo).then(spId => {
        solicitantesStore = solicitantesStore.map(s => s.id === nuevo.id ? { ...s, sp_id: spId } : s)
        lsSave('dom_solicitantes', solicitantesStore)
      }).catch(console.warn)
      return nuevo
    }
  },
}
