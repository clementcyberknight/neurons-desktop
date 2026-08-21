import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { FinanceRecord } from '@/types/database'
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import {
  Plus,
  Search,
  ArrowDownRight,
  Receipt,
  X,
  PieChart,
  Filter,
  Pencil,
  Trash2,
  CheckCircle,
  CreditCard,
  Banknote,
  Layers,
  Eye,
  Printer,
} from 'lucide-react'
import iconReport from '@/assets/icons-pack/Receipt--Streamline-Plump.png'
import iconPayment from '@/assets/icons-pack/Money-Trend--Streamline-Plump.png'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const EXPENSE_TYPES = [
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

const PAYMENT_TYPES = ['Cash', 'Bank Transfer', 'Card', 'Store Credit', 'Split Payment'] as const
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Approved'] as const

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
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<FinanceRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<FinanceRecord | null>(null)

  // Form State matching the exact requested JSON specification
  const [formData, setFormData] = useState({
    expensePurpose: '',
    beneficiary: '',
    expenseType: 'Administrative',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentType: 'Cash' as (typeof PAYMENT_TYPES)[number],
    paymentStatus: 'Paid' as (typeof PAYMENT_STATUSES)[number],
  })

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
    // 1. Streaming KPI aggregation (Single pass cursor iteration)
    let totalSpend = 0
    let countAll = 0
    const categoryTotals: Record<string, number> = {}

    await db.finance.where('type').equals('expense').each((rec) => {
      countAll++
      totalSpend += rec.amount
      categoryTotals[rec.category] = (categoryTotals[rec.category] || 0) + rec.amount
    })

    const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['None', 0]
    const avg = countAll > 0 ? Math.round(totalSpend / countAll) : 0

    // 2. Query with indexed filtering & database-level offset/limit
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
    topCategory: ['None', 0],
    avgVoucherSize: 0,
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      expensePurpose: '',
      beneficiary: '',
      expenseType: 'Administrative',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentType: 'Cash',
      paymentStatus: 'Paid',
    })
    setEditingRecord(null)
    setShowAddModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (rec: FinanceRecord) => {
    setEditingRecord(rec)
    setFormData({
      expensePurpose: rec.description,
      beneficiary: rec.beneficiary || '',
      expenseType: rec.category || 'Administrative',
      date: rec.transactionDate,
      amount: rec.amount,
      paymentType: (rec.paymentType && PAYMENT_TYPES.includes(rec.paymentType as typeof PAYMENT_TYPES[number])) ? (rec.paymentType as typeof PAYMENT_TYPES[number]) : 'Cash',
      paymentStatus: (rec.paymentStatus && PAYMENT_STATUSES.includes(rec.paymentStatus as typeof PAYMENT_STATUSES[number])) ? (rec.paymentStatus as typeof PAYMENT_STATUSES[number]) : 'Paid',
    })
    setShowAddModal(true)
  }

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
      showToast(`Recorded expense: "₦${amountVal.toLocaleString()}" for ${formData.expensePurpose}.`)
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

  const handlePrintVoucher = () => {
    window.print()
  }

  // ─── DataTable Column Definitions ────────────────────────────────
  const expenseColumns: DataTableColumn<FinanceRecord>[] = useMemo(() => [
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
        <span className="font-mono text-neutral-500 text-[11px] whitespace-nowrap">{rec.transactionDate}</span>
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
          {rec.paymentType === 'Split Payment' && <Layers className="h-2.5 w-2.5 text-emerald-600" />}
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
  ], [])

  const expenseActions: DataTableAction<FinanceRecord>[] = useMemo(() => [
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
  ], [])

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar relative">
      {/* In-App Toast Notification */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      {/* 1. Top Header & Overview */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={iconReport} alt="Expense" className="h-9 w-9 object-contain" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">Expense Ledger & Spending Management</h1>
              <p className="text-xs text-neutral-500">Track and categorize business costs, wholesale restocks, and operational bills</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Total Outflow</span>
              <ArrowDownRight className="h-4 w-4 text-neutral-900" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-900">
              ₦{totalExpense.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block font-mono">
              {totalExpenseCount} total vouchers logged
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Top Expense Category</span>
              <PieChart className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="mt-2 text-lg font-extrabold text-neutral-900 truncate">
              {topCategory[0]}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block font-mono">
              ₦{topCategory[1].toLocaleString()} total spend
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Average Voucher Size</span>
              <Receipt className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-900">
              ₦{avgVoucherSize.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block font-mono">Per recorded disbursement</span>
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
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none"
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
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none"
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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none"
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

      {/* 4. MODAL: New Expense Record (Matches exact user JSON specification) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-neutral-100 pb-3 mb-4">
              <img src={iconPayment} alt="Expense" className="h-7 w-7 object-contain" />
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingRecord ? 'Edit Expense Record' : 'New Expense Record'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Fill in the details to document a business expense.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              {/* Field 1: EXPENSE PURPOSE */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  EXPENSE PURPOSE *
                </label>
                <input
                  type="text"
                  required
                  value={formData.expensePurpose}
                  onChange={(e) => setFormData({ ...formData, expensePurpose: e.target.value })}
                  placeholder="e.g. Fuel for generator"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
                />
              </div>

              {/* Field 2: PAID TO (BENEFICIARY) */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  PAID TO (BENEFICIARY)
                </label>
                <input
                  type="text"
                  value={formData.beneficiary}
                  onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                  placeholder="Recipient name"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
                />
              </div>

              {/* Field 3: EXPENSE TYPE & Field 4: DATE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    EXPENSE TYPE
                  </label>
                  <select
                    value={formData.expenseType}
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    {EXPENSE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    DATE
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-mono font-semibold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 5: AMOUNT (₦) */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  AMOUNT (₦) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-mono font-extrabold text-neutral-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Field 6: PAYMENT TYPE & Field 7: PAYMENT STATUS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    PAYMENT TYPE
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as typeof PAYMENT_TYPES[number] })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    {PAYMENT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    PAYMENT STATUS
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as typeof PAYMENT_STATUSES[number] })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    {PAYMENT_STATUSES.map((ps) => (
                      <option key={ps} value={ps}>
                        {ps}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer tracking-wide uppercase"
                >
                  SAVE EXPENSE RECORD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: View Voucher (Printable Receipt Layout) */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setViewingRecord(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Receipt className="h-5 w-5 text-neutral-700" />
              <h3 className="text-sm font-bold text-neutral-900">Expense Voucher Details</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-mono bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase">Voucher ID:</div>
                  <div className="font-bold text-neutral-900">{viewingRecord.referenceId || viewingRecord.id.slice(0, 12).toUpperCase()}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">{viewingRecord.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-400 uppercase">Date:</div>
                  <div className="text-neutral-800 font-bold">{viewingRecord.transactionDate}</div>
                  <div className="text-[11px] text-neutral-500">{viewingRecord.paymentStatus || 'Paid'}</div>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Expense Purpose</span>
                  <div className="font-bold text-neutral-900 text-sm mt-0.5">{viewingRecord.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/60 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Beneficiary</span>
                    <span className="font-semibold text-neutral-800">{viewingRecord.beneficiary || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Payment Method</span>
                    <span className="font-semibold text-neutral-800">{viewingRecord.paymentType || 'Cash'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-neutral-100 font-mono text-xs">
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1.5 border-t border-neutral-200">
                  <span>Total Disbursed:</span>
                  <span className="text-base font-extrabold text-neutral-900">
                    ₦{viewingRecord.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                onClick={handlePrintVoucher}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-800 shadow-2xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setViewingRecord(null)}
                className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs text-white font-bold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Delete Expense Confirmation */}
      <ConfirmDeleteModal
        open={!!deletingRecord}
        title="Delete Expense Voucher?"
        description={
          deletingRecord ? (
            <p>
              Are you sure you want to remove <strong className="text-neutral-900">{deletingRecord.description}</strong> (Amount: <strong className="text-neutral-900 font-mono">₦{deletingRecord.amount.toLocaleString()}</strong>) from the ledger?
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
