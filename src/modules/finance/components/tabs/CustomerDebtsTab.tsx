import React from 'react'
import type { CustomerDebtRecord } from '@/types/database'
import { Plus, CheckCircle2 } from 'lucide-react'

interface CustomerDebtsTabProps {
  debts: CustomerDebtRecord[]
  totalCustomerDebtOwed: number
  onOpenAddDebt: () => void
  onReceivePayment: (debt: CustomerDebtRecord) => void
}

export const CustomerDebtsTab: React.FC<CustomerDebtsTabProps> = ({
  debts,
  totalCustomerDebtOwed,
  onOpenAddDebt,
  onReceivePayment,
}) => {
  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
        <div>
          <h4 className="text-sm font-bold text-amber-950">
            Total Uncollected Customer Credit: ₦{totalCustomerDebtOwed.toLocaleString()}
          </h4>
          <p className="text-xs text-amber-800 mt-0.5">
            Track customers who purchased on credit and record payments when collected.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddDebt}
          className="flex items-center gap-1.5 rounded-xl bg-amber-900 hover:bg-black text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Customer Debt</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold">Description / Goods</th>
              <th className="pb-3 font-semibold">Total Credit</th>
              <th className="pb-3 font-semibold">Paid</th>
              <th className="pb-3 font-semibold">Balance Due</th>
              <th className="pb-3 font-semibold">Due Date</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {debts.map((d) => (
              <tr key={d.id} className="hover:bg-neutral-50">
                <td className="py-3 font-semibold text-neutral-900">
                  <div>{d.customerName}</div>
                  {d.customerPhone && (
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {d.customerPhone}
                    </div>
                  )}
                </td>
                <td className="py-3 text-neutral-600">{d.description}</td>
                <td className="py-3 font-mono font-medium">₦{d.totalAmount.toLocaleString()}</td>
                <td className="py-3 font-mono text-emerald-600">₦{d.amountPaid.toLocaleString()}</td>
                <td className="py-3 font-mono font-bold text-red-600">₦{d.balanceDue.toLocaleString()}</td>
                <td className="py-3 font-mono text-neutral-500">{d.dueDate}</td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                      d.status === 'settled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : d.status === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {d.status !== 'settled' ? (
                    <button
                      type="button"
                      onClick={() => onReceivePayment(d)}
                      className="rounded-lg bg-black hover:bg-neutral-800 text-white px-2.5 py-1 text-xs font-semibold cursor-pointer"
                    >
                      Receive Payment
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Settled
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {debts.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-neutral-400">
                  No customer debt records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
