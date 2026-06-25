import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { db } from '../lib/data'
import { CATEGORIA_LABELS, Categoria } from '../types'
import { FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react'

const COLORS = ['#185FA5', '#3B6D11', '#854F0B', '#533AB7', '#A32D2D', '#0F6E56', '#5F5E5A', '#185F80']

export function EstadisticasPage() {
  const expedientes = db.getExpedientes()

  const stats = useMemo(() => {
    const total = expedientes.length
    const aprobados = expedientes.filter(e => e.estado === 'aprobado').length
    const enRevision = expedientes.filter(e => e.estado === 'en_revision').length
    const de2026 = expedientes.filter(e => e.ano === 2026).length

    const porAno = ['2024', '2025', '2026'].map(y => ({
      año: y,
      total: expedientes.filter(e => String(e.ano) === y).length,
    }))

    const porCat = Object.entries(CATEGORIA_LABELS).map(([k, label]) => ({
      name: label.length > 18 ? label.substring(0, 18) + '…' : label,
      value: expedientes.filter(e => e.categoria === k as Categoria).length,
    })).filter(c => c.value > 0)

    const profCount: Record<string, number> = {}
    expedientes.forEach(e => {
      if (e.profesional && e.profesional !== '—') {
        profCount[e.profesional] = (profCount[e.profesional] || 0) + 1
      }
    })
    const topProf = Object.entries(profCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nombre, total]) => ({ nombre, total }))

    const ultimos = [...expedientes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8)

    return { total, aprobados, enRevision, de2026, porAno, porCat, topProf, ultimos }
  }, [expedientes])

  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de actividad DOM Doñihue</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total expedientes', value: stats.total, icon: <FileText size={18} />, color: 'text-dom-navy', bg: 'bg-dom-navy-light' },
          { label: 'Aprobados', value: stats.aprobados, icon: <CheckCircle size={18} />, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'En revisión', value: stats.enRevision, icon: <Clock size={18} />, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Expedientes 2026', value: stats.de2026, icon: <TrendingUp size={18} />, color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-xl mb-3 ${card.bg}`}>
              <span className={card.color}>{card.icon}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Por año */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Expedientes por año</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.porAno} barSize={40}>
              <XAxis dataKey="año" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [v, 'Expedientes']} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="total" fill="#185FA5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por categoría */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Por categoría</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.porCat} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {stats.porCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top profesionales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top profesionales</h2>
          <div className="space-y-2">
            {stats.topProf.map((p, i) => (
              <div key={p.nombre} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{p.nombre}</div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-dom-navy rounded-full" style={{ width: `${(p.total / stats.topProf[0].total) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-dom-navy shrink-0">{p.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos ingresados */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Últimos expedientes</h2>
          <div className="space-y-2">
            {stats.ultimos.map(e => (
              <div key={e.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{e.propietario}</div>
                  <div className="text-xs text-gray-400">{e.tipo_tramite.replace(/_/g,' ')} · {e.ano}</div>
                </div>
                <span className="text-xs font-mono text-gray-400 shrink-0">{e.num_permiso || e.numero}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
