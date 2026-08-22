import React from 'react'
import { Modal } from '@/components/ui/Modal'
import type { FinanceRecord } from '@/types/database'
import { Scale, Printer } from 'lucide-react'

interface CashbookDetailModalProps {
  record: FinanceRecord | null
  onClose: () => void
}

export const CashbookDetailModal: React.FC<CashbookDetailModalProps> = ({
  record,
  onClose,
}) => {
  if (!record) return null

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      maxWidth="md"
      icon={<Scale className="h-5 w-5 text-[#f97316]" />}
      title="Cashbook Transaction Record"
    >
      <div className="space-y-3 text-xs">
        <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-1">
          <div className="text-[10px] text-neutral-400 uppercase font-mono">Description</div>
          <div className="text-sm font-bold text-neutral-900">{record.description}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <div className="text-[10px] text-neutral-400 uppercase">Type</div>
            <div className="font-bold text-neutral-800 mt-0.5">
              {record.type === 'income' ? 'Debit (Inflow)' : 'Credit (Outflow)'}
            </div>
          </div>

          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <div className="text-[10px] text-neutral-400 uppercase">Date</div>
            <div className="font-bold text-neutral-800 mt-0.5">{record.transactionDate}</div>
          </div>

          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <div className="text-[10px] text-neutral-400 uppercase">Ledger Tag</div>
            <div className="font-bold text-neutral-800 mt-0.5">{record.category}</div>
          </div>

          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <div className="text-[10px] text-neutral-400 uppercase">Reference</div>
            <div className="font-bold text-neutral-800 mt-0.5">{record.referenceId || 'N/A'}</div>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 flex justify-between items-center font-mono">
          <span className="text-xs text-neutral-500">Transaction Amount:</span>
          <span
            className={`text-base font-black ${
              record.type === 'income' ? 'text-[#2563eb]' : 'text-[#ef4444]'
            }`}
          >
            {record.type === 'income' ? '+/ ' : '- '}₦
            {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 mt-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-800 shadow-2xs cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Record</span>
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
