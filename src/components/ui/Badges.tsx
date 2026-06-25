import { ESTADO_CONFIG, Estado } from '../../types'
import clsx from 'clsx'

export function EstadoBadge({ estado }: { estado: Estado }) {
  const cfg = ESTADO_CONFIG[estado]
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

export function CategoriaBadge({ cat }: { cat: string }) {
  const colors: Record<string, string> = {
    PERMISOS_EDIFICACION: 'bg-blue-50 text-blue-700',
    OBRAS_MENORES: 'bg-amber-50 text-amber-700',
    SUBDIVISION_URB: 'bg-purple-50 text-purple-700',
    CERTIFICADOS: 'bg-teal-50 text-teal-700',
    ZONAS_CATASTROFE: 'bg-red-50 text-red-700',
    TORRES_ANTENAS: 'bg-green-50 text-green-700',
    AUTORIZACION_APRO: 'bg-gray-100 text-gray-700',
    REGULARIZACION: 'bg-indigo-50 text-indigo-700',
  }
  const labels: Record<string, string> = {
    PERMISOS_EDIFICACION: 'Perm. Edificación',
    OBRAS_MENORES: 'Obras Menores',
    SUBDIVISION_URB: 'Subdivisión',
    CERTIFICADOS: 'Certificados',
    ZONAS_CATASTROFE: 'Zona Catástrofe',
    TORRES_ANTENAS: 'Torres/Antenas',
    AUTORIZACION_APRO: 'Autorización',
    REGULARIZACION: 'Regularización',
  }
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded text-xs font-medium', colors[cat] || 'bg-gray-100 text-gray-600')}>
      {labels[cat] || cat}
    </span>
  )
}

export function PerfilBadge({ perfil }: { perfil: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-700',
    director: 'bg-green-100 text-green-700',
    profesional: 'bg-amber-100 text-amber-700',
  }
  const labels: Record<string, string> = { admin: 'Admin', director: 'Director', profesional: 'Profesional' }
  return <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', styles[perfil])}>{labels[perfil] || perfil}</span>
}
