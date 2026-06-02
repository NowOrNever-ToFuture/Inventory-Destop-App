import { createContext, use, useCallback, useMemo, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

export interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const styles = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  }[item.type]

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
  }[item.type]

  return (
    <div className={`w-96 max-w-full rounded-lg border shadow-sm px-3 py-2 ${styles}`}>
      <div className="flex items-start gap-2">
        <Icon className="size-4 mt-0.5 shrink-0" />
        <p className="text-sm leading-5 flex-1">{item.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message)
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastView
            key={toast.id}
            item={toast}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = use(ToastContext)
  if (!ctx) {
    throw new Error('useToast phải được dùng trong ToastProvider')
  }
  return ctx
}
