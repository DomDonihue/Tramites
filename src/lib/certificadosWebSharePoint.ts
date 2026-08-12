import { msalInstance } from './auth'

const SITE_URL = 'https://mdonihue.sharepoint.com/sites/DOMExpediente'
const SP_SCOPE = 'https://mdonihue.sharepoint.com/AllSites.Write'

async function getToken() {
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
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json;odata=nometadata', 'Content-Type': 'application/json;odata=nometadata' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`SharePoint ${res.status}: ${await res.text()}`)
  if (res.status === 204) return null
  return res.json()
}

const itemsPath = "/web/lists/getbytitle('CertificadosWeb')/items"

export async function spGetCertificadosWeb(): Promise<Record<string, any>[]> {
  const data = await spFetch(`${itemsPath}?$top=5000&$orderby=Id desc`)
  return data.value ?? []
}

export async function spCreateCertificadoWeb(data: Record<string, unknown>): Promise<string> {
  const result = await spFetch(itemsPath, 'POST', data)
  return String(result.Id)
}

export async function spUpdateCertificadoWeb(id: string, data: Record<string, unknown>) {
  await spFetch(`${itemsPath}(${id})`, 'PATCH', data)
}

export async function spGetCertificadoWebByFolioAndRut(folio: string, rut: string) {
  const safeFolio = folio.replace(/'/g, "''")
  const safeRut = rut.replace(/'/g, "''")
  const data = await spFetch(`${itemsPath}?$top=1&$filter=FolioSolicitud eq '${safeFolio}' and RutSolicitante eq '${safeRut}'`)
  return data.value?.[0] ?? null
}
