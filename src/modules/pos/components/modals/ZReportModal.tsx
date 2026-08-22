import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { FileCheck, Printer } from 'lucide-react'

export interface ClosedShiftSummary {
  cashierName: string
  posStation: string
  shiftStartTime: string
  shiftEndTime: string
  cashSales: number
  transferSales: number
  cardSales: number
  creditSales: number
  totalSales: number
  txnCount: number
  expectedDrawerCash: number
  actualCashCounted: number
  variance: number
  date: string
}

interface ZReportModalProps {
  summary: ClosedShiftSummary | null
  onClose: () => void
  onOpenNewShift: () => void
  onPrint?: () => void
}

export const ZReportModal: React.FC<ZReportModalProps> = ({
  summary,
  onClose,
  onOpenNewShift,
  onPrint = () => window.print(),
}) => {
  if (!summary) return null

  return (
    <Modal
      open={!!summary}
      onClose={onClose}
      maxWidth="md"
      title="End-Of-Shift Z-Report"
      subtitle={`${summary.date} • ${summary.posStation}`}
      icon={
        <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center">
          <FileCheck className="h-4 w-4" />
        </div>
      }
    >
      <div className="space-y-2.5 text-xs font-mono">
        <div className="flex justify-between text-neutral-600">
          <span>Cashier Operator:</span>
          <strong className="text-neutral-900 font-sans">{summary.cashierName}</strong>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Shift Duration:</span>
          <span className="text-neutral-900">
            {summary.shiftStartTime} – {summary.shiftEndTime}
          </span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Total Transactions:</span>
          <strong className="text-neutral-900">{summary.txnCount} orders</strong>
        </div>

        <div className="border-t border-b border-neutral-200 py-2.5 my-2 space-y-1.5">
          <div className="flex justify-between text-neutral-900">
            <span>Total Cash Collected:</span>
            <span className="font-bold">₦{summary.cashSales.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-neutral-900">
            <span>Total Card / Transfer:</span>
            <span className="font-bold">
              ₦{(summary.cardSales + summary.transferSales).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-100">
            <span>TOTAL SHIFT REVENUE:</span>
            <span>₦{summary.totalSales.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
          <div className="flex justify-between font-bold">
            <span>Expected Drawer Cash:</span>
            <span>₦{summary.expectedDrawerCash.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Actual Counted Cash:</span>
            <span>₦{summary.actualCashCounted.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold pt-1 border-t border-neutral-200">
            <span>Variance:</span>
            <span className="text-black font-bold">
              {summary.variance >= 0 ? '+₦' : '-₦'}
              {Math.abs(summary.variance).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={onPrint}
          className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Print Z-Report</span>
        </button>
        <button
          type="button"
          onClick={onOpenNewShift}
          className="flex-1 rounded-xl bg-black hover:bg-neutral-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
        >
          Open New Shift
        </button>
      </div>
    </Modal>
  )
}
