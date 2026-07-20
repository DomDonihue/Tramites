import { useState, useRef } from 'react'
import { read, utils, WorkBook } from 'xlsx'
import { db } from '../lib/data'
import { Certificado, TipoCertificado, Categoria, Expediente } from '../types'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader, Trash2, History } from 'lucide-react'

// ── Mapeo de tipos del Excel → tipos internos ─────────────────────────────────
const TIPO_MAP: Record<string, TipoCertificado> = {
  'NUMERO':              'NUMERO',
  'NÚMERO':              'NUMERO',
  'RURALIDAD':           'RURALIDAD',
  'URBANIZACION':        'URBANIZACION',
  'URBANIZACIÓN':        'URBANIZACION',
  'NO EXPROPIACION':     'AFECTACION_UTILIDAD_PUBLICA',
  'NO EXPROPIACIÓN':     'AFECTACION_UTILIDAD_PUBLICA',
  'AFECTACION':          'AFECTACION_UTILIDAD_PUBLICA',
  'INFORMACIONES PREVIAS': 'INFORMACIONES_PREVIAS',
  'INFORME PREVIO':      'INFORMACIONES_PREVIAS',
  'VIVIENDA SOCIAL':     'VIVIENDA_SOCIAL',
  'LOCALIZACION':        'LOCALIZACION',
  'LOCALIZACIÓN':        'LOCALIZACION',
  'ZONIFICACION':        'ZONIFICACION',
  'ZONIFICACIÓN':        'ZONIFICACION',
}

function mapTipo(raw: string | undefined): TipoCertificado {
  if (!raw) return 'OTROS'
  const key = String(raw).trim().toUpperCase()
  return TIPO_MAP[key] ?? 'OTROS'
}

function excelDateToStr(val: unknown): string {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().split('T')[0]
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    return d.toISOString().split('T')[0]
  }
  const s = String(val).trim()
  if (s.includes('/')) {
    const [d, m, y] = s.split('/')
    return `${y}-${m?.padStart(2,'0')}-${d?.padStart(2,'0')}`
  }
  return s
}

function parseCertGenerales(rows: Record<string, unknown>[]): Omit<Certificado, 'id' | 'numero' | 'created_at' | 'updated_at'>[] {
  return rows
    .filter(r => r['SOLICITANTE'] || r['Solicitante'])
    .map(r => ({
      fecha:          excelDateToStr(r['FECHA'] ?? r['Fecha']),
      solicitante:    String(r['SOLICITANTE'] ?? r['Solicitante'] ?? '').trim(),
      tipo:           mapTipo(String(r['TIPO CERTIFICADO'] ?? r['Tipo Certificado'] ?? '')),
      anotaciones:    String(r['ANOTACIONES'] ?? r['Anotaciones'] ?? '').trim() || undefined,
      rol_avaluo:     String(r['ROL DE AVALUO'] ?? r['ROL DE AVALÚO'] ?? '').trim() || undefined,
      localidad:      String(r['LOCALIDAD '] ?? r['LOCALIDAD'] ?? '').trim() || undefined,
      fecha_entrega:  excelDateToStr(r['FECHA ENTREGA '] ?? r['FECHA ENTREGA']),
      estado:         (String(r['ENTREGADO '] ?? r['ENTREGADO'] ?? '').trim().toUpperCase() === 'ENTREGADO'
                        ? 'ENTREGADO' : 'POR_ENTREGAR') as Certificado['estado'],
      urbano_rural:   'URBANO' as const,
      rut_solicitante: undefined,
      email: undefined, telefono: undefined, otros_descripcion: undefined,
      numero_domicilio: undefined, manzana: undefined, lote: undefined,
      numero_asignado: undefined, total_derechos: undefined,
      giro_municipal: undefined, fecha_pago: undefined, funcionario: undefined,
    }))
}

