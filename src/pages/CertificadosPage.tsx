import { useState, useMemo } from 'react'
import { FilePlus, Printer, Search, X, Check, ChevronDown, ChevronUp, Trash2, Eye } from 'lucide-react'
import { db } from '../lib/data'
import { useAuth } from '../lib/auth'
import {
  Certificado, TipoCertificado, EstadoCertificado,
  TIPO_CERT_LABELS,
} from '../types'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PrintCertificado } from '../components/certificados/PrintCertificado'

const TIPOS: TipoCertificado[] = [
  'NUMERO','RURALIDAD','URBANIZACION','AFECTACION_UTILIDAD_PUBLICA',
  'INFORMACIONES_PREVIAS','VIVIENDA_SOCIAL','LOCALIZACION','ZONIFICACION','OTROS',
]

const EMPTY_FORM: Omit<Certificado,'id'|'numero'|'created_at'|'updated_at'> = {
  fecha: new Date().toISOString().slice(0,10),
  solicitante: '', rut_solicitante: '', email: '', telefono: '',
  tipo: 'NUMERO', otros_descripcion: '', anotaciones: '',
  rol_avaluo: '', direccion: '', numero_domicilio: '', localidad: '',
  manzana: '', lote: '', urbano_rural: 'URBANO', numero_asignado: '',
  fecha_entrega: '', estado: 'POR_ENTREGAR',
  afectacion_vialidad: false, afectacion_parque: false,
  afectacion_ensanche: false, afectacion_apertura: false, vias_afectadas: '',
  total_derechos: undefined, giro_municipal: '', fecha_pago: '',
}

function fmtDate(s?: string) {
  if (!s) return '—'
  const [y,m,d] = s.slice(0,10).split('-')
  return `${d}/${m}/${y}`
}

