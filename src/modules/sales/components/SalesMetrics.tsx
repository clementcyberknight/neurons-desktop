import React from 'react'
import { MetricCard } from '@/components/ui/MetricCard'
import { Receipt, AlertTriangle } from 'lucide-react'
import iconCashier from '@/assets/icons-pack/Cashier-Machine-2--Streamline-Plump.png'

interface SalesMetricsProps {
  totalSalesRevenue: number
  totalTransactionsCount: number
  avgBasket: number
  flaggedCount: number
}

export const SalesMetrics: React.FC<SalesMetricsProps> = ({
  totalSalesRevenue,
  totalTransactionsCount,
  avgBasket,
  flaggedCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Metric 1: Total Sales Volume */}
      <MetricCard
        label="Total Sales Volume"
        value={`₦${totalSalesRevenue.toLocaleString()}`}
        subtext={`${totalTransactionsCount} total receipts recorded`}
        topRightIcon={<img src={iconCashier} alt="POS" className="h-4 w-4 object-contain" />}
      />

      {/* Metric 2: Average Basket Size */}
      <MetricCard
        label="Average Basket Size"
        value={`₦${avgBasket.toLocaleString()}`}
        subtext="Per checkout ticket"
        topRightIcon={<Receipt className="h-4 w-4 text-neutral-500" />}
      />

      {/* Metric 3: Manual Override Flags */}
      <MetricCard
        label="Manual Override Flags"
        value={
          <div className="flex items-baseline gap-1.5">
            <span>{flaggedCount}</span>
            <span className="text-xs font-normal text-neutral-500">flagged</span>
          </div>
        }
        subtext="Discounts & price overrides"
        topRightIcon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
      />
    </div>
  )
}
