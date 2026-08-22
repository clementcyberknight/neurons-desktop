import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { FinanceRecord } from '@/types/database'
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { CashbookHeader } from './components/CashbookHeader'
import { CashbookMetrics } from './components/CashbookMetrics'
import { CashbookFilters } from './components/CashbookFilters'
import { CashbookFormModal, type CashbookFormData } from './components/CashbookFormModal'
import { CashbookDetailModal } from './components/CashbookDetailModal'
import { Calendar as CalendarIcon, Eye, Pencil, Trash2, Scale } from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const INITIAL_FORM_DATA: CashbookFormData = {
  type: 'income',
  description: '',
  tag: 'SALES',
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  referenceId: '',
  paymentType: 'Cash',
}

export const CashbookModule: React.FC<Props> = ({ searchQuery: externalSearchQuery = '' }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'debit' | 'credit'>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
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
  const [formData, setFormData] = useState<CashbookFormData>(INITIAL_FORM_DATA)

  // Seed sample cashbook records if empty so the UI is populated
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

  const activeSearch = externalSearchQuery || localSearch

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, dateFilter, activeSearch, pageSize])

  // Scalable 100k+ Live Query: streaming KPI cursor aggregation + indexed pagination
  const {
    paginatedRecords,
    totalCount,
    totalReceipts,
    totalPayments,
    netChange,
  } = useLiveQuery(async () => {
    // 1. Streaming KPI aggregation (Single pass cursor iteration - AGENTS.md §5.2)
    let receipts = 0
    let payments = 0

    await db.finance.each((r) => {
      if (r.type === 'income') receipts += r.amount
      else if (r.type === 'expense') payments += r.amount
    })

    const net = receipts - payments

    // 2. Query with indexed filtering & database-level offset/limit (AGENTS.md §5.1)
    const q = activeSearch.trim().toLowerCase()
    let filteredCount = 0
    let matchingRecords: FinanceRecord[] = []

    if (activeTab === 'all' && !dateFilter && !q) {
      const collection = db.finance.orderBy('transactionDate').reverse()
      filteredCount = await collection.count()
      matchingRecords = await collection.offset((currentPage - 1) * pageSize).limit(pageSize).toArray()
    } else if (activeTab !== 'all' && !dateFilter && !q) {
      const targetType = activeTab === 'debit' ? 'income' : 'expense'
      const collection = db.finance.where('type').equals(targetType).reverse()
      filteredCount = await collection.count()
      matchingRecords = await collection.offset((currentPage - 1) * pageSize).limit(pageSize).toArray()
    } else {
      const matches: FinanceRecord[] = []
      const collection =
        activeTab !== 'all'
          ? db.finance.where('type').equals(activeTab === 'debit' ? 'income' : 'expense').reverse()
          : db.finance.orderBy('transactionDate').reverse()

      await collection.each((r) => {
        if (dateFilter && r.transactionDate !== dateFilter) return
        if (q) {
          const matchesSearch =
            r.description.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            Boolean(r.referenceId && r.referenceId.toLowerCase().includes(q)) ||
            r.transactionDate.includes(q)
          if (!matchesSearch) return
        }
        matches.push(r)
      })

      filteredCount = matches.length
      const start = (currentPage - 1) * pageSize
      matchingRecords = matches.slice(start, start + pageSize)
    }

    return {
      paginatedRecords: matchingRecords,
      totalCount: filteredCount,
      totalReceipts: receipts,
      totalPayments: payments,
      netChange: net,
    }
  }, [activeTab, dateFilter, activeSearch, currentPage, pageSize]) || {
    paginatedRecords: [],
    totalCount: 0,
    totalReceipts: 0,
    totalPayments: 0,
    netChange: 0,
  }

  // Open Create Modal
  const handleOpenCreate = useCallback(() => {
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
  }, [])

  // Open Edit Modal
  const handleOpenEdit = useCallback((rec: FinanceRecord) => {
    setEditingRecord(rec)
    setFormData({
      type: rec.type,
      description: rec.description,
      tag: rec.category.toUpperCase() || 'SALES',
      date: rec.transactionDate,
      amount: rec.amount,
      referenceId: rec.referenceId || '',
      paymentType:
        rec.paymentType === 'Bank Transfer' || rec.paymentType === 'Card' ? rec.paymentType : 'Cash',
    })
    setShowAddModal(true)
  }, [])

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
  const handleExportCSV = async () => {
    const records = await db.finance.toArray()
    if (records.length === 0) {
      showToast('No ledger records to export.')
      return
    }

    const headers = ['Date', 'Type', 'Description', 'Tag/Category', 'Amount (NGN)', 'Reference', 'Payment Method']
    const rows = records.map((r) => [
      `"${r.transactionDate}"`,
      `"${r.type === 'income' ? 'Debit (Receipt)' : 'Credit (Payment)'}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      r.amount,
      `"${r.referenceId || ''}"`,
      `"${r.paymentType || 'Cash'}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Standard_Cashbook_Ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Cashbook ledger exported successfully.')
  }

  // ─── DataTable Column Definitions ────────────────────────────────
  const cashbookColumns: DataTableColumn<FinanceRecord>[] = useMemo(
    () => [
      {
        key: 'transactionDate',
        header: 'DATE',
        render: (rec) => (
          <div className="flex items-center gap-2 font-mono text-neutral-700 text-xs whitespace-nowrap">
            <CalendarIcon className="h-4 w-4 text-[#f97316] shrink-0" />
            <span>{rec.transactionDate}</span>
          </div>
        ),
      },
      {
        key: 'description',
        header: 'DESCRIPTION',
        render: (rec) => (
          <div>
            <div className="font-bold text-neutral-900 text-xs">{rec.description}</div>
            {rec.referenceId && (
              <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                Ref: {rec.referenceId}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'tag',
        header: 'TAG',
        render: (rec) => {
          const isDebit = rec.type === 'income'
          return (
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
          )
        },
      },
      {
        key: 'amount',
        header: 'AMOUNT',
        render: (rec) => {
          const isDebit = rec.type === 'income'
          return (
            <span
              className={`font-mono font-extrabold text-xs whitespace-nowrap ${
                isDebit ? 'text-[#2563eb]' : 'text-[#ef4444]'
              }`}
            >
              {isDebit ? '+/ ' : '- '}₦
              {rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          )
        },
      },
    ],
    []
  )

  const cashbookActions: DataTableAction<FinanceRecord>[] = useMemo(
    () => [
      {
        label: 'View Details',
        icon: <Eye className="h-3.5 w-3.5" />,
        onClick: (rec) => setViewingRecord(rec),
      },
      {
        label: 'Edit Entry',
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: (rec) => handleOpenEdit(rec),
      },
      {
        label: 'Delete Entry',
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
      {/* In-App Toast */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      {/* 1. Header Bar */}
      <CashbookHeader onExportCSV={handleExportCSV} onOpenCreate={handleOpenCreate} />

      {/* 2. Three Metric Cards */}
      <CashbookMetrics
        totalReceipts={totalReceipts}
        totalPayments={totalPayments}
        netChange={netChange}
      />

      {/* 3. Filter Bar & Search */}
      <CashbookFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        searchQuery={localSearch}
        onSearchQueryChange={setLocalSearch}
      />

      {/* 4. Consolidated Cash Record Table */}
      <DataTable<FinanceRecord>
        columns={cashbookColumns}
        data={paginatedRecords}
        getItemId={(rec) => rec.id}
        actions={cashbookActions}
        emptyIcon={<Scale className="h-8 w-8" />}
        emptyTitle="No cashbook transactions found"
        emptyDescription='Click "+ Add Transaction" above to create an entry.'
        pagination={{
          currentPage,
          pageSize,
          totalCount,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          label: 'transactions',
        }}
      />

      {/* MODAL 1: Add / Edit Cashbook Transaction */}
      <CashbookFormModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingRecord(null)
        }}
        editingRecord={editingRecord}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveTransaction}
      />

      {/* MODAL 2: View Details */}
      <CashbookDetailModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
      />

      {/* MODAL 3: Delete Confirmation */}
      <ConfirmDeleteModal
        open={!!deletingRecord}
        title="Delete Cashbook Entry?"
        description={
          deletingRecord ? (
            <p>
              Are you sure you want to remove{' '}
              <strong className="text-neutral-900">{deletingRecord.description}</strong> (Amount:{' '}
              <strong className="font-mono text-neutral-900">
                ₦{deletingRecord.amount.toLocaleString()}
              </strong>
              ) from the ledger?
            </p>
          ) : null
        }
        confirmLabel="Delete Entry"
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeletingRecord(null)}
      />
    </div>
  )
}
export default CashbookModule
