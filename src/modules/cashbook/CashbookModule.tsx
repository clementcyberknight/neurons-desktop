import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  RefreshCw,
} from 'lucide-react'
import iconCashier from '@/assets/icons-pack/Cashier--Streamline-Plump.png'

interface Props {
  onAskAI?: (prompt: string) => void
}

export const CashbookModule: React.FC<Props> = () => {
  const [openingFloat, setOpeningFloat] = useState(50000)
  const [physicalCount, setPhysicalCount] = useState<number | ''>(57700)
  const [cashierNotes, setCashierNotes] = useState('Daily evening till count & shift handover.')
  const [isReconciled, setIsReconciled] = useState(false)

  // Denominations counter
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    1000: 50,
    500: 14,
    200: 3,
    100: 1,
  })

  // Live cash transactions from Dexie
  const cashTransactions = useLiveQuery(async () => {
    const list = await db.transactions.toArray()
    return list.filter((t) => t.paymentMethod === 'cash')
  }) || []

  // Live cash expenses from Dexie
  const cashExpenses = useLiveQuery(async () => {
    const list = await db.finance.toArray()
    return list.filter((f) => f.type === 'expense')
  }) || []

  const totalCashSales = cashTransactions.reduce((acc, curr) => acc + curr.totalAmount, 0)
  const totalCashPaidOut = cashExpenses.slice(0, 3).reduce((acc, curr) => acc + curr.amount, 0) // sample daily cash payouts

  const expectedDrawerBalance = openingFloat + totalCashSales - totalCashPaidOut
  const currentPhysical = typeof physicalCount === 'number' ? physicalCount : 0
  const discrepancy = currentPhysical - expectedDrawerBalance
  const hasDiscrepancy = Math.abs(discrepancy) > 5000 // Flag if exceeds ₦5,000 as per store SOP

  const handleUpdateDenomination = (denom: number, count: number) => {
    const updated = { ...denominations, [denom]: Math.max(0, count) }
    setDenominations(updated)
    const calculatedTotal = Object.entries(updated).reduce(
      (acc, [d, c]) => acc + Number(d) * Number(c),
      0
    )
    setPhysicalCount(calculatedTotal)
  }

  const handlePerformReconciliation = () => {
    setIsReconciled(true)
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa]">
      {/* Top Banner */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={iconCashier} alt="Cashbook" className="h-9 w-9 object-contain" />
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">Daily Cashbook & Till Reconciliation</h3>
              <p className="text-xs text-neutral-500">Physical drawer cash audit, daily floats, and SOP discrepancy monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePerformReconciliation}
              className="flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Sign-off Till Audit</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Opening Float</span>
              <span className="font-mono text-[10px] text-neutral-400">AM Shift</span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-neutral-900">
              ₦{openingFloat.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">Baseline till float</span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Cash Sales In</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-neutral-900" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-neutral-900">
              +₦{totalCashSales.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block font-mono">
              {cashTransactions.length} cash checkout txns
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Petty Cash Out</span>
              <ArrowDownRight className="h-3.5 w-3.5 text-neutral-900" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-neutral-900">
              -₦{totalCashPaidOut.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block font-mono">Disbursements</span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Expected in Drawer</span>
              <Calculator className="h-3.5 w-3.5 text-neutral-600" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-neutral-900">
              ₦{expectedDrawerBalance.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block font-mono">Calculated ledger balance</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Physical Count Calculator & Discrepancy Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Physical Drawer Denominations Input (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
                Cash Denomination Counter
              </h4>
              <p className="text-[11px] text-neutral-400">Enter quantity of physical notes counted in the cash register</p>
            </div>
            <button
              onClick={() => {
                setDenominations({ 1000: 0, 500: 0, 200: 0, 100: 0 })
                setPhysicalCount(0)
              }}
              className="text-[11px] text-neutral-500 hover:text-black font-medium flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          </div>

          <div className="space-y-2.5">
            {[1000, 500, 200, 100].map((denom) => {
              const count = denominations[denom] || 0
              const sub = denom * count
              return (
                <div
                  key={denom}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/50 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-neutral-900 w-16 bg-white px-2 py-1 rounded border border-neutral-200 text-center">
                      ₦{denom.toLocaleString()}
                    </span>
                    <span className="text-neutral-500 font-mono">×</span>
                    <input
                      type="number"
                      min={0}
                      value={count}
                      onChange={(e) => handleUpdateDenomination(denom, Number(e.target.value))}
                      className="w-20 rounded bg-white border border-neutral-300 px-2 py-1 font-mono text-neutral-900 text-center focus:outline-none focus:border-black"
                    />
                    <span className="text-neutral-500 text-[11px]">notes</span>
                  </div>

                  <div className="font-mono font-bold text-neutral-900">
                    = ₦{sub.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700">Total Counted Physical Cash:</span>
            <span className="text-lg font-bold font-mono text-neutral-900">
              ₦{currentPhysical.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Till Audit Discrepancy & Sign-off (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono border-b border-neutral-100 pb-3">
              Till Reconciliation Status
            </h4>

            <div
              className={`rounded-xl p-4 border ${
                discrepancy === 0
                  ? 'bg-neutral-50 border-neutral-300 text-neutral-900'
                  : hasDiscrepancy
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Audit Variance:</span>
                <span className="font-mono font-bold text-sm">
                  {discrepancy > 0 ? `+₦${discrepancy.toLocaleString()}` : discrepancy < 0 ? `-₦${Math.abs(discrepancy).toLocaleString()}` : '₦0 (Balanced)'}
                </span>
              </div>

              {hasDiscrepancy && (
                <div className="mt-2.5 flex items-start gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <p className="text-[11px] leading-snug">
                    Discrepancy exceeds ₦5,000 threshold. Standard operating procedure requires managerial review and supervisor signature.
                  </p>
                </div>
              )}

              {discrepancy === 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-700 font-medium">
                  <CheckCircle className="h-4 w-4 text-black" />
                  <span>Till is perfectly balanced.</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">
                Handover Notes / Audit Remarks
              </label>
              <textarea
                rows={3}
                value={cashierNotes}
                onChange={(e) => setCashierNotes(e.target.value)}
                className="w-full rounded-lg bg-neutral-50 border border-neutral-200 p-2 text-xs text-neutral-900 focus:outline-none focus:bg-white"
                placeholder="Remarks for manager..."
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100">
            {isReconciled ? (
              <div className="rounded-lg bg-neutral-100 p-2.5 text-center text-xs font-medium text-neutral-800 border border-neutral-300 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-black" />
                <span>Reconciliation logged & signed off for today.</span>
              </div>
            ) : (
              <button
                onClick={handlePerformReconciliation}
                className="w-full rounded-xl bg-black hover:bg-neutral-800 text-white font-medium py-2.5 text-xs shadow-xs transition-all"
              >
                Confirm & Lock Cashbook Count
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
