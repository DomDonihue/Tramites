/*
Portal ciudadano DOM Doñihue: intermediario entre el sitio público y SharePoint.

El vecino no tiene cuenta municipal, así que el portal no puede escribir en
SharePoint. Este Worker recibe el formulario y escribe en SharePoint con Microsoft Graph.

Rutas:
  POST /solicitud        -> crea la solicitud en CertificadosWeb, guarda adjuntos y al vecino en Solicitante
  GET  /consulta         -> ?folio=...&rut=...  estado de una solicitud
  GET  /catalogo         -> certificados activos de CatalogoCertificadosWeb
  GET  /admin/conectar   -> ?clave=...  conecta la cuenta municipal que usará el portal
  GET  /admin/columnas   -> ?clave=...  diagnóstico: nombres internos y tipos de columnas
*/

export interface Env {
  TENANT_ID: string
  CLIENT_ID: string
  CLIENT_SECRET: string
  SITE_PATH: string        // mdonihue.sharepoint.com:/sites/DOMExpediente
  ALLOWED_ORIGINS: string  // separados por coma
  ADMIN_KEY: string        // protege /admin/*
  TOKENS: KVNamespace      // refresh token de la cuenta conectada
}

/*
Autenticación: si hay una cuenta municipal conectada (/admin/conectar), se usa su
sesión con el permiso delegado Sites.Selected, que no requiere consentimiento de
administrador. El acceso efectivo es la intersección entre lo que puede la cuenta y
lo concedido a la aplicación en el sitio (solo DOMExpediente). Si no hay cuenta
conectada, se usa el permiso de aplicación (client credentials), que sí requiere
el consentimiento de administrador.
*/
const SCOPES_DELEGADOS = 'offline_access User.Read https://graph.microsoft.com/Sites.Selected'
const KV_REFRESH = 'refresh_token'
const KV_CUENTA = 'cuenta'

const LISTA_SOLICITUDES = 'CertificadosWeb'
const LISTA_SOLICITANTES = 'Solicitante'
const LISTA_CATALOGO = 'CatalogoCertificadosWeb'
const CARPETA_ADJUNTOS = 'CertificadosWeb'

const MAX_ARCHIVOS = 5
const MAX_BYTES_ARCHIVO = 4 * 1024 * 1024 // límite de subida simple de Graph

// ── Utilidades HTTP ──────────────────────────────────────────────────────────

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const permitidos = env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  return {
    'Access-Control-Allow-Origin': permitidos.includes(origin) ? origin : permitidos[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    Vary: 'Origin',
  }
}

function json(req: Request, env: Env, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(req, env) },
  })
}

function html(cuerpo: string, status = 200): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Portal DOM</title><body style="font-family:system-ui;max-width:560px;margin:60px auto;padding:0 16px">${cuerpo}</body>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

const escaparHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const claveValida = (req: Request, env: Env) =>
  !!env.ADMIN_KEY && new URL(req.url).searchParams.get('clave') === env.ADMIN_KEY

// ── Autenticación Entra ID ───────────────────────────────────────────────────

let tokenCache: { value: string; expira: number } | null = null

const redirectUri = (req: Request) => `${new URL(req.url).origin}/admin/callback`

