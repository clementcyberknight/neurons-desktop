import React from 'react'
import { Search, Filter } from 'lucide-react'

export const EXPENSE_TYPES = [
  'Administrative',
  'Inventory Restock',
  'Salaries & Payroll',
  'Rent & Utilities',
  'Maintenance',
  'Logistics & Delivery',
  'Marketing & Promo',
  'Taxes & Levies',
  'Miscellaneous',
] as const

export const PAYMENT_TYPES = ['Cash', 'Bank Transfer', 'Card', 'Store Credit', 'Split Payment'] as const
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Approved'] as const

interface ExpenseFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  selectedCategory: string
  onCategoryChange: (val: string) => void
  methodFilter: string
  onMethodChange: (val: string) => void
  statusFilter: string
  onStatusChange: (val: string) => void
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  methodFilter,
  onMethodChange,
  statusFilter,
  onStatusChange,
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
            placeholder="Search purpose, recipient, or category..."
            className="h-9 w-full rounded-xl bg-neutral-50 border border-neutral-200 pl-9 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5 text-neutral-400" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Expense Types</option>
            {EXPENSE_TYPES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => onMethodChange(e.target.value)}
          className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none cursor-pointer"
        >
          <option value="all">All Payment Methods</option>
          {PAYMENT_TYPES.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
        </select>

        {/* Payment Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {PAYMENT_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
