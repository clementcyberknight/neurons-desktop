import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { FinanceRecord } from '@/types/database'
import {
  Plus,
  Search,
  ArrowDownRight,
  Receipt,
  X,
  PieChart,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Banknote,
  Layers,
  ChevronLeft,
  ChevronRight,
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

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

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const activeSearch = searchQuery || localSearch

  // Live query for all expenses
  const allExpenses =
    useLiveQuery(async () => {
      let records = await db.finance.reverse().toArray()
      return records.filter((r) => r.type === 'expense')
    }) || []

  // Filtered expense list
  const filteredExpenses = useMemo(() => {
    let list = [...allExpenses]

    if (selectedCategory !== 'all') {
      list = list.filter((r) => r.category === selectedCategory)
    }

    if (statusFilter !== 'all') {
      list = list.filter((r) => (r.paymentStatus || 'Paid') === statusFilter)
    }

    if (methodFilter !== 'all') {
      list = list.filter((r) => (r.paymentType || 'Cash') === methodFilter)
    }

    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase()
      list = list.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.beneficiary && r.beneficiary.toLowerCase().includes(q)) ||
          (r.referenceId && r.referenceId.toLowerCase().includes(q)) ||
          (r.id && r.id.toLowerCase().includes(q))
      )
    }

    return list
  }, [allExpenses, selectedCategory, statusFilter, methodFilter, activeSearch])

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, statusFilter, methodFilter, activeSearch, pageSize])

  const totalCount = filteredExpenses.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredExpenses.slice(start, start + pageSize)
  }, [filteredExpenses, currentPage, pageSize])

  // KPIs
  const totalExpense = allExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  const categoryTotals: Record<string, number> = {}
  allExpenses.forEach((rec) => {
    categoryTotals[rec.category] = (categoryTotals[rec.category] || 0) + rec.amount
  })
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['None', 0]
  const avgVoucher = allExpenses.length > 0 ? Math.round(totalExpense / allExpenses.length) : 0

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
    setActiveMenuId(null)
    setEditingRecord(rec)
    setFormData({
      expensePurpose: rec.description,
      beneficiary: rec.beneficiary || '',
      expenseType: rec.category || 'Administrative',
      date: rec.transactionDate,
      amount: rec.amount,
      paymentType: (rec.paymentType as any) || 'Cash',
      paymentStatus: (rec.paymentStatus as any) || 'Paid',
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

  const startRecordIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRecordIndex = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar relative">
      {/* In-App Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              {allExpenses.length} total vouchers logged
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
              ₦{avgVoucher.toLocaleString()}
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

      {/* 3. Expense Ledger Table (Exact Match to Sales Table Layout) */}
      <div className="flex-1 min-h-[380px] rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
        <div className="overflow-x-auto min-h-[260px] pb-16">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                <th className="pb-3 font-semibold">Voucher / ID</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Expense Purpose</th>
                <th className="pb-3 font-semibold">Beneficiary (Paid To)</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Payment Method</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 font-semibold text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold text-neutral-600">No expense records found matching filters</p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((rec, idx) => {
                  const isMenuOpen = activeMenuId === rec.id
                  const status = rec.paymentStatus || 'Paid'
                  const voucherNum = rec.referenceId || rec.id.slice(0, 10).toUpperCase()
                  const openUpward = idx > 0 && (paginatedExpenses.length <= 4 || idx >= paginatedExpenses.length - 2)

                  return (
                    <tr key={rec.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {voucherNum}
                      </td>
                      <td className="py-3 font-mono text-neutral-500 text-[11px] whitespace-nowrap">
                        {rec.transactionDate}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-neutral-900 max-w-xs">{rec.description}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-neutral-700 font-medium">{rec.beneficiary || '—'}</div>
                      </td>
                      <td className="py-3">
                        <span className="inline-block rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-mono font-bold text-neutral-800">
                          {rec.category}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-mono text-neutral-800 uppercase font-semibold">
                          {rec.paymentType === 'Card' && <CreditCard className="h-2.5 w-2.5" />}
                          {rec.paymentType === 'Cash' && <Banknote className="h-2.5 w-2.5" />}
                          {rec.paymentType === 'Split Payment' && <Layers className="h-2.5 w-2.5 text-emerald-600" />}
                          {rec.paymentType === 'Bank Transfer' ? 'Transfer' : rec.paymentType || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3">
                        {status === 'Paid' ? (
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
                        )}
                      </td>
                      <td className="py-3 font-mono font-extrabold text-right text-neutral-900 whitespace-nowrap">
                        ₦{rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* 3-Dot Action Button & Menu */}
                      <td className="py-3 text-right pr-2 relative">
                        <div className="inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuId(isMenuOpen ? null : rec.id)
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

                          {/* Dropdown Menu (View, Edit, Delete) */}
                          {isMenuOpen && (
                            <div className={`absolute right-2 ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} w-44 rounded-xl bg-white border border-neutral-200 shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}>
                              {/* 1. View Voucher */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null)
                                  setViewingRecord(rec)
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-neutral-500" />
                                <span>View Voucher</span>
                              </button>

                              {/* 2. Edit Record */}
                              <button
                                onClick={() => handleOpenEdit(rec)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                                <span>Edit Record</span>
                              </button>

                              <div className="my-1 border-t border-neutral-100" />

                              {/* 3. Delete Record */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null)
                                  setDeletingRecord(rec)
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-neutral-500 font-medium">
            Showing <span className="font-bold text-neutral-800">{startRecordIndex}</span> to{' '}
            <span className="font-bold text-neutral-800">{endRecordIndex}</span> of{' '}
            <span className="font-bold text-neutral-800">{totalCount}</span> expenses
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Page Size Select */}
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-700 cursor-pointer shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <span className="px-2 font-mono font-semibold text-neutral-800">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-700 cursor-pointer shadow-2xs"
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
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
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
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
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="h-11 w-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-neutral-900">Delete Expense Voucher?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Are you sure you want to remove <strong className="text-neutral-900">{deletingRecord.description}</strong> (Amount: <strong className="text-neutral-900 font-mono">₦{deletingRecord.amount.toLocaleString()}</strong>) from the ledger?
              </p>
              <span className="text-[11px] text-red-600 block mt-2 font-medium">This action cannot be undone.</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