async function pedirToken(env: Env, params: Record<string, string>) {
  const res = await fetch(`https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, ...params }),
  })
  if (!res.ok) throw new Error(`Token Entra ID ${res.status}: ${await res.text()}`)
  return await res.json() as { access_token: string; expires_in: number; refresh_token?: string }
}

async function getToken(env: Env, forzar = false): Promise<string> {
  if (!forzar && tokenCache && tokenCache.expira > Date.now() + 60_000) return tokenCache.value
  const refresh = await env.TOKENS.get(KV_REFRESH)
  const data = refresh
    ? await pedirToken(env, { grant_type: 'refresh_token', refresh_token: refresh, scope: SCOPES_DELEGADOS })
    : await pedirToken(env, { grant_type: 'client_credentials', scope: 'https://graph.microsoft.com/.default' })
  // Entra ID rota el refresh token: se guarda el nuevo para la próxima renovación
  if (data.refresh_token && data.refresh_token !== refresh) await env.TOKENS.put(KV_REFRESH, data.refresh_token)
  tokenCache = { value: data.access_token, expira: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

async function conectar(req: Request, env: Env): Promise<Response> {
  if (!claveValida(req, env)) return html('<h2>Acceso no autorizado</h2>', 403)
  const state = crypto.randomUUID()
  await env.TOKENS.put(`state:${state}`, '1', { expirationTtl: 600 })
  const url = new URL(`https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/v2.0/authorize`)
  url.search = new URLSearchParams({
    client_id: env.CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(req),
    response_mode: 'query',
    scope: SCOPES_DELEGADOS,
    state,
    prompt: 'select_account',
  }).toString()
  return Response.redirect(url.toString(), 302)
}

async function callback(req: Request, env: Env): Promise<Response> {
  const params = new URL(req.url).searchParams
  if (params.get('error'))
    return html(`<h2>No se pudo conectar</h2><p>${escaparHtml(texto(params.get('error_description'), 1000))}</p>`, 400)
  const state = params.get('state') ?? ''
  if (!state || !(await env.TOKENS.get(`state:${state}`))) return html('<h2>Solicitud vencida. Vuelva a intentarlo.</h2>', 400)
  await env.TOKENS.delete(`state:${state}`)

  const data = await pedirToken(env, {
    grant_type: 'authorization_code',
    code: params.get('code') ?? '',
    redirect_uri: redirectUri(req),
    scope: SCOPES_DELEGADOS,
  })
  if (!data.refresh_token) return html('<h2>Microsoft no entregó una sesión renovable (falta offline_access).</h2>', 500)
  await env.TOKENS.put(KV_REFRESH, data.refresh_token)
  tokenCache = { value: data.access_token, expira: Date.now() + data.expires_in * 1000 }

  const me = await graph(env, '/me?$select=displayName,userPrincipalName').catch(() => null)
  const cuenta = me ? `${me.displayName} (${me.userPrincipalName})` : 'cuenta municipal'
  await env.TOKENS.put(KV_CUENTA, cuenta)
  return html(`<h2>✅ Portal conectado</h2><p>El portal ciudadano escribirá en SharePoint con la cuenta <b>${escaparHtml(cuenta)}</b>.</p><p>Ya puede cerrar esta ventana.</p>`)
}

// ── Microsoft Graph ──────────────────────────────────────────────────────────

let siteIdCache: string | null = null

async function graph(env: Env, path: string, init: RequestInit = {}): Promise<any> {
  const token = await getToken(env)
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Permite filtrar por columnas no indexadas (listas pequeñas)
      Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Graph ${res.status} ${path}: ${await res.text()}`)
  if (res.status === 204) return null
  return res.json()
}

async function siteId(env: Env): Promise<string> {
  if (!siteIdCache) siteIdCache = (await graph(env, `/sites/${env.SITE_PATH}?$select=id`)).id
  return siteIdCache!
}

async function listaPath(env: Env, lista: string): Promise<string> {
  return `/sites/${await siteId(env)}/lists/${encodeURIComponent(lista)}`
}

/*
Columnas de una lista. Las listas importadas desde Excel tienen nombres internos
field_1, field_2…, distintos del nombre visible, así que el código trabaja con el
nombre visible y aquí se traduce al interno. También sirve si la columna se
llama igual por dentro y por fuera.
*/
type Tipo = 'text' | 'number' | 'boolean' | 'dateTime' | 'choice' | 'otro'
type Columna = { interno: string; visible: string; tipo: Tipo; opciones?: string[] }
type Columnas = { porVisible: Map<string, Columna>; porInterno: Map<string, Columna> }

const columnasCache = new Map<string, Columnas>()
const normalizar = (s: string) => s.trim().toLowerCase()

async function columnas(env: Env, lista: string): Promise<Columnas> {
  let cols = columnasCache.get(lista)
  if (!cols) {
    const data = await graph(env, `${await listaPath(env, lista)}/columns`)
    cols = { porVisible: new Map(), porInterno: new Map() }
    for (const c of data.value ?? []) {
      if (c.readOnly || c.hidden) continue
      const tipo = (['text', 'number', 'boolean', 'dateTime', 'choice'] as const).find(t => c[t]) ?? 'otro'
      const col: Columna = { interno: c.name, visible: String(c.displayName).trim(), tipo, opciones: c.choice?.choices }
      cols.porInterno.set(c.name, col)
      cols.porVisible.set(normalizar(col.visible), col)
    }
    columnasCache.set(lista, cols)
  }
  return cols
}

