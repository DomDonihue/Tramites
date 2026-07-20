import { useState } from 'react'
import { runSetup, SetupLog } from '../lib/spSetup'
import { getConfig, saveConfig, DomConfig } from '../lib/config'
import { spGetUsuarios, spCreateUsuario, spGetExpedientes, spGetCertificados, spCreateExpediente } from '../lib/sharepoint'
import { db, sincronizarCertificadosToSP } from '../lib/data'
import { CheckCircle, XCircle, Loader, Database, ArrowRight, Clock, Save, RefreshCw, Upload } from 'lucide-react'

export function SetupPage() {
  const [logs, setLogs]       = useState<SetupLog[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone]       = useState(false)

  // Configuración de plazos
  const [config, setConfig]   = useState<DomConfig>(getConfig)
  const [saved, setSaved]     = useState(false)

  // Diagnóstico SP
  const [syncLog, setSyncLog] = useState<{msg: string; ok: boolean}[]>([])
  const [syncing, setSyncing] = useState(false)

  // Sync masivo certificados
  const [certProgress, setCertProgress] = useState<{done: number; total: number; ok: number; err: number} | null>(null)
  const [certSyncing, setCertSyncing]   = useState(false)
  const [certResult, setCertResult]     = useState<{ok: number; err: number; total: number} | null>(null)

  // Sync masivo expedientes
  const [expProgress, setExpProgress] = useState<{done: number; total: number; ok: number; err: number} | null>(null)
  const [expSyncing, setExpSyncing]   = useState(false)
  const [expResult, setExpResult]     = useState<{ok: number; err: number; total: number} | null>(null)

  const handleSyncExpedientes = async () => {
    const pendientes = db.getExpedientes().filter(e => !e.sp_id)
    const total = pendientes.length
    if (total === 0) return
    setExpSyncing(true)
    setExpResult(null)
    setExpProgress({ done: 0, total, ok: 0, err: 0 })
    let ok = 0, err = 0
    for (const exp of pendientes) {
      try {
        const spId = await spCreateExpediente(exp)
        db.updateExpediente(exp.id, { sp_id: spId })
        ok++
      } catch { err++ }
      setExpProgress({ done: ok + err, total, ok, err })
    }
    setExpResult({ ok, err, total })
    setExpSyncing(false)
    setExpProgress(null)
  }

  const handleSyncCertificados = async () => {
    setCertSyncing(true)
    setCertResult(null)
    setCertProgress({ done: 0, total: 0, ok: 0, err: 0 })
    try {
      const result = await sincronizarCertificadosToSP((done, total, ok, err) => {
        setCertProgress({ done, total, ok, err })
      })
      setCertResult(result)
    } catch (e: any) {
      setCertResult({ ok: 0, err: 1, total: 0 })
    } finally {
      setCertSyncing(false)
      setCertProgress(null)
    }
  }

  const handleTestSync = async () => {
    setSyncing(true)
    setSyncLog([])
    const log = (msg: string, ok = true) => setSyncLog(p => [...p, { msg, ok }])
    try {
      log('Verificando conexión a SharePoint...')
      const spUsers = await spGetUsuarios()
      log(`✅ Lista Usuario: ${spUsers.length} registros en SP`)

      const localUsers = db.getUsuarios()
      log(`📋 Usuarios locales: ${localUsers.length}`)

      const sinSp = localUsers.filter(u => !u.sp_id)
      log(`⬆️ Usuarios sin sincronizar: ${sinSp.length}`)

      for (const u of sinSp) {
        const spId = await spCreateUsuario(u)
        log(`✅ Sincronizado: ${u.nombre} → SP ID ${spId}`)
      }

      const spExps = await spGetExpedientes()
      log(`✅ Lista Expediente: ${spExps.length} registros en SP`)

      if (sinSp.length === 0 && spUsers.length > 0) {
        log('✅ Todo sincronizado correctamente')
      }
    } catch (e: any) {
      log(`❌ Error: ${e.message}`, false)
    } finally {
      setSyncing(false)
    }
  }

  const handleRun = async () => {
    setLogs([])
    setRunning(true)
    setDone(false)
    try {
      await runSetup(log => setLogs(prev => [...prev, log]))
      setDone(true)
    } catch (e: any) {
      setLogs(prev => [...prev, { msg: `Error inesperado: ${e.message}`, ok: false }])
    } finally {
      setRunning(false)
    }
  }

  const handleSaveConfig = () => {
    saveConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Field = ({ label, hint, value, onChange }: {
    label: string; hint: string; value: number; onChange: (v: number) => void
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{hint}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={365}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dom-navy"
        />
        <span className="text-sm text-gray-500">días hábiles</span>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* ── Plazos ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} className="text-dom-navy" />
          <h2 className="text-base font-semibold text-gray-900">Plazos de atención</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
          <Field
            label="Plazo para tramites en revisión"
            hint="Días hábiles desde el ingreso hasta cambiar de estado (aprobado, observado, rechazado)"
            value={config.plazo_expediente_dias}
            onChange={v => setConfig(c => ({ ...c, plazo_expediente_dias: v }))}
          />
          <Field
            label="Plazo para entrega de certificados"
            hint="Días hábiles desde la solicitud hasta la entrega al contribuyente"
            value={config.plazo_certificado_dias}
            onChange={v => setConfig(c => ({ ...c, plazo_certificado_dias: v }))}
          />
        </div>

        <div className="border-t border-gray-100 pt-4 mb-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Alerta amarilla (advertencia previa)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tramites — activar en</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} max={99} value={config.alerta_expediente_pct}
                  onChange={e => setConfig(c => ({ ...c, alerta_expediente_pct: Number(e.target.value) }))}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dom-navy"
                />
                <span className="text-sm text-gray-500">
                  % del plazo = día {Math.round(config.plazo_expediente_dias * config.alerta_expediente_pct / 100)} de {config.plazo_expediente_dias}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificados — activar en</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} max={99} value={config.alerta_certificado_pct}
                  onChange={e => setConfig(c => ({ ...c, alerta_certificado_pct: Number(e.target.value) }))}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dom-navy"
                />
                <span className="text-sm text-gray-500">
                  % del plazo = día {Math.round(config.plazo_certificado_dias * config.alerta_certificado_pct / 100)} de {config.plazo_certificado_dias}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa semáforos */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs space-y-1">
          <p className="font-medium text-gray-600 mb-2">Vista previa del semáforo:</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"/>
            <span className="text-gray-600">Verde: días 0 – {Math.round(config.plazo_expediente_dias * config.alerta_expediente_pct / 100) - 1} (tramites) / 0 – {Math.round(config.plazo_certificado_dias * config.alerta_certificado_pct / 100) - 1} (certs)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"/>
            <span className="text-gray-600">Amarillo: días {Math.round(config.plazo_expediente_dias * config.alerta_expediente_pct / 100)} – {config.plazo_expediente_dias - 1} (tramites) / {Math.round(config.plazo_certificado_dias * config.alerta_certificado_pct / 100)} – {config.plazo_certificado_dias - 1} (certs)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>
            <span className="text-gray-600">Rojo: desde día {config.plazo_expediente_dias} en adelante (tramites) / desde día {config.plazo_certificado_dias} (certs)</span>
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          className="flex items-center gap-2 px-5 py-2.5 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark transition-colors"
        >
          {saved
            ? <><CheckCircle size={15}/> Guardado</>
            : <><Save size={15}/> Guardar configuración</>
          }
        </button>
      </div>

      {/* ── Sync usuarios/expedientes ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={18} className="text-dom-navy" />
          <h2 className="text-base font-semibold text-gray-900">Sincronización con SharePoint</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Verifica la conexión y sube a SharePoint los usuarios y expedientes que aún no están sincronizados.
        </p>
        <button
          onClick={handleTestSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {syncing
            ? <><Loader size={15} className="animate-spin"/> Sincronizando...</>
            : <><RefreshCw size={15}/> Verificar y sincronizar ahora</>
          }
        </button>
        {syncLog.length > 0 && (
          <div className="mt-3 bg-gray-900 rounded-xl p-3 font-mono text-xs space-y-1">
            {syncLog.map((l, i) => (
              <div key={i} className={`flex items-start gap-2 ${l.ok ? 'text-green-400' : 'text-red-400'}`}>
                {l.ok ? <CheckCircle size={11} className="mt-0.5 shrink-0"/> : <XCircle size={11} className="mt-0.5 shrink-0"/>}
                <span>{l.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sync masivo certificados ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Upload size={18} className="text-dom-navy" />
          <h2 className="text-base font-semibold text-gray-900">Enviar certificados a SharePoint</h2>
        </div>
        <p className="text-xs text-gray-500 mb-1">
          Los certificados importados desde Excel solo existen en este navegador.
          Usa este botón para subirlos a SharePoint y que todos los usuarios puedan verlos.
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mb-4">
          <span>En la app (este navegador): <strong>{db.getCertificados().length}</strong></span>
          <span className="text-gray-300">|</span>
          <span>Sin sincronizar: <strong className="text-amber-600">{db.getCertificados().filter(c => !c.sp_id).length}</strong></span>
        </div>

        {db.getCertificados().filter(c => !c.sp_id).length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-3 py-2 text-sm">
            <CheckCircle size={15}/> Todos los certificados ya están en SharePoint
          </div>
        ) : (
          <button
            onClick={handleSyncCertificados}
            disabled={certSyncing}
            className="flex items-center gap-2 px-5 py-2.5 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark disabled:opacity-50 transition-colors"
          >
            {certSyncing
              ? <><Loader size={15} className="animate-spin"/> Subiendo...</>
              : <><Upload size={15}/> Subir {db.getCertificados().filter(c => !c.sp_id).length} certificados a SharePoint</>
            }
          </button>
        )}

        {/* Barra de progreso */}
        {certSyncing && certProgress && certProgress.total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{certProgress.done} / {certProgress.total}</span>
              <span className="text-green-600">✓ {certProgress.ok}  {certProgress.err > 0 && <span className="text-red-500 ml-2">✗ {certProgress.err}</span>}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-dom-navy h-2 rounded-full transition-all"
                style={{ width: `${Math.round((certProgress.done / certProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Resultado */}
        {certResult && !certSyncing && (
          <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${certResult.err === 0 ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
            {certResult.err === 0
              ? <CheckCircle size={15} className="mt-0.5 shrink-0 text-green-600"/>
              : <XCircle size={15} className="mt-0.5 shrink-0 text-amber-600"/>
            }
            <span>
              {certResult.ok} certificados subidos correctamente
              {certResult.err > 0 && ` · ${certResult.err} con error (reintenta más tarde)`}.
              {certResult.ok > 0 && ' Ahora todos los usuarios pueden verlos al iniciar sesión.'}
            </span>
          </div>
        )}
      </div>

      {/* ── Sync masivo expedientes ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Upload size={18} className="text-dom-navy" />
          <h2 className="text-base font-semibold text-gray-900">Enviar expedientes a SharePoint</h2>
        </div>
        <p className="text-xs text-gray-500 mb-1">
          Los expedientes importados desde Matriz.xlsx solo existen en este navegador.
          Usa este botón para subirlos a SharePoint.
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mb-4">
          <span>En la app: <strong>{db.getExpedientes().length}</strong></span>
          <span className="text-gray-300">|</span>
          <span>Sin sincronizar: <strong className="text-amber-600">{db.getExpedientes().filter(e => !e.sp_id).length}</strong></span>
        </div>

        {db.getExpedientes().filter(e => !e.sp_id).length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-3 py-2 text-sm">
            <CheckCircle size={15}/> Todos los expedientes ya están en SharePoint
          </div>
        ) : (
          <button
            onClick={handleSyncExpedientes}
            disabled={expSyncing}
            className="flex items-center gap-2 px-5 py-2.5 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark disabled:opacity-50 transition-colors"
          >
            {expSyncing
              ? <><Loader size={15} className="animate-spin"/> Subiendo...</>
              : <><Upload size={15}/> Subir {db.getExpedientes().filter(e => !e.sp_id).length} expedientes a SharePoint</>
            }
          </button>
        )}

        {expSyncing && expProgress && expProgress.total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{expProgress.done} / {expProgress.total}</span>
              <span className="text-green-600">✓ {expProgress.ok}{expProgress.err > 0 && <span className="text-red-500 ml-2">✗ {expProgress.err}</span>}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-dom-navy h-2 rounded-full transition-all"
                style={{ width: `${Math.round((expProgress.done / expProgress.total) * 100)}%` }} />
            </div>
          </div>
        )}

        {expResult && !expSyncing && (
          <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${expResult.err === 0 ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
            {expResult.err === 0
              ? <CheckCircle size={15} className="mt-0.5 shrink-0 text-green-600"/>
              : <XCircle size={15} className="mt-0.5 shrink-0 text-amber-600"/>
            }
            <span>
              {expResult.ok} expedientes subidos correctamente
              {expResult.err > 0 && ` · ${expResult.err} con error`}.
            </span>
          </div>
        )}
      </div>

      {/* ── SharePoint Setup ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start gap-3 mb-5">
          <Database size={20} className="text-dom-navy mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-sm text-gray-900">Configuración SharePoint</div>
            <div className="text-xs text-gray-500 mt-0.5">
              https://mdonihue.sharepoint.com/sites/DOMExpediente
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Crea las listas <strong>Expediente</strong>, <strong>Certificados</strong> y <strong>Desarchivo</strong> con todas sus columnas. Si ya existen, se omiten sin borrar datos.
            </div>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running
            ? <><Loader size={15} className="animate-spin"/> Configurando...</>
            : <><ArrowRight size={15}/> Crear/actualizar listas en SharePoint</>
          }
        </button>
      </div>

      {/* Log */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4 font-mono text-xs space-y-1.5">
          {logs.map((log, i) => (
            <div key={i} className={`flex items-start gap-2 ${log.ok ? 'text-green-400' : 'text-red-400'}`}>
              {log.ok ? <CheckCircle size={12} className="mt-0.5 shrink-0"/> : <XCircle size={12} className="mt-0.5 shrink-0"/>}
              <span>{log.msg}</span>
            </div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader size={12} className="animate-spin shrink-0"/> procesando...
            </div>
          )}
        </div>
      )}

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
          <strong>¡Listo!</strong> Las listas están configuradas en SharePoint.
        </div>
      )}
    </div>
  )
}
