import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, FilePlus, Edit2, Trash2, FileText, ExternalLink, ChevronDown, ChevronUp, X, FolderOpen, ChevronRight } from 'lucide-react'
import { db } from '../lib/data'
import { useAuth } from '../lib/auth'
import { Expediente, Categoria, Estado, Etapa, CATEGORIA_LABELS, ESTADO_CONFIG, ETAPA_LABELS } from '../types'
import { generarRutaRepositorio } from '../lib/repositorio'
import { EstadoBadge, CategoriaBadge } from '../components/ui/Badges'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ui/Toast'

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
    <div className="p-6 max-w-5xl mx-auto">
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
            <div className="space-y-3">
              {results.map(exp => (
                <div key={exp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CategoriaBadge cat={exp.categoria} />
                      <span className="text-xs text-gray-400">{exp.tipo_tramite.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <EstadoBadge estado={exp.estado} />
                      <span className="text-xs font-mono text-gray-400">{exp.numero}</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{exp.propietario}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm mb-4">
                      <div><span className="text-xs text-gray-400 block">Rol de avalúo</span><span className="font-mono text-gray-800">{exp.rol_avaluo}</span></div>
                      <div><span className="text-xs text-gray-400 block">Dirección</span><span className="text-gray-800">{exp.direccion}</span></div>
                      <div><span className="text-xs text-gray-400 block">Profesional</span><span className="text-gray-800">{exp.profesional}</span></div>
                      <div><span className="text-xs text-gray-400 block">Etapa</span><span className="text-gray-800">{ETAPA_LABELS[exp.etapa]}</span></div>
                      <div><span className="text-xs text-gray-400 block">Superficie</span><span className="text-gray-800">{fmtM2(exp.superficie_m2)}</span></div>
                      <div><span className="text-xs text-gray-400 block">Total</span><span className="text-gray-800 font-medium">{fmt(exp.total_pesos)}</span></div>
                    </div>

                    {/* Documents */}
                    {(exp.documentos?.length ?? 0) > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={() => toggleDocs(exp.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2"
                        >
                          <FileText size={13} />
                          {exp.documentos!.length} documento{exp.documentos!.length !== 1 ? 's' : ''} adjunto{exp.documentos!.length !== 1 ? 's' : ''}
                          {expandedDocs.has(exp.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        {expandedDocs.has(exp.id) && (
                          <div className="flex flex-wrap gap-2">
                            {exp.documentos!.map(doc => (
                              <button
                                key={doc.id}
                                onClick={() => window.open('#', '_blank')}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-dom-navy hover:bg-dom-navy hover:text-white transition-colors group"
                              >
                                <FileText size={12} />
                                {doc.nombre}
                                <ExternalLink size={11} className="opacity-50 group-hover:opacity-100" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ruta repositorio */}
                    <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 flex-wrap">
                      <FolderOpen size={13} className="text-amber-500 shrink-0" />
                      {generarRutaRepositorio(exp).split('/').map((seg, i, arr) => (
                        <span key={i} className="flex items-center gap-1 text-xs font-mono">
                          {i > 0 && <ChevronRight size={10} className="text-amber-300" />}
                          <span className={i === arr.length - 1 ? 'text-amber-800 font-semibold' : 'text-amber-600'}>{seg}</span>
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => navigate(`/expediente/${exp.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                      >
                        <Edit2 size={13} /> Ver / Editar
                      </button>
                      {can('delete') && (
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-100 rounded-lg hover:bg-red-50 text-red-600"
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
