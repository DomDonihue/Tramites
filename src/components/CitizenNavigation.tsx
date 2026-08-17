import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'

export function CitizenNavigation({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const goHome = () => navigate('/')

  const handleCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const anchor = target.closest('a')
    if (!anchor) return

    const text = anchor.textContent?.replace(/\s+/g, ' ').trim().toUpperCase() ?? ''
    if (text.includes('I. MUNICIPALIDAD DE DOÑIHUE') || text.includes('DIRECCIÓN DE OBRAS')) {
      event.preventDefault()
      event.stopPropagation()
      goHome()
    }
  }

  return (
    <div onClickCapture={handleCapture}>
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <button
            type="button"
            onClick={goHome}
            className="inline-flex items-center gap-2 text-sm font-semibold text-dom-navy hover:text-blue-700 transition"
            aria-label="Volver al inicio"
          >
            <ArrowLeft size={17} />
            <Home size={16} />
            Volver al inicio
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}
