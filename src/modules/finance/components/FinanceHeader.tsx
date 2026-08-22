import React from 'react'
import { Plus } from 'lucide-react'

export type TimeFilterPeriod = 'month' | 'quarter' | 'all'

interface FinanceHeaderProps {
  timeFilter: TimeFilterPeriod
  onTimeFilterChange: (filter: TimeFilterPeriod) => void
  onOpenRecordEntry: () => void
}

export const FinanceHeader: React.FC<FinanceHeaderProps> = ({
  timeFilter,
  onTimeFilterChange,
  onOpenRecordEntry,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
          Financial Health & Profit
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          SME Profit & Loss, customer debt book, supplier payables, and liquid bank balances
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Period Filter */}
        <div className="flex items-center rounded-xl border border-neutral-200 bg-white p-1 text-xs">
          <button
            type="button"
            onClick={() => onTimeFilterChange('month')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              timeFilter === 'month'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => onTimeFilterChange('quarter')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              timeFilter === 'quarter'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Quarter
          </button>
          <button
            type="button"
            onClick={() => onTimeFilterChange('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            All Time
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenRecordEntry}
          className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Record Entry</span>
        </button>
      </div>
    </div>
  )
}