export function CertificadosPage() {
  const { can } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [view, setView] = useState<'lista'|'form'|'print'>('lista')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [selected, setSelected] = useState<Certificado | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Certificado | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [_r, setR] = useState(0)
  const refresh = () => setR(n => n+1)

  const todos = useMemo(() => db.getCertificados(), [_r])

  const lista = useMemo(() => {
    let data = todos
    if (searchQ) {
      const q = searchQ.toLowerCase()
      data = data.filter(c =>
        c.solicitante.toLowerCase().includes(q) ||
        (c.rol_avaluo ?? '').toLowerCase().includes(q) ||
        (c.localidad ?? '').toLowerCase().includes(q)
      )
    }
    if (filterTipo) data = data.filter(c => c.tipo === filterTipo)
    if (filterEstado) data = data.filter(c => c.estado === filterEstado)
    return data
  }, [todos, searchQ, filterTipo, filterEstado])

  const set = (k: keyof typeof form, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }))

  const autoFillRol = (rol: string) => {
    set('rol_avaluo', rol)
    const exp = db.getExpedientes().find(e => e.rol_avaluo === rol.trim())
    if (exp) {
      set('direccion', exp.direccion)
      set('localidad', exp.direccion)
    }
  }

  const handleGuardar = () => {
    if (!form.solicitante.trim()) { addToast('Ingresa el nombre del solicitante.', 'error'); return }
    const cert = db.createCertificado(form)
    addToast('Certificado registrado.', 'success')
    refresh()
    setSelected(cert)
    setView('lista')
    setForm({ ...EMPTY_FORM })
  }

  const marcarEntregado = (c: Certificado) => {
    db.updateCertificado(c.id, {
      estado: 'ENTREGADO',
      fecha_entrega: c.fecha_entrega || new Date().toISOString().slice(0,10),
    })
    refresh()
    addToast('Marcado como entregado.', 'success')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    db.deleteCertificado(deleteTarget.id)
    setDeleteTarget(null)
    refresh()
    addToast('Certificado eliminado.', 'success')
  }

  const abrirImprimir = (c: Certificado) => {
    setSelected(c)
    setView('print')
  }

  // ── PRINT VIEW ────────────────────────────────────────────────
  if (view === 'print' && selected) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="no-print mb-4 flex items-center gap-3">
          <button onClick={() => setView('lista')} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
            <X size={14}/> Volver
          </button>
          <button
            onClick={() => window.print()}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-dom-navy text-white text-sm rounded-xl hover:bg-dom-navy-dark"
          >
            <Printer size={15}/> Imprimir certificado
          </button>
        </div>
        <PrintCertificado cert={selected} />
      </div>
    )
  }

  // ── FORM VIEW ────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="mb-5 flex items-center gap-3">
          <button onClick={() => setView('lista')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18}/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nueva solicitud de certificado</h1>
            <p className="text-sm text-gray-500">Completa los datos de la solicitud</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Tipo */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Tipo de certificado</h2>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(t => (
                <button key={t} onClick={() => set('tipo', t)}
                  className={`px-3 py-2 rounded-xl border text-xs text-left transition-colors ${
                    form.tipo === t
                      ? 'bg-dom-navy text-white border-dom-navy font-semibold'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}>
                  {TIPO_CERT_LABELS[t]}
                </button>
              ))}
            </div>
            {form.tipo === 'OTROS' && (
              <input value={form.otros_descripcion} onChange={e => set('otros_descripcion', e.target.value)}
                placeholder="Especificar tipo…"
                className="mt-3 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
            )}
            <div className="flex gap-4 mt-3">
              {(['URBANO','RURAL'] as const).map(v => (
                <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={form.urbano_rural===v} onChange={() => set('urbano_rural',v)}/>
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Datos solicitante */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Identificación del solicitante</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre completo *" value={form.solicitante} onChange={v => set('solicitante',v)} placeholder="Nombre y apellidos"/>
              <Field label="R.U.T." value={form.rut_solicitante??''} onChange={v => set('rut_solicitante',v)} placeholder="12.345.678-9"/>
              <Field label="E-mail" value={form.email??''} onChange={v => set('email',v)} placeholder="correo@ejemplo.cl"/>
              <Field label="Teléfono" value={form.telefono??''} onChange={v => set('telefono',v)} placeholder="+56 9 1234 5678"/>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de solicitud</label>
                <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
              </div>
            </div>
          </div>

          {/* Datos propiedad */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Dirección de la propiedad</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ROL SII</label>
                <div className="relative">
                  <input value={form.rol_avaluo??''} onChange={e => autoFillRol(e.target.value)}
                    placeholder="113-19"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
                  {form.rol_avaluo && db.getExpedientes().some(e => e.rol_avaluo === form.rol_avaluo) && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 text-xs font-medium">✓ encontrado</span>
                  )}
                </div>
              </div>
              <Field label="Calle o camino" value={form.direccion??''} onChange={v => set('direccion',v)} placeholder="Nombre de la calle"/>
              <Field label="Número" value={form.numero_domicilio??''} onChange={v => set('numero_domicilio',v)} placeholder="123"/>
              <Field label="Localidad / Loteo" value={form.localidad??''} onChange={v => set('localidad',v)} placeholder="Localidad"/>
              <Field label="Manzana" value={form.manzana??''} onChange={v => set('manzana',v)} placeholder=""/>
              <Field label="Lote N°" value={form.lote??''} onChange={v => set('lote',v)} placeholder=""/>
            </div>
          </div>

          {/* Número asignado (solo tipo NUMERO) */}
          {form.tipo === 'NUMERO' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Número asignado</h2>
              <Field label="N° asignado al predio" value={form.numero_asignado??''} onChange={v => set('numero_asignado',v)} placeholder="Ej: 452"/>
            </div>
          )}

          {/* Afectación (tipo AFECTACION) */}
          {form.tipo === 'AFECTACION_UTILIDAD_PUBLICA' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Afectación a utilidad pública</h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {([
                  ['afectacion_vialidad','Vialidad'],
                  ['afectacion_parque','Parque'],
                  ['afectacion_ensanche','Ensanche'],
                  ['afectacion_apertura','Apertura'],
                ] as const).map(([k,lbl]) => (
                  <label key={k} className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)}/>
                    {lbl}
                  </label>
                ))}
              </div>
              <Field label="Vías afectadas" value={form.vias_afectadas??''} onChange={v => set('vias_afectadas',v)} placeholder="Nombre de las vías"/>
            </div>
          )}

          {/* Anotaciones + pago */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Anotaciones y pago</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Anotaciones</label>
                <textarea value={form.anotaciones??''} onChange={e => set('anotaciones',e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 resize-none"/>
              </div>
              <Field label="Total derechos ($)" value={form.total_derechos?.toString()??''} onChange={v => set('total_derechos', v ? Number(v) : undefined)} placeholder="0" type="number"/>
              <Field label="Giro ingreso municipal N°" value={form.giro_municipal??''} onChange={v => set('giro_municipal',v)} placeholder="N° giro"/>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha entrega estimada</label>
                <input type="date" value={form.fecha_entrega??''} onChange={e => set('fecha_entrega', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pb-6">
            <button onClick={handleGuardar}
              className="flex items-center gap-2 px-6 py-2.5 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark">
              <Check size={15}/> Registrar solicitud
            </button>
            <button onClick={() => setView('lista')}
              className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── LISTA VIEW ───────────────────────────────────────────────
  return (
    <div className="p-6 max-w-full mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog open={!!deleteTarget} title="Eliminar certificado"
        message={`¿Eliminar la solicitud de "${deleteTarget?.solicitante}"?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}/>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Certificados</h1>
          <p className="text-sm text-gray-500">Solicitudes y emisión de certificados DOM</p>
        </div>
        <button onClick={() => setView('form')}
          className="flex items-center gap-2 px-4 py-2 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark">
          <FilePlus size={15}/> Nueva solicitud
        </button>
      </div>

      {/* Barra búsqueda */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 relative min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar por solicitante, rol o localidad…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
            Filtros {showFilters ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          </button>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none">
                <option value="">Todos</option>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_CERT_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none">
                <option value="">Todos</option>
                <option value="POR_ENTREGAR">Por Entregar</option>
                <option value="ENTREGADO">Entregado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {['N°','FECHA','SOLICITANTE','TIPO CERTIFICADO','ANOTACIONES','ROL DE AVALÚO','LOCALIDAD','FECHA ENTREGA','ENTREGADO',''].map(col => (
                <th key={col} className="bg-yellow-300 text-gray-900 font-bold px-2 py-2 text-left border border-yellow-400 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-gray-400">
                No hay certificados registrados.
              </td></tr>
            ) : lista.map((c, i) => (
              <tr key={c.id} className={i % 2 === 0 ? 'bg-white hover:bg-yellow-50' : 'bg-gray-50 hover:bg-yellow-50'}>
                <td className="px-2 py-1.5 border border-gray-200 font-mono font-semibold">{c.numero}</td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">{fmtDate(c.fecha)}</td>
                <td className="px-2 py-1.5 border border-gray-200 font-medium max-w-[160px] truncate">{c.solicitante}</td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">
                  {c.tipo === 'OTROS' ? c.otros_descripcion || 'Otros' : TIPO_CERT_LABELS[c.tipo]}
                </td>
                <td className="px-2 py-1.5 border border-gray-200 max-w-[140px] truncate text-gray-500">{c.anotaciones || '—'}</td>
                <td className="px-2 py-1.5 border border-gray-200 font-mono">{c.rol_avaluo || '—'}</td>
                <td className="px-2 py-1.5 border border-gray-200 max-w-[120px] truncate">{c.localidad || '—'}</td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">{fmtDate(c.fecha_entrega)}</td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    c.estado === 'ENTREGADO'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.estado === 'ENTREGADO' ? <Check size={9}/> : null}
                    {c.estado === 'ENTREGADO' ? 'Entregado' : 'Por Entregar'}
                  </span>
                </td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap sticky right-0 bg-white">
                  <div className="flex gap-1">
                    <button onClick={() => abrirImprimir(c)}
                      className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-100 text-gray-600"
                      title="Ver e imprimir">
                      <Eye size={11}/> Ver
                    </button>
                    {c.estado === 'POR_ENTREGAR' && (
                      <button onClick={() => marcarEntregado(c)}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-green-200 rounded hover:bg-green-50 text-green-700"
                        title="Marcar como entregado">
                        <Check size={11}/>
                      </button>
                    )}
                    {can('delete') && (
                      <button onClick={() => setDeleteTarget(c)}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-red-100 rounded hover:bg-red-50 text-red-600">
                        <Trash2 size={11}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">{lista.length} registro{lista.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type='text' }: {
  label: string; value: string; onChange: (v:string)=>void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy"/>
    </div>
  )
}
