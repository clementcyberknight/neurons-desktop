import React from 'react'
import type { InvoiceRecord } from '@/types/database'
import { Plus, Printer, FileText } from 'lucide-react'

interface WholesaleInvoicesTabProps {
  invoices: InvoiceRecord[]
  onOpenCreateInvoice: () => void
  onViewPrintInvoice: (invoice: InvoiceRecord) => void
}

export const WholesaleInvoicesTab: React.FC<WholesaleInvoicesTabProps> = ({
  invoices,
  onOpenCreateInvoice,
  onViewPrintInvoice,
}) => {
  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-100 border border-neutral-200 rounded-2xl p-4">
        <div>
          <h4 className="text-sm font-bold text-neutral-900">Wholesale Customer Invoicing</h4>
          <p className="text-xs text-neutral-500 mt-0.5">
            Generate printable business invoices with your bank payment details.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateInvoice}
          className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
              <th className="pb-3 font-semibold">Invoice #</th>
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold">Issue Date</th>
              <th className="pb-3 font-semibold">Due Date</th>
              <th className="pb-3 font-semibold">Total Amount</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-neutral-50">
                <td className="py-3 font-mono font-bold text-neutral-900">{inv.invoiceNumber}</td>
                <td className="py-3 font-medium text-neutral-800">{inv.customerName}</td>
                <td className="py-3 font-mono text-neutral-500">{inv.issueDate}</td>
                <td className="py-3 font-mono text-neutral-500">{inv.dueDate}</td>
                <td className="py-3 font-mono font-bold text-neutral-900">
                  ₦{inv.totalAmount.toLocaleString()}
                </td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                      inv.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onViewPrintInvoice(inv)}
                    className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>View & Print</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="p-8 text-center text-neutral-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-neutral-600">
              No wholesale invoices generated yet
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Click "Create Invoice" above to issue an invoice to a customer.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