function parseInformesPrevios(rows: Record<string, unknown>[]): Omit<Certificado, 'id' | 'numero' | 'created_at' | 'updated_at'>[] {
  return rows
    .filter(r => r['SOLICITANTE'] || r['Solicitante'])
    .map(r => ({
      fecha:          excelDateToStr(r['FECHA'] ?? r['Fecha']),
      solicitante:    String(r['SOLICITANTE'] ?? r['Solicitante'] ?? '').trim(),
      tipo:           'INFORMACIONES_PREVIAS' as TipoCertificado,
      anotaciones:    String(r['Anotaciones'] ?? r['OBSERVACIÓNES'] ?? r['OBSERVACIONES'] ?? r['Observaciones'] ?? '').trim() || undefined,
      rol_avaluo:     String(r['ROL DE AVALUO'] ?? r['ROL DE AVALÚO'] ?? '').trim() || undefined,
      localidad:      String(r['LOCAIDAD '] ?? r['LOCALIDAD'] ?? r['LOCAIDAD'] ?? '').trim() || undefined,
      fecha_entrega:  excelDateToStr(r['FECHA ENTREGA '] ?? r['FECHA ENTREGA']),
      estado:         (String(r['Estado'] ?? r['ENTREGADO'] ?? '').trim().toUpperCase() === 'ENTREGADO'
                        ? 'ENTREGADO' : 'POR_ENTREGAR') as Certificado['estado'],
      urbano_rural:   'URBANO' as const,
      rut_solicitante: undefined, email: undefined, telefono: undefined,
      otros_descripcion: undefined, numero_domicilio: undefined, manzana: undefined,
      lote: undefined, numero_asignado: undefined, total_derechos: undefined,
      giro_municipal: undefined, fecha_pago: undefined, funcionario: undefined,
    }))
}

// ── Mapeo MATERIA → Categoría/TipoTrámite (Matriz histórica) ──────────────────
function norm(s: string) {
  return s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function mapMateria(raw: string): { categoria: Categoria; tipo_tramite: string } {
  const m = norm(raw)
  if (m.includes('LEY 20898') || m.includes('LEY20898'))
    return { categoria: 'REGULARIZACION', tipo_tramite: 'LEY_20898' }
  if (m.includes('20.251') || m.includes('20,251') || m.includes('20251') || m.includes('20.251'))
    return { categoria: 'REGULARIZACION', tipo_tramite: 'LEY_20251' }
  if (m.includes('LEY 21031') || m.includes('21031'))
    return { categoria: 'REGULARIZACION', tipo_tramite: 'LEY_21031' }
  if (m.includes('REGULARIZ'))
    return { categoria: 'REGULARIZACION', tipo_tramite: 'LEY_20898' }
  if (m.includes('CATASTR') || m.includes('ZONA'))
    return { categoria: 'ZONAS_CATASTROFE', tipo_tramite: 'OBRA_NUEVA_VIV' }
  if (m.includes('RECONSTRUCC'))
    return { categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'RECONSTRUCCION' }
  if (m.includes('ALTERAC') || m.includes('MODIF'))
    return { categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'ALTERACION' }
  if (m.includes('OBRA NUEVA') || m.includes('OBRA_NUEVA'))
    return { categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA' }
  if (m.includes('SUBDIVISION') || m.includes('SUBDIVICI') || m.includes('SUBDIVIS'))
    return { categoria: 'SUBDIVISION_URB', tipo_tramite: 'SUBDIVISION' }
  if (m.includes('FUSION') || m.includes('FUSI'))
    return { categoria: 'SUBDIVISION_URB', tipo_tramite: 'FUSION' }
  if (m.includes('LOTEO'))
    return { categoria: 'SUBDIVISION_URB', tipo_tramite: 'LOTEO' }
  if (m.includes('AMPLIACI') || m.includes('AMPLIACION'))
    return { categoria: 'OBRAS_MENORES', tipo_tramite: 'AMPLIACION_100' }
  if (m.includes('OBRA MENOR') || m.includes('OBRA_MENOR'))
    return { categoria: 'OBRAS_MENORES', tipo_tramite: 'ARTE_SIN_OBRA' }
  if (m.includes('DECLARAC'))
    return { categoria: 'DECLARACION_JURADA', tipo_tramite: 'DJ_OTRO' }
  return { categoria: 'PERMISOS_EDIFICACION', tipo_tramite: 'OBRA_NUEVA' }
}

type ExpedienteImport = Omit<Expediente, 'id' | 'created_at' | 'updated_at' | 'documentos'>

function getCol(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v != null && String(v).trim() && String(v).trim() !== 'None') return String(v).trim()
  }
  return ''
}

