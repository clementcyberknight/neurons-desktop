import React from 'react'
import iconSales from '@/assets/icons-pack/Shopping-Cart-2--Streamline-Plump.png'

export const SalesHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        <img src={iconSales} alt="Sales" className="h-9 w-9 object-contain" />
        <div>
          <h1 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
            Sales Records & Transaction Ledger
          </h1>
          <p className="text-xs text-neutral-500">
            Live offline point-of-sale checkout log with audit trails
          </p>
        </div>
      </div>
    </div>
  )
}
