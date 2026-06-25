import { useAuth } from '../lib/auth'
import { Building2 } from 'lucide-react'

export function LoginPage() {
  const { login, loading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-dom-navy rounded-2xl mb-4 shadow-lg">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DOM en Línea</h1>
          <p className="text-gray-500 mt-1 text-sm">Municipalidad de Doñihue · Dirección de Obras</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
          <p className="text-sm text-gray-500 text-center mb-6">
            Inicia sesión con tu cuenta institucional Microsoft para acceder al sistema.
          </p>

          <button
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {/* Ícono Microsoft */}
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
              <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión con Microsoft'}
            </span>
          </button>

          <p className="text-xs text-gray-400 text-center mt-6">
            Acceso exclusivo para funcionarios DOM.<br />
            Usa tu cuenta <span className="font-medium text-gray-500">@mdonihue.cl</span>
          </p>
        </div>
      </div>
    </div>
  )
}