function parseMatrizHoja(
  wb: WorkBook, sheetName: string, fuente: string
): ExpedienteImport[] {
  const ws = wb.Sheets[sheetName]
  if (!ws) return []
  // Fila 1 = título, fila 2 = encabezados → range:1 salta fila 1
  const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, range: 1 })
  return rows
    .filter(r => {
      const nombre = getCol(r, 'NOMBRE / PROPIETARIO', 'PROPIETARIO', 'NOMBRE/PROPIETARIO')
      return !!nombre && nombre !== '...'
    })
    .map(r => {
      const fecha = excelDateToStr(
        r['FECHA'] ?? r['FECHA RECEPCIÓN'] ?? r['FECHA RECEPCION']
      )
      const ano = r['AÑO'] ? Number(r['AÑO'])
        : fecha ? Number(fecha.slice(0, 4)) : 0
      const propietario = getCol(r, 'NOMBRE / PROPIETARIO', 'PROPIETARIO', 'NOMBRE/PROPIETARIO')
      const materia     = getCol(r, 'MATERIA', 'MATERIA / TIPO', 'TIPO NORM')
      const { categoria, tipo_tramite } = mapMateria(materia || 'OBRA NUEVA')
      const numero = getCol(r, 'N°', 'N°', 'Nº', 'Nº', 'N.', 'N�')
        || getCol(r, 'N° PERMISO', 'N° RECEPCION')
      const recepcion = excelDateToStr(r['RECEPCIÓN'] ?? r['RECEPCION'])

      return {
        ano,
        numero: numero || `${fuente.slice(0,3).toUpperCase()}-${ano}-?`,
        fecha:  fecha || `${ano}-01-01`,
        propietario,
        rol_avaluo:    getCol(r, 'ROL', 'ROL AVALUO', 'ROL AVALÚO'),
        direccion:     getCol(r, 'DIRECCIÓN', 'DIRECCION', 'DIRECCIÓN'),
        profesional:   getCol(r, 'PROFESIONAL'),
        categoria,
        tipo_tramite,
        etapa:         (recepcion ? 'RECEPCION' : 'PERMISO') as Expediente['etapa'],
        estado:        'aprobado' as Expediente['estado'],
        superficie_m2: parseFloat(getCol(r, 'SUP (m²)', 'SUP (m2)', 'SUPERFICIE (m²)', 'SUPERFICIE (m2)') || '0') || 0,
        total_pesos:   parseInt(getCol(r, 'TOTAL $', 'TOTAL').replace(/[^0-9]/g, '') || '0') || 0,
        caja:          Number(r['CAJA'] ?? 0) || 0,
        num_permiso:   numero,
        observaciones: materia,
        fuente,
        patente_profesional: undefined,
        created_by: undefined,
      }
    })
}

function parseMatriz(wb: WorkBook): { historico: ExpedienteImport[]; permisos: ExpedienteImport[] } {
  const historico = parseMatrizHoja(wb, 'HISTÓRICO (1980-2023)', 'historico')
  const permisos  = [
    ...parseMatrizHoja(wb, 'PERMISOS', 'permisos_2024_2026'),
    ...parseMatrizHoja(wb, 'RECEPCIONES', 'recepciones_2024_2026'),
    ...parseMatrizHoja(wb, 'EXPEDIENTES 2026', 'expedientes_2026'),
  ]
  return { historico, permisos }
}

type FileType = 'generales' | 'previos' | 'matriz'

interface ParsedFile {
  type: FileType
  name: string
  records: Omit<Certificado, 'id' | 'numero' | 'created_at' | 'updated_at'>[]
  // Solo para type === 'matriz':
  historico?: ExpedienteImport[]
  permisos?:  ExpedienteImport[]
}

