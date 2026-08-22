import React from 'react'
import { Search, X } from 'lucide-react'

interface CashbookFiltersProps {
  activeTab: 'all' | 'debit' | 'credit'
  onTabChange: (tab: 'all' | 'debit' | 'credit') => void
  dateFilter: string
  onDateFilterChange: (date: string) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
}

export const CashbookFilters: React.FC<CashbookFiltersProps> = ({
  activeTab,
  onTabChange,
  dateFilter,
  onDateFilterChange,
  searchQuery,
  onSearchQueryChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left Side: Ledger Filter Pills */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-neutral-100 p-1.5 border border-neutral-200/70 text-xs font-bold">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`rounded-xl px-4 py-2 transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-black text-white shadow-xs'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
          }`}
        >
          Full Ledger
        </button>

        <button
          type="button"
          onClick={() => onTabChange('debit')}
          className={`flex items-center gap-1 rounded-xl px-4 py-2 transition-all cursor-pointer ${
            activeTab === 'debit'
              ? 'bg-black text-white shadow-xs'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
          }`}
        >
          <span>↓</span>
          <span>Debit (Receipts)</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('credit')}
          className={`flex items-center gap-1 rounded-xl px-4 py-2 transition-all cursor-pointer ${
            activeTab === 'credit'
              ? 'bg-black text-white shadow-xs'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
          }`}
        >
          <span>↑</span>
          <span>Credit (Payments)</span>
        </button>
      </div>

      {/* Right Side: Date Picker & Search Input */}
      <div className="flex items-center gap-3">
        {/* Pick a Date Input */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="h-10 rounded-2xl bg-white border border-neutral-200 px-3.5 text-xs text-neutral-700 shadow-2xs focus:border-neutral-400 focus:outline-none cursor-pointer"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => onDateFilterChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
              title="Clear date filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search Ledger Entries */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search ledger entries..."
            className="h-10 w-full rounded-2xl bg-white border border-neutral-200 pl-9 pr-3.5 text-xs text-neutral-800 placeholder-neutral-400 shadow-2xs focus:border-neutral-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
