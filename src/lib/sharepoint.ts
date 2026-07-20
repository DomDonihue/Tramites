import { msalInstance } from './auth'
import { Expediente, Usuario, Certificado, Desarchivo, Solicitante } from '../types'

const SITE_URL = 'https://mdonihue.sharepoint.com/sites/DOMExpediente'
const SP_SCOPE  = 'https://mdonihue.sharepoint.com/AllSites.Write'

// ── Token ────────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  try {
    const r = await msalInstance.acquireTokenSilent({ scopes: [SP_SCOPE], account })
    return r.accessToken
  } catch {
    const r = await msalInstance.acquireTokenPopup({ scopes: [SP_SCOPE], account })
    return r.accessToken
  }
}

async function spFetch(path: string, method = 'GET', body?: unknown) {
  const token = await getToken()
  const res = await fetch(`${SITE_URL}/_api${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`SP ${res.status}: ${txt}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function spDelete(path: string) {
  const token = await getToken()
  await fetch(`${SITE_URL}/_api${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'IF-MATCH': '*',
      'X-HTTP-Method': 'DELETE',
    },
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function listItems(list: string) {
  return `/web/lists/getbytitle('${list}')/items`
}

function listItem(list: string, id: string) {
  return `/web/lists/getbytitle('${list}')/items(${id})`
}

// ── EXPEDIENTES ──────────────────────────────────────────────────────────────

function expToSP(e: Partial<Expediente>): Record<string, unknown> {
  return {
    Title:        e.numero ?? '',
    Numero:       e.numero,
    Ano:          e.ano,
    Fecha:        e.fecha,
    Propietario:  e.propietario,
    RolAvaluo:    e.rol_avaluo,
    Direccion:    e.direccion,
    Profesional:  e.profesional,
    Categoria:    e.categoria,
    TipoTramite:  e.tipo_tramite,
    Etapa:        e.etapa,
    Estado:       e.estado,
    SuperficieM2: e.superficie_m2,
    TotalPesos:   e.total_pesos,
    Caja:         e.caja,
    NumPermiso:   e.num_permiso,
    Observaciones:e.observaciones,
    DocsEnArchivo: e.docs_en_archivo ? JSON.stringify(e.docs_en_archivo) : null,
    Fuente:       e.fuente,
    CreadoPor:    e.created_by,
  }
}

function spToExp(f: Record<string, unknown>, spId: string): Expediente {
  return {
    id:            String(spId),
    sp_id:         String(spId),
    numero:        String(f.Numero ?? f.Title ?? ''),
    ano:           Number(f.Ano ?? 0),
    fecha:         String(f.Fecha ?? '').split('T')[0],
    propietario:   String(f.Propietario ?? ''),
    rol_avaluo:    String(f.RolAvaluo ?? ''),
    direccion:     String(f.Direccion ?? ''),
    profesional:   String(f.Profesional ?? ''),
    categoria:     (f.Categoria ?? 'PERMISOS_EDIFICACION') as Expediente['categoria'],
    tipo_tramite:  String(f.TipoTramite ?? ''),
    etapa:         (f.Etapa ?? 'PERMISO') as Expediente['etapa'],
    estado:        (f.Estado ?? 'en_revision') as Expediente['estado'],
    superficie_m2: Number(f.SuperficieM2 ?? 0),
    total_pesos:   Number(f.TotalPesos ?? 0),
    caja:          Number(f.Caja ?? 0),
    num_permiso:   String(f.NumPermiso ?? ''),
    observaciones: String(f.Observaciones ?? ''),
    docs_en_archivo: f.DocsEnArchivo ? JSON.parse(String(f.DocsEnArchivo)) : undefined,
    fuente:        String(f.Fuente ?? ''),
    created_at:    String(f.Created ?? new Date().toISOString()),
    updated_at:    String(f.Modified ?? new Date().toISOString()),
    documentos:    [],
  }
}

export async function spGetExpedientes(): Promise<Expediente[]> {
  const data = await spFetch(`${listItems('Expediente')}?$top=1000&$orderby=Id desc`)
  return (data.value ?? []).map((item: any) => spToExp(item, item.Id))
}

export async function spCreateExpediente(e: Partial<Expediente>): Promise<string> {
  const data = await spFetch(listItems('Expediente'), 'POST', expToSP(e))
  return String(data.Id)
}

export async function spUpdateExpediente(spId: string, e: Partial<Expediente>): Promise<void> {
  await spFetch(listItem('Expediente', spId), 'PATCH', expToSP(e))
}

export async function spDeleteExpediente(spId: string): Promise<void> {
  await spDelete(listItem('Expediente', spId))
}

// ── CERTIFICADOS ─────────────────────────────────────────────────────────────

function dateOrNull(v: string | undefined | null): string | null {
  if (!v || v.trim() === '' || v.startsWith('1970')) return null
  return v
}

function certToSP(c: Partial<Certificado>): Record<string, unknown> {
  return {
    Title:              String(c.numero ?? ''),
    Fecha:              dateOrNull(c.fecha),
    Solicitante:        c.solicitante ?? null,
    RutSolicitante:     c.rut_solicitante || null,
    EmailSol:           c.email || null,
    Telefono:           c.telefono || null,
    TipoCertificado:    c.tipo ?? null,
    OtrosDescripcion:   c.otros_descripcion || null,
    Anotaciones:        c.anotaciones || null,
    RolAvaluo:          c.rol_avaluo || null,
    Direccion:          c.direccion || null,
    NumeroDomicilio:    c.numero_domicilio || null,
    Localidad:          c.localidad || null,
    Manzana:            c.manzana || null,
    Lote:               c.lote || null,
    UrbanoRural:        c.urbano_rural ?? null,
    NumeroAsignado:     c.numero_asignado || null,
    FechaEntrega:       dateOrNull(c.fecha_entrega),
    EstadoCert:         c.estado ?? null,
    TotalDerechos:      c.total_derechos ?? null,
    GiroMunicipal:      c.giro_municipal || null,
    FechaPago:          dateOrNull(c.fecha_pago),
    Funcionario:        c.funcionario || null,
  }
}

function spToCert(f: Record<string, unknown>, spId: string): Certificado {
  return {
    id:                 String(spId),
    sp_id:              String(spId),
    numero:             Number(f.NumeroCert ?? f.Title ?? 0),
    fecha:              String(f.Fecha ?? '').split('T')[0],
    solicitante:        String(f.Solicitante ?? ''),
    rut_solicitante:    String(f.RutSolicitante ?? ''),
    email:              String(f.EmailSol ?? ''),
    telefono:           String(f.Telefono ?? ''),
    tipo:               (f.TipoCertificado ?? 'NUMERO') as Certificado['tipo'],
    otros_descripcion:  String(f.OtrosDescripcion ?? ''),
    anotaciones:        String(f.Anotaciones ?? ''),
    rol_avaluo:         String(f.RolAvaluo ?? ''),
    direccion:          String(f.Direccion ?? ''),
    numero_domicilio:   String(f.NumeroDomicilio ?? ''),
    localidad:          String(f.Localidad ?? ''),
    manzana:            String(f.Manzana ?? ''),
    lote:               String(f.Lote ?? ''),
    urbano_rural:       (f.UrbanoRural ?? 'URBANO') as Certificado['urbano_rural'],
    numero_asignado:    String(f.NumeroAsignado ?? ''),
    fecha_entrega:      String(f.FechaEntrega ?? '').split('T')[0],
    estado:             (f.EstadoCert ?? 'POR_ENTREGAR') as Certificado['estado'],
    total_derechos:     Number(f.TotalDerechos ?? 0),
    giro_municipal:     String(f.GiroMunicipal ?? ''),
    fecha_pago:         String(f.FechaPago ?? '').split('T')[0],
    funcionario:        String(f.Funcionario ?? ''),
    afectacion_vialidad: Boolean(f.AfectacionVialidad),
    afectacion_parque:   Boolean(f.AfectacionParque),
    afectacion_ensanche: Boolean(f.AfectacionEnsanche),
    afectacion_apertura: Boolean(f.AfectacionApertura),
    vias_afectadas:     String(f.ViasAfectadas ?? ''),
    created_at:         String(f.Created ?? new Date().toISOString()),
    updated_at:         String(f.Modified ?? new Date().toISOString()),
  }
}

export async function spGetCertificados(): Promise<Certificado[]> {
  const data = await spFetch(`${listItems('Certificados')}?$top=1000&$orderby=Id desc`)
  return (data.value ?? []).map((item: any) => spToCert(item, item.Id))
}

export async function spCreateCertificado(c: Partial<Certificado>): Promise<string> {
  const data = await spFetch(listItems('Certificados'), 'POST', certToSP(c))
  return String(data.Id)
}

export async function spUpdateCertificado(spId: string, c: Partial<Certificado>): Promise<void> {
  await spFetch(listItem('Certificados', spId), 'PATCH', certToSP(c))
}

export async function spDeleteCertificado(spId: string): Promise<void> {
  await spDelete(listItem('Certificados', spId))
}

// ── DESARCHIVOS ──────────────────────────────────────────────────────────────

function desToSP(d: Partial<Desarchivo>): Record<string, unknown> {
  return {
    Title:                d.expediente_id ?? '',
    ExpedienteId:         d.expediente_id,
    Solicitante:          d.solicitante,
    RutSolicitante:       d.rut_solicitante,
    DocumentosRetirados:  d.documentos_retirados ? JSON.stringify(d.documentos_retirados) : null,
    Fecha:                d.fecha,
    Funcionario:          d.funcionario,
  }
}

function spToDes(f: Record<string, unknown>, spId: string): Desarchivo {
  const docs = f.DocumentosRetirados ? JSON.parse(String(f.DocumentosRetirados)) : []
  return {
    id:                  String(spId),
    sp_id:               String(spId),
    expediente_id:       String(f.ExpedienteId ?? ''),
    solicitante:         String(f.Solicitante ?? ''),
    rut_solicitante:     String(f.RutSolicitante ?? ''),
    documentos:          docs,
    documentos_retirados: docs,
    fecha:               String(f.Fecha ?? '').split('T')[0],
    funcionario:         String(f.Funcionario ?? ''),
    created_at:          String(f.Created ?? new Date().toISOString()),
  }
}

export async function spGetDesarchivos(): Promise<Desarchivo[]> {
  const data = await spFetch(`${listItems('Desarchivo')}?$top=1000&$orderby=Id desc`)
  return (data.value ?? []).map((item: any) => spToDes(item, item.Id))
}

export async function spCreateDesarchivo(d: Partial<Desarchivo>): Promise<string> {
  const data = await spFetch(listItems('Desarchivo'), 'POST', desToSP(d))
  return String(data.Id)
}

// ── USUARIOS ─────────────────────────────────────────────────────────────────

export async function spGetUsuarios(): Promise<Usuario[]> {
  const data = await spFetch(`${listItems('Usuario')}?$top=200`)
  return (data.value ?? []).map((item: any) => ({
    id:       String(item.Id),
    sp_id:    String(item.Id),
    nombre:   String(item.Title ?? ''),
    email:    String(item.Email ?? ''),
    perfil:   (PERFIL_FROM_SP[String(item.Perfil ?? '').toLowerCase()] ?? 'profesional') as Usuario['perfil'],
    activo:   item.Activo !== false,
    cargo:    String(item.Cargo ?? ''),
    created_at: String(item.Created ?? new Date().toISOString()),
  }))
}

const PERFIL_TO_SP: Record<string, string> = {
  admin:       'Administrador',
  director:    'Director',
  profesional: 'Profesional',
}
const PERFIL_FROM_SP: Record<string, string> = {
  administrador: 'admin',
  director:      'director',
  profesional:   'profesional',
}

function usuarioToSP(u: Partial<Usuario>): Record<string, unknown> {
  return {
    Title:        u.nombre ?? '',
    Email:        u.email ?? '',
    Perfil:       PERFIL_TO_SP[u.perfil ?? 'profesional'] ?? u.perfil,
    Activo:       u.activo !== false,
    Cargo:        u.cargo ?? '',
    FechaIngreso: u.created_at ? u.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    UltimoAcceso: new Date().toISOString().split('T')[0],
  }
}

export async function spCreateUsuario(u: Partial<Usuario>): Promise<string> {
  const data = await spFetch(listItems('Usuario'), 'POST', usuarioToSP(u))
  return String(data.Id)
}

export async function spUpdateUsuario(spId: string, u: Partial<Usuario>): Promise<void> {
  await spFetch(listItem('Usuario', spId), 'PATCH', usuarioToSP(u))
}

export async function spDeleteUsuario(spId: string): Promise<void> {
  await spDelete(listItem('Usuario', spId))
}

// ── ARCHIVOS ─────────────────────────────────────────────────────────────────

export async function spUploadArchivo(file: File, rutaCarpeta: string): Promise<string> {
  const token = await getToken()
  const graphToken = token // reutilizamos mismo token (AllSites.Write cubre drives)
  const driveRes = await fetch(
    `https://graph.microsoft.com/v1.0/sites/mdonihue.sharepoint.com:/sites/DOMExpediente/drive`,
    { headers: { Authorization: `Bearer ${graphToken}` } }
  )
  if (!driveRes.ok) throw new Error('No se pudo obtener el drive')
  const drive = await driveRes.json()
  const buffer = await file.arrayBuffer()
  const uploadRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/Documentos DOM/${rutaCarpeta}/${file.name}:/content`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${graphToken}`, 'Content-Type': file.type || 'application/octet-stream' },
      body: buffer,
    }
  )
  if (!uploadRes.ok) throw new Error(`Error subiendo archivo: ${uploadRes.status}`)
  const data = await uploadRes.json()
  return data.webUrl as string
}

