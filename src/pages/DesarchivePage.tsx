import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Printer, Save, CheckSquare, Square, History,
  AlertCircle, FileText, MapPin, ScrollText, Zap, Pencil, Check, X
} from 'lucide-react'
import { db } from '../lib/data'
import { useAuth } from '../lib/auth'
import { DocDesarchivo, DOC_DESARCHIVO_LABELS, Desarchivo } from '../types'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ui/Toast'

const DOCS: DocDesarchivo[] = ['plano', 'permiso_edificacion', 'recepcion', 'eet']

const DOC_ICONS: Record<DocDesarchivo, React.ReactNode> = {
  plano:               <MapPin size={22} />,
  permiso_edificacion: <ScrollText size={22} />,
  recepcion:           <FileText size={22} />,
  eet:                 <Zap size={22} />,
}

const DOC_DESC: Record<DocDesarchivo, string> = {
  plano:               'Planos arquitectónicos y estructurales',
  permiso_edificacion: 'Resolución de permiso aprobado',
  recepcion:           'Certificado de recepción final',
  eet:                 'Especificaciones técnicas',
}

function today() { return new Date().toISOString().slice(0, 10) }
function formatDate(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

export function DesarchivePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const expediente = id ? db.getExpediente(id) : undefined

  // Inventario editable
  const [editandoInventario, setEditandoInventario] = useState(false)
  const [inventarioTemp, setInventarioTemp] = useState<Set<DocDesarchivo>>(new Set())

  // Formulario de retiro
  const [solicitante, setSolicitante] = useState('')
  const [rut, setRut] = useState('')
  const [fecha, setFecha] = useState(today())
  const [docsRetiro, setDocsRetiro] = useState<Set<DocDesarchivo>>(new Set())
  const [saved, setSaved] = useState<Desarchivo | null>(null)

  const [_refresh, setRefresh] = useState(0)
  const forceRefresh = () => setRefresh(n => n + 1)

  const historial = id ? db.getDesarchivos(id) : []

  if (!expediente) {
    return (
      <div className="p-6 text-center">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Expediente no encontrado.</p>
        <button onClick={() => navigate('/buscar')} className="mt-4 text-dom-navy text-sm underline">
          Volver a buscar
        </button>
      </div>
    )
  }

  const enArchivo = new Set<DocDesarchivo>(expediente.docs_en_archivo ?? [])

  const iniciarEdicionInventario = () => {
    setInventarioTemp(new Set(enArchivo))
    setEditandoInventario(true)
  }

  const guardarInventario = () => {
    db.setDocsEnArchivo(expediente.id, Array.from(inventarioTemp))
    // Quitar del retiro docs que ya no están en archivo
    setDocsRetiro(prev => new Set([...prev].filter(d => inventarioTemp.has(d))))
    setEditandoInventario(false)
    forceRefresh()
    addToast('Inventario actualizado.', 'success')
  }

  const toggleInventario = (doc: DocDesarchivo) => {
    setInventarioTemp(prev => {
      const next = new Set(prev)
      next.has(doc) ? next.delete(doc) : next.add(doc)
      return next
    })
  }

  const toggleRetiro = (doc: DocDesarchivo) => {
    if (!enArchivo.has(doc)) return
    setDocsRetiro(prev => {
      const next = new Set(prev)
      next.has(doc) ? next.delete(doc) : next.add(doc)
      return next
    })
  }

  const handleGuardar = () => {
    if (!solicitante.trim()) { addToast('Ingresa el nombre del solicitante.', 'error'); return }
    if (docsRetiro.size === 0) { addToast('Selecciona al menos un documento a retirar.', 'error'); return }
    const nuevo = db.createDesarchivo({
      expediente_id: expediente.id,
      solicitante: solicitante.trim(),
      rut_solicitante: rut.trim() || undefined,
      documentos: Array.from(docsRetiro),
      fecha,
      funcionario: user?.nombre,
    })
    setSaved(nuevo)
    addToast('Desarchivo registrado correctamente.', 'success')
  }

  const resetForm = () => {
    setSaved(null); setDocsRetiro(new Set()); setSolicitante(''); setRut(''); setFecha(today())
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="no-print mb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Desarchivo</h1>
          <p className="text-sm text-gray-500">Registro de retiro de documentos del archivo</p>
        </div>
      </div>

      <div id="desarchivo-print" className="space-y-4">

        {/* Print header */}
        <div className="print-only bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <div className="font-bold text-lg text-gray-900">Municipalidad de Doñihue</div>
          <div className="text-sm text-gray-600">Dirección de Obras Municipales</div>
          <div className="font-semibold text-base mt-1">COMPROBANTE DE DESARCHIVO</div>
        </div>

        {/* Datos del predio */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Datos del predio</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Rol de avalúo</span>
              <div className="font-bold text-gray-900 font-mono text-base">{expediente.rol_avaluo}</div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">N° Permiso</span>
              <div className="font-semibold text-gray-900">{expediente.num_permiso ?? '—'}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 text-xs">Propietario</span>
              <div className="font-semibold text-gray-900">{expediente.propietario}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 text-xs">Dirección</span>
              <div className="text-gray-800">{expediente.direccion}</div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Categoría</span>
              <div className="text-gray-800">{expediente.categoria.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Superficie</span>
              <div className="text-gray-800">{expediente.superficie_m2 ? `${expediente.superficie_m2} m²` : '—'}</div>
            </div>
          </div>
        </div>

        {/* Inventario del archivo */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 no-print">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Inventario del archivo físico</h2>
              <p className="text-xs text-gray-400 mt-0.5">Marca qué documentos están disponibles en el archivo</p>
            </div>
            {!editandoInventario ? (
              <button
                onClick={iniciarEdicionInventario}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                <Pencil size={12} /> Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={guardarInventario}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Check size={12} /> Guardar
                </button>
                <button
                  onClick={() => setEditandoInventario(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
                >
                  <X size={12} /> Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DOCS.map(doc => {
              const presente = editandoInventario ? inventarioTemp.has(doc) : enArchivo.has(doc)
              return (
                <div
                  key={doc}
                  onClick={() => editandoInventario && toggleInventario(doc)}
                  className={`relative rounded-xl border-2 p-4 transition-all ${
                    editandoInventario ? 'cursor-pointer' : ''
                  } ${
                    presente
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Estado badge */}
                  <div className={`absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    presente
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {presente ? <><Check size={9} /> En archivo</> : <>No registrado</>}
                  </div>

                  {/* Ícono */}
                  <div className={`mb-2 ${presente ? 'text-green-600' : 'text-gray-300'}`}>
                    {DOC_ICONS[doc]}
                  </div>

                  <div className={`text-sm font-semibold ${presente ? 'text-gray-900' : 'text-gray-400'}`}>
                    {DOC_DESARCHIVO_LABELS[doc]}
                  </div>
                  <div className={`text-xs mt-0.5 ${presente ? 'text-gray-500' : 'text-gray-400'}`}>
                    {DOC_DESC[doc]}
                  </div>

                  {/* Checkbox al editar */}
                  {editandoInventario && (
                    <div className="absolute bottom-3 right-3">
                      {presente
                        ? <CheckSquare size={16} className="text-green-600" />
                        : <Square size={16} className="text-gray-300" />
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {enArchivo.size === 0 && !editandoInventario && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
              No hay documentos registrados en el archivo para este rol. Haz clic en "Editar" para indicar qué documentos están disponibles.
            </p>
          )}
        </div>

        {/* Formulario de retiro / Comprobante */}
        {!saved ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 no-print">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Registrar retiro</h2>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombre del solicitante <span className="text-red-500">*</span>
                </label>
                <input
                  value={solicitante}
                  onChange={e => setSolicitante(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">RUT (opcional)</label>
                <input
                  value={rut}
                  onChange={e => setRut(e.target.value)}
                  placeholder="12.345.678-9"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de retiro</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy"
                />
              </div>
            </div>

            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Documentos a retirar <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {DOCS.map(doc => {
                const disponible = enArchivo.has(doc)
                const seleccionado = docsRetiro.has(doc)
                return (
                  <button
                    key={doc}
                    onClick={() => toggleRetiro(doc)}
                    disabled={!disponible}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                      !disponible
                        ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                        : seleccionado
                          ? 'bg-dom-navy/5 border-dom-navy text-dom-navy font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {seleccionado
                      ? <CheckSquare size={15} className="text-dom-navy shrink-0" />
                      : <Square size={15} className={disponible ? 'text-gray-400 shrink-0' : 'text-gray-200 shrink-0'} />
                    }
                    <span>{DOC_DESARCHIVO_LABELS[doc]}</span>
                    {!disponible && <span className="ml-auto text-[10px] text-gray-300">No disponible</span>}
                  </button>
                )
              })}
            </div>

            {enArchivo.size === 0 && (
              <p className="text-xs text-amber-600 mt-3">
                Primero registra qué documentos están en el archivo físico (sección de arriba).
              </p>
            )}

            <button
              onClick={handleGuardar}
              disabled={enArchivo.size === 0}
              className="mt-5 flex items-center gap-2 px-5 py-2 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={15} /> Registrar desarchivo
            </button>
          </div>
        ) : (
          /* Comprobante imprimible */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Comprobante de retiro</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
              <div>
                <span className="text-gray-500 text-xs">Solicitante</span>
                <div className="font-semibold text-gray-900">{saved.solicitante}</div>
              </div>
              {saved.rut_solicitante && (
                <div>
                  <span className="text-gray-500 text-xs">RUT</span>
                  <div className="text-gray-800">{saved.rut_solicitante}</div>
                </div>
              )}
              <div>
                <span className="text-gray-500 text-xs">Fecha de retiro</span>
                <div className="text-gray-800">{formatDate(saved.fecha)}</div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Funcionario</span>
                <div className="text-gray-800">{saved.funcionario ?? '—'}</div>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-gray-500 text-xs block mb-2">Documentos retirados</span>
              <div className="flex flex-wrap gap-2">
                {saved.documentos.map(doc => (
                  <span key={doc} className="inline-flex items-center gap-1.5 px-3 py-1 bg-dom-navy/10 text-dom-navy text-xs font-medium rounded-lg border border-dom-navy/20">
                    <CheckSquare size={12} />
                    {DOC_DESARCHIVO_LABELS[doc]}
                  </span>
                ))}
              </div>
            </div>

            {/* Firmas — solo al imprimir */}
            <div className="border-t border-dashed border-gray-300 pt-4 mt-4 grid grid-cols-2 gap-8 print-only">
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1 mt-10 text-xs text-gray-500">Firma del solicitante</div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1 mt-10 text-xs text-gray-500">Funcionario DOM</div>
              </div>
            </div>

            <div className="no-print flex gap-2 mt-4">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark transition-colors"
              >
                <Printer size={15} /> Imprimir comprobante
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
              >
                Nuevo retiro
              </button>
            </div>
          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 no-print">
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Historial de retiros</h2>
            </div>
            <div className="space-y-2">
              {historial.map(h => (
                <div key={h.id} className="flex items-start justify-between text-xs bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                  <div>
                    <span className="font-medium text-gray-800">{h.solicitante}</span>
                    {h.rut_solicitante && <span className="text-gray-500 ml-1">({h.rut_solicitante})</span>}
                    <div className="text-gray-500 mt-0.5">
                      {h.documentos.map(d => DOC_DESARCHIVO_LABELS[d]).join(' · ')}
                    </div>
                  </div>
                  <div className="text-gray-400 text-right shrink-0 ml-4">
                    <div>{formatDate(h.fecha)}</div>
                    {h.funcionario && <div>{h.funcionario}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
