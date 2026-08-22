import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ModalProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'md',
  children,
  footer,
}) => {
  // Close on Escape key with cleanup
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const widthClass = MAX_WIDTH_CLASSES[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`relative w-full ${widthClass} rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 my-8 animate-in fade-in zoom-in-95`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Optional Header */}
        {(title || icon) && (
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3 mb-4">
            {icon && (
              <div className="h-9 w-9 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && typeof title === 'string' ? (
                <h3 className="text-base font-bold text-neutral-900">{title}</h3>
              ) : (
                title
              )}
              {subtitle && typeof subtitle === 'string' ? (
                <p className="text-xs text-neutral-500">{subtitle}</p>
              ) : (
                subtitle
              )}
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="text-xs">{children}</div>

        {/* Optional Footer */}
        {footer && <div className="mt-4 pt-3 border-t border-neutral-100">{footer}</div>}
      </div>
    </div>
  )
}
