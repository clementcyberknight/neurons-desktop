import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { FinanceRecord } from '@/types/database'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Calendar,
} from 'lucide-react'

interface Props {
  onAskAI: (prompt: string) => void
}

export const FinanceModule: React.FC<Props> = ({ onAskAI }) => {
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
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6">
      {/* KPI Metric Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Financial Overview & P&L</h3>
            <p className="text-xs text-slate-400">Real-time local ledger turnover for current operating period</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onAskAI(
                  'Investigate the audit logs and internal records to identify why Q3 software license costs exceeded our forecast by 25%.'
                )
              }
              className="flex items-center gap-1.5 rounded-lg bg-teal-600/20 border border-teal-500/30 text-teal-400 hover:bg-teal-600 hover:text-white px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI P&L Variance Audit</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Total Revenue</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              ₦{totalIncome.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">POS sales & wholesale</span>
          </div>

          {/* Total Expenses */}
          <div className="rounded-2xl border border-red-500/20 bg-red-950/15 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-red-400">
              <span>Total Expenses</span>
              <ArrowDownRight className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              ₦{totalExpense.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">Payroll, stock, licenses</span>
          </div>

          {/* Net Margin */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-950/15 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>Net Profit Margin</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              ₦{netProfit.toLocaleString()} ({marginPct}%)
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">Healthy operating margin</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {financeRecords.map((rec) => {
                const isIncome = rec.type === 'income'
                return (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-mono text-slate-400">{rec.transactionDate}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-200">{rec.category}</td>
                    <td className="py-2.5 text-slate-400 truncate max-w-xs">{rec.description}</td>
                    <td
                      className={`py-2.5 font-mono font-bold text-right ${
                        isIncome ? 'text-emerald-400' : 'text-red-400'
                      }`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">Add Financial Record</h3>
            <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Type</label>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as any })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">Category</label>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as any })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
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
                <label className="text-slate-400">Description</label>
                <input
                  type="text"
                  required
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="e.g. Monthly cloud backup & software license"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400">Amount (₦)</label>
                <input
                  type="number"
                  required
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-1.5 text-white font-medium shadow-sm"
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
