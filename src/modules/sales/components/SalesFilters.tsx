import React from 'react'
import type { POSTransaction } from '@/types/database'
import { Search, Filter } from 'lucide-react'

export type SalesStatusFilter = 'all' | POSTransaction['status'] | 'pending'

interface SalesFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  statusFilter: SalesStatusFilter
  onStatusFilterChange: (val: SalesStatusFilter) => void
  methodFilter: string
  onMethodFilterChange: (val: string) => void
}

export const SalesFilters: React.FC<SalesFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  methodFilter,
  onMethodFilterChange,
}) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search receipt #, cashier, station, or item..."
            className="h-9 w-full rounded-xl bg-neutral-50 border border-neutral-200 pl-9 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as SalesStatusFilter)}
            className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="flagged">Flagged Overrides</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => onMethodFilterChange(e.target.value)}
          className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none cursor-pointer"
        >
          <option value="all">All Payment Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card / POS Terminal</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="credit">Store Credit</option>
          <option value="split">Split Payment</option>
        </select>
      </div>
    </div>
  )
}
