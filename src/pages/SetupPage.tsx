import { useState } from 'react'
import { runSetup, SetupLog } from '../lib/spSetup'
import { CheckCircle, XCircle, Loader, Database, ArrowRight } from 'lucide-react'

export function SetupPage() {
  const [logs, setLogs]       = useState<SetupLog[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone]       = useState(false)

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configuración SharePoint</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crea automáticamente las listas <strong>Expedientes</strong>, <strong>Certificados</strong> y <strong>Desarchivos</strong> en el sitio SharePoint de la DOM.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="flex items-start gap-3 mb-5">
          <Database size={20} className="text-dom-navy mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-sm text-gray-900">Sitio destino</div>
            <div className="text-xs text-gray-500 mt-0.5">
              https://mdonihue.sharepoint.com/sites/DOMExpediente
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Se crearán 3 listas con todas sus columnas. Si ya existen, se omiten sin borrar datos.
            </div>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running
            ? <><Loader size={15} className="animate-spin"/> Creando listas...</>
            : <><ArrowRight size={15}/> Crear listas en SharePoint</>
          }
        </button>
      </div>

      {/* Log */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4 font-mono text-xs space-y-1.5">
          {logs.map((log, i) => (
            <div key={i} className={`flex items-start gap-2 ${log.ok ? 'text-green-400' : 'text-red-400'}`}>
              {log.ok
                ? <CheckCircle size={12} className="mt-0.5 shrink-0"/>
                : <XCircle size={12} className="mt-0.5 shrink-0"/>
              }
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
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
          <strong>¡Listo!</strong> Las listas están creadas en SharePoint. El siguiente paso es conectar la app para leer y escribir datos desde SharePoint en vez del almacenamiento local.
        </div>
      )}
    </div>
  )
}