// ── SOLICITANTES ─────────────────────────────────────────────────────────────

function solToSP(s: Partial<Solicitante>): Record<string, unknown> {
  return {
    Title:    s.rut ?? '',
    Nombre:   s.nombre ?? null,
    Email:    s.email || null,
    Telefono: s.telefono || null,
  }
}

function spToSol(f: Record<string, unknown>, spId: string): Solicitante {
  return {
    id:        String(spId),
    sp_id:     String(spId),
    rut:      String(f.Title ?? ''),
    nombre:   String(f.Nombre ?? ''),
    email:    String(f.Email ?? '') || undefined,
    telefono: String(f.Telefono ?? '') || undefined,
    created_at: String(f.Created ?? new Date().toISOString()),
    updated_at: String(f.Modified ?? new Date().toISOString()),
  }
}

export async function spGetSolicitantes(): Promise<Solicitante[]> {
  const data = await spFetch(`${listItems('Solicitante')}?$top=2000&$orderby=Title asc`)
  return (data.value ?? []).map((item: any) => spToSol(item, item.Id))
}

export async function spCreateSolicitante(s: Partial<Solicitante>): Promise<string> {
  const data = await spFetch(listItems('Solicitante'), 'POST', solToSP(s))
  return String(data.Id)
}

export async function spUpdateSolicitante(spId: string, s: Partial<Solicitante>): Promise<void> {
  await spFetch(listItem('Solicitante', spId), 'PATCH', solToSP(s))
}

export async function spUpsertSolicitante(s: Solicitante): Promise<string> {
  if (s.sp_id) {
    await spUpdateSolicitante(s.sp_id, s)
    return s.sp_id
  }
  return spCreateSolicitante(s)
}

// ── INIT: carga inicial desde SharePoint ─────────────────────────────────────

export async function spLoadAll() {
  const [expedientes, certificados, desarchivos, usuarios] = await Promise.all([
    spGetExpedientes().catch(() => null),
    spGetCertificados().catch(() => null),
    spGetDesarchivos().catch(() => null),
    spGetUsuarios().catch(() => null),
  ])
  return { expedientes, certificados, desarchivos, usuarios }
}
