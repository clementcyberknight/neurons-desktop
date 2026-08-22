import React from 'react'
import { MetricCard } from '@/components/ui/MetricCard'
import { TrendingUp, TrendingDown, Receipt } from 'lucide-react'

interface FinanceMetricsProps {
  totalSalesRevenue: number
  estimatedCOGS: number
  totalExpenses: number
  netTakeHomeProfit: number
  netMarginPct: number
}

export const FinanceMetrics: React.FC<FinanceMetricsProps> = ({
  totalSalesRevenue,
  estimatedCOGS,
  totalExpenses,
  netTakeHomeProfit,
  netMarginPct,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Sales Revenue */}
      <MetricCard
        label="Total Sales Revenue"
        value={`₦${totalSalesRevenue.toLocaleString()}`}
        subtext="POS + Orders collected"
        topRightIcon={
          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
        }
      />

      {/* Metric 2: Cost of Stock Sold (COGS) */}
      <MetricCard
        label="Cost of Stock Sold (COGS)"
        value={`₦${estimatedCOGS.toLocaleString()}`}
        subtext="Inventory purchase cost"
        topRightIcon={
          <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="h-4 w-4" />
          </div>
        }
      />

      {/* Metric 3: Store Operating Expenses */}
      <MetricCard
        label="Store Operating Expenses"
        value={`₦${totalExpenses.toLocaleString()}`}
        subtext="Fuel, rent, utilities & logistics"
        topRightIcon={
          <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingDown className="h-4 w-4" />
          </div>
        }
      />

      {/* Metric 4: Net Take-Home Profit */}
      <MetricCard
        label="Net Take-Home Profit"
        value={`₦${netTakeHomeProfit.toLocaleString()}`}
        valueColor="text-emerald-700"
        subtext="Actual business bottom line"
        accentLeftBorder="border-l-emerald-500"
        topRightIcon={
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-mono font-bold">
            {netMarginPct}% Margin
          </span>
        }
      />
    </div>
  )
}
