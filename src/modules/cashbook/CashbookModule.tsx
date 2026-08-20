import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { FinanceRecord } from '@/types/database'
import {
  ArrowDown,
  ArrowUp,
  Scale,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Download,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers,
} from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const CASHBOOK_TAGS = [
  'SALES',
  'RESTOCK',
  'PAYROLL',
  'EXPENSE',
  'CAPITAL',
  'UTILITIES',
  'REFUND',
  'MISC',
] as const

export const CashbookModule: React.FC<Props> = ({ searchQuery: externalSearchQuery = '' }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'debit' | 'credit'>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
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

  // Form State
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    tag: 'SALES',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    referenceId: '',
    paymentType: 'Cash' as 'Cash' | 'Bank Transfer' | 'Card',
  })

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const activeSearch = externalSearchQuery || localSearch

  // Live Query from Dexie Finance table
  const allRecords = useLiveQuery(() => db.finance.reverse().toArray()) || []

  // Seed sample cashbook records if empty so the UI looks lively and populated like the user's screenshot
  useEffect(() => {
    const seed = async () => {
      const count = await db.finance.count()
      if (count === 0) {
        const now = Date.now()
        const todayStr = new Date().toISOString().split('T')[0]
        const sampleSeed: FinanceRecord[] = [
          {
            id: `fin-seed-1`,
            transactionDate: todayStr,
            type: 'income',
            category: 'SALES',
            description: 'POS Shift Reconciled (cd18e4f7)',
            amount: 910200,
            currency: 'NGN',
            referenceId: 'POS-REC-9102',
            paymentType: 'Cash',
            paymentStatus: 'Paid',
            createdAt: now - 3600000 * 2,
            updatedAt: now - 3600000 * 2,
            synced: 1,
          },
          {
            id: `fin-seed-2`,
            transactionDate: todayStr,
            type: 'income',
            category: 'SALES',
            description: 'Sale #88b53150',
            amount: 16000,
            currency: 'NGN',
            referenceId: 'REC-88B5',
            paymentType: 'Card',
            paymentStatus: 'Paid',
            createdAt: now - 3600000 * 4,
            updatedAt: now - 3600000 * 4,
            synced: 1,
          },
          {
            id: `fin-seed-3`,
            transactionDate: todayStr,
            type: 'expense',
            category: 'EXPENSE',
            description: 'Logistics Stamp & Dispatch Fee',
            amount: 20,
            currency: 'NGN',
            referenceId: 'EXP-LOG-02',
            paymentType: 'Cash',
            paymentStatus: 'Paid',
            createdAt: now - 3600000 * 6,
            updatedAt: now - 3600000 * 6,
            synced: 1,
          },
        ]
        for (const item of sampleSeed) {
          await db.finance.add(item)
        }
      }
    }
    seed()
  }, [])

  // Filtered list
  const filteredRecords = useMemo(() => {
    let list = [...allRecords]

    if (activeTab === 'debit') {
      list = list.filter((r) => r.type === 'income')
    } else if (activeTab === 'credit') {
      list = list.filter((r) => r.type === 'expense')
    }

    if (dateFilter.trim()) {
      list = list.filter((r) => r.transactionDate === dateFilter)
    }

    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase()
      list = list.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.referenceId && r.referenceId.toLowerCase().includes(q)) ||
          r.transactionDate.includes(q)
      )
    }

    return list
  }, [allRecords, activeTab, dateFilter, activeSearch])

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, dateFilter, activeSearch, pageSize])

  const totalCount = filteredRecords.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, currentPage, pageSize])

  // Summary KPIs (Debit = Receipts, Credit = Payments, Net Change)
  const totalReceipts = allRecords
    .filter((r) => r.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalPayments = allRecords
    .filter((r) => r.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const netChange = totalReceipts - totalPayments

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      type: 'income',
      description: '',
      tag: 'SALES',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      referenceId: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentType: 'Cash',
    })
    setEditingRecord(null)
    setShowAddModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (rec: FinanceRecord) => {
    setActiveMenuId(null)
    setEditingRecord(rec)
    setFormData({
      type: rec.type,
      description: rec.description,
      tag: rec.category.toUpperCase() || 'SALES',
      date: rec.transactionDate,
      amount: rec.amount,
      referenceId: rec.referenceId || '',
      paymentType: (rec.paymentType as any) || 'Cash',
    })
    setShowAddModal(true)
  }

  // Save Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description.trim()) {
      showToast('Please enter a description for the transaction.')
      return
    }

    const now = Date.now()
    const amountVal = Number(formData.amount) || 0

    if (editingRecord) {
      await db.finance.update(editingRecord.id, {
        type: formData.type,
        category: formData.tag,
        description: formData.description,
        amount: amountVal,
        transactionDate: formData.date,
        referenceId: formData.referenceId,
        paymentType: formData.paymentType,
        updatedAt: now,
        synced: 0,
      })
      showToast(`Updated cashbook transaction: "${formData.description}".`)
    } else {
      await db.finance.add({
        id: `fin-${now}`,
        type: formData.type,
        category: formData.tag,
        description: formData.description,
        amount: amountVal,
        transactionDate: formData.date,
        currency: 'NGN',
        referenceId: formData.referenceId || `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentType: formData.paymentType,
        paymentStatus: 'Paid',
        createdAt: now,
        updatedAt: now,
        synced: 0,
      })
      showToast(
        `Recorded ${formData.type === 'income' ? 'Debit (Receipt)' : 'Credit (Payment)'}: ₦${amountVal.toLocaleString()}.`
      )
    }

    setShowAddModal(false)
    setEditingRecord(null)
  }

  // Delete Transaction
  const handleExecuteDelete = async () => {
    if (!deletingRecord) return
    const desc = deletingRecord.description
    await db.finance.delete(deletingRecord.id)
    setDeletingRecord(null)
    showToast(`Deleted cashbook entry: "${desc}".`)
  }

  // Export Ledger to CSV
  const handleExportCSV = () => {
    if (allRecords.length === 0) {
      showToast('No ledger records to export.')
      return
    }

    const headers = ['Date', 'Type', 'Description', 'Tag/Category', 'Amount (NGN)', 'Reference', 'Payment Method']
    const rows = allRecords.map((r) => [
      `"${r.transactionDate}"`,
      `"${r.type === 'income' ? 'Debit (Receipt)' : 'Credit (Payment)'}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      r.amount,
      `"${r.referenceId || ''}"`,
      `"${r.paymentType || 'Cash'}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Standard_Cashbook_Ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Cashbook ledger exported successfully.')
  }

  const startRecordIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRecordIndex = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar relative">
      {/* In-App Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar (Matches Screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
            Standard Cashbook
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Monitor financial health with real-time debit and credit tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Ledger Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-neutral-500" />
            <span>Export Ledger</span>
          </button>

          {/* + Add Transaction Button (Vibrant Orange Gradient Matching Screenshot) */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2.5 text-xs font-extrabold transition-all shadow-md shadow-orange-500/25 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 2. Three Metric Cards (Exact Match to Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TOTAL RECEIPTS (DEBIT) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase font-mono block">
              TOTAL RECEIPTS (DEBIT)
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-[#2563eb]">
              ₦{totalReceipts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Watermark Down Arrow */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-35">
            <div className="h-16 w-16 rounded-full border-2 border-blue-400/40 flex items-center justify-center text-blue-500">
              <ArrowDown className="h-9 w-9 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 2: TOTAL PAYMENTS (CREDIT) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase font-mono block">
              TOTAL PAYMENTS (CREDIT)
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-[#ef4444]">
              ₦{totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Watermark Up Arrow */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-35">
            <div className="h-16 w-16 rounded-full border-2 border-red-400/40 flex items-center justify-center text-red-500">
              <ArrowUp className="h-9 w-9 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 3: NET CHANGE (PERIOD) */}
        <div className="rounded-2xl border border-neutral-200 border-l-4 border-l-[#f97316] bg-white p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase font-mono block">
              NET CHANGE (PERIOD)
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-neutral-900">
              ₦{netChange.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Watermark Balance / Scales */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-15 text-neutral-800">
            <Scale className="h-18 w-18 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search (Matches Screenshot) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Ledger Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-neutral-100/90 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-xl px-4 py-2 transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-[#f97316] font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Full Ledger
          </button>

          <button
            onClick={() => setActiveTab('debit')}
            className={`flex items-center gap-1 rounded-xl px-4 py-2 transition-all cursor-pointer ${
              activeTab === 'debit'
                ? 'bg-white text-[#2563eb] font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>↓</span>
            <span>Debit (Receipts)</span>
          </button>

          <button
            onClick={() => setActiveTab('credit')}
            className={`flex items-center gap-1 rounded-xl px-4 py-2 transition-all cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-white text-[#ef4444] font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
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
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-10 rounded-2xl bg-white border border-neutral-200 px-3.5 text-xs text-neutral-700 shadow-2xs focus:border-neutral-400 focus:outline-none cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
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
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search ledger entries..."
              className="h-10 w-full rounded-2xl bg-white border border-neutral-200 pl-9 pr-3.5 text-xs text-neutral-800 placeholder-neutral-400 shadow-2xs focus:border-neutral-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Consolidated Cash Record Table (Exact Match to Screenshot) */}
      <div className="flex-1 min-h-[420px] rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Consolidated Cash Record</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Historical view of all transactions sorted by date.</p>
          </div>

          <div className="overflow-x-auto min-h-[260px] pb-16">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-mono text-[11px] tracking-wider">
                  <th className="pb-3 font-semibold">DATE</th>
                  <th className="pb-3 font-semibold">DESCRIPTION</th>
                  <th className="pb-3 font-semibold">TAG</th>
                  <th className="pb-3 font-semibold">AMOUNT</th>
                  <th className="pb-3 font-semibold text-right pr-3">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-neutral-400">
                      <Scale className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-semibold text-neutral-600">No cashbook transactions found</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Click "+ Add Transaction" above to create an entry.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((rec, idx) => {
                    const isDebit = rec.type === 'income'
                    const isMenuOpen = activeMenuId === rec.id
                    const openUpward =
                      idx > 0 && (paginatedRecords.length <= 4 || idx >= paginatedRecords.length - 2)

                    return (
                      <tr key={rec.id} className="hover:bg-neutral-50/70 transition-colors">
                        {/* 1. DATE (With Orange Calendar Icon) */}
                        <td className="py-4 font-mono text-neutral-700 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-[#f97316] shrink-0" />
                            <span>{rec.transactionDate}</span>
                          </div>
                        </td>

                        {/* 2. DESCRIPTION */}
                        <td className="py-4">
                          <div className="font-bold text-neutral-900 text-xs">
                            {rec.description}
                          </div>
                          {rec.referenceId && (
                            <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                              Ref: {rec.referenceId}
                            </span>
                          )}
                        </td>

                        {/* 3. TAG */}
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono font-extrabold uppercase ${
                              isDebit
                                ? 'bg-[#dbeafe] text-[#2563eb] border border-blue-200'
                                : 'bg-[#fee2e2] text-[#ef4444] border border-red-200'
                            }`}
                          >
                            <span>{isDebit ? '↓' : '↑'}</span>
                            <span>{rec.category.toUpperCase() || (isDebit ? 'SALES' : 'EXPENSE')}</span>
                          </span>
                        </td>

                        {/* 4. AMOUNT */}
                        <td className="py-4 font-mono font-extrabold text-xs whitespace-nowrap">
                          <span className={isDebit ? 'text-[#2563eb]' : 'text-[#ef4444]'}>
                            {isDebit ? '+/ ' : '- '}₦{rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* 5. ACTION (Three-dot with smart upward placement) */}
                        <td className="py-4 text-right pr-2 relative">
                          <div className="inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuId(isMenuOpen ? null : rec.id)
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isMenuOpen
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white hover:bg-neutral-100 text-neutral-500 border-neutral-200 shadow-2xs'
                              }`}
                              title="More Options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div
                                className={`absolute right-2 ${
                                  openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                                } w-44 rounded-xl bg-white border border-neutral-200 shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100 text-xs`}
                              >
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    setViewingRecord(rec)
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 text-neutral-500" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  onClick={() => handleOpenEdit(rec)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                                  <span>Edit Entry</span>
                                </button>

                                <div className="my-1 border-t border-neutral-100" />

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    setDeletingRecord(rec)
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  <span>Delete Entry</span>
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
        </div>

        {/* Pagination Toolbar */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-neutral-500 font-medium">
            Showing <span className="font-bold text-neutral-800">{startRecordIndex}</span> to{' '}
            <span className="font-bold text-neutral-800">{endRecordIndex}</span> of{' '}
            <span className="font-bold text-neutral-800">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
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

      {/* MODAL 1: Add / Edit Cashbook Transaction */}
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
              <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#f97316]">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingRecord ? 'Edit Cashbook Entry' : 'New Cashbook Transaction'}
                </h3>
                <p className="text-xs text-neutral-500">Record debit inflow or credit payment disbursement</p>
              </div>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
              {/* Type Switcher (Debit vs Credit) */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  TRANSACTION TYPE *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income', tag: 'SALES' })}
                    className={`rounded-xl py-2.5 px-3 font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.type === 'income'
                        ? 'bg-blue-50 border-blue-400 text-[#2563eb] shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-white'
                    }`}
                  >
                    <ArrowDown className="h-4 w-4" />
                    <span>Debit (Receipt / Inflow)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense', tag: 'EXPENSE' })}
                    className={`rounded-xl py-2.5 px-3 font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.type === 'expense'
                        ? 'bg-red-50 border-red-400 text-[#ef4444] shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-white'
                    }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span>Credit (Payment / Outflow)</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  DESCRIPTION *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. POS Shift Reconciled / Generator Fuel"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
                />
              </div>

              {/* Tag & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    LEDGER TAG
                  </label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    {CASHBOOK_TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
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

              {/* Amount & Reference */}
              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    REFERENCE / TICKET NO.
                  </label>
                  <input
                    type="text"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    placeholder="e.g. REC-88B5"
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

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
                  className="rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-2.5 text-xs font-extrabold shadow-md shadow-orange-500/25 cursor-pointer uppercase tracking-wider"
                >
                  {editingRecord ? 'Save Changes' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Details */}
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
              <Scale className="h-5 w-5 text-[#f97316]" />
              <h3 className="text-sm font-bold text-neutral-900">Cashbook Transaction Record</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase font-mono">Description</div>
                <div className="text-sm font-bold text-neutral-900">{viewingRecord.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                  <div className="text-[10px] text-neutral-400 uppercase">Type</div>
                  <div className="font-bold text-neutral-800 mt-0.5">
                    {viewingRecord.type === 'income' ? 'Debit (Inflow)' : 'Credit (Outflow)'}
                  </div>
                </div>

                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                  <div className="text-[10px] text-neutral-400 uppercase">Date</div>
                  <div className="font-bold text-neutral-800 mt-0.5">{viewingRecord.transactionDate}</div>
                </div>

                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                  <div className="text-[10px] text-neutral-400 uppercase">Ledger Tag</div>
                  <div className="font-bold text-neutral-800 mt-0.5">{viewingRecord.category}</div>
                </div>

                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                  <div className="text-[10px] text-neutral-400 uppercase">Reference</div>
                  <div className="font-bold text-neutral-800 mt-0.5">{viewingRecord.referenceId || 'N/A'}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex justify-between items-center font-mono">
                <span className="text-xs text-neutral-500">Transaction Amount:</span>
                <span
                  className={`text-base font-black ${
                    viewingRecord.type === 'income' ? 'text-[#2563eb]' : 'text-[#ef4444]'
                  }`}
                >
                  {viewingRecord.type === 'income' ? '+/ ' : '- '}₦{viewingRecord.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-800 shadow-2xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Record</span>
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

      {/* MODAL 3: Delete Confirmation */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="h-11 w-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-neutral-900">Delete Cashbook Entry?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Are you sure you want to remove <strong className="text-neutral-900">{deletingRecord.description}</strong> (Amount:{' '}
                <strong className="font-mono text-neutral-900">₦{deletingRecord.amount.toLocaleString()}</strong>) from the ledger?
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
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
