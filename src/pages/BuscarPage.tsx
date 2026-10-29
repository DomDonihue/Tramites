import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, FilePlus, Edit2, Trash2, FileText, ChevronDown, ChevronUp, X, ChevronRight, Archive, AlertTriangle, Filter } from 'lucide-react'
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

const fmtM2Col = (n?: number) => n && n > 0 ? `${n.toLocaleString('es-CL')} m²` : '—'
const fmtCol = (n?: number) => n ? `$${n.toLocaleString('es-CL')}` : '—'

interface ColDef {
  key: string
  label: string
  get: (e: Expediente) => string
  sortVal?: (e: Expediente) => number
}

const COLUMNAS: ColDef[] = [
  { key: 'fecha', label: 'FECHA', get: e => String(e.fecha ?? e.ano ?? '') },
  { key: 'numero', label: 'N°', get: e => String(e.numero ?? '') },
  { key: 'propietario', label: 'PROPIETARIO', get: e => e.propietario ?? '' },
  { key: 'categoria', label: 'TIPO DE INGRESO', get: e => CATEGORIA_LABELS[e.categoria] ?? e.categoria },
  { key: 'tipo_tramite', label: 'TIPO DE OBRA', get: e => (e.tipo_tramite ?? '').replace(/_/g, ' ') },
  { key: 'rol_avaluo', label: 'ROL', get: e => e.rol_avaluo ?? '' },
  { key: 'profesional', label: 'PROFESIONAL', get: e => e.profesional ?? '' },
  { key: 'superficie_m2', label: 'SUP', get: e => fmtM2Col(e.superficie_m2), sortVal: e => e.superficie_m2 ?? 0 },
  { key: 'caja', label: 'CAJA', get: e => String(e.caja ?? '—'), sortVal: e => e.caja ?? 0 },
  { key: 'total_pesos', label: 'TOTAL $', get: e => fmtCol(e.total_pesos), sortVal: e => e.total_pesos ?? 0 },
  { key: 'direccion', label: 'DIRECCIÓN', get: e => e.direccion ?? '' },
  { key: 'estado', label: 'ESTADO', get: e => ESTADO_CONFIG[e.estado]?.label ?? e.estado },
]

type ColFilters = Record<string, Set<string>>

