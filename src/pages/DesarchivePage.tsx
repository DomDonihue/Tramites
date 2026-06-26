import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Save, CheckSquare, Square, History, AlertCircle } from 'lucide-react'
import { db } from '../lib/data'
import { useAuth } from '../lib/auth'
import { DocDesarchivo, DOC_DESARCHIVO_LABELS, Desarchivo } from '../types'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ui/Toast'

const DOCS: DocDesarchivo[] = ['plano', 'permiso_edificacion', 'recepcion', 'eet']

function today() {
  return new Date().toISOString().slice(0, 10)
}

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

  const [solicitante, setSolicitante] = useState('')
  const [rut, setRut] = useState('')
  const [fecha, setFecha] = useState(today())
  const [docs, setDocs] = useState<Set<DocDesarchivo>>(new Set())
  const [saved, setSaved] = useState<Desarchivo | null>(null)

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

  const toggleDoc = (doc: DocDesarchivo) => {
    setDocs(prev => {
      const next = new Set(prev)
      next.has(doc) ? next.delete(doc) : next.add(doc)
      return next
    })
  }

  const handleGuardar = () => {
    if (!solicitante.trim()) { addToast('Ingresa el nombre del solicitante.', 'error'); return }
    if (docs.size === 0) { addToast('Selecciona al menos un documento.', 'error'); return }

    const nuevo = db.createDesarchivo({
      expediente_id: expediente.id,
      solicitante: solicitante.trim(),
      rut_solicitante: rut.trim() || undefined,
      documentos: Array.from(docs),
      fecha,
      funcionario: user?.nombre,
    })
    setSaved(nuevo)
    addToast('Desarchivo registrado correctamente.', 'success')
  }

  const handleImprimir = () => window.print()

  const docsArray = Array.from(docs)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header — hidden on print */}
      <div className="no-print mb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Desarchivo</h1>
          <p className="text-sm text-gray-500">Registro de retiro de documentos del archivo</p>
        </div>
      </div>

      {/* Card — printable */}
      <div id="desarchivo-print" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Print header — only visible when printing */}
        <div className="print-only p-6 border-b border-gray-200 text-center">
          <div className="font-bold text-lg text-gray-900">Municipalidad de Doñihue</div>
          <div className="text-sm text-gray-600">Dirección de Obras Municipales</div>
          <div className="font-semibold text-base mt-1">COMPROBANTE DE DESARCHIVO</div>
        </div>

        {/* Datos del predio */}
        <div className="p-5 border-b border-gray-100">
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

        {/* Formulario de solicitud — oculto después de guardar al imprimir */}
        {!saved ? (
          <div className="p-5 border-b border-gray-100 no-print">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Datos del solicitante</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo <span className="text-red-500">*</span></label>
                <input
                  value={solicitante}
                  onChange={e => setSolicitante(e.target.value)}
                  placeholder="Nombre del solicitante"
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

            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Documentos a retirar <span className="text-red-500">*</span></h2>
            <div className="grid grid-cols-2 gap-2">
              {DOCS.map(doc => {
                const checked = docs.has(doc)
                return (
                  <button
                    key={doc}
                    onClick={() => toggleDoc(doc)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                      checked
                        ? 'bg-dom-navy/5 border-dom-navy text-dom-navy font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {checked ? <CheckSquare size={16} className="text-dom-navy shrink-0" /> : <Square size={16} className="text-gray-400 shrink-0" />}
                    {DOC_DESARCHIVO_LABELS[doc]}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleGuardar}
                className="flex items-center gap-2 px-5 py-2 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark transition-colors"
              >
                <Save size={15} /> Registrar desarchivo
              </button>
            </div>
          </div>
        ) : (
          /* Comprobante — visible en pantalla y al imprimir */
          <div className="p-5 border-b border-gray-100">
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

            <div className="border-t border-dashed border-gray-300 pt-4 mt-4 grid grid-cols-2 gap-8 print-only">
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1 mt-8 text-xs text-gray-500">Firma del solicitante</div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1 mt-8 text-xs text-gray-500">Funcionario DOM</div>
              </div>
            </div>

            <div className="no-print flex gap-2 mt-4">
              <button
                onClick={handleImprimir}
                className="flex items-center gap-2 px-5 py-2 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark transition-colors"
              >
                <Printer size={15} /> Imprimir comprobante
              </button>
              <button
                onClick={() => { setSaved(null); setDocs(new Set()); setSolicitante(''); setRut(''); setFecha(today()) }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
              >
                Nuevo desarchivo
              </button>
            </div>
          </div>
        )}

        {/* Historial de desarchivos */}
        {historial.length > 0 && (
          <div className="p-5 no-print">
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
                    {h.funcionario && <div className="text-gray-400">{h.funcionario}</div>}
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
