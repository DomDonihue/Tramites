import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Upload, X, FileText, CheckCircle, Loader2, AlertCircle, Plus } from 'lucide-react'
import { db } from '../lib/data'
import { useAuth } from '../lib/auth'
import { Expediente, Categoria, Etapa, TIPOS_POR_CATEGORIA, CATEGORIA_LABELS, ETAPA_LABELS, ESTADO_CONFIG, Documento } from '../types'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { generarRutaRepositorio } from '../lib/repositorio'
import { spUploadArchivo } from '../lib/sharepoint'
import { getChecklist, ItemChecklist } from '../lib/checklistDocs'

interface ArchivoEnCola {
  itemId:   string   // id del ItemChecklist al que pertenece (o 'extra' para adicionales)
  file:     File
  tipo_doc: string
  estado:   'pendiente' | 'subiendo' | 'ok' | 'error'
  url?:     string
}

const EMPTY: Omit<Expediente, 'id' | 'created_at' | 'updated_at' | 'documentos'> = {
  ano:                 new Date().getFullYear(),
  numero:              '',
  propietario:         '',
  rol_avaluo:          '',
  direccion:           '',
  profesional:         '',
  patente_profesional: '',
  categoria:           'PERMISOS_EDIFICACION',
  tipo_tramite:        'OBRA_NUEVA',
  etapa:               'PERMISO',
  estado:              'en_revision',
  superficie_m2:       undefined,
  total_pesos:         undefined,
  caja:                undefined,
  num_permiso:         '',
  observaciones:       '',
  fuente:              'manual',
}

