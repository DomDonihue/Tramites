import { Expediente, Usuario, Documento, Desarchivo } from '../types'

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

// In-memory store
let expedientesStore = [...mockExpedientes]
let usuariosStore = [...mockUsuarios]
let desarchivosStore: Desarchivo[] = []

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
    return newExp
  },
  updateExpediente: (id: string, data: Partial<Expediente>) => {
    expedientesStore = expedientesStore.map(e =>
      e.id === id ? { ...e, ...data, updated_at: new Date().toISOString() } : e
    )
    return expedientesStore.find(e => e.id === id)
  },
  deleteExpediente: (id: string) => {
    expedientesStore = expedientesStore.filter(e => e.id !== id)
  },
  addDocumento: (expedienteId: string, doc: Omit<Documento, 'id' | 'created_at'>) => {
    const newDoc: Documento = { ...doc, id: 'd' + Date.now(), created_at: new Date().toISOString() }
    expedientesStore = expedientesStore.map(e =>
      e.id === expedienteId
        ? { ...e, documentos: [...(e.documentos || []), newDoc] }
        : e
    )
    return newDoc
  },
  deleteDocumento: (expedienteId: string, docId: string) => {
    expedientesStore = expedientesStore.map(e =>
      e.id === expedienteId
        ? { ...e, documentos: (e.documentos || []).filter(d => d.id !== docId) }
        : e
    )
  },
  // Usuarios
  getUsuarios: () => [...usuariosStore],
  createUsuario: (data: Omit<Usuario, 'id' | 'created_at'>) => {
    const newUser: Usuario = { ...data, id: 'u' + Date.now(), created_at: new Date().toISOString() }
    usuariosStore = [...usuariosStore, newUser]
    return newUser
  },
  updateUsuario: (id: string, data: Partial<Usuario>) => {
    usuariosStore = usuariosStore.map(u => u.id === id ? { ...u, ...data } : u)
    return usuariosStore.find(u => u.id === id)
  },
  deleteUsuario: (id: string) => {
    usuariosStore = usuariosStore.filter(u => u.id !== id)
  },
  // Inventario de archivo por expediente
  setDocsEnArchivo: (expedienteId: string, docs: import('../types').DocDesarchivo[]) => {
    expedientesStore = expedientesStore.map(e =>
      e.id === expedienteId ? { ...e, docs_en_archivo: docs, updated_at: new Date().toISOString() } : e
    )
  },
  // Desarchivos
  getDesarchivos: (expedienteId?: string) =>
    expedienteId ? desarchivosStore.filter(d => d.expediente_id === expedienteId) : [...desarchivosStore],
  createDesarchivo: (data: Omit<Desarchivo, 'id' | 'created_at'>) => {
    const nuevo: Desarchivo = { ...data, id: 'da' + Date.now(), created_at: new Date().toISOString() }
    desarchivosStore = [nuevo, ...desarchivosStore]
    return nuevo
  },
}
