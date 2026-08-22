import React from 'react'
import { MetricCard } from '@/components/ui/MetricCard'
import { ArrowDown, ArrowUp, Scale } from 'lucide-react'

interface CashbookMetricsProps {
  totalReceipts: number
  totalPayments: number
  netChange: number
}

export const CashbookMetrics: React.FC<CashbookMetricsProps> = ({
  totalReceipts,
  totalPayments,
  netChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: TOTAL RECEIPTS (DEBIT) */}
      <MetricCard
        label="TOTAL RECEIPTS (DEBIT)"
        value={`₦${totalReceipts.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        valueColor="text-[#2563eb]"
        watermarkIcon={
          <div className="opacity-35">
            <div className="h-16 w-16 rounded-full border-2 border-blue-400/40 flex items-center justify-center text-blue-500">
              <ArrowDown className="h-9 w-9 stroke-[2.5]" />
            </div>
          </div>
        }
      />

      {/* Card 2: TOTAL PAYMENTS (CREDIT) */}
      <MetricCard
        label="TOTAL PAYMENTS (CREDIT)"
        value={`₦${totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        valueColor="text-[#ef4444]"
        watermarkIcon={
          <div className="opacity-35">
            <div className="h-16 w-16 rounded-full border-2 border-red-400/40 flex items-center justify-center text-red-500">
              <ArrowUp className="h-9 w-9 stroke-[2.5]" />
            </div>
          </div>
        }
      />

      {/* Card 3: NET CHANGE (PERIOD) */}
      <MetricCard
        label="NET CHANGE (PERIOD)"
        value={`₦${netChange.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        valueColor="text-neutral-900"
        accentLeftBorder="border-l-[#f97316]"
        watermarkIcon={
          <div className="opacity-15 text-neutral-800">
            <Scale className="h-18 w-18 stroke-[1.5]" />
          </div>
        }
      />
    </div>
  )
}
