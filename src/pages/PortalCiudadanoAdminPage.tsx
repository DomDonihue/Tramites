import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Save, Trash2, RefreshCw, X, FileText } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { CatalogoCertificadoSP, spCreateCatalogoCertificado, spDeleteCatalogoCertificado, spGetCatalogoCertificadosWeb, spUpdateCatalogoCertificado } from '../lib/sharepoint'

const emptyItem: CatalogoCertificadoSP = { id:'', title:'', codigo:'', descripcion:'', valor:0, plazoDias:7, documentosRequeridos:'', activo:true, orden:1, destacado:false }

export function PortalCiudadanoAdminPage() {
  const { user, can } = useAuth()
  const [items, setItems] = useState<CatalogoCertificadoSP[]>([])
  const [editing, setEditing] = useState<CatalogoCertificadoSP | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => { setLoading(true); setError(''); try { setItems(await spGetCatalogoCertificadosWeb()) } catch(e:any) { setError(e?.message || 'No fue posible leer CatalogoCertificadosWeb.') } finally { setLoading(false) } }
  useEffect(() => { if (can('manageUsers')) load() }, [user, can])
  if (!user || !can('manageUsers')) return <Navigate to="/buscar" replace />

  const save = async () => {
    if (!editing?.title.trim() || !editing.codigo.trim()) { setError('Nombre y código son obligatorios.'); return }
    setSaving(true); setError('')
    try {
      if (editing.id) await spUpdateCatalogoCertificado(editing.id, editing)
      else await spCreateCatalogoCertificado(editing)
      setEditing(null); await load()
    } catch(e:any) { setError(e?.message || 'No fue posible guardar el certificado.') } finally { setSaving(false) }
  }
  const remove = async (item: CatalogoCertificadoSP) => {
    if (!item.id || !confirm(`¿Eliminar "${item.title}" del catálogo?`)) return
    try { await spDeleteCatalogoCertificado(item.id); await load() } catch(e:any) { setError(e?.message || 'No fue posible eliminar el certificado.') }
  }
  const money = (n:number) => new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n)

  return <div className="max-w-7xl mx-auto p-6 lg:p-8">
    <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
      <div><div className="text-xs font-semibold uppercase tracking-wide text-dom-navy">Administración</div><h1 className="text-2xl font-bold text-gray-900">Portal ciudadano · Certificados</h1><p className="text-sm text-gray-500 mt-1">Catálogo conectado a SharePoint: <b>CatalogoCertificadosWeb</b></p></div>
      <div className="flex gap-2"><button onClick={load} className="px-3 py-2 rounded-xl border bg-white text-sm flex items-center gap-2"><RefreshCw size={16}/> Actualizar</button><button onClick={()=>setEditing({...emptyItem,orden:items.length+1})} className="px-4 py-2 rounded-xl bg-dom-navy text-white text-sm font-semibold flex items-center gap-2"><Plus size={17}/> Nuevo certificado</button></div>
    </div>
    {error && <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
    {loading ? <div className="p-8 text-center text-gray-500">Cargando catálogo...</div> : <div className="bg-white border rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-4">Certificado</th><th className="text-left p-4">Código</th><th className="text-right p-4">Valor</th><th className="text-center p-4">Plazo</th><th className="text-center p-4">Activo</th><th className="text-right p-4">Acciones</th></tr></thead><tbody>{items.map(item=><tr key={item.id} className="border-t"><td className="p-4"><div className="font-semibold text-gray-900">{item.title}</div><div className="text-xs text-gray-500">{item.descripcion}</div></td><td className="p-4 font-mono text-xs">{item.codigo}</td><td className="p-4 text-right font-semibold">{money(item.valor)}</td><td className="p-4 text-center">{item.plazoDias} días</td><td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs ${item.activo?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{item.activo?'Activo':'Inactivo'}</span></td><td className="p-4 text-right"><button onClick={()=>setEditing({...item})} className="px-3 py-1.5 rounded-lg bg-gray-100 mr-2">Editar</button><button onClick={()=>remove(item)} className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div></div>}
    {editing && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="p-5 border-b flex items-center justify-between"><div><h2 className="font-bold text-lg">{editing.id?'Editar certificado':'Nuevo certificado'}</h2><p className="text-xs text-gray-500">Los cambios se guardan directamente en SharePoint.</p></div><button onClick={()=>setEditing(null)}><X/></button></div><div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="md:col-span-2 text-sm">Nombre<input className="w-full mt-1 border rounded-xl p-2.5" value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label>
      <label className="text-sm">Código<input className="w-full mt-1 border rounded-xl p-2.5" value={editing.codigo} onChange={e=>setEditing({...editing,codigo:e.target.value.toUpperCase()})}/></label>
      <label className="text-sm">Valor ($)<input type="number" min="0" className="w-full mt-1 border rounded-xl p-2.5" value={editing.valor} onChange={e=>setEditing({...editing,valor:Number(e.target.value)})}/></label>
      <label className="text-sm">Plazo (días hábiles)<input type="number" min="0" className="w-full mt-1 border rounded-xl p-2.5" value={editing.plazoDias} onChange={e=>setEditing({...editing,plazoDias:Number(e.target.value)})}/></label>
      <label className="text-sm">Orden<input type="number" min="1" className="w-full mt-1 border rounded-xl p-2.5" value={editing.orden} onChange={e=>setEditing({...editing,orden:Number(e.target.value)})}/></label>
      <label className="md:col-span-2 text-sm">Descripción<textarea className="w-full mt-1 border rounded-xl p-2.5" rows={3} value={editing.descripcion} onChange={e=>setEditing({...editing,descripcion:e.target.value})}/></label>
      <label className="md:col-span-2 text-sm">Documentos requeridos<textarea className="w-full mt-1 border rounded-xl p-2.5" rows={2} placeholder="Separar con ;" value={editing.documentosRequeridos} onChange={e=>setEditing({...editing,documentosRequeridos:e.target.value})}/></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.activo} onChange={e=>setEditing({...editing,activo:e.target.checked})}/> Disponible para ciudadanos</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.destacado} onChange={e=>setEditing({...editing,destacado:e.target.checked})}/> Destacado en portada</label>
    </div><div className="p-5 border-t flex justify-end gap-2"><button onClick={()=>setEditing(null)} className="px-4 py-2 rounded-xl border">Cancelar</button><button disabled={saving} onClick={save} className="px-4 py-2 rounded-xl bg-dom-navy text-white font-semibold flex items-center gap-2"><Save size={16}/>{saving?'Guardando...':'Guardar'}</button></div></div></div>}
  </div>
}
