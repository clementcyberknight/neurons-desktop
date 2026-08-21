import React from 'react'
import { Trash2 } from 'lucide-react'

export interface ConfirmDeleteModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Title of the modal (e.g. "Delete Expense Voucher?") */
  title: string
  /** Description / body text. Supports React nodes for bold formatting. */
  description: React.ReactNode
  /** Text for the delete button (default: "Delete Record") */
  confirmLabel?: string
  /** Callback when user confirms deletion */
  onConfirm: () => void
  /** Callback when user cancels */
  onCancel: () => void
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Delete Record',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="h-11 w-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <Trash2 className="h-5 w-5" />
        </div>

        <div className="text-center">
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
          <div className="text-xs text-neutral-500 mt-1">{description}</div>
          <span className="text-[11px] text-red-600 block mt-2 font-medium">
            This action cannot be undone.
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-semibold text-neutral-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
