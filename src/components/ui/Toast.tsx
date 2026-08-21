import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export interface ToastProps {
  message: string | null
  /** 'success' (green icon), 'error' (red icon), or 'info' (emerald icon, default) */
  variant?: 'success' | 'error' | 'info'
  /** Duration in ms before auto-dismissing (default: 3500) */
  duration?: number
  /** Callback when the toast dismisses */
  onDismiss?: () => void
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  duration = 3500,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, duration)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [message, duration, onDismiss])

  if (!visible || !message) return null

  const iconMap = {
    success: <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />,
    error: <XCircle className="h-4 w-4 text-red-400 shrink-0" />,
    info: <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0" />,
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-top-2">
      {iconMap[variant]}
      <span>{message}</span>
    </div>
  )
}
