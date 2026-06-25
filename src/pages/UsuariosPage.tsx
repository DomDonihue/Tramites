import { useState } from 'react'
import { UserPlus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Save } from 'lucide-react'
import { db } from '../lib/data'
import { Usuario, Perfil } from '../types'
import { PerfilBadge } from '../components/ui/Badges'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ui/Toast'

type FilterTab = 'todos' | Perfil

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'admin', label: 'Admins' },
  { value: 'director', label: 'Directores' },
  { value: 'profesional', label: 'Profesionales' },
]

interface UserForm { nombre: string; email: string; perfil: Perfil }
const EMPTY_FORM: UserForm = { nombre: '', email: '', perfil: 'profesional' }

export function UsuariosPage() {
  const { toasts, addToast, removeToast } = useToast()
  const [filter, setFilter] = useState<FilterTab>('todos')
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Usuario | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const usuarios = db.getUsuarios().filter(u => filter === 'todos' || u.perfil === filter)

  const openNew = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true) }
  const openEdit = (u: Usuario) => { setForm({ nombre: u.nombre, email: u.email, perfil: u.perfil }); setEditTarget(u); setShowModal(true) }

  const handleSave = () => {
    if (!form.nombre || !form.email) return
    if (editTarget) {
      db.updateUsuario(editTarget.id, form)
      addToast('Usuario actualizado.', 'success')
    } else {
      db.createUsuario({ ...form, activo: true })
      addToast('Usuario creado.', 'success')
    }
    setShowModal(false)
    refresh()
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    db.deleteUsuario(deleteTarget.id)
    setDeleteTarget(null)
    addToast('Usuario eliminado.', 'success')
    refresh()
  }

  const toggleActivo = (u: Usuario) => {
    db.updateUsuario(u.id, { activo: !u.activo })
    addToast(u.activo ? 'Usuario desactivado.' : 'Usuario activado.', 'info')
    refresh()
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dom-navy/30 focus:border-dom-navy"

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar a "${deleteTarget?.nombre}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{editTarget ? 'Editar usuario' : 'Nuevo usuario'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre completo</label>
                <input className={inputCls} value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="María González" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Correo electrónico</label>
                <input className={inputCls} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="m.gonzalez@donihue.cl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Perfil</label>
                <select className={inputCls} value={form.perfil} onChange={e => setForm(p => ({ ...p, perfil: e.target.value as Perfil }))}>
                  <option value="profesional">Profesional</option>
                  <option value="director">Director</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-dom-navy text-white text-sm rounded-xl hover:bg-dom-navy-dark">
                <Save size={14} /> {editTarget ? 'Guardar' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestión de usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administra los accesos al sistema DOM</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-dom-navy text-white text-sm font-medium rounded-xl hover:bg-dom-navy-dark">
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setFilter(t.value)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all ${filter === t.value ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Nombre</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Correo</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Perfil</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-dom-navy-light flex items-center justify-center text-dom-navy text-xs font-bold shrink-0">
                      {u.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="font-medium text-gray-900">{u.nombre}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-sm">{u.email}</td>
                <td className="px-5 py-3.5"><PerfilBadge perfil={u.perfil} /></td>
                <td className="px-5 py-3.5">
                  <button onClick={() => toggleActivo(u)} className="flex items-center gap-1.5 text-xs">
                    {u.activo
                      ? <><ToggleRight size={18} className="text-green-600" /><span className="text-green-700">Activo</span></>
                      : <><ToggleLeft size={18} className="text-gray-400" /><span className="text-gray-500">Inactivo</span></>}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-dom-navy">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(u)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
