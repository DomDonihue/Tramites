import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, RefreshCw, Search, CheckCircle2, Clock3, AlertTriangle, XCircle, FileText, FilePlus, X, Paperclip } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { AdjuntoWeb, spGetAdjuntosCertificadoWeb, spGetCertificadosWeb, spUpdateCertificadoWeb } from '../lib/sharepoint'

type Item = Record<string, any>

// Mismas opciones que la columna EstadoSolicitud de CertificadosWeb
const ESTADOS = ['INGRESADA','EN_REVISION','OBSERVADA','ADMISIBLE','EN_ELABORACION','POR_ENTREGAR','ENTREGADA','RECHAZADA']

// Estados en los que el funcionario todavía decide si la solicitud cumple o no
const POR_REVISAR = ['INGRESADA','EN_REVISION','OBSERVADA']
// Solicitudes aceptadas desde las que aún se pueden crear certificados (una solicitud puede pedir varios)
const PUEDE_CREAR = ['ADMISIBLE','EN_ELABORACION']

const COLOR_ESTADO: Record<string, string> = {
  INGRESADA: 'bg-amber-50 text-amber-700',
  EN_REVISION: 'bg-blue-50 text-blue-700',
  OBSERVADA: 'bg-orange-50 text-orange-700',
  ADMISIBLE: 'bg-emerald-50 text-emerald-700',
  EN_ELABORACION: 'bg-indigo-50 text-indigo-700',
  POR_ENTREGAR: 'bg-violet-50 text-violet-700',
  ENTREGADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-50 text-red-700',
}

const estadoDe = (i: Item) => String(i.EstadoSolicitud || i.Estado || 'INGRESADA')
const folioDe = (i: Item) => String(i.FolioSolicitud || i.Title || `CERT-WEB-${i.Id}`)
const fecha = (v: unknown) => { const s = String(v ?? ''); if (!s) return '—'; const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}` }
const pesos = (v: unknown) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(v ?? 0))

function EstadoBadge({ estado }: { estado: string }) {
  return <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${COLOR_ESTADO[estado] ?? 'bg-slate-100 text-slate-600'}`}>{estado}</span>
}

export function CertificadosWebBandejaPage() {
  const { can } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<Item | null>(null)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true); setError('')
    try { setItems(await spGetCertificadosWeb()) }
    catch (e: any) { setError(e?.message || 'No fue posible leer CertificadosWeb.') }
    finally { setLoading(false) }
  }
  useEffect(() => { cargar() }, [])

  const lista = useMemo(() => items.filter(i => {
    const q = search.toLowerCase()
    const text = [folioDe(i), i.Solicitante, i.RutSolicitante, i.RolAvaluo, i.TipoCertificado].join(' ').toLowerCase()
    return (!q || text.includes(q)) && (!estado || estadoDe(i) === estado)
  }), [items, search, estado])

  if (!can('manageUsers')) return <div className="p-8 text-red-600">No tiene permisos para acceder a esta bandeja.</div>

  const tarjetas: [string, string, typeof Clock3][] = [
    ['INGRESADA', 'Ingresadas', Clock3], ['ADMISIBLE', 'Admisibles', CheckCircle2],
    ['EN_ELABORACION', 'En elaboración', FileText], ['RECHAZADA', 'Rechazadas', XCircle],
  ]

  return <div className="p-6 max-w-7xl mx-auto">
    <div className="flex flex-wrap gap-4 items-center mb-6">
      <div><h1 className="text-2xl font-bold text-dom-navy">Bandeja de Certificados Web</h1><p className="text-sm text-slate-500">Solicitudes ingresadas por los ciudadanos desde el portal.</p></div>
      <button onClick={cargar} className="ml-auto border rounded-xl px-4 py-2 flex gap-2 items-center"><RefreshCw size={16}/> Actualizar</button>
    </div>
    {error && <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">{tarjetas.map(([key, label, Icon]) =>
      <button key={key} onClick={() => setEstado(estado === key ? '' : key)} className={`text-left bg-white border rounded-xl p-4 ${estado === key ? 'ring-2 ring-dom-navy/40' : ''}`}>
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Icon size={16}/>{label}</div>
        <div className="text-2xl font-bold mt-2 text-dom-navy">{items.filter(i => estadoDe(i) === key).length}</div>
      </button>)}
    </div>
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar folio, RUT, solicitante o ROL..." className="w-full border rounded-xl pl-9 pr-3 py-2.5"/></div>
        <select value={estado} onChange={e => setEstado(e.target.value)} className="border rounded-xl px-3 py-2.5"><option value="">Todos los estados</option>{ESTADOS.map(e => <option key={e}>{e}</option>)}</select>
      </div>
      <div className="overflow-x-auto">{loading ? <div className="p-10 text-center text-slate-500">Cargando solicitudes...</div> :
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Folio</th><th className="text-left p-3">Fecha</th><th className="text-left p-3">Solicitante</th><th className="text-left p-3">RUT</th><th className="text-left p-3">ROL</th><th className="text-left p-3">Certificado</th><th className="text-left p-3">Estado</th><th className="p-3"></th></tr></thead>
          <tbody className="divide-y">{lista.map(i =>
            <tr key={i.Id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(i)}>
              <td className="p-3 font-semibold text-dom-navy">{folioDe(i)}</td>
              <td className="p-3">{fecha(i.FechaIngreso || i.Created)}</td>
              <td className="p-3">{i.Solicitante}</td>
              <td className="p-3">{i.RutSolicitante}</td>
              <td className="p-3 font-mono">{i.RolAvaluo || '—'}</td>
              <td className="p-3">{i.TipoCertificado}</td>
              <td className="p-3"><EstadoBadge estado={estadoDe(i)}/></td>
              <td className="p-3 text-right"><Eye size={17} className="inline text-slate-500"/></td>
            </tr>)}
            {!lista.length && <tr><td colSpan={8} className="p-10 text-center text-slate-500">No hay solicitudes con esos filtros.</td></tr>}
          </tbody>
        </table>}
      </div>
    </div>
    {selected && <DetalleSolicitud item={selected} onClose={() => setSelected(null)} onCambio={() => { setSelected(null); cargar() }}/>}
  </div>
}

