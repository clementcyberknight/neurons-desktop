import React from 'react'
import { Modal } from '@/components/ui/Modal'
import type { FinanceRecord } from '@/types/database'
import { Receipt, Printer } from 'lucide-react'

interface ExpenseVoucherModalProps {
  record: FinanceRecord | null
  onClose: () => void
  onPrint?: () => void
}

export const ExpenseVoucherModal: React.FC<ExpenseVoucherModalProps> = ({
  record,
  onClose,
  onPrint = () => window.print(),
}) => {
  if (!record) return null

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      maxWidth="md"
      icon={<Receipt className="h-5 w-5 text-neutral-700" />}
      title="Expense Voucher Details"
    >
      <div className="space-y-3 text-xs">
        <div className="flex justify-between font-mono bg-neutral-50 p-3 rounded-xl border border-neutral-200">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Voucher ID:</div>
            <div className="font-bold text-neutral-900">
              {record.referenceId || record.id.slice(0, 12).toUpperCase()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">{record.category}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-400 uppercase">Date:</div>
            <div className="text-neutral-800 font-bold">{record.transactionDate}</div>
            <div className="text-[11px] text-neutral-500">{record.paymentStatus || 'Paid'}</div>
          </div>
        </div>

        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase font-mono block">
              Expense Purpose
            </span>
            <div className="font-bold text-neutral-900 text-sm mt-0.5">{record.description}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/60 font-mono text-xs">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Beneficiary</span>
              <span className="font-semibold text-neutral-800">{record.beneficiary || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Payment Method</span>
              <span className="font-semibold text-neutral-800">{record.paymentType || 'Cash'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t border-neutral-100 font-mono text-xs">
          <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1.5 border-t border-neutral-200">
            <span>Total Disbursed:</span>
            <span className="text-base font-extrabold text-neutral-900">
              ₦{record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 mt-3">
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-800 shadow-2xs cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Voucher</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs text-white font-bold shadow-xs cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
