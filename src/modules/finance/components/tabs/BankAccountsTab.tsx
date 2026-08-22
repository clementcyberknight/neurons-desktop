import React from 'react'
import type { BankAccountRecord } from '@/types/database'
import { Plus, Landmark } from 'lucide-react'

interface BankAccountsTabProps {
  bankAccounts: BankAccountRecord[]
  totalLiquidMoney: number
  onOpenAddBank: () => void
}

export const BankAccountsTab: React.FC<BankAccountsTabProps> = ({
  bankAccounts,
  totalLiquidMoney,
  onOpenAddBank,
}) => {
  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
        <div>
          <h4 className="text-sm font-bold text-emerald-950">
            Total Liquid Business Funds: ₦{totalLiquidMoney.toLocaleString()}
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Live aggregated balances across commercial banks, POS accounts & physical store safe.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddBank}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-900 hover:bg-black text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {bankAccounts.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase font-mono text-neutral-400">
                  {b.accountType === 'bank'
                    ? 'Commercial Bank'
                    : b.accountType === 'pos_terminal'
                    ? 'POS Terminal'
                    : 'Cash Drawer'}
                </span>
                <h4 className="text-sm font-bold text-neutral-900 mt-1">{b.bankName}</h4>
                <p className="text-xs font-mono text-neutral-500 mt-0.5">{b.accountNumber}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <Landmark className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-neutral-100 flex items-baseline justify-between">
              <span className="text-xs text-neutral-500 font-medium">Available Balance</span>
              <span className="text-xl font-bold font-mono text-neutral-900">
                ₦{b.balance.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