function ColumnFilterMenu({ options, selected, sortDir, anchor, onApply, onSort, onClose }: {
  options: string[]
  selected: Set<string> | undefined
  sortDir: 'asc' | 'desc' | null
  anchor: DOMRect
  onApply: (sel: Set<string> | undefined) => void
  onSort: (dir: 'asc' | 'desc' | null) => void
  onClose: () => void
}) {
  const [busca, setBusca] = useState('')
  const [draft, setDraft] = useState<Set<string>>(() => new Set(selected ?? options))
  const visibles = options.filter(o => o.toLowerCase().includes(busca.toLowerCase()))
  const todosVisibles = visibles.length > 0 && visibles.every(v => draft.has(v))

  const toggle = (v: string) => setDraft(prev => {
    const next = new Set(prev)
    if (next.has(v)) next.delete(v); else next.add(v)
    return next
  })
  const toggleTodos = () => setDraft(prev => {
    const next = new Set(prev)
    visibles.forEach(v => { if (todosVisibles) next.delete(v); else next.add(v) })
    return next
  })
  const aplicar = () => {
    onApply(options.every(o => draft.has(o)) ? undefined : draft)
    onClose()
  }

  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - 270))
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 w-64 bg-white border border-gray-300 rounded-lg shadow-xl text-gray-800 font-normal normal-case text-xs"
        style={{ top: anchor.bottom + 4, left }}>
        <div className="p-1 border-b border-gray-200">
          <button onClick={() => { onSort('asc'); onClose() }}
            className={`w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 ${sortDir === 'asc' ? 'font-bold text-dom-navy' : ''}`}>
            Ordenar de A a Z (menor a mayor)
          </button>
          <button onClick={() => { onSort('desc'); onClose() }}
            className={`w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 ${sortDir === 'desc' ? 'font-bold text-dom-navy' : ''}`}>
            Ordenar de Z a A (mayor a menor)
          </button>
          {sortDir && (
            <button onClick={() => { onSort(null); onClose() }} className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 text-gray-500">
              Quitar orden
            </button>
          )}
        </div>
        <div className="p-2">
          <input autoFocus value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar…"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-dom-navy/30" />
        </div>
        <div className="max-h-56 overflow-y-auto px-2 pb-1">
          <label className="flex items-center gap-2 px-1 py-1 hover:bg-gray-50 cursor-pointer font-semibold">
            <input type="checkbox" checked={todosVisibles} onChange={toggleTodos} />
            (Seleccionar todo)
          </label>
          {visibles.map(v => (
            <label key={v} className="flex items-center gap-2 px-1 py-1 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={draft.has(v)} onChange={() => toggle(v)} />
              <span className="truncate">{v === '' ? '(Vacías)' : v}</span>
            </label>
          ))}
          {visibles.length === 0 && <p className="px-1 py-2 text-gray-400">Sin coincidencias</p>}
        </div>
        <div className="p-2 border-t border-gray-200 flex justify-between gap-2">
          <button onClick={() => { onApply(undefined); onClose() }} className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50">
            Borrar filtro
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
            <button onClick={aplicar} className="px-3 py-1.5 bg-dom-navy text-white rounded hover:bg-dom-navy-dark">Aceptar</button>
          </div>
        </div>
      </div>
    </>
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
  const [colFilters, setColFilters] = useState<ColFilters>({})
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
  const [menu, setMenu] = useState<{ key: string; anchor: DOMRect } | null>(null)

  const baseResults = useMemo(() => {
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

  const filtrarPorColumnas = (data: Expediente[], omitir?: string) =>
    data.filter(e => COLUMNAS.every(c => {
      if (c.key === omitir) return true
      const sel = colFilters[c.key]
      return !sel || sel.has(c.get(e))
    }))

  const results = useMemo(() => {
    const data = filtrarPorColumnas(baseResults)
    if (!sort) return data
    const col = COLUMNAS.find(c => c.key === sort.key)
    if (!col) return data
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      if (col.sortVal) return (col.sortVal(a) - col.sortVal(b)) * factor
      return col.get(a).localeCompare(col.get(b), 'es', { numeric: true }) * factor
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseResults, colFilters, sort])

  const columnasFiltradas = Object.keys(colFilters).length
  const opcionesColumna = (key: string) => {
    const col = COLUMNAS.find(c => c.key === key)
    if (!col) return []
    const vals = new Set(filtrarPorColumnas(baseResults, key).map(col.get))
    return [...vals].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
  }
  const aplicarFiltroColumna = (key: string, sel: Set<string> | undefined) =>
    setColFilters(prev => {
      const next = { ...prev }
      if (sel) next[key] = sel; else delete next[key]
      return next
    })

  // Desglose por categoría sobre el total, no sobre los resultados filtrados:
  // sirve para saber qué hay en el sistema antes de buscar nada.
  const desglose = useMemo(() => {
    const todos = db.getExpedientes()
    return {
      total: todos.length,
      cats: (Object.entries(CATEGORIA_LABELS) as [Categoria, string][])
        .map(([k, label]) => ({ k, label, n: todos.filter(e => e.categoria === k).length }))
        .filter(c => c.n > 0),
    }
  }, [searched])

  const doSearch = () => setSearched(true)
  const clearSearch = () => { setQuery(''); setSearched(false) }

  /** Al tocar un chip se filtra y se muestran los resultados de inmediato. */
  const filtrarPorCat = (cat: string) => {
    setFilterCat(prev => (prev === cat ? '' : cat))
    setSearched(true)
  }

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

      {/* Desglose por categoría — cada número es además un filtro */}
      {desglose.total > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => { setFilterCat(''); setSearched(true) }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filterCat === '' ? 'bg-dom-navy text-white border-dom-navy' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            Todos <span className="ml-1 opacity-60">({desglose.total.toLocaleString('es-CL')})</span>
          </button>
          {desglose.cats.map(c => (
            <button key={c.k} onClick={() => filtrarPorCat(c.k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                filterCat === c.k ? 'bg-dom-navy text-white border-dom-navy' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {c.label} <span className="ml-1 opacity-60">({c.n.toLocaleString('es-CL')})</span>
            </button>
          ))}
        </div>
      )}

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
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-3 flex-wrap">
            <span>
              {results.length === 0 ? 'Sin resultados' : `${results.length} expediente${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`}
              {columnasFiltradas > 0 && baseResults.length !== results.length && ` (de ${baseResults.length})`}
            </span>
            {(columnasFiltradas > 0 || sort) && (
              <button onClick={() => { setColFilters({}); setSort(null) }}
                className="text-dom-navy font-semibold hover:underline">
                Quitar filtros y orden de columnas
              </button>
            )}
          </p>

          {menu && (
            <ColumnFilterMenu
              key={menu.key}
              options={opcionesColumna(menu.key)}
              selected={colFilters[menu.key]}
              sortDir={sort?.key === menu.key ? sort.dir : null}
              anchor={menu.anchor}
              onApply={sel => aplicarFiltroColumna(menu.key, sel)}
              onSort={dir => setSort(dir ? { key: menu.key, dir } : null)}
              onClose={() => setMenu(null)}
            />
          )}

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
                    {COLUMNAS.map(col => {
                      const activo = !!colFilters[col.key]
                      const orden = sort?.key === col.key ? sort.dir : null
                      return (
                        <th key={col.key} className="bg-yellow-300 text-gray-900 font-bold px-2 py-2 text-left border border-yellow-400 whitespace-nowrap">
                          <button
                            onClick={e => setMenu({ key: col.key, anchor: e.currentTarget.getBoundingClientRect() })}
                            className="flex items-center gap-1 font-bold hover:text-dom-navy"
                            title="Filtrar / ordenar"
                          >
                            {col.label}
                            {orden === 'asc' && <ChevronUp size={12} />}
                            {orden === 'desc' && <ChevronDown size={12} />}
                            <Filter size={12} className={activo ? 'fill-dom-navy text-dom-navy' : 'opacity-50'} />
                          </button>
                        </th>
                      )
                    })}
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
