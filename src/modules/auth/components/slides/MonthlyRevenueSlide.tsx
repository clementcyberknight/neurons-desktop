import React from 'react'
import type { MonthlyRevenueBracket } from '@/types/database'
import { TrendingUp } from 'lucide-react'

interface MonthlyRevenueSlideProps {
  monthlyRevenue: MonthlyRevenueBracket
  setMonthlyRevenue: (val: MonthlyRevenueBracket) => void
}

const OPTIONS: { id: MonthlyRevenueBracket; label: string; desc: string }[] = [
  { id: 'under_1m', label: '< ₦1,000,000 / mo', desc: 'Starter commercial tier' },
  { id: '1m_5m', label: '₦1M – ₦5,000,000 / mo', desc: 'Established retail store' },
  { id: '5m_20m', label: '₦5M – ₦20,000,000 / mo', desc: 'Major supplier & distributor' },
  { id: 'over_20m', label: '₦20,000,000+ / mo', desc: 'Large manufacturing plant' },
]

export const MonthlyRevenueSlide: React.FC<MonthlyRevenueSlideProps> = ({
  monthlyRevenue,
  setMonthlyRevenue,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <div>
        <h3 className="text-xl font-extrabold text-black tracking-tight">
          Company Monthly Revenue Bracket
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Customizes executive analytics thresholds, P&L forecasts, and cashflow benchmarks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMonthlyRevenue(opt.id)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              monthlyRevenue === opt.id
                ? 'border-black bg-black text-white shadow-md'
                : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
            }`}
          >
            <TrendingUp className="h-5 w-5 mb-2" />
            <h4 className="text-xs font-bold">{opt.label}</h4>
            <p className={`text-[11px] mt-0.5 ${monthlyRevenue === opt.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
              {opt.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
