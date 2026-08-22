import React from 'react'
import { Modal } from '@/components/ui/Modal'
import type { POSTransaction } from '@/types/database'
import { Printer, Layers, AlertTriangle } from 'lucide-react'
import iconSales from '@/assets/icons-pack/Shopping-Cart-2--Streamline-Plump.png'

interface SalesReceiptModalProps {
  transaction: POSTransaction | null
  onClose: () => void
  onPrint?: () => void
}

export const SalesReceiptModal: React.FC<SalesReceiptModalProps> = ({
  transaction,
  onClose,
  onPrint = () => window.print(),
}) => {
  if (!transaction) return null

  return (
    <Modal
      open={!!transaction}
      onClose={onClose}
      maxWidth="md"
      title="Receipt Details"
      icon={<img src={iconSales} alt="Sales" className="h-5 w-5 object-contain" />}
    >
      <div className="space-y-3 text-xs">
        <div className="flex justify-between font-mono bg-neutral-50 p-3 rounded-xl border border-neutral-200">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Receipt No:</div>
            <div className="font-bold text-neutral-900">{transaction.receiptNumber}</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {transaction.posStation} • {transaction.cashierName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-400 uppercase">Date:</div>
            <div className="text-neutral-800">
              {new Date(transaction.createdAt).toLocaleDateString()}
            </div>
            <div className="text-[11px] text-neutral-500">
              {new Date(transaction.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        <div>
          <span className="text-neutral-500 text-[11px] block mb-1 font-mono uppercase font-bold">
            Purchased Items:
          </span>
          <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto border border-neutral-200 rounded-xl p-2 bg-white no-scrollbar">
            {transaction.items?.map((item, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-neutral-900">{item.name}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {item.quantity} × ₦{item.unitPrice.toLocaleString()}
                  </div>
                </div>
                <div className="font-mono font-bold text-neutral-900">
                  ₦{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t border-neutral-100 font-mono text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal:</span>
            <span>
              ₦{transaction.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          {transaction.discountAmount > 0 && (
            <div className="flex justify-between text-amber-700 font-semibold">
              <span>Discount ({transaction.discountPercent}%):</span>
              <span>
                -₦{transaction.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1.5 border-t border-neutral-200">
            <span>Total Paid:</span>
            <span className="text-base font-extrabold text-neutral-900">
              ₦{transaction.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {transaction.paymentMethod === 'split' && transaction.splitBreakdown && (
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-2.5 text-emerald-950 font-mono text-[11px] space-y-1">
            <span className="font-bold block mb-1 font-sans text-xs flex items-center gap-1.5 text-emerald-900">
              <Layers className="h-3.5 w-3.5" /> Split Payment Breakdown:
            </span>
            {Boolean(transaction.splitBreakdown.cash) && (
              <div>• Cash: ₦{transaction.splitBreakdown.cash?.toLocaleString()}</div>
            )}
            {Boolean(transaction.splitBreakdown.transfer) && (
              <div>• Transfer: ₦{transaction.splitBreakdown.transfer?.toLocaleString()}</div>
            )}
            {Boolean(transaction.splitBreakdown.card) && (
              <div>• Card / POS: ₦{transaction.splitBreakdown.card?.toLocaleString()}</div>
            )}
            {Boolean(transaction.splitBreakdown.credit) && (
              <div>• Store Credit: ₦{transaction.splitBreakdown.credit?.toLocaleString()}</div>
            )}
          </div>
        )}

        {transaction.overrideReason && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-amber-900 text-xs">
            <span className="font-bold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" /> Override Justification:
            </span>
            <p className="mt-0.5">{transaction.overrideReason}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 mt-4">
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-800 shadow-2xs cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Receipt</span>
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
