import { useState, useEffect, useRef } from 'react'
import { FilePlus, Printer, Search, X, Check, ChevronDown, ChevronUp, Trash2, Eye, AlertTriangle, Edit2, UserCheck, SlidersHorizontal } from 'lucide-react'
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
import { diasHabilesTranscurridos, nivelSemaforoCert } from '../lib/diasHabiles'

function SemaforoCert({ fecha, estado }: { fecha: string; estado: EstadoCertificado }) {
  if (estado === 'ENTREGADO') return null
  const dias = diasHabilesTranscurridos(fecha)
  const nivel = nivelSemaforoCert(dias)
  const restantes = Math.max(0, 7 - dias)
  const cfg = {
    verde:    { dot: 'bg-green-500',  text: 'text-green-700',  label: `${restantes}d háb.` },
    amarillo: { dot: 'bg-yellow-400', text: 'text-yellow-700', label: `${restantes}d háb.` },
    rojo:     { dot: 'bg-red-500',    text: 'text-red-700',    label: dias > 7 ? `+${dias - 7}d vencido` : `${restantes}d háb.` },
  }[nivel]
  return (
    <span title={`${dias} días hábiles desde la solicitud`}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

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
  const [tab, setTab]   = useState<'certificados'|'previos'>('certificados')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editTarget, setEditTarget] = useState<Certificado | null>(null)
  const [selected, setSelected] = useState<Certificado | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Certificado | null>(null)
  const [showFilters, setShowFilters]   = useState(false)
  const [filterTipo,       setFilterTipo]       = useState<TipoCertificado | ''>('')
  const [filterEstado,     setFilterEstado]     = useState('')
  const [filterSolic,      setFilterSolic]      = useState('')
  const [filterRol,        setFilterRol]        = useState('')
  const [filterLocalidad,  setFilterLocalidad]  = useState('')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')

  const [_r, setR] = useState(0)
  const refresh = () => setR(n => n + 1)
  const [solicitanteConocido, setSolicitanteConocido] = useState(false)
  const rutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sin useMemo para que cada cambio de filtro/pestaña recalcule en fresco
  const todos: Certificado[] = db.getCertificados()

  /* ── separar por grupo ── */
  const todosTab = tab === 'previos'
    ? todos.filter(c => c.tipo === 'INFORMACIONES_PREVIAS')
    : todos.filter(c => c.tipo !== 'INFORMACIONES_PREVIAS')

  /* ── tipos disponibles en la pestaña actual ── */
  const TIPOS_TAB = tab === 'previos'
    ? []
    : TIPOS.filter(t => t !== 'INFORMACIONES_PREVIAS')

  /* ── lista filtrada y ordenada ── */
  const lista: Certificado[] = todosTab
    .filter(c => {
      if (filterTipo      && c.tipo    !== filterTipo)                                               return false
      if (filterEstado    && c.estado  !== filterEstado)                                             return false
      if (filterSolic     && !c.solicitante.toLowerCase().includes(filterSolic.toLowerCase()))       return false
      if (filterRol       && !(c.rol_avaluo  ?? '').toLowerCase().includes(filterRol.toLowerCase())) return false
      if (filterLocalidad && !(c.localidad   ?? '').toLowerCase().includes(filterLocalidad.toLowerCase())) return false
      if (filterFechaDesde && c.fecha < filterFechaDesde)                                            return false
      if (filterFechaHasta && c.fecha > filterFechaHasta)                                            return false
      return true
    })
    .sort((a, b) => {
      // Primero por fecha descendente (más reciente primero)
      if (b.fecha > a.fecha) return 1
      if (b.fecha < a.fecha) return -1
      // Mismo día: por número descendente
      return b.numero - a.numero
    })

  const activeFiltersCount = [filterEstado, filterSolic, filterRol, filterLocalidad, filterFechaDesde, filterFechaHasta].filter(Boolean).length

  const resetFilters = () => {
    setFilterTipo(''); setFilterEstado(''); setFilterSolic(''); setFilterRol('')
    setFilterLocalidad(''); setFilterFechaDesde(''); setFilterFechaHasta('')
  }

  const cambiarTab = (t: 'certificados'|'previos') => {
    setTab(t); resetFilters(); setShowFilters(false)
    if (t === 'previos') setForm(f => ({ ...f, tipo: 'INFORMACIONES_PREVIAS' }))
    else setForm(f => ({ ...f, tipo: 'NUMERO' }))
  }

  const set = (k: keyof typeof form, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleRutChange = (rut: string) => {
    set('rut_solicitante', rut)
    setSolicitanteConocido(false)
    if (rutTimeoutRef.current) clearTimeout(rutTimeoutRef.current)
    rutTimeoutRef.current = setTimeout(() => {
      const found = db.getSolicitanteByRut(rut)
      if (found) {
        setForm(f => ({
          ...f,
          solicitante: found.nombre,
          email:       found.email    ?? f.email,
          telefono:    found.telefono ?? f.telefono,
        }))
        setSolicitanteConocido(true)
      }
    }, 400)
  }

  const autoFillRol = (rol: string) => {
    set('rol_avaluo', rol)
    const exp = db.getExpedientes().find(e => e.rol_avaluo === rol.trim())
    if (exp) {
      set('direccion', exp.direccion)
      set('localidad', exp.direccion)
    }
  }

  const abrirEditar = (c: Certificado) => {
    const { id, numero, created_at, updated_at, sp_id, ...rest } = c
    setForm({ ...EMPTY_FORM, ...rest })
    setEditTarget(c)
    setSolicitanteConocido(false)
    setView('form')
  }

  const handleGuardar = () => {
    if (!form.solicitante.trim()) { addToast('Ingresa el nombre del solicitante.', 'error'); return }
    // Guardar/actualizar solicitante si hay RUT
    if (form.rut_solicitante?.trim()) {
      db.upsertSolicitante({
        rut:      form.rut_solicitante.trim(),
        nombre:   form.solicitante.trim(),
        email:    form.email    || undefined,
        telefono: form.telefono || undefined,
      })
    }
    if (editTarget) {
      db.updateCertificado(editTarget.id, form)
      addToast('Certificado actualizado.', 'success')
      setEditTarget(null)
    } else {
      db.createCertificado(form)
      addToast('Certificado registrado.', 'success')
    }
    refresh()
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
            <h1 className="text-xl font-bold text-gray-900">
              {editTarget ? `Editar certificado N° ${editTarget.numero}` : 'Nueva solicitud de certificado'}
            </h1>
            <p className="text-sm text-gray-500">
              {editTarget ? `${editTarget.solicitante}` : 'Completa los datos de la solicitud'}
            </p>
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Identificación del solicitante</h2>
              {solicitanteConocido && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  <UserCheck size={12}/> Solicitante conocido — datos precargados
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">R.U.T. <span className="text-gray-400">(busca automáticamente)</span></label>
                <input
                  value={form.rut_solicitante ?? ''}
                  onChange={e => handleRutChange(e.target.value)}
                  placeholder="12.345.678-9"
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy ${
                    solicitanteConocido ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                />
              </div>
              <Field label="Nombre completo *" value={form.solicitante} onChange={v => { set('solicitante',v); setSolicitanteConocido(false) }} placeholder="Nombre y apellidos"/>
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
              <Check size={15}/> {editTarget ? 'Guardar cambios' : 'Registrar solicitud'}
            </button>
            <button onClick={() => { setView('lista'); setEditTarget(null); setForm({ ...EMPTY_FORM }) }}
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

      {/* Encabezado */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Certificados DOM</h1>
        <button onClick={() => setView('form')}
          className="flex items-center gap-2 px-4 py-2 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark">
          <FilePlus size={15}/> Nueva solicitud
        </button>
      </div>

      {/* ── PESTAÑAS ── */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-2xl w-fit">
        {([
          { key: 'certificados', label: 'Certificados', count: todos.filter(c => c.tipo !== 'INFORMACIONES_PREVIAS').length },
          { key: 'previos',      label: 'Informes Previos', count: todos.filter(c => c.tipo === 'INFORMACIONES_PREVIAS').length },
        ] as const).map(({ key, label, count }) => (
          <button key={key} onClick={() => cambiarTab(key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === key ? 'bg-white shadow text-dom-navy' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label} <span className="ml-1 text-xs opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* ── BOTONES POR TIPO (solo en pestaña Certificados) ── */}
      {tab === 'certificados' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFilterTipo('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filterTipo === '' ? 'bg-dom-navy text-white border-dom-navy' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            Todos <span className="ml-1 opacity-60">({todosTab.length})</span>
          </button>
          {TIPOS_TAB.filter(t => todosTab.some(c => c.tipo === t)).map(t => (
            <button key={t} onClick={() => setFilterTipo(filterTipo === t ? '' : t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                filterTipo === t ? 'bg-dom-navy text-white border-dom-navy' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {TIPO_CERT_LABELS[t]} <span className="ml-1 opacity-60">({todosTab.filter(c => c.tipo === t).length})</span>
            </button>
          ))}
        </div>
      )}

      {/* ── PANEL FILTROS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex gap-3 flex-wrap items-center">
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${
              activeFiltersCount > 0 ? 'bg-dom-navy text-white border-dom-navy' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {showFilters ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-white text-dom-navy rounded-full px-1.5 text-[10px] font-bold">{activeFiltersCount}</span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-2 text-xs text-red-600 border border-red-100 rounded-xl hover:bg-red-50">
              <X size={12}/> Limpiar filtros
            </button>
          )}
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-dom-navy/30">
                <option value="">Todos</option>
                <option value="POR_ENTREGAR">Por Entregar</option>
                <option value="ENTREGADO">Entregado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Solicitante</label>
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={filterSolic} onChange={e => setFilterSolic(e.target.value)} placeholder="Nombre…"
                  className="w-full pl-6 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ROL de Avalúo</label>
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={filterRol} onChange={e => setFilterRol(e.target.value)} placeholder="Ej: 113-19"
                  className="w-full pl-6 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Localidad</label>
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={filterLocalidad} onChange={e => setFilterLocalidad(e.target.value)} placeholder="Localidad…"
                  className="w-full pl-6 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha desde</label>
              <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha hasta</label>
              <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30"/>
            </div>
          </div>
        )}
      </div>

      {/* Banner alertas — solo pestaña activa */}
      {(() => {
        const criticos = todosTab.filter(c =>
          c.estado === 'POR_ENTREGAR' &&
          nivelSemaforoCert(diasHabilesTranscurridos(c.fecha)) !== 'verde'
        )
        if (criticos.length === 0) return null
        const rojos     = criticos.filter(c => nivelSemaforoCert(diasHabilesTranscurridos(c.fecha)) === 'rojo')
        const amarillos = criticos.filter(c => nivelSemaforoCert(diasHabilesTranscurridos(c.fecha)) === 'amarillo')
        return (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <span className="font-semibold">Plazo próximo a vencer:</span>{' '}
              {rojos.length > 0 && <span className="font-bold text-red-700">{rojos.length} vencido{rojos.length !== 1 ? 's' : ''}</span>}
              {rojos.length > 0 && amarillos.length > 0 && ', '}
              {amarillos.length > 0 && <span className="text-yellow-700 font-semibold">{amarillos.length} próximo{amarillos.length !== 1 ? 's' : ''} a vencer</span>}
              {' '}— plazo máximo 7 días hábiles.
            </div>
          </div>
        )
      })()}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {['N°','FECHA','SOLICITANTE','TIPO','ANOTACIONES','ROL DE AVALÚO','LOCALIDAD','FECHA ENTREGA','ESTADO',''].map(col => (
                <th key={col} className="bg-yellow-300 text-gray-900 font-bold px-2 py-2 text-left border border-yellow-400 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-gray-400">
                No hay registros para mostrar.
              </td></tr>
            ) : lista.map((c, i) => (
              <tr key={c.id} className={i % 2 === 0 ? 'bg-white hover:bg-yellow-50' : 'bg-gray-50 hover:bg-yellow-50'}>
                <td className="px-2 py-1.5 border border-gray-200 font-mono font-semibold">{c.numero}</td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">{fmtDate(c.fecha)}</td>
                <td className="px-2 py-1.5 border border-gray-200 font-medium max-w-[160px] truncate">{c.solicitante}</td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">
                  {tab === 'previos'
                    ? <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px]">Informe Previo</span>
                    : (c.tipo === 'OTROS' ? c.otros_descripcion || 'Otros' : TIPO_CERT_LABELS[c.tipo])
                  }
                </td>
                <td className="px-2 py-1.5 border border-gray-200 max-w-[140px] truncate text-gray-500">{c.anotaciones || '—'}</td>
                <td className="px-2 py-1.5 border border-gray-200 font-mono">{c.rol_avaluo || '—'}</td>
                <td className="px-2 py-1.5 border border-gray-200 max-w-[120px] truncate">{c.localidad || '—'}</td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">{fmtDate(c.fecha_entrega)}</td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      c.estado === 'ENTREGADO'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.estado === 'ENTREGADO' ? <Check size={9}/> : null}
                      {c.estado === 'ENTREGADO' ? 'Entregado' : 'Por Entregar'}
                    </span>
                    <SemaforoCert fecha={c.fecha} estado={c.estado} />
                  </div>
                </td>
                <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap sticky right-0 bg-white">
                  <div className="flex gap-1">
                    <button onClick={() => abrirEditar(c)}
                      className="flex items-center gap-1 px-2 py-1 text-xs border border-blue-100 rounded hover:bg-blue-50 text-blue-600"
                      title="Editar">
                      <Edit2 size={11}/>
                    </button>
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