export function ExpedienteFormPage() {
  const { id }     = useParams<{ id?: string }>()
  const isEdit     = !!id
  const navigate   = useNavigate()
  const { user, can } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [form, setForm]               = useState({ ...EMPTY })
  const [docs, setDocs]               = useState<Documento[]>([])
  const [cola, setCola]               = useState<ArchivoEnCola[]>([])
  const [dragOver, setDragOver]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [deleteDocTarget, setDeleteDocTarget] = useState<Documento | null>(null)

  useEffect(() => {
    if (isEdit && id) {
      const exp = db.getExpediente(id)
      if (exp) {
        const { id: _id, created_at, updated_at, documentos, ...rest } = exp
        setForm(rest)
        setDocs(documentos || [])
      }
    }
  }, [id, isEdit])

  const set = (key: string, val: unknown) => {
    setForm(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'categoria') {
        const tipos = TIPOS_POR_CATEGORIA[val as Categoria]
        next.tipo_tramite = tipos[0]
      }
      return next
    })
  }

  // Adjunta un archivo a un ítem del checklist
  const adjuntarAItem = (item: ItemChecklist, files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setCola(prev => {
      // Reemplaza si ya había uno para ese ítem
      const sinEste = prev.filter(a => a.itemId !== item.id)
      return [...sinEste, { itemId: item.id, file, tipo_doc: item.tipo_doc, estado: 'pendiente' }]
    })
  }

  // Archivo adicional libre (no asociado al checklist)
  const agregarAdicional = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      setCola(prev => [...prev, { itemId: 'extra', file, tipo_doc: 'OTRO', estado: 'pendiente' }])
    })
  }

  const quitarDeCola = (itemId: string, idx?: number) => {
    if (idx !== undefined) {
      setCola(prev => prev.filter((_, i) => i !== idx))
    } else {
      setCola(prev => prev.filter(a => a.itemId !== itemId))
    }
  }

  // Guarda el expediente y sube los archivos a SharePoint
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)

    let expedienteId = id

    try {
      if (isEdit && id) {
        db.updateExpediente(id, form)
      } else {
        const nuevo = db.createExpediente({ ...form, created_by: user?.id })
        expedienteId = nuevo.id
      }

      // Subir archivos en cola a SharePoint
      if (cola.length > 0 && expedienteId) {
        const expCompleto = db.getExpediente(expedienteId)!
        const ruta = generarRutaRepositorio(expCompleto)

        for (let i = 0; i < cola.length; i++) {
          const archivo = cola[i]
          setCola(prev => prev.map((a, idx) => idx === i ? { ...a, estado: 'subiendo' } : a))
          try {
            const url = await spUploadArchivo(archivo.file, ruta)
            const doc = db.addDocumento(expedienteId!, {
              expediente_id: expedienteId!,
              nombre:        archivo.file.name,
              tipo_doc:      archivo.tipo_doc as any,
              url,
            })
            setDocs(prev => [...prev, doc])
            setCola(prev => prev.map((a, idx) => idx === i ? { ...a, estado: 'ok', url } : a))
          } catch {
            setCola(prev => prev.map((a, idx) => idx === i ? { ...a, estado: 'error' } : a))
          }
        }
      }

      addToast(isEdit ? 'Expediente actualizado.' : 'Expediente registrado.', 'success')
      setTimeout(() => navigate('/buscar'), 1500)
    } catch (err) {
      addToast('Error al guardar. Intenta de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDoc = () => {
    if (!deleteDocTarget || !id) return
    db.deleteDocumento(id, deleteDocTarget.id)
    setDocs(prev => prev.filter(d => d.id !== deleteDocTarget.id))
    setDeleteDocTarget(null)
    addToast('Documento eliminado.', 'success')
  }

  const tipos = TIPOS_POR_CATEGORIA[form.categoria as Categoria] || []
  const esDJ = form.categoria === 'DECLARACION_JURADA'

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy"

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={!!deleteDocTarget}
        title="Eliminar documento"
        message={`¿Eliminar "${deleteDocTarget?.nombre}"?`}
        onConfirm={handleDeleteDoc}
        onCancel={() => setDeleteDocTarget(null)}
      />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar expediente' : 'Nuevo expediente'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? `Expediente ${form.numero}` : 'Registrar nuevo trámite DOM'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Datos principales ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Datos del expediente</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="N° Expediente">
              <input className={inputCls} value={form.numero} onChange={e => set('numero', e.target.value)} placeholder="2025-0001" />
            </Field>
            <Field label="Año">
              <input className={inputCls} type="number" value={form.ano} onChange={e => set('ano', +e.target.value)} min={1980} max={2099} />
            </Field>
            <Field label="N° Permiso">
              <input className={inputCls} value={form.num_permiso || ''} onChange={e => set('num_permiso', e.target.value)} placeholder="01/2025" />
            </Field>
            <Field label="Categoría">
              <select className={inputCls} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Tipo de trámite">
              <select className={inputCls} value={form.tipo_tramite} onChange={e => set('tipo_tramite', e.target.value)}>
                {tipos.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Field label="Etapa">
              <select className={inputCls} value={form.etapa} onChange={e => set('etapa', e.target.value as Etapa)}>
                {Object.entries(ETAPA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="col-span-2 md:col-span-3">
              <Field label="Estado">
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                    <button key={k} type="button"
                      onClick={() => set('estado', k)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                      style={form.estado === k ? { background: v.bg, color: v.color, borderColor: v.color } : { borderColor: '#e5e7eb', color: '#6b7280' }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* ── Propietario ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
            {esDJ ? 'Datos del declarante' : 'Propietario y ubicación'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={esDJ ? 'Declarante *' : 'Propietario *'}>
              <input className={inputCls} value={form.propietario} onChange={e => set('propietario', e.target.value)} placeholder="Nombre completo" required />
            </Field>
            <Field label="Rol de avalúo *">
              <input className={inputCls} value={form.rol_avaluo} onChange={e => set('rol_avaluo', e.target.value)} placeholder="113-19" required />
            </Field>
            <div className="md:col-span-2">
              <Field label="Dirección">
                <input className={inputCls} value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle y número" />
              </Field>
            </div>
            {!esDJ && (
              <>
                <Field label="Profesional responsable">
                  <input className={inputCls} value={form.profesional} onChange={e => set('profesional', e.target.value)} placeholder="Nombre del arquitecto o ingeniero" />
                </Field>
                <Field label="Patente profesional">
                  <input className={inputCls} value={form.patente_profesional || ''} onChange={e => set('patente_profesional', e.target.value)} placeholder="Ej: 12.345" />
                </Field>
              </>
            )}
          </div>
        </div>

        {/* ── Valores (solo para trámites no-DJ) ── */}
        {!esDJ && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Valores y medidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Superficie (m²)">
                <input className={inputCls} type="number" step="0.01" value={form.superficie_m2 || ''} onChange={e => set('superficie_m2', e.target.value ? +e.target.value : undefined)} placeholder="0.00" />
              </Field>
              <Field label="Total ($)">
                <input className={inputCls} type="number" value={form.total_pesos || ''} onChange={e => set('total_pesos', e.target.value ? +e.target.value : undefined)} placeholder="0" />
              </Field>
              <Field label="Caja">
                <input className={inputCls} type="number" value={form.caja || ''} onChange={e => set('caja', e.target.value ? +e.target.value : undefined)} placeholder="1" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Observaciones">
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.observaciones || ''} onChange={e => set('observaciones', e.target.value)} placeholder="Notas adicionales…" />
              </Field>
            </div>
          </div>
        )}

        {/* ── Observaciones para DJ ── */}
        {esDJ && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Contenido de la declaración</h2>
            <Field label="Descripción / Motivo de la declaración">
              <textarea className={`${inputCls} resize-none`} rows={4} value={form.observaciones || ''} onChange={e => set('observaciones', e.target.value)} placeholder="Describa el objeto de la declaración jurada…" />
            </Field>
          </div>
        )}

        {/* ── Checklist de documentos ── */}
        {(() => {
          const checklist: ItemChecklist[] = getChecklist(form.categoria, form.etapa)
          const extras = cola.filter(a => a.itemId === 'extra')

          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <FileText size={15} className="text-dom-navy" /> Documentos del trámite
              </h2>
              <p className="text-xs text-gray-400 mb-4">Adjunta un archivo por cada documento. Los requeridos están marcados con <span className="text-red-400">*</span></p>

              <div className="space-y-3">
                {checklist.map(item => {
                  const enCola  = cola.find(a => a.itemId === item.id)
                  const guardado = docs.find(d => d.tipo_doc === item.tipo_doc && !cola.find(a => a.itemId === item.id && a.estado === 'ok'))

                  return (
                    <div key={item.id} className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors ${
                      enCola?.estado === 'ok' || guardado ? 'bg-green-50 border-green-200' :
                      enCola                              ? 'bg-blue-50 border-blue-200' :
                                                            'bg-gray-50 border-gray-200'
                    }`}>
                      {/* Estado */}
                      <div className="shrink-0">
                        {enCola?.estado === 'ok' || guardado
                          ? <CheckCircle size={18} className="text-green-600" />
                          : enCola?.estado === 'subiendo'
                          ? <Loader2 size={18} className="animate-spin text-blue-500" />
                          : enCola?.estado === 'error'
                          ? <AlertCircle size={18} className="text-red-500" />
                          : enCola
                          ? <FileText size={18} className="text-blue-500" />
                          : <div className={`w-4.5 h-4.5 rounded-full border-2 ${item.requerido ? 'border-red-300' : 'border-gray-300'}`} />
                        }
                      </div>

                      {/* Nombre */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {item.label}
                          {item.requerido && <span className="text-red-400 ml-1">*</span>}
                        </p>
                        {enCola && (
                          <p className="text-xs text-gray-500 truncate">{enCola.file.name}</p>
                        )}
                        {guardado && !enCola && (
                          <p className="text-xs text-green-600 truncate">{guardado.nombre}</p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="shrink-0 flex items-center gap-2">
                        {guardado && !enCola && guardado.url && guardado.url !== '#' && (
                          <a href={guardado.url} target="_blank" rel="noreferrer"
                            className="text-xs text-dom-navy hover:underline px-2 py-1 rounded-lg hover:bg-white">
                            Ver
                          </a>
                        )}
                        {enCola && enCola.estado === 'pendiente' && (
                          <button type="button" onClick={() => quitarDeCola(item.id)}
                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-white">
                            Quitar
                          </button>
                        )}
                        {!enCola && (
                          <label className="cursor-pointer inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600">
                            <Upload size={12} /> Adjuntar
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.dwg,.doc,.docx" className="hidden"
                              onChange={e => adjuntarAItem(item, e.target.files)} />
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Documentos adicionales */}
                {extras.map((archivo, i) => (
                  <div key={`extra-${i}`} className="rounded-xl border px-4 py-3 flex items-center gap-3 bg-amber-50 border-amber-200">
                    <FileText size={18} className="text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-amber-700 font-medium truncate">{archivo.file.name}</p>
                      <p className="text-xs text-amber-500">Documento adicional</p>
                    </div>
                    <button type="button" onClick={() => quitarDeCola('extra', cola.findIndex((a, idx) => a.itemId === 'extra' && idx === cola.indexOf(archivo)))}
                      className="text-gray-400 hover:text-red-500"><X size={13} /></button>
                  </div>
                ))}

                {/* Botón agregar adicional */}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl hover:border-dom-navy hover:bg-blue-50 transition-colors text-sm text-gray-500 hover:text-dom-navy">
                  <Plus size={15} /> Agregar otro documento
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.dwg,.doc,.docx" className="hidden"
                    onChange={e => agregarAdicional(e.target.files)} />
                </label>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Los archivos se subirán a SharePoint automáticamente al guardar el expediente.
              </p>
            </div>
          )
        })()}

        {/* ── Acciones ── */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark transition-colors disabled:opacity-60"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Guardando…</>
              : <><Save size={16} /> {isEdit ? 'Guardar cambios' : 'Registrar expediente'}</>
            }
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
