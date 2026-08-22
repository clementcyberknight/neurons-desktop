import React from 'react'
import { MetricCard } from '@/components/ui/MetricCard'
import { ArrowDownRight, PieChart, Receipt } from 'lucide-react'

interface ExpenseMetricsProps {
  totalExpense: number
  totalExpenseCount: number
  topCategory: [string, number]
  avgVoucherSize: number
}

export const ExpenseMetrics: React.FC<ExpenseMetricsProps> = ({
  totalExpense,
  totalExpenseCount,
  topCategory,
  avgVoucherSize,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Metric 1: Total Outflow */}
      <MetricCard
        label="Total Outflow"
        value={`₦${totalExpense.toLocaleString()}`}
        subtext={`${totalExpenseCount} total vouchers logged`}
        topRightIcon={<ArrowDownRight className="h-4 w-4 text-neutral-900" />}
      />

      {/* Metric 2: Top Expense Category */}
      <MetricCard
        label="Top Expense Category"
        value={<div className="truncate text-lg sm:text-2xl">{topCategory[0]}</div>}
        subtext={`₦${topCategory[1].toLocaleString()} total spend`}
        topRightIcon={<PieChart className="h-4 w-4 text-neutral-500" />}
      />

      {/* Metric 3: Average Voucher Size */}
      <MetricCard
        label="Average Voucher Size"
        value={`₦${avgVoucherSize.toLocaleString()}`}
        subtext="Per recorded disbursement"
        topRightIcon={<Receipt className="h-4 w-4 text-neutral-500" />}
      />
    </div>
  )
}
