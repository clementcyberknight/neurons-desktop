import React from 'react'
import type { InvoiceRecord } from '@/types/database'
import { Printer, X } from 'lucide-react'

interface PrintInvoiceModalProps {
  invoice: InvoiceRecord | null
  onClose: () => void
  onPrint?: () => void
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  invoice,
  onClose,
  onPrint = () => window.print(),
}) => {
  if (!invoice) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl border border-neutral-200 text-neutral-900 my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Invoice Print Sheet */}
        <div className="border-b-2 border-neutral-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
              COMMERCIAL INVOICE
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-sm text-neutral-900">Neurons Enterprise</span>
            <p className="text-[11px] text-neutral-500">Wholesale & Production Depot</p>
            <p className="text-[11px] text-neutral-500 font-mono">Date: {invoice.issueDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono">
              Billed To:
            </span>
            <h4 className="font-bold text-neutral-900 text-sm mt-0.5">{invoice.customerName}</h4>
            {invoice.customerPhone && (
              <p className="text-neutral-500 font-mono">{invoice.customerPhone}</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono">
              Payment Terms:
            </span>
            <p className="font-semibold text-neutral-900 mt-0.5">Due by: {invoice.dueDate}</p>
            <p className="text-neutral-500 uppercase font-mono text-[10px]">
              Status: {invoice.status}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left text-xs mb-6 border border-neutral-200 rounded-xl overflow-hidden">
          <thead className="bg-neutral-100 text-neutral-600 font-mono">
            <tr>
              <th className="p-2.5 font-semibold">Item Description</th>
              <th className="p-2.5 font-semibold text-center">Qty</th>
              <th className="p-2.5 font-semibold text-right">Unit Price</th>
              <th className="p-2.5 font-semibold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invoice.items.map((it, idx) => (
              <tr key={idx}>
                <td className="p-2.5 font-medium text-neutral-900">{it.description}</td>
                <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                <td className="p-2.5 text-right font-mono">₦{it.unitPrice.toLocaleString()}</td>
                <td className="p-2.5 text-right font-mono font-bold">
                  ₦{it.subtotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-start pt-2 border-t border-neutral-200 text-xs">
          <div className="max-w-xs text-[11px] text-neutral-500">
            <strong className="text-neutral-800 block mb-0.5">Payment Instructions:</strong>
            <p>{invoice.notes}</p>
          </div>

          <div className="text-right space-y-1 font-mono">
            <div className="text-neutral-500 text-xs">Total Due:</div>
            <div className="text-xl font-extrabold text-neutral-900">
              ₦{invoice.totalAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-black hover:bg-neutral-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
