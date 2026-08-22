import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { Lock } from 'lucide-react'

export interface ShiftStats {
  cashSales: number
  transferSales: number
  cardSales: number
  creditSales: number
  totalSales: number
  txnCount: number
}

interface CloseShiftModalProps {
  open: boolean
  onClose: () => void
  cashierName: string
  shiftStartTime: string
  shiftStats: ShiftStats
  actualCashCounted: number
  setActualCashCounted: (val: number) => void
  onConfirmCloseShift: (e: React.FormEvent) => void
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  open,
  onClose,
  cashierName,
  shiftStartTime,
  shiftStats,
  actualCashCounted,
  setActualCashCounted,
  onConfirmCloseShift,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onConfirmCloseShift}
      maxWidth="md"
      title="Close Cashier Shift"
      subtitle={`Shift Active since ${shiftStartTime}`}
      icon={
        <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center">
          <Lock className="h-4 w-4" />
        </div>
      }
      submitLabel="End Shift & Print Z-Report"
    >
      <div className="space-y-3 text-xs">
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-500">Cashier:</span>
            <span className="font-semibold text-neutral-900">{cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Total Cash Sales:</span>
            <span className="font-mono font-bold text-black">
              ₦{shiftStats.cashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Total Card / Transfer:</span>
            <span className="font-mono font-bold text-black">
              ₦
              {(shiftStats.cardSales + shiftStats.transferSales).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="border-t border-neutral-200 pt-2 flex justify-between font-bold text-sm">
            <span>Total Shift Revenue:</span>
            <span className="font-mono text-black">
              ₦{shiftStats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Actual Counted Drawer Cash (₦)
          </label>
          <input
            type="number"
            min="0"
            value={actualCashCounted}
            onChange={(e) => setActualCashCounted(Number(e.target.value))}
            className="w-full rounded-xl bg-white border border-neutral-300 px-3 py-2 text-sm font-mono font-bold text-neutral-900 focus:outline-none focus:border-black"
          />
        </div>
      </div>
    </FormModal>
  )
}
