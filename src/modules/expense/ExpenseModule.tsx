import React, { useState } from 'react'
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
} from 'lucide-react'
import iconReport from '@/assets/icons-pack/Receipt--Streamline-Plump.png'
import iconPayment from '@/assets/icons-pack/Money-Trend--Streamline-Plump.png'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const EXPENSE_CATEGORIES = [
  'Inventory Restock',
  'Salaries & Payroll',
  'Rent & Utilities',
  'Software Licenses',
  'Maintenance',
  'Logistics & Delivery',
  'Marketing & Promo',
] as const

export const ExpenseModule: React.FC<Props> = ({ searchQuery = '' }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [localSearch, setLocalSearch] = useState('')

  const activeSearch = searchQuery || localSearch

  const expenseRecords = useLiveQuery(async () => {
    let records = await db.finance.reverse().toArray()
    records = records.filter((r) => r.type === 'expense')
    if (selectedCategory !== 'all') {
      records = records.filter((r) => r.category === selectedCategory)
    }
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase()
      records = records.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.referenceId && r.referenceId.toLowerCase().includes(q))
      )
    }
    return records
  }, [selectedCategory, activeSearch]) || []

  const totalExpense = expenseRecords.reduce((acc, curr) => acc + curr.amount, 0)

  // Category Breakdown Stats
  const categoryTotals: Record<string, number> = {}
  expenseRecords.forEach((rec) => {
    categoryTotals[rec.category] = (categoryTotals[rec.category] || 0) + rec.amount
  })

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['None', 0]

  // Add Expense State
  const [newExpense, setNewExpense] = useState<{
    category: (typeof EXPENSE_CATEGORIES)[number]
    description: string
    amount: number
    transactionDate: string
  }>({
    category: 'Inventory Restock',
    description: '',
    amount: 15000,
    transactionDate: new Date().toISOString().split('T')[0],
  })

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpense.description || !newExpense.amount) return

    const now = Date.now()
    await db.finance.add({
      id: `exp-${now}`,
      transactionDate: newExpense.transactionDate,
      type: 'expense',
      category: newExpense.category as any,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      currency: 'NGN',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })

    setShowAddModal(false)
    setNewExpense({
      category: 'Inventory Restock',
      description: '',
      amount: 15000,
      transactionDate: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa]">
      {/* Top Header & Overview */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={iconReport} alt="Expense" className="h-9 w-9 object-contain" />
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">Expense Ledger & Spending Management</h3>
              <p className="text-xs text-neutral-500">Track and categorize business costs, wholesale restocks, and operational bills</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Total Outflow</span>
              <ArrowDownRight className="h-4 w-4 text-neutral-900" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
              ₦{totalExpense.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">
              {expenseRecords.length} vouchers logged
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Top Expense Category</span>
              <PieChart className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="mt-2 text-lg font-bold text-neutral-900 truncate">
              {topCategory[0]}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">
              ₦{topCategory[1].toLocaleString()} total spend
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Average Voucher Size</span>
              <Receipt className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
              ₦{expenseRecords.length > 0 ? Math.round(totalExpense / expenseRecords.length).toLocaleString() : '0'}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">Per recorded disbursement</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search descriptions, vouchers..."
            className="h-8 w-full rounded-lg bg-neutral-50 border border-neutral-200 pl-8 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg bg-neutral-50 border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 focus:outline-none"
          >
            <option value="all">All Expense Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 flex flex-col justify-between overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold text-right">Amount (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {expenseRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenseRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 font-mono text-neutral-500">{rec.transactionDate}</td>
                    <td className="py-3">
                      <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-800">
                        {rec.category}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-800 max-w-md font-medium">{rec.description}</td>
                    <td className="py-3 font-mono font-bold text-right text-neutral-900">
                      -₦{rec.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <img src={iconPayment} alt="Payment" className="h-5 w-5 object-contain" />
                <h3 className="text-sm font-bold text-neutral-900">Record Operational Expense</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-600">Expense Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-600">Disbursement Date</label>
                  <input
                    type="date"
                    required
                    value={newExpense.transactionDate}
                    onChange={(e) => setNewExpense({ ...newExpense, transactionDate: e.target.value })}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-600">Voucher / Bill Description</label>
                <input
                  type="text"
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="e.g. Generator diesel refill & service maintenance"
                  className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-600">Disbursement Amount (₦)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                  className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-1.5 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-4 py-1.5 text-white font-medium shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
