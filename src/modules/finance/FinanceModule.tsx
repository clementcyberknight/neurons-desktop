import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { FinanceRecord } from '@/types/database'
import {
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react'

interface Props {
  onAskAI?: (prompt: string) => void
}

export const FinanceModule: React.FC<Props> = () => {
  const financeRecords = useLiveQuery(() => db.finance.reverse().toArray()) || []

  const totalIncome = financeRecords
    .filter((f) => f.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalExpense = financeRecords
    .filter((f) => f.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const netProfit = totalIncome - totalExpense
  const marginPct = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0

  const [showAddModal, setShowAddModal] = useState(false)
  const [newEntry, setNewEntry] = useState<Partial<FinanceRecord>>({
    type: 'expense',
    category: 'Inventory Restock',
    description: '',
    amount: 50000,
    currency: 'NGN',
  })

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.description || !newEntry.amount) return

    const now = Date.now()
    await db.finance.add({
      id: `fin-${now}`,
      transactionDate: new Date().toISOString().split('T')[0],
      type: newEntry.type as any,
      category: newEntry.category as any,
      description: newEntry.description!,
      amount: Number(newEntry.amount),
      currency: 'NGN',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })
    setShowAddModal(false)
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa]">
      {/* Metric Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">Financial Overview & P&L</h3>
            <p className="text-xs text-neutral-500">Real-time local ledger turnover for current operating period</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Total Revenue</span>
              <ArrowUpRight className="h-4 w-4 text-neutral-900" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
              ₦{totalIncome.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">POS sales & wholesale</span>
          </div>

          {/* Total Expenses */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Total Expenses</span>
              <ArrowDownRight className="h-4 w-4 text-neutral-900" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
              ₦{totalExpense.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">Payroll, stock, licenses</span>
          </div>

          {/* Net Margin */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Net Profit Margin</span>
              <TrendingUp className="h-4 w-4 text-neutral-900" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
              ₦{netProfit.toLocaleString()} ({marginPct}%)
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">Operating net margin</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 flex flex-col justify-between overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {financeRecords.map((rec) => {
                const isIncome = rec.type === 'income'
                return (
                  <tr key={rec.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-2.5 font-mono text-neutral-500">{rec.transactionDate}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          isIncome ? 'bg-neutral-100 text-neutral-900 border border-neutral-300' : 'bg-neutral-900 text-white'
                        }`}
                      >
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-neutral-900">{rec.category}</td>
                    <td className="py-2.5 text-neutral-600 truncate max-w-xs">{rec.description}</td>
                    <td
                      className="py-2.5 font-mono font-bold text-right text-neutral-900"
                    >
                      {isIncome ? '+' : '-'}₦{rec.amount.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-900 mb-4">Add Financial Record</h3>
            <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-600">Type</label>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as any })}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none focus:border-neutral-500"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-600">Category</label>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as any })}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none focus:border-neutral-500"
                  >
                    <option value="POS Sales">POS Sales</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Rent & Utilities">Rent & Utilities</option>
                    <option value="Salaries & Payroll">Salaries & Payroll</option>
                    <option value="Inventory Restock">Inventory Restock</option>
                    <option value="Software Licenses">Software Licenses</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-neutral-600">Description</label>
                <input
                  type="text"
                  required
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="e.g. Monthly cloud backup & software license"
                  className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="text-neutral-600">Amount (₦)</label>
                <input
                  type="number"
                  required
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                  className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 font-mono focus:outline-none focus:border-neutral-500"
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
