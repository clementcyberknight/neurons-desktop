import React from 'react'
import { FormModal } from '@/components/ui/FormModal'

export interface SplitDetails {
  cash: number
  transfer: number
  card: number
}

interface SplitPaymentModalProps {
  open: boolean
  onClose: () => void
  total: number
  splitDetails: SplitDetails
  setSplitDetails: React.Dispatch<React.SetStateAction<SplitDetails>>
  onApplySplit: (e: React.FormEvent) => void
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  open,
  onClose,
  total,
  splitDetails,
  setSplitDetails,
  onApplySplit,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onApplySplit}
      maxWidth="md"
      title="Configure Split Payment"
      subtitle={`Order Total: ₦${total.toLocaleString()}`}
      submitLabel="Apply Split"
    >
      <div className="space-y-3 text-xs mb-2">
        <div>
          <label className="block font-bold text-neutral-700 mb-1">CASH AMOUNT (₦)</label>
          <input
            type="number"
            min="0"
            value={splitDetails.cash}
            onChange={(e) =>
              setSplitDetails({ ...splitDetails, cash: Number(e.target.value) })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 mb-1">TRANSFER AMOUNT (₦)</label>
          <input
            type="number"
            min="0"
            value={splitDetails.transfer}
            onChange={(e) =>
              setSplitDetails({ ...splitDetails, transfer: Number(e.target.value) })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 mb-1">CARD / POS AMOUNT (₦)</label>
          <input
            type="number"
            min="0"
            value={splitDetails.card}
            onChange={(e) =>
              setSplitDetails({ ...splitDetails, card: Number(e.target.value) })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-black"
          />
        </div>
      </div>
    </FormModal>
  )
}
