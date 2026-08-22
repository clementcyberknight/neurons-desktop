import React from 'react'
import { Modal } from '@/components/ui/Modal'
import type { POSTransaction } from '@/types/database'
import { Check, Printer } from 'lucide-react'

interface ReceiptModalProps {
  transaction: POSTransaction | null
  onClose: () => void
  onPrint?: () => void
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  onPrint = () => window.print(),
}) => {
  if (!transaction) return null

  return (
    <Modal
      open={!!transaction}
      onClose={onClose}
      maxWidth="sm"
      title="Payment Successful!"
      subtitle={transaction.receiptNumber}
      icon={
        <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center">
          <Check className="h-4 w-4 stroke-[3]" />
        </div>
      }
    >
      <div className="space-y-3 text-xs font-mono">
        <div className="flex justify-between text-neutral-500">
          <span>Date/Time:</span>
          <span className="text-neutral-900">
            {new Date(transaction.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Cashier:</span>
          <span className="text-neutral-900">{transaction.cashierName}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Payment Method:</span>
          <span className="text-neutral-900 uppercase font-bold">
            {transaction.paymentMethod}
          </span>
        </div>

        <div className="border-t border-b border-neutral-200 py-2 my-2 space-y-1.5">
          {transaction.items.map((it, idx) => (
            <div key={idx} className="flex justify-between text-xs font-sans">
              <span className="truncate max-w-[180px] font-medium">
                {it.name} × {it.quantity}
              </span>
              <span className="font-mono font-bold">₦{it.subtotal.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1">
          <span>TOTAL PAID</span>
          <span>
            ₦{transaction.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={onPrint}
          className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Print Receipt</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl bg-black hover:bg-neutral-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
        >
          New Sale
        </button>
      </div>
    </Modal>
  )
}
