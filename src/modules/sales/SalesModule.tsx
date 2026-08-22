import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { POSTransaction } from '@/types/database'
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { SalesHeader } from './components/SalesHeader'
import { SalesMetrics } from './components/SalesMetrics'
import { SalesFilters, type SalesStatusFilter } from './components/SalesFilters'
import { SalesReceiptModal } from './components/SalesReceiptModal'
import { SalesEditModal, type EditSalesFormData } from './components/SalesEditModal'
import {
  AlertTriangle,
  Receipt,
  Eye,
  CheckCircle,
  CreditCard,
  Banknote,
  Layers,
  Pencil,
  Trash2,
} from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

export const SalesModule: React.FC<Props> = ({ searchQuery = '' }) => {
  const [statusFilter, setStatusFilter] = useState<SalesStatusFilter>('all')
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
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    const timer = setTimeout(() => setToastMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [])

  // Edit form state
  const [editFormData, setEditFormData] = useState<EditSalesFormData>({
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
    // 1. Streaming KPI aggregation (Single pass, zero 100k array allocation) - AGENTS.md §5.2
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

    // 2. Query with indexed filtering & database-level offset/limit - AGENTS.md §5.1
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
      const collection =
        statusFilter !== 'all'
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
            Boolean(
              txn.items?.some(
                (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
              )
            )
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

  // Open Edit Modal
  const handleOpenEdit = useCallback((txn: POSTransaction) => {
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
  }, [])

  // Save Edit Execution
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTxn) return

    const now = Date.now()
    const discountAmt = Math.round(
      (editingTxn.subtotal * (Number(editFormData.discountPercent) || 0)) / 100
    )
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
      hasManualOverride: Boolean(
        editFormData.overrideReason || Number(editFormData.discountPercent) > 0
      ),
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

  // ─── DataTable Column Definitions ────────────────────────────────
  const salesColumns: DataTableColumn<POSTransaction>[] = useMemo(
    () => [
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
            {new Date(txn.createdAt).toLocaleDateString()}{' '}
            {new Date(txn.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
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
            {txn.paymentMethod === 'split' && (
              <Layers className="h-2.5 w-2.5 text-emerald-600" />
            )}
            {txn.paymentMethod === 'bank_transfer'
              ? 'Transfer'
              : txn.paymentMethod === 'store_credit'
              ? 'Credit'
              : txn.paymentMethod === 'split'
              ? 'Split'
              : txn.paymentMethod}
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
    ],
    []
  )

  const salesActions: DataTableAction<POSTransaction>[] = useMemo(
    () => [
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
    ],
    [handleOpenEdit]
  )

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar relative">
      {/* In-App Toast Notification Banner */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      {/* 1. Top Banner & KPI Summary */}
      <div>
        <SalesHeader />
        <SalesMetrics
          totalSalesRevenue={totalSalesRevenue}
          totalTransactionsCount={totalTransactionsCount}
          avgBasket={avgBasket}
          flaggedCount={flaggedCount}
        />
      </div>

      {/* 2. Filter & Search Bar */}
      <SalesFilters
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        methodFilter={methodFilter}
        onMethodFilterChange={setMethodFilter}
      />

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
      <SalesReceiptModal
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />

      {/* 5. MODAL: Edit Transaction */}
      <SalesEditModal
        transaction={editingTxn}
        formData={editFormData}
        setFormData={setEditFormData}
        onClose={() => setEditingTxn(null)}
        onSubmit={handleSaveEdit}
      />

      {/* 6. MODAL: Delete Confirmation */}
      <ConfirmDeleteModal
        open={!!deletingTxn}
        title="Delete Sales Record?"
        description={
          deletingTxn ? (
            <p>
              Are you sure you want to remove{' '}
              <strong className="text-neutral-800">{deletingTxn.receiptNumber}</strong> (Total:{' '}
              <strong className="text-neutral-800 font-mono">
                ₦{deletingTxn.totalAmount.toLocaleString()}
              </strong>
              ) from the transaction ledger?
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
export default SalesModule