export function ImportPage() {
  const [files, setFiles]       = useState<ParsedFile[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult]     = useState<{ ok: number; err: number; expeds?: number } | null>(null)
  const [confirmLimpiar, setConfirmLimpiar] = useState(false)
  const [totalActual, setTotalActual] = useState(() => db.getCertificados().length)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLimpiar = () => {
    db.limpiarTodosCertificados()
    setConfirmLimpiar(false)
    setTotalActual(0)
    setResult(null)
  }

  const handleFile = async (file: File) => {
    const buf = await file.arrayBuffer()
    const wb  = read(buf, { type: 'array', cellDates: true })

    // Detectar Matriz por nombre de hoja
    const esMatriz = wb.SheetNames.some(s =>
      s.includes('HIST') || s.includes('PERMISOS') || s.includes('RECEPCIONES')
    )

    if (esMatriz) {
      const { historico, permisos } = parseMatriz(wb)
      setFiles(prev => {
        const others = prev.filter(f => f.type !== 'matriz')
        return [...others, { type: 'matriz', name: file.name, records: [], historico, permisos }]
      })
      return
    }

    const ws   = wb.Sheets[wb.SheetNames[0]]
    const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
    const nameLower = file.name.toLowerCase()
    const type: FileType = nameLower.includes('informe') || nameLower.includes('previo') || nameLower.includes('cip')
      ? 'previos' : 'generales'
    const records = type === 'previos' ? parseInformesPrevios(rows) : parseCertGenerales(rows)
    setFiles(prev => {
      const others = prev.filter(f => f.type !== type)
      return [...others, { type, name: file.name, records }]
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    Array.from(e.dataTransfer.files).forEach(handleFile)
  }

  const handleImport = async () => {
    setImporting(true)
    let ok = 0, err = 0, expeds = 0
    for (const f of files) {
      if (f.type === 'matriz') {
        const todos = [...(f.historico ?? []), ...(f.permisos ?? [])]
        expeds += db.bulkImportExpedientes(todos)
      } else {
        for (const rec of f.records) {
          try { db.createCertificado(rec); ok++ } catch { err++ }
        }
      }
    }
    setResult({ ok, err, expeds })
    setFiles([])
    setTotalActual(db.getCertificados().length)
    setImporting(false)
  }

  const totalRecords = files.reduce((s, f) =>
    f.type === 'matriz'
      ? s + (f.historico?.length ?? 0) + (f.permisos?.length ?? 0)
      : s + f.records.length
  , 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Importar certificados desde Excel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sube los archivos <strong>CERTIFICADOS GENERALES 2026.xlsm</strong> e <strong>INFORMES PREVIOS 2026.xlsm</strong>
        </p>
      </div>

      {/* Panel limpiar datos actuales */}
      {totalActual > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Hay {totalActual} certificados cargados actualmente
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Si importas un nuevo Excel sin limpiar, los registros se <strong>agregarán</strong> a los existentes y habrá duplicados.
                Limpia primero si quieres reemplazar todo.
              </p>
            </div>
            {!confirmLimpiar ? (
              <button
                onClick={() => setConfirmLimpiar(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-amber-300 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <Trash2 size={13}/> Limpiar todo
              </button>
            ) : (
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs text-red-700 font-semibold">¿Confirmar?</span>
                <button onClick={handleLimpiar}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700">
                  Sí, borrar todo
                </button>
                <button onClick={() => setConfirmLimpiar(false)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {totalActual === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle size={15} className="text-green-600"/> Lista limpia — listo para importar.
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-dom-navy hover:bg-dom-navy-light/10 transition-colors"
      >
        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">Arrastra los archivos Excel aquí o haz clic para seleccionar</p>
        <p className="text-xs text-gray-400 mt-1">Admite .xlsm y .xlsx</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xlsm"
          className="hidden"
          onChange={e => Array.from(e.target.files ?? []).forEach(handleFile)}
        />
      </div>

      {/* Archivos cargados */}
      {files.map(f => (
        <div key={f.type} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            {f.type === 'matriz'
              ? <History size={20} className="text-purple-600 shrink-0" />
              : <FileSpreadsheet size={20} className="text-green-600 shrink-0" />
            }
            <div>
              <p className="text-sm font-semibold text-gray-900">{f.name}</p>
              {f.type === 'matriz' ? (
                <p className="text-xs text-gray-500">
                  Matriz DOM — <span className="font-semibold text-purple-700">{f.historico?.length ?? 0} históricos</span> + {f.permisos?.length ?? 0} permisos/recepciones 2024-2026
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  {f.type === 'previos' ? 'Informes Previos' : 'Certificados Generales'} — {f.records.length} registros detectados
                </p>
              )}
            </div>
          </div>

          {/* Preview especial para Matriz */}
          {f.type === 'matriz' && (
            <div className="space-y-3">
              {[
                { label: 'Histórico 1980-2023', items: f.historico ?? [], color: 'purple' },
                { label: 'Permisos / Recepciones 2024-2026', items: f.permisos ?? [], color: 'blue' },
              ].map(({ label, items, color }) => items.length > 0 && (
                <div key={label}>
                  <p className={`text-xs font-semibold text-${color}-700 mb-1`}>{label} — {items.length} registros</p>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Año','N°','Propietario','Materia','ROL','Profesional'].map(c => (
                            <th key={c} className="text-left px-3 py-2 font-medium text-gray-500 whitespace-nowrap">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.slice(0, 4).map((r, i) => (
                          <tr key={i} className="border-t border-gray-50">
                            <td className="px-3 py-1.5 text-gray-600">{r.ano}</td>
                            <td className="px-3 py-1.5 font-mono text-gray-700">{r.num_permiso || '—'}</td>
                            <td className="px-3 py-1.5 font-medium text-gray-900 max-w-[140px] truncate">{r.propietario}</td>
                            <td className="px-3 py-1.5 text-gray-500 max-w-[100px] truncate">{r.observaciones}</td>
                            <td className="px-3 py-1.5 font-mono text-gray-500">{r.rol_avaluo || '—'}</td>
                            <td className="px-3 py-1.5 text-gray-500 max-w-[120px] truncate">{r.profesional || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {items.length > 4 && (
                      <p className="text-xs text-gray-400 px-3 py-2 border-t border-gray-100">
                        ... y {items.length - 4} registros más
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-xs text-purple-800">
                <strong>Nota:</strong> El histórico se importa como expedientes de solo lectura. Cuando digitalices los documentos físicos, podrás adjuntarlos al expediente correspondiente buscando por ROL o N° de permiso.
              </div>
            </div>
          )}
          {/* Preview certificados (solo para no-matriz) */}
          {f.type !== 'matriz' && <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Solicitante</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Localidad</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {f.records.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-3 py-2 text-gray-600">{r.fecha}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 truncate max-w-[160px]">{r.solicitante}</td>
                    <td className="px-3 py-2 text-gray-600">{r.tipo}</td>
                    <td className="px-3 py-2 text-gray-500">{r.localidad ?? '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        r.estado === 'ENTREGADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>{r.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {f.records.length > 5 && (
              <p className="text-xs text-gray-400 px-3 py-2 border-t border-gray-100">
                ... y {f.records.length - 5} registros más
              </p>
            )}
          </div>}
        </div>
      ))}

      {/* Botón importar */}
      {totalRecords > 0 && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="flex items-center gap-2 px-6 py-3 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark disabled:opacity-50 transition-colors"
        >
          {importing
            ? <><Loader size={16} className="animate-spin"/> Importando...</>
            : <><CheckCircle size={16}/> Importar {totalRecords} registros a la app</>
          }
        </button>
      )}

      {/* Resultado */}
      {result && (
        <div className={`rounded-2xl p-4 text-sm flex items-start gap-3 ${
          result.err === 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'
        }`}>
          {result.err === 0
            ? <CheckCircle size={18} className="shrink-0 mt-0.5 text-green-600"/>
            : <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600"/>
          }
          <div>
            <p className="font-semibold">
              {result.expeds ? `${result.expeds} expedientes históricos importados` : `${result.ok} certificados importados`}
              {result.ok > 0 && result.expeds ? ` · ${result.ok} certificados` : ''}
              {result.err > 0 && ` · ${result.err} con error`}
            </p>
            <p className="text-xs mt-0.5">
              {result.expeds
                ? <>Ve a <strong>Expedientes</strong> para buscar por ROL o propietario.</>
                : <>Ve al módulo <strong>Certificados</strong> para ver los registros importados.</>
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
