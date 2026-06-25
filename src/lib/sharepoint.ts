import { msalInstance } from './auth'
import { loginRequest } from './msalConfig'

const SITE_URL    = 'https://mdonihue.sharepoint.com/sites/DOMExpediente'
const GRAPH_BASE  = 'https://graph.microsoft.com/v1.0'
const SITE_PATH   = 'mdonihue.sharepoint.com:/sites/DOMExpediente'

async function getToken(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  const result  = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    scopes:  ['https://graph.microsoft.com/Sites.ReadWrite.All', 'Files.ReadWrite.All'],
    account,
  })
  return result.accessToken
}

async function graphFetch(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const res   = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Graph API error ${res.status}: ${err}`)
  }
  return res.json()
}

// Obtiene el ID del sitio SharePoint
let _siteId: string | null = null
async function getSiteId(): Promise<string> {
  if (_siteId) return _siteId
  const data = await graphFetch(`/sites/${SITE_PATH}`)
  _siteId    = data.id
  return _siteId!
}

// Obtiene el ID de la lista por nombre
const _listIds: Record<string, string> = {}
async function getListId(listName: string): Promise<string> {
  if (_listIds[listName]) return _listIds[listName]
  const siteId = await getSiteId()
  const data   = await graphFetch(`/sites/${siteId}/lists?$filter=displayName eq '${listName}'`)
  const list   = data.value?.[0]
  if (!list) throw new Error(`Lista '${listName}' no encontrada en SharePoint`)
  _listIds[listName] = list.id
  return list.id
}

// ─── EXPEDIENTES ────────────────────────────────────────────────────────────

export async function spGetExpedientes() {
  const siteId  = await getSiteId()
  const listId  = await getListId('Expedientes')
  const data    = await graphFetch(
    `/sites/${siteId}/lists/${listId}/items?expand=fields&$top=500`
  )
  return data.value.map((item: any) => ({ id: item.id, ...item.fields }))
}

export async function spCreateExpediente(fields: Record<string, unknown>) {
  const siteId = await getSiteId()
  const listId = await getListId('Expedientes')
  return graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    body:   JSON.stringify({ fields }),
  })
}

export async function spUpdateExpediente(itemId: string, fields: Record<string, unknown>) {
  const siteId = await getSiteId()
  const listId = await getListId('Expedientes')
  return graphFetch(`/sites/${siteId}/lists/${listId}/items/${itemId}/fields`, {
    method: 'PATCH',
    body:   JSON.stringify(fields),
  })
}

export async function spDeleteExpediente(itemId: string) {
  const siteId = await getSiteId()
  const listId = await getListId('Expedientes')
  const token  = await getToken()
  await fetch(`${GRAPH_BASE}/sites/${siteId}/lists/${listId}/items/${itemId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ─── ARCHIVOS EN SHAREPOINT ─────────────────────────────────────────────────

/**
 * Sube un archivo a SharePoint en la carpeta del expediente.
 * Ruta: Documentos DOM / {categoria} / {tipoTramite} / {etapa} / {año} / _{prefix}_{numExp}_{rol} / archivo.pdf
 */
export async function spUploadArchivo(
  file: File,
  rutaCarpeta: string   // Ej: "PERMISOS_EDIFICACION/OBRA_NUEVA/PERMISO/2024/_PE_0001_113-19"
): Promise<string> {
  const siteId     = await getSiteId()
  // Obtiene el drive raíz del sitio
  const drive      = await graphFetch(`/sites/${siteId}/drive`)
  const driveId    = drive.id

  // Crea la carpeta si no existe (Graph crea recursivamente con la ruta completa)
  const folderPath = `Documentos DOM/${rutaCarpeta}`
  const uploadUrl  = `/drives/${driveId}/root:/${folderPath}/${file.name}:/content`

  const token  = await getToken()
  const buffer = await file.arrayBuffer()
  const res    = await fetch(`${GRAPH_BASE}${uploadUrl}`, {
    method:  'PUT',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: buffer,
  })
  if (!res.ok) throw new Error(`Error subiendo archivo: ${res.status}`)
  const data = await res.json()
  return data.webUrl as string
}

// ─── USUARIOS ────────────────────────────────────────────────────────────────

export async function spGetUsuarios() {
  const siteId = await getSiteId()
  const listId = await getListId('Usuario')
  const data   = await graphFetch(
    `/sites/${siteId}/lists/${listId}/items?expand=fields&$top=200`
  )
  return data.value.map((item: any) => ({
    id:        item.id,
    nombre:    item.fields.Title ?? item.fields.NombreCompleto ?? '',
    email:     item.fields.Email ?? '',
    perfil:    item.fields.Perfil ?? 'profesional',
    activo:    item.fields.Activo ?? true,
    cargo:     item.fields.Cargo ?? '',
  }))
}