function buscarColumna(cols: Columnas, nombre: string): Columna | undefined {
  return cols.porVisible.get(normalizar(nombre)) ?? cols.porInterno.get(nombre)
}

function convertir(col: Columna, v: unknown): unknown {
  switch (col.tipo) {
    case 'number': { const n = Number(v); return Number.isFinite(n) ? n : undefined }
    case 'boolean': return v === true || v === 'Sí' || v === 1
    case 'text': return typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v)
    case 'choice': return col.opciones && !col.opciones.includes(String(v)) ? undefined : String(v)
    default: return v
  }
}

/* Convierte { NombreVisible: valor } a { nombreInterno: valor } con el tipo de cada columna,
   omitiendo columnas que no existen (Graph rechaza el elemento completo si una sola no existe). */
async function aSharePoint(env: Env, lista: string, campos: Record<string, unknown>) {
  const cols = await columnas(env, lista)
  const out: Record<string, unknown> = {}
  for (const [nombre, v] of Object.entries(campos)) {
    if (v === undefined || v === null || v === '') continue
    const col = buscarColumna(cols, nombre)
    if (!col) { console.warn(`Columna "${nombre}" no existe en ${lista}; se omite`); continue }
    const valor = convertir(col, v)
    if (valor === undefined) { console.warn(`Valor "${v}" no válido para ${lista}.${nombre} (${col.tipo}); se omite`); continue }
    out[col.interno] = valor
  }
  return out
}

/* Convierte los campos de un elemento de nombre interno a nombre visible */
async function desdeSharePoint(env: Env, lista: string, fields: Record<string, unknown>) {
  const cols = await columnas(env, lista)
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(fields)) out[cols.porInterno.get(k)?.visible ?? k] = v
  return out
}

async function nombreInterno(env: Env, lista: string, visible: string): Promise<string | undefined> {
  return buscarColumna(await columnas(env, lista), visible)?.interno
}

