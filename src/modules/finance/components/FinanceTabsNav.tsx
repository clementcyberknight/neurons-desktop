import React from 'react'
import { TrendingUp, Users, Building2, Landmark, FileText } from 'lucide-react'

export type FinanceTabKey = 'pnl' | 'debts' | 'payables' | 'accounts' | 'invoices'

interface FinanceTabsNavProps {
  activeTab: FinanceTabKey
  onTabChange: (tab: FinanceTabKey) => void
  unsettledDebtsCount: number
  unsettledPayablesCount: number
}

export const FinanceTabsNav: React.FC<FinanceTabsNavProps> = ({
  activeTab,
  onTabChange,
  unsettledDebtsCount,
  unsettledPayablesCount,
}) => {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200/70 text-xs font-bold">
      <button
        type="button"
        onClick={() => onTabChange('pnl')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer text-center ${
          activeTab === 'pnl'
            ? 'bg-black text-white shadow-xs'
            : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
        }`}
      >
        <TrendingUp className="h-4 w-4 shrink-0" />
        <span className="truncate">Profit & Loss Ledger</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('debts')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer text-center ${
          activeTab === 'debts'
            ? 'bg-black text-white shadow-xs'
            : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
        }`}
      >
        <Users className="h-4 w-4 shrink-0" />
        <span className="truncate">Customer Debt Book ({unsettledDebtsCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('payables')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer text-center ${
          activeTab === 'payables'
            ? 'bg-black text-white shadow-xs'
            : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
        }`}
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="truncate">Supplier Payables ({unsettledPayablesCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('accounts')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer text-center ${
          activeTab === 'accounts'
            ? 'bg-black text-white shadow-xs'
            : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
        }`}
      >
        <Landmark className="h-4 w-4 shrink-0" />
        <span className="truncate">Bank & Cash Balances</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('invoices')}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer text-center ${
          activeTab === 'invoices'
            ? 'bg-black text-white shadow-xs'
            : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
        }`}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">Wholesale Invoices</span>
      </button>
    </div>
  )
}
