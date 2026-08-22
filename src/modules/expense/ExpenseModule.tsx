import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { FinanceRecord } from '@/types/database'
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { ExpenseHeader } from './components/ExpenseHeader'
import { ExpenseMetrics } from './components/ExpenseMetrics'
import { ExpenseFilters, PAYMENT_TYPES, PAYMENT_STATUSES } from './components/ExpenseFilters'
import { ExpenseFormModal, type ExpenseFormData } from './components/ExpenseFormModal'
import { ExpenseVoucherModal } from './components/ExpenseVoucherModal'
import {
  CreditCard,
  Banknote,
  Layers,
  CheckCircle,
  Eye,
  Pencil,
  Trash2,
  Receipt,
} from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const INITIAL_FORM_DATA: ExpenseFormData = {
  expensePurpose: '',
  beneficiary: '',
  expenseType: 'Administrative',
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  paymentType: 'Cash',
  paymentStatus: 'Paid',
}

export const ExpenseModule: React.FC<Props> = ({ searchQuery = '' }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [localSearch, setLocalSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // In-App Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    const timer = setTimeout(() => setToastMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [])

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<FinanceRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<FinanceRecord | null>(null)

  // Form State
  const [formData, setFormData] = useState<ExpenseFormData>(INITIAL_FORM_DATA)

  const activeSearch = searchQuery || localSearch

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, statusFilter, methodFilter, activeSearch, pageSize])

  // Scalable 100k+ Live Query: streaming KPI aggregations + indexed DB pagination
  const {
    paginatedExpenses,
    totalCount,
    totalExpense,
    totalExpenseCount,
    topCategory,
    avgVoucherSize,
  } = useLiveQuery(async () => {
    // 1. Streaming KPI aggregation (Single pass cursor iteration - AGENTS.md §5.2)
    let totalSpend = 0
    let countAll = 0
    const categoryTotals: Record<string, number> = {}

    await db.finance.where('type').equals('expense').each((rec) => {
      countAll++
      totalSpend += rec.amount
      categoryTotals[rec.category] = (categoryTotals[rec.category] || 0) + rec.amount
    })

    const topCat: [string, number] = (Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    )[0] as [string, number]) || ['None', 0]
    const avg = countAll > 0 ? Math.round(totalSpend / countAll) : 0

    // 2. Query with indexed filtering & database-level offset/limit (AGENTS.md §5.1)
    const q = activeSearch.trim().toLowerCase()
    let filteredCount = 0
    let matchingExpenses: FinanceRecord[] = []

    if (selectedCategory === 'all' && statusFilter === 'all' && methodFilter === 'all' && !q) {
      const collection = db.finance.where('type').equals('expense').reverse()
      filteredCount = await collection.count()
      matchingExpenses = await collection.offset((currentPage - 1) * pageSize).limit(pageSize).toArray()
    } else {
      const matches: FinanceRecord[] = []
      const collection = db.finance.where('type').equals('expense').reverse()

      await collection.each((rec) => {
        if (selectedCategory !== 'all' && rec.category !== selectedCategory) {
          return
        }
        if (statusFilter !== 'all' && (rec.paymentStatus || 'Paid') !== statusFilter) {
          return
        }
        if (methodFilter !== 'all' && (rec.paymentType || 'Cash') !== methodFilter) {
          return
        }
        if (q) {
          const matchesSearch =
            rec.description.toLowerCase().includes(q) ||
            rec.category.toLowerCase().includes(q) ||
            Boolean(rec.beneficiary && rec.beneficiary.toLowerCase().includes(q)) ||
            Boolean(rec.referenceId && rec.referenceId.toLowerCase().includes(q)) ||
            rec.id.toLowerCase().includes(q)
          if (!matchesSearch) return
        }
        matches.push(rec)
      })

      filteredCount = matches.length
      const start = (currentPage - 1) * pageSize
      matchingExpenses = matches.slice(start, start + pageSize)
    }

    return {
      paginatedExpenses: matchingExpenses,
      totalCount: filteredCount,
      totalExpense: totalSpend,
      totalExpenseCount: countAll,
      topCategory: topCat,
      avgVoucherSize: avg,
    }
  }, [selectedCategory, statusFilter, methodFilter, activeSearch, currentPage, pageSize]) || {
    paginatedExpenses: [],
    totalCount: 0,
    totalExpense: 0,
    totalExpenseCount: 0,
    topCategory: ['None', 0] as [string, number],
    avgVoucherSize: 0,
  }

  // Open Create Modal
  const handleOpenCreate = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setEditingRecord(null)
    setShowAddModal(true)
  }, [])

  // Open Edit Modal
  const handleOpenEdit = useCallback((rec: FinanceRecord) => {
    setEditingRecord(rec)
    setFormData({
      expensePurpose: rec.description,
      beneficiary: rec.beneficiary || '',
      expenseType: rec.category || 'Administrative',
      date: rec.transactionDate,
      amount: rec.amount,
      paymentType:
        rec.paymentType && PAYMENT_TYPES.includes(rec.paymentType as (typeof PAYMENT_TYPES)[number])
          ? (rec.paymentType as (typeof PAYMENT_TYPES)[number])
          : 'Cash',
      paymentStatus:
        rec.paymentStatus &&
        PAYMENT_STATUSES.includes(rec.paymentStatus as (typeof PAYMENT_STATUSES)[number])
          ? (rec.paymentStatus as (typeof PAYMENT_STATUSES)[number])
          : 'Paid',
    })
    setShowAddModal(true)
  }, [])

  // Save Expense Record (Create or Edit)
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.expensePurpose.trim()) {
      showToast('Please enter an expense purpose.')
      return
    }

    const now = Date.now()
    const amountVal = Number(formData.amount) || 0

    if (editingRecord) {
      await db.finance.update(editingRecord.id, {
        transactionDate: formData.date,
        category: formData.expenseType,
        description: formData.expensePurpose,
        amount: amountVal,
        beneficiary: formData.beneficiary,
        paymentType: formData.paymentType,
        paymentStatus: formData.paymentStatus,
        updatedAt: now,
        synced: 0,
      })
      showToast(`Updated expense: "${formData.expensePurpose}".`)
    } else {
      await db.finance.add({
        id: `exp-${now}`,
        transactionDate: formData.date,
        type: 'expense',
        category: formData.expenseType,
        description: formData.expensePurpose,
        amount: amountVal,
        currency: 'NGN',
        beneficiary: formData.beneficiary,
        paymentType: formData.paymentType,
        paymentStatus: formData.paymentStatus,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      })
      showToast(
        `Recorded expense: "₦${amountVal.toLocaleString()}" for ${formData.expensePurpose}.`
      )
    }

    setShowAddModal(false)
    setEditingRecord(null)
  }

  // Delete Expense Record
  const handleExecuteDelete = async () => {
    if (!deletingRecord) return
    const desc = deletingRecord.description
    await db.finance.delete(deletingRecord.id)
    setDeletingRecord(null)
    showToast(`Deleted expense voucher "${desc}".`)
  }

  // ─── DataTable Column Definitions ────────────────────────────────
  const expenseColumns: DataTableColumn<FinanceRecord>[] = useMemo(
    () => [
      {
        key: 'voucherId',
        header: 'Voucher / ID',
        render: (rec) => (
          <span className="font-mono font-bold text-neutral-900 whitespace-nowrap">
            {rec.referenceId || rec.id.slice(0, 10).toUpperCase()}
          </span>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        render: (rec) => (
          <span className="font-mono text-neutral-500 text-[11px] whitespace-nowrap">
            {rec.transactionDate}
          </span>
        ),
      },
      {
        key: 'purpose',
        header: 'Expense Purpose',
        render: (rec) => (
          <div className="font-semibold text-neutral-900 max-w-xs">{rec.description}</div>
        ),
      },
      {
        key: 'beneficiary',
        header: 'Beneficiary (Paid To)',
        render: (rec) => (
          <div className="text-neutral-700 font-medium">{rec.beneficiary || '—'}</div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        render: (rec) => (
          <span className="inline-block rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-mono font-bold text-neutral-800">
            {rec.category}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Payment Method',
        render: (rec) => (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-mono text-neutral-800 uppercase font-semibold">
            {rec.paymentType === 'Card' && <CreditCard className="h-2.5 w-2.5" />}
            {rec.paymentType === 'Cash' && <Banknote className="h-2.5 w-2.5" />}
            {rec.paymentType === 'Split Payment' && (
              <Layers className="h-2.5 w-2.5 text-emerald-600" />
            )}
            {rec.paymentType === 'Bank Transfer' ? 'Transfer' : rec.paymentType || 'Cash'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (rec) => {
          const status = rec.paymentStatus || 'Paid'
          return status === 'Paid' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 font-mono uppercase">
              <CheckCircle className="h-2.5 w-2.5" />
              Paid
            </span>
          ) : status === 'Pending' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800 font-mono uppercase">
              Pending
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700 font-mono uppercase">
              Approved
            </span>
          )
        },
      },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right' as const,
        render: (rec) => (
          <span className="font-mono font-extrabold text-neutral-900 whitespace-nowrap">
            ₦{rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
    ],
    []
  )

  const expenseActions: DataTableAction<FinanceRecord>[] = useMemo(
    () => [
      {
        label: 'View Voucher',
        icon: <Eye className="h-3.5 w-3.5" />,
        onClick: (rec) => setViewingRecord(rec),
      },
      {
        label: 'Edit Record',
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: (rec) => handleOpenEdit(rec),
      },
      {
        label: 'Delete Record',
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: (rec) => setDeletingRecord(rec),
        variant: 'danger' as const,
        separator: true,
      },
    ],
    [handleOpenEdit]
  )

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar relative">
      {/* In-App Toast Notification */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      {/* 1. Top Header & Metrics */}
      <div>
        <ExpenseHeader onOpenCreate={handleOpenCreate} />

        <ExpenseMetrics
          totalExpense={totalExpense}
          totalExpenseCount={totalExpenseCount}
          topCategory={topCategory}
          avgVoucherSize={avgVoucherSize}
        />
      </div>

      {/* 2. Filter & Search Bar */}
      <ExpenseFilters
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* 3. Expense Ledger Table */}
      <DataTable<FinanceRecord>
        columns={expenseColumns}
        data={paginatedExpenses}
        getItemId={(rec) => rec.id}
        actions={expenseActions}
        emptyIcon={<Receipt className="h-8 w-8" />}
        emptyTitle="No expense records found matching filters"
        pagination={{
          currentPage,
          pageSize,
          totalCount,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          label: 'expenses',
        }}
      />

      {/* 4. MODAL: New / Edit Expense Record */}
      <ExpenseFormModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingRecord(null)
        }}
        editingRecord={editingRecord}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveExpense}
      />

      {/* 5. MODAL: View Voucher */}
      <ExpenseVoucherModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
      />

      {/* 6. MODAL: Delete Expense Confirmation */}
      <ConfirmDeleteModal
        open={!!deletingRecord}
        title="Delete Expense Voucher?"
        description={
          deletingRecord ? (
            <p>
              Are you sure you want to remove{' '}
              <strong className="text-neutral-900">{deletingRecord.description}</strong> (Amount:{' '}
              <strong className="text-neutral-900 font-mono">
                ₦{deletingRecord.amount.toLocaleString()}
              </strong>
              ) from the ledger?
            </p>
          ) : null
        }
        confirmLabel="Delete Record"
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeletingRecord(null)}
      />
    </div>
  )
}
export default ExpenseModule
