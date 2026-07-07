import { ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import {
  Building2, Search, FilePlus, BarChart2,
  Users, LogOut, Menu, X, ChevronRight, FileCheck, Settings
} from 'lucide-react'
import clsx from 'clsx'

const PERFIL_BADGE: Record<string, { label: string; cls: string }> = {
  admin:       { label: 'Admin',       cls: 'bg-blue-100 text-blue-700' },
  director:    { label: 'Director',    cls: 'bg-green-100 text-green-700' },
  profesional: { label: 'Profesional', cls: 'bg-amber-100 text-amber-700' },
}

interface NavItem { to: string; icon: ReactNode; label: string; adminOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { to: '/buscar',      icon: <Search size={18} />,    label: 'Buscar expedientes' },
  { to: '/nuevo',       icon: <FilePlus size={18} />,  label: 'Nuevo expediente' },
  { to: '/certificados', icon: <FileCheck size={18} />, label: 'Certificados' },
  { to: '/estadisticas',icon: <BarChart2 size={18} />, label: 'Estadísticas' },
  { to: '/usuarios',    icon: <Users size={18} />,     label: 'Usuarios', adminOnly: true },
  { to: '/setup',       icon: <Settings size={18} />,  label: 'Configurar SharePoint', adminOnly: true },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, can } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const badge = user ? PERFIL_BADGE[user.perfil] : null
  const visibleItems = NAV_ITEMS.filter(i => !i.adminOnly || can('manageUsers'))

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {visibleItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-dom-navy text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )
          }
        >
          {item.icon}
          {item.label}
          <ChevronRight size={14} className="ml-auto opacity-40" />
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-100 shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-dom-navy rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">DOM en Línea</div>
              <div className="text-xs text-gray-400 leading-tight">Doñihue</div>
            </div>
          </div>
        </div>

        <NavLinks />

        {/* User footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 p-2">
            <div className="w-8 h-8 rounded-full bg-dom-navy-light flex items-center justify-center text-dom-navy text-xs font-bold shrink-0">
              {user?.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{user?.nombre}</div>
              <span className={clsx('inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5', badge?.cls)}>{badge?.label}</span>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-dom-navy rounded-lg flex items-center justify-center">
            <Building2 size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">DOM en Línea</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-gray-100">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-dom-navy rounded-xl flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">DOM en Línea</div>
                <div className="text-xs text-gray-400">Doñihue</div>
              </div>
            </div>
            <NavLinks />
            <div className="p-3 border-t border-gray-100">
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl w-full">
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
