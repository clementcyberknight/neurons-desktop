import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { POSTransaction } from '@/types/database'
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
  Smartphone,
} from 'lucide-react'
import iconSales from '@/assets/icons-pack/Shopping-Cart-2--Streamline-Plump.png'
import iconReceipt from '@/assets/icons-pack/Receipt--Streamline-Plump.png'
import iconCashier from '@/assets/icons-pack/Cashier-Machine-2--Streamline-Plump.png'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

export const SalesModule: React.FC<Props> = ({ searchQuery = '' }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'flagged' | 'refunded'>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [selectedTxn, setSelectedTxn] = useState<POSTransaction | null>(null)
  const [localSearch, setLocalSearch] = useState('')

  const activeSearch = searchQuery || localSearch

  const transactions = useLiveQuery(async () => {
    let list = await db.transactions.reverse().toArray()
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter)
    }
    if (methodFilter !== 'all') {
      list = list.filter((t) => t.paymentMethod === methodFilter)
    }
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase()
      list = list.filter(
        (t) =>
          t.receiptNumber.toLowerCase().includes(q) ||
          t.cashierName.toLowerCase().includes(q) ||
          t.posStation.toLowerCase().includes(q) ||
          (t.overrideReason && t.overrideReason.toLowerCase().includes(q))
      )
    }
    return list
  }, [statusFilter, methodFilter, activeSearch]) || []

  // Sales KPIs
  const totalSalesRevenue = transactions.reduce((acc, curr) => acc + curr.totalAmount, 0)
  const flaggedCount = transactions.filter((t) => t.status === 'flagged' || t.hasManualOverride).length
  const avgBasket = transactions.length > 0 ? Math.round(totalSalesRevenue / transactions.length) : 0

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa]">
      {/* Top Banner & KPI Summary */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={iconSales} alt="Sales" className="h-9 w-9 object-contain" />
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">Sales Records & Transaction Ledger</h3>
              <p className="text-xs text-neutral-500">Live offline point-of-sale checkout log with audit trails</p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Total Sales Volume</span>
              <img src={iconCashier} alt="POS" className="h-4 w-4 object-contain" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
              ₦{totalSalesRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">
              {transactions.length} receipts recorded
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Average Basket Size</span>
              <Receipt className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
              ₦{avgBasket.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">Per checkout ticket</span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Manual Override Flags</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
              {flaggedCount} <span className="text-xs font-normal text-neutral-500">flagged</span>
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-mono">Requires managerial audit</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search receipt #, cashier, station..."
              className="h-8 w-full rounded-lg bg-neutral-50 border border-neutral-200 pl-8 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg bg-neutral-50 border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="flagged">Flagged Overrides</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg bg-neutral-50 border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card / POS Terminal</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 flex flex-col justify-between overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                <th className="pb-3 font-semibold">Receipt No.</th>
                <th className="pb-3 font-semibold">Date & Time</th>
                <th className="pb-3 font-semibold">Cashier & Station</th>
                <th className="pb-3 font-semibold">Items</th>
                <th className="pb-3 font-semibold">Payment Method</th>
                <th className="pb-3 font-semibold">Discount / Override</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    No sales transactions found matching filters.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isFlagged = txn.status === 'flagged' || txn.hasManualOverride
                  return (
                    <tr key={txn.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 font-mono font-semibold text-neutral-900">{txn.receiptNumber}</td>
                      <td className="py-3 font-mono text-neutral-500 text-[11px]">
                        {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-neutral-900">{txn.cashierName}</div>
                        <div className="text-[10px] text-neutral-400">{txn.posStation}</div>
                      </td>
                      <td className="py-3 font-mono text-neutral-600">
                        {txn.items?.length || 0} item{(txn.items?.length || 0) > 1 ? 's' : ''}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-mono text-neutral-800 uppercase">
                          {txn.paymentMethod === 'card' && <CreditCard className="h-2.5 w-2.5" />}
                          {txn.paymentMethod === 'cash' && <Banknote className="h-2.5 w-2.5" />}
                          {txn.paymentMethod === 'mobile_money' && <Smartphone className="h-2.5 w-2.5" />}
                          {txn.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3">
                        {isFlagged ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {txn.discountPercent}% Override
                          </span>
                        ) : txn.discountPercent > 0 ? (
                          <span className="text-neutral-500 font-mono text-[11px]">{txn.discountPercent}% off</span>
                        ) : (
                          <span className="text-neutral-400 font-mono text-[11px]">None</span>
                        )}
                      </td>
                      <td className="py-3 font-mono font-bold text-right text-neutral-900">
                        ₦{txn.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedTxn(txn)}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 shadow-2xs transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <img src={iconSales} alt="Sales" className="h-5 w-5 object-contain" />
                <h3 className="text-sm font-bold text-neutral-900">Receipt Details</h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-mono bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <div>
                  <div className="text-[10px] text-neutral-500">Receipt No:</div>
                  <div className="font-bold text-neutral-900">{selectedTxn.receiptNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-500">Date:</div>
                  <div>{new Date(selectedTxn.createdAt).toLocaleDateString()} {new Date(selectedTxn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 text-[11px] block mb-1 font-mono uppercase">Purchased Items:</span>
                <div className="divide-y divide-neutral-100 max-h-40 overflow-y-auto border border-neutral-200 rounded-lg p-2 bg-white">
                  {selectedTxn.items?.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <div>
                        <div className="font-medium text-neutral-900">{item.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {item.quantity} × ₦{item.unitPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-neutral-900">
                        ₦{item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-neutral-100 font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span>₦{selectedTxn.subtotal.toLocaleString()}</span>
                </div>
                {selectedTxn.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Discount ({selectedTxn.discountPercent}%):</span>
                    <span>-₦{selectedTxn.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                  <span>Total Paid:</span>
                  <span>₦{selectedTxn.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {selectedTxn.overrideReason && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-amber-900 text-[11px]">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Override Justification:
                  </span>
                  <p className="mt-0.5">{selectedTxn.overrideReason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-2xs cursor-pointer"
              >
                <img src={iconReceipt} alt="Print" className="h-3.5 w-3.5 object-contain" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedTxn(null)}
                className="rounded-lg bg-black hover:bg-neutral-800 px-4 py-1.5 text-xs text-white font-medium shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
