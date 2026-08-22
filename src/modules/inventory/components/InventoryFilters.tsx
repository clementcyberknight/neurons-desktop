import React from 'react'
import { Search, X } from 'lucide-react'

export const DEFAULT_SUPPLIERS = [
  'Emzor Pharmaceuticals Ltd',
  'Fidson Healthcare Plc',
  'May & Baker Nigeria',
  'Unilever Nigeria Plc',
  'Nestlé Nigeria',
  'Chi Limited',
  'Dangote Consumer Goods',
  'Innoson Industrial Supplies',
  'Direct Overseas Distributor',
]

export const DEFAULT_CATEGORIES = [
  'Pharmaceuticals & OTC',
  'FMCG & Groceries',
  'Medical Supplies & PPE',
  'Consumer Electronics',
  'Beverages & Drinks',
  'Personal Care & Cosmetics',
  'Packaging & Raw Materials',
]

export const DEFAULT_UNITS = [
  'Packs',
  'Boxes',
  'Bottles',
  'Units / Pcs',
  'Cartons',
  'Rolls',
  'Kilograms (kg)',
  'Litres (L)',
  'Gallons',
  'Sacks',
]

export const DEFAULT_SALES_CHANNELS = [
  'Main Warehouse - Central Floor',
  'Retail Store Branch - Ikeja',
  'Retail Store Branch - Lekki',
  'Regional Depot - Abuja',
  'Wholesale Distribution Hub',
  'Direct POS Terminal 1',
]

export type ProductTypeFilter = 'ALL' | 'Finished Good' | 'Raw Material'
export type StockStatusFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

interface InventoryFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  typeFilter: ProductTypeFilter
  onTypeFilterChange: (val: ProductTypeFilter) => void
  categoryFilter: string
  onCategoryFilterChange: (val: string) => void
  statusFilter: StockStatusFilter
  onStatusFilterChange: (val: StockStatusFilter) => void
  lowStockCount: number
  onResetFilters: () => void
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  lowStockCount,
  onResetFilters,
}) => {
  const hasActiveFilters =
    typeFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || Boolean(searchQuery)

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by name, SKU, brand, supplier..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50/50 text-xs text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Product Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as ProductTypeFilter)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="Finished Good">Finished Goods</option>
            <option value="Raw Material">Raw Materials</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer max-w-[160px]"
          >
            <option value="ALL">All Categories</option>
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Health Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StockStatusFilter)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Stock Status</option>
            <option value="IN_STOCK">In Stock (Healthy)</option>
            <option value="LOW_STOCK">Low Stock Alert ({lowStockCount})</option>
            <option value="OUT_OF_STOCK">Out of Stock (0 Units)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 text-[11px] text-neutral-500 font-mono flex-wrap">
          <span>Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-neutral-800 font-sans">
              Search: "{searchQuery}"
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-600"
                onClick={() => onSearchChange('')}
              />
            </span>
          )}
          {typeFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 font-sans">
              Type: {typeFilter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-600"
                onClick={() => onTypeFilterChange('ALL')}
              />
            </span>
          )}
          {categoryFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 font-sans">
              Category: {categoryFilter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-600"
                onClick={() => onCategoryFilterChange('ALL')}
              />
            </span>
          )}
          {statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 font-sans">
              Status: {statusFilter.replace('_', ' ')}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-600"
                onClick={() => onStatusFilterChange('ALL')}
              />
            </span>
          )}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-red-600 hover:underline font-sans text-xs ml-auto cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
