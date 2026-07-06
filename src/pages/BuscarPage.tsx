import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, FilePlus, Edit2, Trash2, FileText, ChevronDown, ChevronUp, X, ChevronRight, Archive, AlertTriangle } from 'lucide-react'
import { db } from '../lib/data'
import { useAuth } from '../lib/auth'
import { Expediente, Categoria, Estado, Etapa, CATEGORIA_LABELS, ESTADO_CONFIG, ETAPA_LABELS } from '../types'
import { generarRutaRepositorio } from '../lib/repositorio'
import { EstadoBadge, CategoriaBadge } from '../components/ui/Badges'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ui/Toast'
import { diasHabilesTranscurridos, nivelSemaforo } from '../lib/diasHabiles'

function Semaforo({ fecha, estado }: { fecha?: string; estado: string }) {
  if (estado !== 'en_revision' || !fecha) return null
  const dias = diasHabilesTranscurridos(fecha)
  const nivel = nivelSemaforo(dias)
  const restantes = Math.max(0, 30 - dias)
  const cfg = {
    verde:    { dot: 'bg-green-500',  text: 'text-green-700',  label: `${restantes}d háb.` },
    amarillo: { dot: 'bg-yellow-400', text: 'text-yellow-700', label: `${restantes}d háb.` },
    rojo:     { dot: 'bg-red-500',    text: 'text-red-700',    label: dias > 30 ? `+${dias - 30}d vencido` : `${restantes}d háb.` },
  }[nivel]
  return (
    <span title={`${dias} días hábiles transcurridos`}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const TIPO_BUSQUEDA = [
  { value: 'propietario', label: 'Propietario' },
  { value: 'rol_avaluo', label: 'Rol de avalúo' },
  { value: 'direccion', label: 'Dirección' },
  { value: 'num_permiso', label: 'N° Permiso' },
]

export function BuscarPage() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const { toasts, addToast, removeToast } = useToast()

  const [tipoBusqueda, setTipoBusqueda] = useState('propietario')
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('')
  const [filterEtapa, setFilterEtapa] = useState<string>('')
  const [filterEstado, setFilterEstado] = useState<string>('')
  const [filterAno, setFilterAno] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<Expediente | null>(null)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())

  const results = useMemo(() => {
    if (!searched) return []
    let data = db.getExpedientes()
    if (query) {
      const q = query.toLowerCase()
      data = data.filter(e => {
        const val = e[tipoBusqueda as keyof Expediente]
        return val ? String(val).toLowerCase().includes(q) : false
      })
    }
    if (filterCat) data = data.filter(e => e.categoria === filterCat)
    if (filterEtapa) data = data.filter(e => e.etapa === filterEtapa)
    if (filterEstado) data = data.filter(e => e.estado === filterEstado)
    if (filterAno) data = data.filter(e => String(e.ano) === filterAno)
    return data
  }, [searched, query, tipoBusqueda, filterCat, filterEtapa, filterEstado, filterAno])

  const doSearch = () => setSearched(true)
  const clearSearch = () => { setQuery(''); setSearched(false) }

  const handleDelete = () => {
    if (!deleteTarget) return
    db.deleteExpediente(deleteTarget.id)
    setDeleteTarget(null)
    addToast('Expediente eliminado correctamente.', 'success')
    setSearched(false)
    setTimeout(() => setSearched(true), 50)
  }

  const toggleDocs = (id: string) => {
    setExpandedDocs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const fmt = (n?: number) => n ? `$${n.toLocaleString('es-CL')}` : '—'
  const fmtM2 = (n?: number) => n && n > 0 ? `${n.toLocaleString('es-CL')} m²` : '—'

  return (
    <div className="p-6 max-w-full mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar expediente"
        message={`¿Estás seguro de eliminar el expediente de "${deleteTarget?.propietario}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Buscar expedientes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Consulta permisos, recepciones y certificados de la comuna</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex gap-3 flex-wrap">
          <select
            value={tipoBusqueda}
            onChange={e => setTipoBusqueda(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy"
          >
            {TIPO_BUSQUEDA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <div className="flex-1 relative min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder={`Buscar por ${TIPO_BUSQUEDA.find(t => t.value === tipoBusqueda)?.label.toLowerCase()}…`}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy"
            />
            {query && (
              <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          <button onClick={doSearch} className="px-5 py-2 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark transition-colors">
            Buscar
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
          >
            <SlidersHorizontal size={15} />
            Filtros
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-dom-navy/30">
                <option value="">Todas</option>
                {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Etapa</label>
              <select value={filterEtapa} onChange={e => setFilterEtapa(e.target.value)} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-dom-navy/30">
                <option value="">Todas</option>
                {Object.entries(ETAPA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-dom-navy/30">
                <option value="">Todos</option>
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
              <select value={filterAno} onChange={e => setFilterAno(e.target.value)} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-dom-navy/30">
                <option value="">Todos</option>
                {['2026','2025','2024','2023','2022'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Banner alertas en revisión */}
      {(() => {
        const criticos = db.getExpedientes().filter(e =>
          e.estado === 'en_revision' && nivelSemaforo(diasHabilesTranscurridos(e.fecha ?? e.created_at)) !== 'verde'
        )
        if (criticos.length === 0) return null
        const rojos = criticos.filter(e => nivelSemaforo(diasHabilesTranscurridos(e.fecha ?? e.created_at)) === 'rojo')
        const amarillos = criticos.filter(e => nivelSemaforo(diasHabilesTranscurridos(e.fecha ?? e.created_at)) === 'amarillo')
        return (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <span className="font-semibold">Expedientes con plazo próximo a vencer:</span>{' '}
              {rojos.length > 0 && <span className="font-bold text-red-700">{rojos.length} vencido{rojos.length !== 1 ? 's' : ''} o crítico{rojos.length !== 1 ? 's' : ''}</span>}
              {rojos.length > 0 && amarillos.length > 0 && ', '}
              {amarillos.length > 0 && <span className="text-yellow-700 font-semibold">{amarillos.length} próximo{amarillos.length !== 1 ? 's' : ''} a vencer</span>}
              {' '}— plazo máximo 30 días hábiles en estado "En revisión".
            </div>
          </div>
        )
      })()}

      {/* Results */}
      {searched && (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            {results.length === 0 ? 'Sin resultados' : `${results.length} expediente${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`}
          </p>

          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm mb-4">No se encontraron expedientes con esos datos.</p>
              <button onClick={() => navigate('/nuevo')} className="inline-flex items-center gap-2 px-4 py-2 bg-dom-navy text-white text-sm rounded-xl hover:bg-dom-navy-dark">
                <FilePlus size={15} /> Registrar nuevo expediente
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    {['FECHA','N°','PROPIETARIO','TIPO DE INGRESO','TIPO DE OBRA','ROL','PROFESIONAL','SUP','CAJA','TOTAL $','DIRECCIÓN','ESTADO'].map(col => (
                      <th key={col} className="bg-yellow-300 text-gray-900 font-bold px-2 py-2 text-left border border-yellow-400 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                    <th className="bg-yellow-300 text-gray-900 font-bold px-2 py-2 text-left border border-yellow-400 sticky right-0 z-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((exp, i) => (
                    <tr key={exp.id} className={i % 2 === 0 ? 'bg-white hover:bg-yellow-50' : 'bg-gray-50 hover:bg-yellow-50'}>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">{exp.fecha ?? exp.ano}</td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap font-mono">{exp.numero}</td>
                      <td className="px-2 py-1.5 border border-gray-200 font-medium max-w-[160px] truncate">{exp.propietario}</td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">
                        <CategoriaBadge cat={exp.categoria} />
                      </td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">{exp.tipo_tramite.replace(/_/g, ' ')}</td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap font-mono">{exp.rol_avaluo}</td>
                      <td className="px-2 py-1.5 border border-gray-200 max-w-[120px] truncate">{exp.profesional}</td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap text-right">{fmtM2(exp.superficie_m2)}</td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap text-right">{exp.caja ?? '—'}</td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap text-right font-medium">{fmt(exp.total_pesos)}</td>
                      <td className="px-2 py-1.5 border border-gray-200 max-w-[140px] truncate">{exp.direccion}</td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <EstadoBadge estado={exp.estado} />
                          <Semaforo fecha={exp.fecha ?? exp.created_at} estado={exp.estado} />
                        </div>
                      </td>
                      <td className="px-2 py-1.5 border border-gray-200 whitespace-nowrap sticky right-0 bg-white">
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/expediente/${exp.id}`)}
                            className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-100 text-gray-600"
                          >
                            <Edit2 size={11} /> Editar
                          </button>
                          <button
                            onClick={() => navigate(`/desarchivo/${exp.id}`)}
                            className="flex items-center gap-1 px-2 py-1 text-xs border border-amber-200 rounded hover:bg-amber-50 text-amber-700"
                            title="Desarchivo"
                          >
                            <Archive size={11} /> Desarchivo
                          </button>
                          {can('delete') && (
                            <button
                              onClick={() => setDeleteTarget(exp)}
                              className="flex items-center gap-1 px-2 py-1 text-xs border border-red-100 rounded hover:bg-red-50 text-red-600"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-gray-400">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Ingresa un término de búsqueda para consultar expedientes</p>
        </div>
      )}
    </div>
  )
}
