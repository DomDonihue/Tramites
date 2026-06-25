import { CheckCircle, XCircle, Info, X } from 'lucide-react'

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' }

const icons = {
  success: <CheckCircle size={16} className="text-green-600" />,
  error: <XCircle size={16} className="text-red-600" />,
  info: <Info size={16} className="text-blue-600" />,
}
const styles = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm animate-in slide-in-from-right ${styles[t.type]}`}>
          {icons[t.type]}
          <span className="flex-1 text-gray-800">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
