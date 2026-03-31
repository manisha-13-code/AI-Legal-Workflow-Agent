'use client'
import { useEffect, useState } from 'react'
import { subscribeToToasts, ToastType } from '@/hooks/useToast'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

interface Toast { id: number; message: string; type: ToastType }

const icons = {
  success: <CheckCircle className="w-4 h-4 text-green-600" />,
  error:   <XCircle className="w-4 h-4 text-red-600" />,
  info:    <Info className="w-4 h-4 text-blue-600" />,
}
const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return subscribeToToasts(t => {
      setToasts(p => [...p, t])
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 3500)
    })
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id}
          className={`animate-slideIn flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium min-w-[260px] max-w-[360px] ${styles[t.type]}`}>
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-50 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
