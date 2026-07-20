import { msalInstance } from './auth'

const SITE_URL = 'https://mdonihue.sharepoint.com/sites/DOMExpediente'
const SP_SCOPE  = 'https://mdonihue.sharepoint.com/AllSites.Write'

async function getToken() {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  const scopes  = [SP_SCOPE]
  try {
    const r = await msalInstance.acquireTokenSilent({ scopes, account })
    return r.accessToken
  } catch {
    const r = await msalInstance.acquireTokenPopup({ scopes, account })
    return r.accessToken
  }
}

async function spApi(path: string, method = 'GET', body?: unknown) {
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
    throw new Error(`${res.status}: ${txt}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function listExists(name: string): Promise<boolean> {
  try {
    await spApi(`/web/lists/getbytitle('${name}')`)
    return true
  } catch {
    return false
  }
}

async function createList(name: string): Promise<void> {
  if (await listExists(name)) return
  await spApi('/web/lists', 'POST', {
    Title: name,
    BaseTemplate: 100,
    AllowContentTypes: false,
  })
}

type ColDef = {
  name: string
  type: 'text' | 'number' | 'dateTime' | 'boolean' | 'choice'
  choices?: string[]
}

// FieldTypeKind: Text=2, Number=9, DateTime=4, Boolean=8, Choice=6
const FIELD_KIND: Record<ColDef['type'], number> = {
  text: 2, number: 9, dateTime: 4, boolean: 8, choice: 6,
}

async function addColumn(listName: string, col: ColDef): Promise<void> {
  const body: Record<string, unknown> = {
    Title: col.name,
    FieldTypeKind: FIELD_KIND[col.type],
    Required: false,
  }
  if (col.type === 'choice' && col.choices) {
    body.Choices = { results: col.choices }
  }
  try {
    await spApi(`/web/lists/getbytitle('${listName}')/fields`, 'POST', body)
  } catch (e: any) {
    // Ignorar si ya existe
    if (!e.message?.includes('already exists') && !e.message?.includes('duplicat')) {
      console.warn(`Col ${col.name}:`, e.message)
    }
  }
}

// ── Definición de columnas ───────────────────────────────────────────────────

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
  { name: 'CreadoPor',    type: 'text' },
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
  { name: 'EstadoCert',       type: 'choice', choices: ['POR_ENTREGAR','ENTREGADO'] },
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

const COLS_SOLICITANTE: ColDef[] = [
  { name: 'Nombre',   type: 'text' },
  { name: 'Email',    type: 'text' },
  { name: 'Telefono', type: 'text' },
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

  log('Conectando con SharePoint...')
  // Verificar acceso
  try {
    await spApi('/web?$select=Title')
    log('Sitio DOM Expediente accesible')
  } catch (e: any) {
    log(`Error de conexión: ${e.message}`, false)
    throw e
  }

  const listas: { name: string; cols: ColDef[] }[] = [
    { name: 'Expediente',   cols: COLS_EXPEDIENTES },
    { name: 'Certificados', cols: COLS_CERTIFICADOS },
    { name: 'Desarchivo',   cols: COLS_DESARCHIVOS },
    { name: 'Solicitante',  cols: COLS_SOLICITANTE },
  ]

  for (const lista of listas) {
    log(`Verificando lista "${lista.name}"...`)
    const existe = await listExists(lista.name)
    if (!existe) {
      log(`❌ Lista "${lista.name}" no encontrada — créala manualmente en SharePoint primero`, false)
      continue
    }
    log(`Lista "${lista.name}" encontrada`)
    log(`Agregando ${lista.cols.length} columnas a "${lista.name}"...`)
    let ok = 0
    for (const col of lista.cols) {
      try {
        await addColumn(lista.name, col)
        ok++
      } catch { /* ignorar */ }
    }
    log(`${ok}/${lista.cols.length} columnas configuradas en "${lista.name}"`)

    // Agregar columnas a la vista por defecto
    try {
      const viewRes = await spApi(`/web/lists/getbytitle('${lista.name}')/defaultview`)
      const viewId = (viewRes as any).Id
      for (const col of lista.cols) {
        await spApi(
          `/web/lists/getbytitle('${lista.name}')/views('${viewId}')/viewfields/addviewfield('${col.name}')`,
          'POST'
        ).catch(() => {})
      }
      log(`Vista actualizada con todas las columnas en "${lista.name}"`)
    } catch { /* ignorar */ }
  }

  log('Configuración completada. Las listas están listas en SharePoint.')
}
