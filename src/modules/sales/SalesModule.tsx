import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { POSTransaction } from '@/types/database'
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import {
  Search,
  Filter,
  AlertTriangle,
  Receipt,
  Eye,
  CheckCircle,
  X,
  CreditCard,
  Banknote,
  Layers,
  Pencil,
  Trash2,
  Printer,
  RotateCcw,
  ArrowRightLeft,
  Store,
} from 'lucide-react'
import iconSales from '@/assets/icons-pack/Shopping-Cart-2--Streamline-Plump.png'
import iconReceipt from '@/assets/icons-pack/Receipt--Streamline-Plump.png'
import iconCashier from '@/assets/icons-pack/Cashier-Machine-2--Streamline-Plump.png'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

export const SalesModule: React.FC<Props> = ({ searchQuery = '' }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'flagged' | 'refunded' | 'pending'>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [localSearch, setLocalSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals state
  const [selectedTxn, setSelectedTxn] = useState<POSTransaction | null>(null)
  const [editingTxn, setEditingTxn] = useState<POSTransaction | null>(null)
  const [deletingTxn, setDeletingTxn] = useState<POSTransaction | null>(null)

  // In-App Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    receiptNumber: string
    cashierName: string
    posStation: string
    paymentMethod: POSTransaction['paymentMethod']
    status: POSTransaction['status']
    discountPercent: number
    overrideReason: string
  }>({
    receiptNumber: '',
    cashierName: '',
    posStation: '',
    paymentMethod: 'cash',
    status: 'completed',
    discountPercent: 0,
    overrideReason: '',
  })

  const activeSearch = searchQuery || localSearch

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, methodFilter, activeSearch, pageSize])

  // Scalable 100k+ Live Query: streaming KPI calculations + indexed DB pagination
  const {
    paginatedTransactions,
    totalCount,
    totalSalesRevenue,
    totalTransactionsCount,
    flaggedCount,
    avgBasket,
  } = useLiveQuery(async () => {
    // 1. Streaming KPI aggregation (Single pass, zero 100k array allocation)
    let revenue = 0
    let totalCountAll = 0
    let flagged = 0

    await db.transactions.each((txn) => {
      totalCountAll++
      if (txn.status !== 'refunded') {
        revenue += txn.totalAmount
      }
      if (txn.status === 'flagged' || txn.hasManualOverride) {
        flagged++
      }
    })

    const avg = totalCountAll > 0 ? Math.round(revenue / totalCountAll) : 0

    // 2. Query with indexed filtering & database-level offset/limit
    const q = activeSearch.trim().toLowerCase()
    let filteredCount = 0
    let matchingTransactions: POSTransaction[] = []

    if (statusFilter !== 'all' && methodFilter === 'all' && !q) {
      const collection = db.transactions.where('status').equals(statusFilter).reverse()
      filteredCount = await collection.count()
      matchingTransactions = await collection.offset((currentPage - 1) * pageSize).limit(pageSize).toArray()
    } else if (statusFilter === 'all' && methodFilter === 'all' && !q) {
      const collection = db.transactions.orderBy('createdAt').reverse()
      filteredCount = await collection.count()
      matchingTransactions = await collection.offset((currentPage - 1) * pageSize).limit(pageSize).toArray()
    } else {
      // Complex compound search & multi-field filter
      let collection = statusFilter !== 'all'
        ? db.transactions.where('status').equals(statusFilter).reverse()
        : db.transactions.orderBy('createdAt').reverse()

      const matches: POSTransaction[] = []
      await collection.each((txn) => {
        if (methodFilter !== 'all' && txn.paymentMethod !== methodFilter) {
          return
        }
        if (q) {
          const matchesSearch =
            txn.receiptNumber.toLowerCase().includes(q) ||
            txn.cashierName.toLowerCase().includes(q) ||
            txn.posStation.toLowerCase().includes(q) ||
            Boolean(txn.overrideReason && txn.overrideReason.toLowerCase().includes(q)) ||
            Boolean(txn.items?.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)))
          if (!matchesSearch) return
        }
        matches.push(txn)
      })

      filteredCount = matches.length
      const start = (currentPage - 1) * pageSize
      matchingTransactions = matches.slice(start, start + pageSize)
    }

    return {
      paginatedTransactions: matchingTransactions,
      totalCount: filteredCount,
      totalSalesRevenue: revenue,
      totalTransactionsCount: totalCountAll,
      flaggedCount: flagged,
      avgBasket: avg,
    }
  }, [statusFilter, methodFilter, activeSearch, currentPage, pageSize]) || {
    paginatedTransactions: [],
    totalCount: 0,
    totalSalesRevenue: 0,
    totalTransactionsCount: 0,
    flaggedCount: 0,
    avgBasket: 0,
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  // Open Edit Modal
  const handleOpenEdit = (txn: POSTransaction) => {
    setEditingTxn(txn)
    setEditFormData({
      receiptNumber: txn.receiptNumber,
      cashierName: txn.cashierName,
      posStation: txn.posStation,
      paymentMethod: txn.paymentMethod,
      status: txn.status,
      discountPercent: txn.discountPercent || 0,
      overrideReason: txn.overrideReason || '',
    })
  }

  // Save Edit Execution
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTxn) return

    const now = Date.now()
    const discountAmt = Math.round((editingTxn.subtotal * (Number(editFormData.discountPercent) || 0)) / 100)
    const newTotal = Math.max(0, editingTxn.subtotal - discountAmt)

    await db.transactions.update(editingTxn.id, {
      receiptNumber: editFormData.receiptNumber,
      cashierName: editFormData.cashierName,
      posStation: editFormData.posStation,
      paymentMethod: editFormData.paymentMethod,
      status: editFormData.status,
      discountPercent: Number(editFormData.discountPercent) || 0,
      discountAmount: discountAmt,
      totalAmount: newTotal,
      overrideReason: editFormData.overrideReason,
      hasManualOverride: Boolean(editFormData.overrideReason || Number(editFormData.discountPercent) > 0),
      updatedAt: now,
      synced: 0,
    })

    setEditingTxn(null)
    showToast(`Transaction ${editFormData.receiptNumber} updated successfully.`)
  }

  // Delete Execution
  const handleExecuteDelete = async () => {
    if (!deletingTxn) return
    const receipt = deletingTxn.receiptNumber
    await db.transactions.delete(deletingTxn.id)
    setDeletingTxn(null)
    showToast(`Sales record ${receipt} deleted from ledger.`)
  }

  const startRecordIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRecordIndex = Math.min(currentPage * pageSize, totalCount)

  // ─── DataTable Column Definitions ────────────────────────────────
  const salesColumns: DataTableColumn<POSTransaction>[] = useMemo(() => [
    {
      key: 'receiptNumber',
      header: 'Receipt No.',
      render: (txn) => (
        <span className="font-mono font-bold text-neutral-900">{txn.receiptNumber}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (txn) => (
        <span className="font-mono text-neutral-500 text-[11px]">
          {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'cashier',
      header: 'Cashier & Station',
      render: (txn) => (
        <div>
          <div className="font-semibold text-neutral-900">{txn.cashierName}</div>
          <div className="text-[10px] text-neutral-400 font-mono">{txn.posStation}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (txn) => (
        <span className="font-mono text-neutral-600">
          {txn.items?.length || 0} item{(txn.items?.length || 0) !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: (txn) => (
        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-mono text-neutral-800 uppercase font-semibold">
          {txn.paymentMethod === 'card' && <CreditCard className="h-2.5 w-2.5" />}
          {txn.paymentMethod === 'cash' && <Banknote className="h-2.5 w-2.5" />}
          {txn.paymentMethod === 'split' && <Layers className="h-2.5 w-2.5 text-emerald-600" />}
          {txn.paymentMethod === 'bank_transfer' ? 'Transfer' : txn.paymentMethod === 'store_credit' ? 'Credit' : txn.paymentMethod === 'split' ? 'Split' : txn.paymentMethod}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status / Override',
      render: (txn) => {
        const isFlagged = txn.status === 'flagged' || txn.hasManualOverride
        return isFlagged ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            <AlertTriangle className="h-2.5 w-2.5" />
            {txn.discountPercent}% Override
          </span>
        ) : txn.status === 'refunded' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700 font-mono uppercase">
            Refunded
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 font-mono uppercase">
            <CheckCircle className="h-2.5 w-2.5" />
            Completed
          </span>
        )
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right' as const,
      render: (txn) => (
        <span className="font-mono font-extrabold text-neutral-900">
          ₦{txn.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ], [])

  const salesActions: DataTableAction<POSTransaction>[] = useMemo(() => [
    {
      label: 'View Receipt',
      icon: <Eye className="h-3.5 w-3.5" />,
      onClick: (txn) => setSelectedTxn(txn),
    },
    {
      label: 'Edit Sale',
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (txn) => handleOpenEdit(txn),
    },
    {
      label: 'Delete Record',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (txn) => setDeletingTxn(txn),
      variant: 'danger' as const,
      separator: true,
    },
  ], [])

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar relative">
      {/* In-App Toast Notification Banner */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      {/* 1. Top Banner & KPI Summary */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={iconSales} alt="Sales" className="h-9 w-9 object-contain" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">Sales Records & Transaction Ledger</h1>
              <p className="text-xs text-neutral-500">Live offline point-of-sale checkout log with audit trails</p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Total Sales Volume</span>
              <img src={iconCashier} alt="POS" className="h-4 w-4 object-contain" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-900">
              ₦{totalSalesRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block font-mono">
              {totalTransactionsCount} total receipts recorded
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Average Basket Size</span>
              <Receipt className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-900">
              ₦{avgBasket.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block font-mono">Per checkout ticket</span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Manual Override Flags</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-900">
              {flaggedCount} <span className="text-xs font-normal text-neutral-500">flagged</span>
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block font-mono">Discounts & price overrides</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value as 'all' | POSTransaction['status'] | 'pending')}
              className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none"
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
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none"
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

      {/* 3. Transactions Table */}
      <DataTable<POSTransaction>
        columns={salesColumns}
        data={paginatedTransactions}
        getItemId={(txn) => txn.id}
        actions={salesActions}
        emptyIcon={<Receipt className="h-8 w-8" />}
        emptyTitle="No sales transactions found matching filters"
        pagination={{
          currentPage,
          pageSize,
          totalCount,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          label: 'sales records',
        }}
      />

      {/* 4. MODAL: Receipt Detail View */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedTxn(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <img src={iconSales} alt="Sales" className="h-5 w-5 object-contain" />
              <h3 className="text-sm font-bold text-neutral-900">Receipt Details</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-mono bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase">Receipt No:</div>
                  <div className="font-bold text-neutral-900">{selectedTxn.receiptNumber}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">{selectedTxn.posStation} • {selectedTxn.cashierName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-400 uppercase">Date:</div>
                  <div className="text-neutral-800">{new Date(selectedTxn.createdAt).toLocaleDateString()}</div>
                  <div className="text-[11px] text-neutral-500">{new Date(selectedTxn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 text-[11px] block mb-1 font-mono uppercase font-bold">Purchased Items:</span>
                <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto border border-neutral-200 rounded-xl p-2 bg-white no-scrollbar">
                  {selectedTxn.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-neutral-900">{item.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {item.quantity} × ₦{item.unitPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-neutral-900">
                        ₦{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-neutral-100 font-mono text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span>₦{selectedTxn.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {selectedTxn.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Discount ({selectedTxn.discountPercent}%):</span>
                    <span>-₦{selectedTxn.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1.5 border-t border-neutral-200">
                  <span>Total Paid:</span>
                  <span className="text-base font-extrabold text-neutral-900">
                    ₦{selectedTxn.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {selectedTxn.paymentMethod === 'split' && selectedTxn.splitBreakdown && (
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-2.5 text-emerald-950 font-mono text-[11px] space-y-1">
                  <span className="font-bold block mb-1 font-sans text-xs flex items-center gap-1.5 text-emerald-900">
                    <Layers className="h-3.5 w-3.5" /> Split Payment Breakdown:
                  </span>
                  {Boolean(selectedTxn.splitBreakdown.cash) && <div>• Cash: ₦{selectedTxn.splitBreakdown.cash?.toLocaleString()}</div>}
                  {Boolean(selectedTxn.splitBreakdown.transfer) && <div>• Transfer: ₦{selectedTxn.splitBreakdown.transfer?.toLocaleString()}</div>}
                  {Boolean(selectedTxn.splitBreakdown.card) && <div>• Card / POS: ₦{selectedTxn.splitBreakdown.card?.toLocaleString()}</div>}
                  {Boolean(selectedTxn.splitBreakdown.credit) && <div>• Store Credit: ₦{selectedTxn.splitBreakdown.credit?.toLocaleString()}</div>}
                </div>
              )}

              {selectedTxn.overrideReason && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-amber-900 text-xs">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-600" /> Override Justification:
                  </span>
                  <p className="mt-0.5">{selectedTxn.overrideReason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-800 shadow-2xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedTxn(null)}
                className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs text-white font-bold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Edit Transaction */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setEditingTxn(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Pencil className="h-4 w-4 text-neutral-700" />
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Edit Sales Record</h3>
                <p className="text-[11px] text-neutral-500 font-mono">{editingTxn.receiptNumber}</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Receipt Number</label>
                <input
                  type="text"
                  required
                  value={editFormData.receiptNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, receiptNumber: e.target.value })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-semibold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Cashier Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.cashierName}
                    onChange={(e) => setEditFormData({ ...editFormData, cashierName: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">POS Station</label>
                  <input
                    type="text"
                    required
                    value={editFormData.posStation}
                    onChange={(e) => setEditFormData({ ...editFormData, posStation: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value as POSTransaction['paymentMethod'] })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card / POS Terminal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit">Store Credit</option>
                    <option value="split">Split Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as POSTransaction['status'] })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    <option value="completed">Completed</option>
                    <option value="flagged">Flagged Override</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Discount % Override</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editFormData.discountPercent}
                  onChange={(e) => setEditFormData({ ...editFormData, discountPercent: Number(e.target.value) })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Override Reason / Audit Note</label>
                <textarea
                  rows={2}
                  value={editFormData.overrideReason}
                  onChange={(e) => setEditFormData({ ...editFormData, overrideReason: e.target.value })}
                  placeholder="e.g. Approved bulk discount for loyalty customer"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingTxn(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Delete Confirmation */}
      <ConfirmDeleteModal
        open={!!deletingTxn}
        title="Delete Sales Record?"
        description={
          deletingTxn ? (
            <p>
              Are you sure you want to remove <strong className="text-neutral-800">{deletingTxn.receiptNumber}</strong> (Total: <strong className="text-neutral-800 font-mono">₦{deletingTxn.totalAmount.toLocaleString()}</strong>) from the transaction ledger?
            </p>
          ) : null
        }
        confirmLabel="Delete Record"
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeletingTxn(null)}
      />
    </div>
  )
}
