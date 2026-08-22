import React from 'react'
import type { FinanceRecord } from '@/types/database'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface PnlTabProps {
  records: FinanceRecord[]
}

export const PnlTab: React.FC<PnlTabProps> = ({ records }) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900">
          Income & Operational Outflows Ledger
        </h3>
        <span className="text-xs text-neutral-500 font-mono">
          {records.length} recorded entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Type</th>
              <th className="pb-3 font-semibold">Category</th>
              <th className="pb-3 font-semibold">Description</th>
              <th className="pb-3 font-semibold text-right">Amount (₦)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-sans">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                <td className="py-3 font-mono text-neutral-500">{r.transactionDate}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                      r.type === 'income'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {r.type === 'income' ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {r.type}
                  </span>
                </td>
                <td className="py-3 font-medium text-neutral-800">{r.category}</td>
                <td className="py-3 text-neutral-600">{r.description}</td>
                <td
                  className={`py-3 text-right font-mono font-bold ${
                    r.type === 'income' ? 'text-emerald-600' : 'text-neutral-900'
                  }`}
                >
                  {r.type === 'income' ? '+' : '-'}₦
                  {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-400">
                  No ledger records recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
