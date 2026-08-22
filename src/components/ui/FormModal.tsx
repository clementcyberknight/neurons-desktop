import React from 'react'
import { Modal, type ModalProps } from './Modal'
import { RefreshCw } from 'lucide-react'

export interface FormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  maxWidth?: ModalProps['maxWidth']
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  submitVariant?: 'black' | 'orange' | 'emerald' | 'red'
  children: React.ReactNode
}

const VARIANT_STYLES = {
  black: 'bg-black hover:bg-neutral-800 text-white',
  orange: 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-orange-500/25',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  red: 'bg-red-600 hover:bg-red-700 text-white',
}

export const FormModal: React.FC<FormModalProps> = ({
  open,
  onClose,
  onSubmit,
  title,
  subtitle,
  icon,
  maxWidth = 'md',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  submitVariant = 'black',
  children,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      title={title}
      subtitle={subtitle}
      icon={icon}
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        {children}

        {/* Unified Standard Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-xl px-6 py-2.5 text-xs font-bold shadow-xs cursor-pointer tracking-wide uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${VARIANT_STYLES[submitVariant]}`}
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
