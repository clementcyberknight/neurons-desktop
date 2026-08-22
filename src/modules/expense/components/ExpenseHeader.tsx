import React from 'react'
import { Plus } from 'lucide-react'
import iconReport from '@/assets/icons-pack/Receipt--Streamline-Plump.png'

interface ExpenseHeaderProps {
  onOpenCreate: () => void
}

export const ExpenseHeader: React.FC<ExpenseHeaderProps> = ({ onOpenCreate }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        <img src={iconReport} alt="Expense" className="h-9 w-9 object-contain" />
        <div>
          <h1 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
            Expense Ledger & Spending Management
          </h1>
          <p className="text-xs text-neutral-500">
            Track and categorize business costs, wholesale restocks, and operational bills
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>
    </div>
  )
}
