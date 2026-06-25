import { useState } from 'react'
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react'

interface TreeNode {
  name: string
  nomenclatura?: string
  children?: TreeNode[]
  isFile?: boolean
}

const TREE: TreeNode[] = [
  {
    name: 'CERTIFICADOS',
    children: [{
      name: 'AÑO',
      children: [
        { name: 'CERT_NUM', isFile: true },
        { name: 'CERT_COP', isFile: true },
        { name: 'CERT_ZON', isFile: true },
        { name: 'CERT_OTRO', isFile: true },
        { name: 'CERT_ETC...', isFile: true },
      ]
    }]
  },
  {
    name: 'PERMISOS_EDIFICACION',
    nomenclatura: '[AÑO]_PE_[EXPEDIENTE]_[ROL]/',
    children: ['ALTERACION','AMPLIACION_100','OBRA_NUEVA','RECONSTRUCCION','REPARACION'].map(t => ({
      name: t,
      children: ['ANTEPROYECTO','PERMISO','MODIFICACION','RECEPCION'].map(e => ({ name: e, isFile: true }))
    }))
  },
  {
    name: 'OBRAS_MENORES',
    nomenclatura: '[AÑO]_OM_[EXPEDIENTE]_[ROL]/',
    children: ['AMPLIACION_100','AMPLIACION_VIV_50','ARTE_SIN_OBRA','MODIF_SIN_ALT','REGUL_EDIF_ANTI'].map(t => ({
      name: t,
      children: ['PERMISO','MODIFICACION','RECEPCION'].map(e => ({ name: e, isFile: true }))
    }))
  },
  {
    name: 'SUBDIVISION_URB',
    nomenclatura: '[AÑO]_SUB_[EXPEDIENTE]_[ROL]/',
    children: ['FUSION','LOTEO','LOTEO_CONS_SIN','LOTEO_DFL2','SUBDIVISION','URBANIZACION'].map(t => ({
      name: t,
      children: ['ANTEPROYECTO','PERMISO','MODIFICACION','RECEPCION'].map(e => ({ name: e, isFile: true }))
    }))
  },
  {
    name: 'ZONAS_CATASTROFE',
    nomenclatura: '[AÑO]_CAT_[EXPEDIENTE]_[ROL]/',
    children: ['AMPLIACION_VIV','AMPLIACION_OTROS','OBRA_NUEVA_VIV','OBRA_NUEVA_OT','RECONSTRUCCION_V','RECONSTRUCCION_O','REGULARIZACION','VIVIENDA_TIPO'].map(t => ({
      name: t,
      children: ['PERMISO','RECEPCION'].map(e => ({ name: e, isFile: true }))
    }))
  },
  {
    name: 'TORRES_ANTENAS',
    nomenclatura: '[AÑO]_TORR_[EXPEDIENTE]_[ROL]/',
    children: ['116_BIS_F_GENERAL','116_BIS_F_ESPECIAL','116_BIS_G_SIMPLIF'].map(t => ({
      name: t,
      children: ['PERMISO','RECEPCION'].map(e => ({ name: e, isFile: true }))
    }))
  },
  {
    name: 'AUTORIZACION_APRO',
    nomenclatura: '[AÑO]_AUT_[EXPEDIENTE]_[ROL]/',
    children: ['OBRA_PRELIMINAR','DEMOLICION','CAMBIO_DESTINO','MOD_DESLINDES','REC_DESLINDES'].map(t => ({
      name: t,
      children: [{ name: 'PERMISO', isFile: true }]
    }))
  },
  {
    name: 'REGULARIZACION',
    nomenclatura: '[AÑO]_REG_[EXPEDIENTE]_[ROL]/',
    children: ['LEY_20898','LEY_21031','LEY_21052','LEY_20251'].map(n => ({ name: n, isFile: true }))
  },
]

const CAT_COLORS: Record<string, string> = {
  CERTIFICADOS: '#185FA5',
  PERMISOS_EDIFICACION: '#3B6D11',
  OBRAS_MENORES: '#854F0B',
  SUBDIVISION_URB: '#533AB7',
  ZONAS_CATASTROFE: '#A32D2D',
  TORRES_ANTENAS: '#0F6E56',
  AUTORIZACION_APRO: '#5F5E5A',
  REGULARIZACION: '#185F80',
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = node.children && node.children.length > 0
  const isRoot = depth === 0
  const color = isRoot ? CAT_COLORS[node.name] : undefined

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer select-none transition-colors ${
          isRoot ? 'hover:bg-gray-50' : 'hover:bg-gray-50/80'
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <FolderOpen size={15} style={{ color: color || '#EF9F27', flexShrink: 0 }} />
               : <Folder size={15} style={{ color: color || '#EF9F27', flexShrink: 0 }} />
        ) : (
          <FileText size={14} className="text-gray-400 shrink-0" />
        )}

        <span className={`text-sm font-${isRoot ? 'semibold' : 'normal'} ${node.isFile ? 'text-gray-500' : 'text-gray-800'}`}
          style={isRoot ? { color } : undefined}>
          {node.name}{!node.isFile ? '/' : ''}
        </span>

        {node.nomenclatura && (
          <span className="ml-auto text-xs font-mono text-gray-400 hidden md:block">{node.nomenclatura}</span>
        )}

        {hasChildren && (
          <span className="ml-auto text-gray-400 shrink-0">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        )}
      </div>

      {open && hasChildren && (
        <div className="border-l border-gray-100 ml-6">
          {node.children!.map((child, i) => (
            <TreeItem key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function RepositorioPage() {
  const [allOpen, setAllOpen] = useState(false)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Repositorio documental</h1>
          <p className="text-sm text-gray-500 mt-0.5">Estructura jerárquica de carpetas — DOM Doñihue</p>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5 text-xs text-blue-800">
        <p className="font-medium mb-1">Nomenclatura de archivos</p>
        <p className="font-mono">[AÑO]_[TIPO]_[N°EXPEDIENTE]_[ROL]/</p>
        <p className="mt-1 text-blue-600">Ejemplo: 2024_PE_0015_113-19/ → Permiso de Edificación N°15 año 2024, Rol 113-19</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
        {/* Root */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 mb-1">
          <Folder size={18} className="text-dom-navy" />
          <span className="font-bold text-gray-900 text-sm">REPOSITORIO_DOM/</span>
          <span className="ml-auto text-xs text-gray-400">Raíz del repositorio</span>
        </div>
        {TREE.map((node, i) => (
          <TreeItem key={i} node={node} depth={0} />
        ))}
      </div>

      {/* Etapas legend */}
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Tipos de trámite (Nivel 4)</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Anteproyecto', color: '#533AB7' },
            { label: 'Permiso', color: '#185FA5' },
            { label: 'Modificación', color: '#854F0B' },
            { label: 'Recepción', color: '#3B6D11' },
          ].map(e => (
            <div key={e.label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
              {e.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
