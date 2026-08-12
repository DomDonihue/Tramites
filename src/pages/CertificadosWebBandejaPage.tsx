import { useEffect, useMemo, useState } from 'react'
import { Eye, RefreshCw, Search, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { spGetCertificadosWeb } from '../lib/sharepoint'

type Item = Record<string, any>

const ESTADOS = ['RECIBIDA','EN_REVISION','OBSERVADA','POR_PAGAR','PAGADA','EN_EMISION','EMITIDA','ENTREGADA','RECHAZADA']

export function CertificadosWebBandejaPage() {
  const { can } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<Item | null>(null)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    try { setItems(await spGetCertificadosWeb()) } finally { setLoading(false) }
  }
  useEffect(() => { cargar() }, [])

  const lista = useMemo(() => items.filter(i => {
    const q = search.toLowerCase()
    const text = [i.FolioSolicitud,i.Title,i.Solicitante,i.RutSolicitante,i.RolAvaluo,i.TipoCertificado].join(' ').toLowerCase()
    return (!q || text.includes(q)) && (!estado || String(i.Estado || '') === estado)
  }), [items, search, estado])

  if (!can('manageUsers')) return <div className="p-8 text-red-600">No tiene permisos para acceder a esta bandeja.</div>

  return <div className="p-6 max-w-7xl mx-auto">
    <div className="flex flex-wrap gap-4 items-center mb-6"><div><h1 className="text-2xl font-bold text-dom-navy">Bandeja de Certificados Web</h1><p className="text-sm text-slate-500">Solicitudes ingresadas por los ciudadanos desde el portal.</p></div><button onClick={cargar} className="ml-auto border rounded-xl px-4 py-2 flex gap-2 items-center"><RefreshCw size={16}/> Actualizar</button></div>
    <div className="grid sm:grid-cols-4 gap-3 mb-6">{[['RECIBIDA','Recibidas',Clock3],['EN_REVISION','En revisión',Search],['OBSERVADA','Observadas',AlertTriangle],['ENTREGADA','Entregadas',CheckCircle2]].map(([key,label,Icon]:any)=><div key={key} className="bg-white border rounded-xl p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><Icon size={16}/>{label}</div><div className="text-2xl font-bold mt-2 text-dom-navy">{items.filter(i=>i.Estado===key).length}</div></div>)}</div>
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex flex-wrap gap-3"><div className="relative flex-1 min-w-[240px]"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar folio, RUT, solicitante o ROL..." className="w-full border rounded-xl pl-9 pr-3 py-2.5"/></div><select value={estado} onChange={e=>setEstado(e.target.value)} className="border rounded-xl px-3 py-2.5"><option value="">Todos los estados</option>{ESTADOS.map(e=><option key={e}>{e}</option>)}</select></div>
      <div className="overflow-x-auto">{loading ? <div className="p-10 text-center text-slate-500">Cargando solicitudes...</div> : <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Folio</th><th className="text-left p-3">Fecha</th><th className="text-left p-3">Solicitante</th><th className="text-left p-3">RUT</th><th className="text-left p-3">Certificado</th><th className="text-left p-3">Estado</th><th className="p-3"></th></tr></thead><tbody className="divide-y">{lista.map(i=><tr key={i.Id || i.ID}><td className="p-3 font-semibold text-dom-navy">{i.FolioSolicitud || i.Title || `CERT-WEB-${i.Id}`}</td><td className="p-3">{String(i.FechaIngreso || i.Created || '').slice(0,10)}</td><td className="p-3">{i.Solicitante}</td><td className="p-3">{i.RutSolicitante}</td><td className="p-3">{i.TipoCertificado}</td><td className="p-3"><span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold">{i.Estado || 'RECIBIDA'}</span></td><td className="p-3 text-right"><button onClick={()=>setSelected(i)} className="p-2 rounded-lg hover:bg-slate-100"><Eye size={17}/></button></td></tr>)}</tbody></table>}</div>
    </div>
    {selected && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setSelected(null)}><div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-7" onClick={e=>e.stopPropagation()}><div className="flex justify-between"><div><h2 className="text-xl font-bold text-dom-navy">{selected.FolioSolicitud || selected.Title}</h2><p className="text-sm text-slate-500">Detalle de solicitud ciudadana</p></div><button onClick={()=>setSelected(null)}>✕</button></div><div className="grid sm:grid-cols-2 gap-4 mt-6">{Object.entries(selected).filter(([k])=>!['__metadata'].includes(k)).map(([k,v])=><div key={k} className="border rounded-xl p-3"><div className="text-xs text-slate-500">{k}</div><div className="font-medium mt-1 break-words">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}</div></div>)}</div></div></div>}
  </div>
}
