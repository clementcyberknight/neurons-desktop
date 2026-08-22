import React from 'react'
import { Download, Plus } from 'lucide-react'

interface CashbookHeaderProps {
  onExportCSV: () => void
  onOpenCreate: () => void
}

export const CashbookHeader: React.FC<CashbookHeaderProps> = ({
  onExportCSV,
  onOpenCreate,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
          Standard Cashbook
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Monitor financial health with real-time debit and credit tracking.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Export Ledger Button */}
        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Download className="h-4 w-4 text-neutral-500" />
          <span>Export Ledger</span>
        </button>

        {/* Add Transaction Button */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2.5 text-xs font-extrabold transition-all shadow-md shadow-orange-500/25 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Transaction</span>
        </button>
      </div>
    </div>
  )
}
