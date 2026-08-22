import React from 'react'
import type { SupplierPayableRecord } from '@/types/database'
import { Plus, CheckCircle2 } from 'lucide-react'

interface SupplierPayablesTabProps {
  payables: SupplierPayableRecord[]
  totalSupplierDebtOwed: number
  onOpenAddPayable: () => void
  onPaySupplier: (payable: SupplierPayableRecord) => void
}

export const SupplierPayablesTab: React.FC<SupplierPayablesTabProps> = ({
  payables,
  totalSupplierDebtOwed,
  onOpenAddPayable,
  onPaySupplier,
}) => {
  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
        <div>
          <h4 className="text-sm font-bold text-blue-950">
            Total Supplier Balances Owed: ₦{totalSupplierDebtOwed.toLocaleString()}
          </h4>
          <p className="text-xs text-blue-800 mt-0.5">
            Manage goods and raw materials collected on credit from distributors.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddPayable}
          className="flex items-center gap-1.5 rounded-xl bg-blue-900 hover:bg-black text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Supplier Payable</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
              <th className="pb-3 font-semibold">Supplier / Distributor</th>
              <th className="pb-3 font-semibold">Item / Restock Batch</th>
              <th className="pb-3 font-semibold">Total Amount</th>
              <th className="pb-3 font-semibold">Paid</th>
              <th className="pb-3 font-semibold">Balance Due</th>
              <th className="pb-3 font-semibold">Due Date</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {payables.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="py-3 font-semibold text-neutral-900">
                  <div>{p.supplierName}</div>
                  {p.supplierPhone && (
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {p.supplierPhone}
                    </div>
                  )}
                </td>
                <td className="py-3 text-neutral-600">{p.itemName}</td>
                <td className="py-3 font-mono font-medium">₦{p.totalAmount.toLocaleString()}</td>
                <td className="py-3 font-mono text-emerald-600">₦{p.amountPaid.toLocaleString()}</td>
                <td className="py-3 font-mono font-bold text-red-600">₦{p.balanceDue.toLocaleString()}</td>
                <td className="py-3 font-mono text-neutral-500">{p.dueDate}</td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                      p.status === 'settled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {p.status !== 'settled' ? (
                    <button
                      type="button"
                      onClick={() => onPaySupplier(p)}
                      className="rounded-lg bg-black hover:bg-neutral-800 text-white px-2.5 py-1 text-xs font-semibold cursor-pointer"
                    >
                      Pay Supplier
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Fully Paid
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {payables.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-neutral-400">
                  No supplier payable records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