function Dato({ label, value, mono }: { label: string; value: unknown; mono?: boolean }) {
  const v = value === null || value === undefined || value === '' ? '—' : String(value)
  return <div><div className="text-xs text-slate-500">{label}</div><div className={`font-medium break-words ${mono ? 'font-mono' : ''}`}>{v}</div></div>
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <section className="border rounded-xl p-4"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">{titulo}</h3><div className="grid sm:grid-cols-2 gap-3">{children}</div></section>
}

function DetalleSolicitud({ item, onClose, onCambio }: { item: Item; onClose: () => void; onCambio: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [adjuntos, setAdjuntos] = useState<AdjuntoWeb[] | null>(null)
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const estado = estadoDe(item)
  const folio = folioDe(item)

  useEffect(() => { spGetAdjuntosCertificadoWeb(folio).then(setAdjuntos).catch(() => setAdjuntos([])) }, [folio])

  const actualizar = async (valores: Record<string, unknown>) => {
    setGuardando(true); setError('')
    try { await spUpdateCertificadoWeb(String(item.Id), { FuncionarioAsignado: user?.nombre ?? '', ...valores }); return true }
    catch (e: any) { setError(e?.message || 'No fue posible actualizar la solicitud.'); return false }
    finally { setGuardando(false) }
  }

  const rechazar = async () => {
    if (!motivo.trim()) { setError('Indica el motivo del rechazo.'); return }
    if (await actualizar({ EstadoSolicitud: 'RECHAZADA', ObservacionDOM: motivo.trim() })) onCambio()
  }

  // Cumple: queda admisible y se abre Nuevo certificado con los datos de la solicitud
  const crearCertificado = async () => {
    if (POR_REVISAR.includes(estado) && !(await actualizar({ EstadoSolicitud: 'ADMISIBLE', FechaAdmisibilidad: new Date().toISOString() }))) return
    navigate('/certificados/nuevo', { state: { solicitudWeb: item } })
  }

  return <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="p-6 border-b flex justify-between items-start gap-4">
        <div><h2 className="text-xl font-bold text-dom-navy">{folio}</h2><p className="text-sm text-slate-500">Ingresada el {fecha(item.FechaIngreso || item.Created)}</p></div>
        <div className="flex items-center gap-3"><EstadoBadge estado={estado}/><button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18}/></button></div>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto">
        <Seccion titulo="Solicitante">
          <Dato label="Nombre" value={item.Solicitante}/>
          <Dato label="RUT" value={item.RutSolicitante} mono/>
          <Dato label="Correo" value={item.Email}/>
          <Dato label="Teléfono" value={item.Telefono}/>
        </Seccion>
        <Seccion titulo="Propiedad">
          <Dato label="ROL SII" value={item.RolAvaluo} mono/>
          <Dato label="Propietario" value={item.Propietario}/>
          <Dato label="Dirección" value={[item.Direccion, item.NumeroDomicilio].filter(Boolean).join(' ')}/>
          <Dato label="Localidad" value={item.Localidad}/>
          <Dato label="Urbano / Rural" value={item.UrbanoRural}/>
        </Seccion>
        <Seccion titulo="Solicitud">
          <Dato label="Certificados solicitados" value={item.TipoCertificado}/>
          <Dato label="Total derechos" value={pesos(item.TotalDerechos)}/>
          {item.OtrosDescripcion && <Dato label="Otro (descripción)" value={item.OtrosDescripcion}/>}
          <Dato label="Estado de pago" value={item.EstadoPago}/>
          {item.Observaciones && <div className="sm:col-span-2"><Dato label="Observaciones del ciudadano" value={item.Observaciones}/></div>}
        </Seccion>

        <section className="border rounded-xl p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Documentos adjuntos</h3>
          {adjuntos === null ? <p className="text-sm text-slate-500">Buscando documentos...</p>
            : !adjuntos.length ? <p className="text-sm text-slate-500">La solicitud no trae documentos adjuntos.</p>
            : <ul className="space-y-2">{adjuntos.map(a =>
                <li key={a.url}><a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-dom-navy hover:underline"><Paperclip size={15}/>{a.nombre}<span className="text-slate-400">({Math.max(1, Math.round(a.tamano / 1024))} KB)</span></a></li>)}
              </ul>}
        </section>

        {(item.ObservacionDOM || item.FuncionarioAsignado) && <Seccion titulo="Revisión DOM">
          <Dato label="Funcionario" value={item.FuncionarioAsignado}/>
          <Dato label="Fecha admisibilidad" value={item.FechaAdmisibilidad ? fecha(item.FechaAdmisibilidad) : ''}/>
          {item.ObservacionDOM && <div className="sm:col-span-2"><Dato label="Observación / motivo" value={item.ObservacionDOM}/></div>}
        </Seccion>}

        {rechazando && <div className="border border-red-200 bg-red-50/50 rounded-xl p-4">
          <label className="text-sm font-semibold text-red-800">Motivo del rechazo
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} autoFocus placeholder="Ej.: falta la cédula de identidad; el ROL no corresponde a la dirección indicada…" className="mt-2 w-full border rounded-xl p-2.5 font-normal text-sm bg-white"/>
          </label>
          <p className="text-xs text-red-700 mt-1">El motivo queda registrado en la solicitud (ObservacionDOM).</p>
        </div>}
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
      </div>

      <div className="p-5 border-t flex flex-wrap justify-end gap-2">
        {POR_REVISAR.includes(estado) && !rechazando && <>
          <button onClick={() => { setRechazando(true); setError('') }} className="px-4 py-2 rounded-xl border border-red-200 text-red-700 font-semibold flex items-center gap-2 hover:bg-red-50"><XCircle size={16}/> Rechazar</button>
          <button disabled={guardando} onClick={crearCertificado} className="px-4 py-2 rounded-xl bg-dom-navy text-white font-semibold flex items-center gap-2 disabled:opacity-60"><CheckCircle2 size={16}/> Cumple: crear certificado</button>
        </>}
        {rechazando && <>
          <button onClick={() => { setRechazando(false); setError('') }} className="px-4 py-2 rounded-xl border">Cancelar</button>
          <button disabled={guardando} onClick={rechazar} className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold flex items-center gap-2 disabled:opacity-60"><XCircle size={16}/>{guardando ? 'Guardando...' : 'Confirmar rechazo'}</button>
        </>}
        {PUEDE_CREAR.includes(estado) && <button onClick={crearCertificado} className="px-4 py-2 rounded-xl bg-dom-navy text-white font-semibold flex items-center gap-2"><FilePlus size={16}/> Crear certificado</button>}
        {!POR_REVISAR.includes(estado) && !PUEDE_CREAR.includes(estado) && <p className="text-sm text-slate-500 mr-auto flex items-center gap-2"><AlertTriangle size={15}/> Solicitud {estado.toLowerCase().replace('_', ' ')}: no requiere acción en la bandeja.</p>}
      </div>
    </div>
  </div>
}