const odataStr = (v: string) => v.replace(/'/g, "''")

// ── Validación ───────────────────────────────────────────────────────────────

const limpiarRut = (rut: string) => rut.replace(/[^0-9kK]/g, '').toUpperCase()

function rutValido(rut: string): boolean {
  const r = limpiarRut(rut)
  if (r.length < 2) return false
  const cuerpo = r.slice(0, -1), dv = r.slice(-1)
  if (!/^\d+$/.test(cuerpo)) return false
  let suma = 0, mult = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const esperado = 11 - (suma % 11)
  return dv === (esperado === 11 ? '0' : esperado === 10 ? 'K' : String(esperado))
}

const texto = (v: unknown, max = 255) => String(v ?? '').trim().slice(0, max)

type Archivo = { nombre: string; tipo: string; tamano: number; contenidoBase64: string }

// ── Rutas ────────────────────────────────────────────────────────────────────

async function crearSolicitud(req: Request, env: Env): Promise<Response> {
  const body = await req.json().catch(() => null) as Record<string, any> | null
  if (!body) throw new HttpError(400, 'Solicitud inválida.')

  const nombre = texto(body.nombre)
  const rut = texto(body.rut, 20)
  const email = texto(body.email)
  const certificados: string[] = Array.isArray(body.certificados) ? body.certificados.map((c: unknown) => texto(c, 60)) : []
  const archivos: Archivo[] = Array.isArray(body.archivos) ? body.archivos : []

  if (!nombre) throw new HttpError(400, 'Falta el nombre del solicitante.')
  if (!rutValido(rut)) throw new HttpError(400, 'El RUT no es válido.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'El correo electrónico no es válido.')
  if (!certificados.length) throw new HttpError(400, 'Debe seleccionar al menos un certificado.')
  if (body.aceptaDatos !== true) throw new HttpError(400, 'Debe autorizar el tratamiento de sus datos personales.')
  if (archivos.length > MAX_ARCHIVOS) throw new HttpError(400, `Puede adjuntar hasta ${MAX_ARCHIVOS} archivos.`)
  for (const a of archivos) {
    if (!a?.contenidoBase64 || a.contenidoBase64.length * 0.75 > MAX_BYTES_ARCHIVO)
      throw new HttpError(400, `El archivo "${texto(a?.nombre)}" supera los 4 MB.`)
  }

  const ahora = new Date().toISOString()
  const campos = await aSharePoint(env, LISTA_SOLICITUDES, {
    Title: 'TEMPORAL',
    Solicitante: nombre,
    RutSolicitante: rut,
    Email: email,
    Telefono: texto(body.telefono, 30),
    TipoCertificado: certificados.join(', '),
    OtrosDescripcion: texto(body.otrosDescripcion),
    RolAvaluo: texto(body.rolAvaluo, 30),
    Propietario: texto(body.propietario),
    Direccion: texto(body.direccion),
    NumeroDomicilio: texto(body.numeroDomicilio, 30),
    Localidad: texto(body.localidad),
    UrbanoRural: body.urbanoRural === 'RURAL' ? 'RURAL' : 'URBANO',
    Observaciones: texto(body.observaciones, 2000),
    FechaIngreso: ahora,
    TotalDerechos: Number(body.total) || 0,
    EstadoSolicitud: 'INGRESADA',
    EstadoPago: 'PENDIENTE',
    Origen: 'WEB',
    AceptaTratamientoDatos: true,
    FechaAceptacionDatos: ahora,
  })

  const lista = await listaPath(env, LISTA_SOLICITUDES)
  const creado = await graph(env, `${lista}/items`, { method: 'POST', body: JSON.stringify({ fields: campos }) })
  const id = String(creado.id)
  const folio = `CERT-WEB-${new Date().getFullYear()}-${id.padStart(6, '0')}`

  // En CertificadosWeb el folio vive en Title (se muestra como "FolioSolicitud")
  await graph(env, `${lista}/items/${id}/fields`, {
    method: 'PATCH',
    body: JSON.stringify(await aSharePoint(env, LISTA_SOLICITUDES, { Title: folio, FolioSolicitud: folio })),
  })

  // Adjuntos: se guardan en la biblioteca Documentos, carpeta CertificadosWeb/<folio>
  const site = await siteId(env)
  for (const a of archivos) {
    const nombreArchivo = texto(a.nombre, 120).replace(/[\\/:*?"<>|#%]/g, '_') || 'archivo'
    const bytes = Uint8Array.from(atob(a.contenidoBase64.replace(/^data:[^,]*,/, '')), c => c.charCodeAt(0))
    const token = await getToken(env)
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site}/drive/root:/${CARPETA_ADJUNTOS}/${folio}/${encodeURIComponent(nombreArchivo)}:/content`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': a.tipo || 'application/octet-stream' }, body: bytes },
    )
    if (!res.ok) console.error(`Adjunto ${nombreArchivo} ${res.status}: ${await res.text()}`)
  }

  // Vecino en Solicitante (Title = RUT). Un error aquí no debe anular la solicitud ya creada.
  try {
    const listaSol = await listaPath(env, LISTA_SOLICITANTES)
    const datos = await aSharePoint(env, LISTA_SOLICITANTES, {
      Title: rut, Nombre: nombre, Email: email, Telefono: texto(body.telefono, 30), FolioSolicitud: folio,
    })
    const existentes = await graph(env, `${listaSol}/items?$top=1&$filter=fields/Title eq '${odataStr(rut)}'`)
    const existente = existentes.value?.[0]
    if (existente) await graph(env, `${listaSol}/items/${existente.id}/fields`, { method: 'PATCH', body: JSON.stringify(datos) })
    else await graph(env, `${listaSol}/items`, { method: 'POST', body: JSON.stringify({ fields: datos }) })
  } catch (e) {
    console.error('No se pudo guardar el solicitante:', e)
  }

  return json(req, env, { folioSolicitud: folio })
}

async function consultarSolicitud(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const folio = texto(url.searchParams.get('folio'), 40).toUpperCase()
  const rut = limpiarRut(texto(url.searchParams.get('rut'), 20))
  if (!folio || !rut) throw new HttpError(400, 'Debe indicar folio y RUT.')

  const lista = await listaPath(env, LISTA_SOLICITUDES)
  const colFolio = (await nombreInterno(env, LISTA_SOLICITUDES, 'FolioSolicitud')) ?? 'Title'
  const data = await graph(env, `${lista}/items?$expand=fields&$top=1&$filter=fields/${colFolio} eq '${odataStr(folio)}'`)
  const item = data.value?.[0]
  const f = item ? await desdeSharePoint(env, LISTA_SOLICITUDES, item.fields) : null
  // Mismo mensaje si no existe o si el RUT no coincide, para no revelar folios ajenos
  if (!f || limpiarRut(String(f.RutSolicitante ?? '')) !== rut)
    throw new HttpError(404, 'No encontramos una solicitud con esos datos.')

  return json(req, env, {
    folioSolicitud: f.FolioSolicitud ?? f.Title,
    estado: f.EstadoSolicitud ?? 'INGRESADA',
    tipoCertificado: f.TipoCertificado,
    fechaIngreso: f.FechaIngreso ?? item.createdDateTime,
    ultimaActualizacion: item.lastModifiedDateTime,
    totalDerechos: f.TotalDerechos,
    estadoPago: f.EstadoPago,
  })
}

async function obtenerCatalogo(req: Request, env: Env): Promise<Response> {
  const lista = await listaPath(env, LISTA_CATALOGO)
  const data = await graph(env, `${lista}/items?$expand=fields&$top=200`)
  const esSi = (v: unknown) => v === true || ['sí', 'si', 'true', '1'].includes(String(v ?? '').trim().toLowerCase())
  const filas = await Promise.all((data.value ?? []).map((i: any) => desdeSharePoint(env, LISTA_CATALOGO, i.fields)))
  const certificados = filas
    .filter(f => esSi(f.Activo))
    .map(f => ({
      tipo: f.Codigo,
      nombre: f.Title,
      descripcion: f.Descripcion ?? '',
      valor: Number(f.Valor ?? 0),
      plazo: f.PlazoDias ? `${f.PlazoDias} días hábiles` : '',
      activo: true,
      orden: Number(f.Orden ?? 999) || 999,
      destacado: esSi(f.Destacado),
    }))
    .sort((a, b) => a.orden - b.orden)
  return json(req, env, { certificados })
}

// Diagnóstico: nombre visible → nombre interno y tipo de las columnas de cada lista
async function verColumnas(req: Request, env: Env): Promise<Response> {
  if (!claveValida(req, env)) return json(req, env, { error: 'Acceso no autorizado.' }, 403)
  columnasCache.clear()
  const out: Record<string, unknown> = { cuenta: await env.TOKENS.get(KV_CUENTA) }
  for (const lista of [LISTA_SOLICITUDES, LISTA_SOLICITANTES, LISTA_CATALOGO]) {
    const cols = await columnas(env, lista)
    out[lista] = [...cols.porInterno.values()].map(c =>
      `${c.visible} → ${c.interno} : ${c.tipo}${c.opciones ? ' ' + JSON.stringify(c.opciones) : ''}`)
  }
  return json(req, env, out)
}

// ── Entrada ──────────────────────────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) })
    const { pathname } = new URL(req.url)
    try {
      if (req.method === 'GET' && pathname === '/admin/conectar') return await conectar(req, env)
      if (req.method === 'GET' && pathname === '/admin/callback') return await callback(req, env)
      if (req.method === 'GET' && pathname === '/admin/columnas') return await verColumnas(req, env)
      if (req.method === 'POST' && pathname === '/solicitud') return await crearSolicitud(req, env)
      if (req.method === 'GET' && pathname === '/consulta') return await consultarSolicitud(req, env)
      if (req.method === 'GET' && pathname === '/catalogo') return await obtenerCatalogo(req, env)
      return json(req, env, { error: 'Ruta no encontrada.' }, 404)
    } catch (e) {
      if (e instanceof HttpError) return json(req, env, { error: e.message }, e.status)
      console.error(e)
      return json(req, env, { error: 'Ocurrió un error al procesar la solicitud. Intente nuevamente.' }, 500)
    }
  },

  // Cron diario: renueva la sesión para que no venza por inactividad
  async scheduled(_evento: ScheduledController, env: Env): Promise<void> {
    if (await env.TOKENS.get(KV_REFRESH)) await getToken(env, true)
  },
}
