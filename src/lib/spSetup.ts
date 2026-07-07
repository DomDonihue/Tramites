import { msalInstance } from './auth'

const GRAPH = 'https://graph.microsoft.com/v1.0'
const SITE_PATH = 'mdonihue.sharepoint.com:/sites/DOMExpediente'

async function getToken() {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  const result = await msalInstance.acquireTokenSilent({
    scopes: ['https://graph.microsoft.com/Sites.ReadWrite.All'],
    account,
  })
  return result.accessToken
}

async function api(path: string, method = 'GET', body?: unknown) {
  const token = await getToken()
  const res = await fetch(`${GRAPH}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`${res.status}: ${txt}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function getSiteId() {
  const data = await api(`/sites/${SITE_PATH}`)
  return data.id as string
}

async function getListId(siteId: string, name: string): Promise<string | null> {
  const data = await api(`/sites/${siteId}/lists?$filter=displayName eq '${name}'`)
  return data.value?.[0]?.id ?? null
}

async function createList(siteId: string, name: string): Promise<string> {
  const existing = await getListId(siteId, name)
  if (existing) return existing
  const data = await api(`/sites/${siteId}/lists`, 'POST', {
    displayName: name,
    list: { template: 'genericList' },
  })
  return data.id as string
}

// Tipos de columna para Graph API
type ColDef = { name: string; type: 'text' | 'number' | 'dateTime' | 'boolean' | 'choice'; choices?: string[] }

async function addColumn(siteId: string, listId: string, col: ColDef) {
  const base: Record<string, unknown> = { name: col.name, enforceUniqueValues: false }
  if (col.type === 'text')     base.text = {}
  if (col.type === 'number')   base.number = {}
  if (col.type === 'dateTime') base.dateTime = { format: 'dateOnly' }
  if (col.type === 'boolean')  base.boolean = {}
  if (col.type === 'choice')   base.choice = { choices: col.choices ?? [] }
  try {
    await api(`/sites/${siteId}/lists/${listId}/columns`, 'POST', base)
  } catch (e: any) {
    // Ignorar error si la columna ya existe
    if (!e.message?.includes('already exists') && !e.message?.includes('duplicateColumn')) {
      console.warn(`Columna ${col.name}:`, e.message)
    }
  }
}

// ── Definición de listas ────────────────────────────────────────────────────

const COLS_EXPEDIENTES: ColDef[] = [
  { name: 'Numero',       type: 'text' },
  { name: 'Ano',          type: 'number' },
  { name: 'Fecha',        type: 'dateTime' },
  { name: 'Propietario',  type: 'text' },
  { name: 'RolAvaluo',    type: 'text' },
  { name: 'Direccion',    type: 'text' },
  { name: 'Profesional',  type: 'text' },
  { name: 'Categoria',    type: 'choice', choices: [
    'PERMISOS_EDIFICACION','OBRAS_MENORES','SUBDIVISION_URB','CERTIFICADOS',
    'ZONAS_CATASTROFE','TORRES_ANTENAS','AUTORIZACION_APRO','REGULARIZACION','DECLARACION_JURADA',
  ]},
  { name: 'TipoTramite',  type: 'text' },
  { name: 'Etapa',        type: 'choice', choices: ['ANTEPROYECTO','PERMISO','MODIFICACION','RECEPCION'] },
  { name: 'Estado',       type: 'choice', choices: ['en_revision','aprobado','observado','vigente','rechazado'] },
  { name: 'SuperficieM2', type: 'number' },
  { name: 'TotalPesos',   type: 'number' },
  { name: 'Caja',         type: 'number' },
  { name: 'NumPermiso',   type: 'text' },
  { name: 'Observaciones',type: 'text' },
  { name: 'DocsEnArchivo',type: 'text' },
  { name: 'PatenteProfesional', type: 'text' },
  { name: 'Fuente',       type: 'text' },
  { name: 'CreatedBy_',   type: 'text' },
]

const COLS_CERTIFICADOS: ColDef[] = [
  { name: 'NumeroCert',       type: 'number' },
  { name: 'Fecha',            type: 'dateTime' },
  { name: 'Solicitante',      type: 'text' },
  { name: 'RutSolicitante',   type: 'text' },
  { name: 'EmailSol',         type: 'text' },
  { name: 'Telefono',         type: 'text' },
  { name: 'TipoCertificado',  type: 'choice', choices: [
    'NUMERO','RURALIDAD','URBANIZACION','AFECTACION_UTILIDAD_PUBLICA',
    'INFORMACIONES_PREVIAS','VIVIENDA_SOCIAL','LOCALIZACION','ZONIFICACION','OTROS',
  ]},
  { name: 'OtrosDescripcion', type: 'text' },
  { name: 'Anotaciones',      type: 'text' },
  { name: 'RolAvaluo',        type: 'text' },
  { name: 'Direccion',        type: 'text' },
  { name: 'NumeroDomicilio',  type: 'text' },
  { name: 'Localidad',        type: 'text' },
  { name: 'Manzana',          type: 'text' },
  { name: 'Lote',             type: 'text' },
  { name: 'UrbanoRural',      type: 'choice', choices: ['URBANO','RURAL'] },
  { name: 'NumeroAsignado',   type: 'text' },
  { name: 'FechaEntrega',     type: 'dateTime' },
  { name: 'Estado',           type: 'choice', choices: ['POR_ENTREGAR','ENTREGADO'] },
  { name: 'TotalDerechos',    type: 'number' },
  { name: 'GiroMunicipal',    type: 'text' },
  { name: 'FechaPago',        type: 'dateTime' },
  { name: 'Funcionario',      type: 'text' },
  { name: 'AfectacionVialidad', type: 'boolean' },
  { name: 'AfectacionParque',   type: 'boolean' },
  { name: 'AfectacionEnsanche', type: 'boolean' },
  { name: 'AfectacionApertura', type: 'boolean' },
  { name: 'ViasAfectadas',    type: 'text' },
]

const COLS_DESARCHIVOS: ColDef[] = [
  { name: 'ExpedienteId',        type: 'text' },
  { name: 'Solicitante',         type: 'text' },
  { name: 'RutSolicitante',      type: 'text' },
  { name: 'DocumentosRetirados', type: 'text' },
  { name: 'Fecha',               type: 'dateTime' },
  { name: 'Funcionario',         type: 'text' },
]

// ── Runner principal ─────────────────────────────────────────────────────────

export type SetupLog = { msg: string; ok: boolean }

export async function runSetup(onLog: (log: SetupLog) => void): Promise<void> {
  const log = (msg: string, ok = true) => onLog({ msg, ok })

  log('🔗 Conectando con SharePoint...')
  const siteId = await getSiteId()
  log(`✅ Sitio encontrado: ${siteId.split(',')[1] ?? siteId}`)

  const listas: { name: string; cols: ColDef[] }[] = [
    { name: 'Expedientes',  cols: COLS_EXPEDIENTES },
    { name: 'Certificados', cols: COLS_CERTIFICADOS },
    { name: 'Desarchivos',  cols: COLS_DESARCHIVOS },
  ]

  for (const lista of listas) {
    log(`📋 Creando lista "${lista.name}"...`)
    let listId: string
    try {
      listId = await createList(siteId, lista.name)
      log(`✅ Lista "${lista.name}" lista`)
    } catch (e: any) {
      log(`❌ Error creando "${lista.name}": ${e.message}`, false)
      continue
    }

    log(`   Agregando ${lista.cols.length} columnas...`)
    let ok = 0
    for (const col of lista.cols) {
      try {
        await addColumn(siteId, listId, col)
        ok++
      } catch { /* ignorar duplicados */ }
    }
    log(`   ✅ ${ok}/${lista.cols.length} columnas configuradas`)
  }

  log('🎉 Configuración completada. Las listas están listas en SharePoint.')
}
