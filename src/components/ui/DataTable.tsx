import React, { useState, useEffect, useCallback } from 'react'
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// ─── Column Definition ───────────────────────────────────────────────
export interface DataTableColumn<T> {
  /** Unique key for this column */
  key: string
  /** Header label text */
  header: string
  /** Text alignment ('left' by default) */
  align?: 'left' | 'right' | 'center'
  /** Custom render function for cell content */
  render: (item: T, index: number) => React.ReactNode
}

// ─── Action Menu Item ────────────────────────────────────────────────
export interface DataTableAction<T> {
  /** Display label */
  label: string
  /** Icon element (e.g. <Eye className="h-3.5 w-3.5" />) */
  icon: React.ReactNode
  /** Callback when clicked */
  onClick: (item: T) => void
  /** 'danger' renders red text; 'default' renders neutral */
  variant?: 'default' | 'danger'
  /** If true, a separator line is rendered BEFORE this action */
  separator?: boolean
}

// ─── Pagination Props ────────────────────────────────────────────────
export interface DataTablePagination {
  currentPage: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  /** Label for the count display (e.g. "expenses", "transactions") */
  label?: string
}

// ─── Main DataTable Props ────────────────────────────────────────────
export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[]
  /** Data for the current page */
  data: T[]
  /** Extract unique ID from each item */
  getItemId: (item: T) => string
  /** Action menu items for the three-dot button */
  actions?: DataTableAction<T>[]
  /** Pagination configuration */
  pagination?: DataTablePagination
  /** Icon element for the empty state */
  emptyIcon?: React.ReactNode
  /** Title text for the empty state */
  emptyTitle?: string
  /** Description text for the empty state */
  emptyDescription?: string
  /** Optional title rendered above the table */
  title?: string
  /** Optional subtitle rendered below the title */
  subtitle?: string
}

// ─── Component ───────────────────────────────────────────────────────
export function DataTable<T>({
  columns,
  data,
  getItemId,
  actions,
  pagination,
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDescription,
  title,
  subtitle,
}: DataTableProps<T>) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const hasActions = actions && actions.length > 0
  const colSpan = columns.length + (hasActions ? 1 : 0)

  // Pagination calculations
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize))
    : 1
  const startIndex = pagination
    ? pagination.totalCount === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.pageSize + 1
    : 0
  const endIndex = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)
    : 0
  const label = pagination?.label || 'entries'

  return (
    <div className="flex-1 min-h-[380px] rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
      {/* Optional Title */}
      {title && (
        <div className="mb-4">
          <h2 className="text-base font-bold text-neutral-900">{title}</h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Scrollable Table Area */}
      <div className="overflow-x-auto min-h-[260px] pb-16 flex-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`pb-3 font-semibold ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="pb-3 font-semibold text-right pr-3">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-12 text-center text-neutral-400">
                  {emptyIcon && (
                    <div className="mx-auto mb-2 opacity-30 flex justify-center">
                      {emptyIcon}
                    </div>
                  )}
                  <p className="text-xs font-semibold text-neutral-600">{emptyTitle}</p>
                  {emptyDescription && (
                    <p className="text-[11px] text-neutral-400 mt-0.5">{emptyDescription}</p>
                  )}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const itemId = getItemId(item)
                const isMenuOpen = activeMenuId === itemId
                const openUpward =
                  idx > 0 && (data.length <= 4 || idx >= data.length - 2)

                return (
                  <tr key={itemId} className="hover:bg-neutral-50/80 transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-3 ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : ''
                        }`}
                      >
                        {col.render(item, idx)}
                      </td>
                    ))}

                    {/* 3-Dot Action Button & Menu */}
                    {hasActions && (
                      <td className="py-3 text-right pr-2 relative">
                        <div className="inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuId(isMenuOpen ? null : itemId)
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isMenuOpen
                                ? 'bg-neutral-900 text-white border-neutral-900'
                                : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-200 shadow-2xs'
                            }`}
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              className={`absolute right-2 ${
                                openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                              } w-44 rounded-xl bg-white border border-neutral-200 shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}
                            >
                              {actions!.map((action, actionIdx) => (
                                <React.Fragment key={actionIdx}>
                                  {action.separator && (
                                    <div className="my-1 border-t border-neutral-100" />
                                  )}
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null)
                                      action.onClick(item)
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                      action.variant === 'danger'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                                    }`}
                                  >
                                    <span
                                      className={
                                        action.variant === 'danger'
                                          ? 'text-red-500'
                                          : 'text-neutral-500'
                                      }
                                    >
                                      {action.icon}
                                    </span>
                                    <span>{action.label}</span>
                                  </button>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-neutral-500 font-medium">
            Showing{' '}
            <span className="font-bold text-neutral-800">{startIndex}</span> to{' '}
            <span className="font-bold text-neutral-800">{endIndex}</span> of{' '}
            <span className="font-bold text-neutral-800">{pagination.totalCount}</span>{' '}
            {label}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Page Size Select */}
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span>Show:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                className="rounded-lg bg-neutral-50 border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-700 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Prev / Next Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  pagination.onPageChange(Math.max(1, pagination.currentPage - 1))
                }
                disabled={pagination.currentPage <= 1}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-700 cursor-pointer shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <span className="px-2 font-mono font-semibold text-neutral-800">
                Page {pagination.currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  pagination.onPageChange(
                    Math.min(totalPages, pagination.currentPage + 1)
                  )
                }
                disabled={pagination.currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-700 cursor-pointer shadow-2xs"
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
